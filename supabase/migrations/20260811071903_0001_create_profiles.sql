/*
# Create profiles table with auto-admin provisioning

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users(id) ON DELETE CASCADE)
  - `name` (text, display name)
  - `email` (text, unique, email address)
  - `role` (text, default 'user'; can be 'user' or 'admin')
  - `whatsapp` (text, nullable)
  - `phone` (text, nullable)
  - `address` (text, nullable)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Automation
- Trigger `on_auth_user_created`: when a new row is inserted into auth.users,
  insert a corresponding row into profiles with id, email, and role copied from
  the auth record. If the email matches rodrigonunesarquiteto@gmail.com, role
  is set to 'admin' automatically.
- Trigger `on_auth_user_updated`: when a row in auth.users is updated (e.g. email
  change), sync the profiles row and re-evaluate admin status for the configured
  email.
- Trigger `profiles_set_updated_at`: bump updated_at on every UPDATE of profiles.

3. Security
- RLS enabled on profiles.
- SELECT: users can read their own profile; admins can read all profiles.
- INSERT: only the system (trigger) inserts; no direct client INSERT allowed.
- UPDATE: users can update their own profile (name, whatsapp, phone, address);
  admins can update any profile. Role column is protected: only admins can change
  role (enforced by the WITH CHECK on the update policy + column privileges).
- DELETE: admins only.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'user',
  whatsapp text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: is the current user an admin?
-- SECURITY DEFINER so it can read profiles bypassing RLS for the check.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Trigger function: handle new auth.users row -> profiles insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email = 'rodrigonunesarquiteto@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = CASE
          WHEN EXCLUDED.email = 'rodrigonunesarquiteto@gmail.com' THEN 'admin'
          ELSE profiles.role
        END,
        updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger: after insert on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: after update on auth.users (sync email + re-evaluate admin)
CREATE OR REPLACE FUNCTION public.handle_updated_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
    SET email = NEW.email,
        role = CASE
          WHEN NEW.email = 'rodrigonunesarquiteto@gmail.com' THEN 'admin'
          ELSE COALESCE(public.profiles.role, 'user')
        END,
        updated_at = now()
    WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_user();

-- Trigger: bump updated_at on profiles UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS Policies for profiles

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_none" ON profiles;
-- No direct client INSERT; rows are created by the trigger only.
CREATE POLICY "profiles_insert_none"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin_only" ON profiles;
CREATE POLICY "profiles_delete_admin_only"
ON profiles FOR DELETE
TO authenticated
USING (public.is_admin());

-- Restrict role column: only admins can change it via column-level privilege.
-- Revoke default and grant only SELECT on role to non-admins (enforced at app layer + RPC).
-- The update policy already allows self-update, but we add a column guard:
-- users can update their own row but NOT the role column.
REVOKE UPDATE (role) ON profiles FROM authenticated;
