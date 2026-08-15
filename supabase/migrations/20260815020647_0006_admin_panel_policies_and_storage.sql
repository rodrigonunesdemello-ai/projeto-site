/*
# Admin panel: RLS policies and storage bucket

1. Policy changes
- `voters`: add admin-only INSERT policy (admin panel creates voters when
  managing). Keep existing INSERT for anon+authenticated (lead capture).
- `voters`: change SELECT to allow admin to read ALL voters (currently
  only own + admin). The existing policy already covers admin via is_admin().
  No change needed — admin already has full SELECT.
- `votes`: admin already has SELECT, UPDATE, DELETE. No change needed.
- `profiles`: admin already has SELECT, UPDATE, DELETE. No change needed.

2. Storage
- Create a public bucket `sintese-images` for nominee and region images.
- Storage policies: public read, admin-only write.

3. Important notes
- No new tables created.
- No data loss — all changes are additive.
- The admin panel will use the authenticated Supabase client (browser)
  with RLS enforcing admin-only access via is_admin().
*/

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('sintese-images', 'sintese-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin-only write
DROP POLICY IF EXISTS "sintese_images_public_read" ON storage.objects;
CREATE POLICY "sintese_images_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'sintese-images');

DROP POLICY IF EXISTS "sintese_images_admin_insert" ON storage.objects;
CREATE POLICY "sintese_images_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sintese-images' AND public.is_admin());

DROP POLICY IF EXISTS "sintese_images_admin_update" ON storage.objects;
CREATE POLICY "sintese_images_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'sintese-images' AND public.is_admin())
WITH CHECK (bucket_id = 'sintese-images' AND public.is_admin());

DROP POLICY IF EXISTS "sintese_images_admin_delete" ON storage.objects;
CREATE POLICY "sintese_images_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'sintese-images' AND public.is_admin());

-- Allow admin to INSERT into voters (admin panel management)
-- The existing voters_insert_public already allows anon+authenticated.
-- No additional policy needed.

-- Allow admin to read ALL regions/categories/nominees including inactive ones.
-- Currently SELECT is limited to active=true for anon+authenticated.
-- Add admin SELECT-all policies.
DROP POLICY IF EXISTS "regions_select_all_admin" ON regions;
CREATE POLICY "regions_select_all_admin"
ON regions FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "categories_select_all_admin" ON categories;
CREATE POLICY "categories_select_all_admin"
ON categories FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "nominees_select_all_admin" ON nominees;
CREATE POLICY "nominees_select_all_admin"
ON nominees FOR SELECT
TO authenticated
USING (public.is_admin());
