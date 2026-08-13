/*
# Fix security advisor warnings

1. Modified functions
- `handle_new_user()`: revoke EXECUTE from anon and authenticated. This is a
  trigger function that fires on auth.users INSERT and should not be callable
  directly via the REST API.
- `handle_updated_user()`: same treatment — trigger function, not directly
  callable.

2. Security
- These functions remain SECURITY DEFINER (needed to write to public.profiles
  from the auth trigger) but are no longer executable through the public API.
- `is_admin`, `register_vote`, `register_voter` remain executable by anon
  because the app is a public no-auth voting app — the browser uses the anon
  key and must be able to call them.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_updated_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_updated_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_updated_user() FROM authenticated;
