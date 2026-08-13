/*
# Add registration_complete to profiles and unique voter index

1. Changes to `profiles`
   - New column `registration_complete` (boolean, NOT NULL, default false).
   - Tracks whether the user has filled in their complementary registration
     (whatsapp, phone, address) after Google OAuth login.

2. Updated trigger function `handle_new_user`
   - Now copies the user's display name from `raw_user_meta_data`:
     tries `full_name` first, then `name`, then empty string.
   - This ensures Google-provided names are stored in profiles on signup.

3. Changes to `voters`
   - New partial UNIQUE INDEX on `user_id` (WHERE user_id IS NOT NULL).
   - Ensures one voter record per authenticated user, while still
     allowing multiple anonymous (user_id = NULL) voter rows.

4. Security
   - No new RLS policies needed. Existing policies already allow
     authenticated users to UPDATE their own profile (all columns
     except `role` which is revoked). The new `registration_complete`
     column is updatable by the profile owner.
   - The voters INSERT policy (WITH CHECK true) and UPDATE policy
     (auth.uid() = user_id) already cover the upsert flow.
*/

-- 1. Add registration_complete to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS registration_complete boolean NOT NULL DEFAULT false;

-- 2. Update handle_new_user to copy name from Google metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      ''
    ),
    CASE WHEN NEW.email = 'rodrigonunesarquiteto@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = COALESCE(NULLIF(EXCLUDED.name, ''), profiles.name),
        role = CASE
          WHEN EXCLUDED.email = 'rodrigonunesarquiteto@gmail.com' THEN 'admin'
          ELSE profiles.role
        END,
        updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Partial unique index on voters.user_id
CREATE UNIQUE INDEX IF NOT EXISTS voters_user_id_unique
  ON voters (user_id)
  WHERE user_id IS NOT NULL;
