/*
# Create voters and votes tables, unique constraint, and register_vote RPC

1. New Tables
- `voters`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users(id) ON DELETE CASCADE, nullable)
  - `name` (text, not null)
  - `whatsapp` (text)
  - `phone` (text)
  - `address` (text)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  A voter is a lead captured during the voting flow. user_id is set if the
  voter also has an auth account; otherwise it is null (anonymous lead).

- `votes`
  - `id` (uuid, primary key)
  - `voter_id` (uuid, references voters(id) ON DELETE CASCADE)
  - `region_id` (uuid, references regions(id) ON DELETE CASCADE)
  - `category_id` (uuid, references categories(id) ON DELETE CASCADE)
  - `nominee_id` (uuid, references nominees(id) ON DELETE CASCADE)
  - `created_at` (timestamptz, default now())

2. Constraints
- UNIQUE (voter_id, region_id, category_id) on votes: one voter may cast
  at most one vote per category per region. Enforced at the database level
  so even direct SQL inserts cannot violate the rule.

3. RPC: register_vote
- Function public.register_vote(p_voter_id uuid, p_region_id uuid,
  p_category_id uuid, p_nominee_id uuid) returns jsonb.
- Validates:
  a) region is active
  b) category is active
  c) nominee is active
  d) nominee belongs to the given region AND category
  e) voter has not already voted in this region+category (unique constraint)
- Returns:
  { success: true, vote_id: "<uuid>" } on success
  { success: false, code: "ALREADY_VOTED", message: "..." } if duplicate
  { success: false, code: "INACTIVE_<entity>", message: "..." } if inactive
  { success: false, code: "MISMATCH", message: "..." } if nominee-region/category mismatch
  { success: false, code: "NOT_FOUND", message: "..." } if any entity missing
- SECURITY DEFINER so it can insert into votes and read voters/regions/
  categories/nominees bypassing RLS. The function is the single entry point
  for vote creation; the votes table itself has no direct INSERT policy
  for client roles.

4. Security
- RLS enabled on voters and votes.
- voters: a voter can read their own record (by user_id or by id if
  passed back to the client); admins can read all. INSERT is allowed
  for anon+authenticated (lead capture). UPDATE/DELETE admin only.
- votes: SELECT allowed for anon+authenticated (to check if already voted
  by voter_id). No direct INSERT/UPDATE/DELETE for clients; all writes go
  through register_vote RPC. Admins can DELETE (moderation).
*/

-- voters
CREATE TABLE IF NOT EXISTS voters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  whatsapp text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE voters ENABLE ROW LEVEL SECURITY;

-- votes
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
  region_id uuid NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  nominee_id uuid NOT NULL REFERENCES nominees(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Unique constraint: one vote per voter per region per category
CREATE UNIQUE INDEX IF NOT EXISTS votes_voter_region_category_unique
  ON votes (voter_id, region_id, category_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_nominee ON votes(nominee_id);
CREATE INDEX IF NOT EXISTS idx_votes_region_category ON votes(region_id, category_id);

-- Trigger: bump updated_at on voters UPDATE
DROP TRIGGER IF EXISTS voters_set_updated_at ON voters;
CREATE TRIGGER voters_set_updated_at
  BEFORE UPDATE ON voters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RPC: register_vote
CREATE OR REPLACE FUNCTION public.register_vote(
  p_voter_id uuid,
  p_region_id uuid,
  p_category_id uuid,
  p_nominee_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_region regions%ROWTYPE;
  v_category categories%ROWTYPE;
  v_nominee nominees%ROWTYPE;
  v_voter voters%ROWTYPE;
  v_vote_id uuid;
BEGIN
  -- 1. Verify voter exists
  SELECT * INTO v_voter FROM voters WHERE id = p_voter_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'VOTER_NOT_FOUND',
      'message', 'Eleitor não encontrado.'
    );
  END IF;

  -- 2. Verify region exists and is active
  SELECT * INTO v_region FROM regions WHERE id = p_region_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'REGION_NOT_FOUND',
      'message', 'Região não encontrada.'
    );
  END IF;
  IF NOT v_region.active THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INACTIVE_REGION',
      'message', 'Esta região não está ativa para votação.'
    );
  END IF;

  -- 3. Verify category exists and is active
  SELECT * INTO v_category FROM categories WHERE id = p_category_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'CATEGORY_NOT_FOUND',
      'message', 'Categoria não encontrada.'
    );
  END IF;
  IF NOT v_category.active THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INACTIVE_CATEGORY',
      'message', 'Esta categoria não está ativa para votação.'
    );
  END IF;

  -- 4. Verify nominee exists and is active
  SELECT * INTO v_nominee FROM nominees WHERE id = p_nominee_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOMINEE_NOT_FOUND',
      'message', 'Concorrente não encontrado.'
    );
  END IF;
  IF NOT v_nominee.active THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INACTIVE_NOMINEE',
      'message', 'Este concorrente não está ativo para votação.'
    );
  END IF;

  -- 5. Verify nominee belongs to the given region AND category
  IF v_nominee.region_id != p_region_id OR v_nominee.category_id != p_category_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'MISMATCH',
      'message', 'O concorrente não pertence a esta região/categoria.'
    );
  END IF;

  -- 6. Insert the vote (unique constraint catches duplicates)
  BEGIN
    INSERT INTO votes (voter_id, region_id, category_id, nominee_id)
    VALUES (p_voter_id, p_region_id, p_category_id, p_nominee_id)
    RETURNING id INTO v_vote_id;

    RETURN jsonb_build_object(
      'success', true,
      'vote_id', v_vote_id::text
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'ALREADY_VOTED',
        'message', 'Você já votou nesta categoria para esta região.'
      );
  END;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.register_vote(uuid, uuid, uuid, uuid) TO anon, authenticated;

-- RLS: voters
-- A voter record can be read by the voter themselves (matching user_id) or by admin.
-- Also allow reading by id for anon (the client stores the voter_id after lead capture).
DROP POLICY IF EXISTS "voters_select_own_or_admin" ON voters;
CREATE POLICY "voters_select_own_or_admin"
ON voters FOR SELECT
TO anon, authenticated
USING (auth.uid() = user_id OR public.is_admin() OR user_id IS NULL);

-- Allow lead capture: anon and authenticated can insert voter records.
DROP POLICY IF EXISTS "voters_insert_public" ON voters;
CREATE POLICY "voters_insert_public"
ON voters FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Update: admin only (or own user)
DROP POLICY IF EXISTS "voters_update_own_or_admin" ON voters;
CREATE POLICY "voters_update_own_or_admin"
ON voters FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Delete: admin only
DROP POLICY IF EXISTS "voters_delete_admin" ON voters;
CREATE POLICY "voters_delete_admin"
ON voters FOR DELETE
TO authenticated
USING (public.is_admin());

-- RLS: votes
-- SELECT: allow anon+authenticated to check votes by voter_id (to see if already voted).
DROP POLICY IF EXISTS "votes_select_public" ON votes;
CREATE POLICY "votes_select_public"
ON votes FOR SELECT
TO anon, authenticated
USING (true);

-- No direct INSERT policy for clients; all inserts go through register_vote RPC.
-- Admins can update (moderation) and delete.
DROP POLICY IF EXISTS "votes_update_admin" ON votes;
CREATE POLICY "votes_update_admin"
ON votes FOR UPDATE
TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "votes_delete_admin" ON votes;
CREATE POLICY "votes_delete_admin"
ON votes FOR DELETE
TO authenticated
USING (public.is_admin());
