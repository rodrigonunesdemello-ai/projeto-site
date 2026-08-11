/*
# Fix security advisor warnings

1. Revoke EXECUTE on trigger functions (handle_new_user, handle_updated_user)
   from anon and authenticated. These are only called by triggers on auth.users,
   never directly by clients.

2. Revoke EXECUTE on is_admin() from anon. Anon users cannot be admins; only
   authenticated users need this function for RLS policy checks.

3. register_vote remains callable by anon + authenticated (intentional: the
   voting flow is public). The function validates all inputs and is safe.

4. Fix set_updated_at to have an immutable search_path.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- Recreate set_updated_at with search_path set
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
