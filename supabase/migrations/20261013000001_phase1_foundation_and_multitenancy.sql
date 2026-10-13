-- ==============================================================================
-- ShopOS Phase 1: Foundation and Multi-Tenancy Migration
-- Tables: profiles, organizations, organization_memberships, stores, store_assignments, platform_admins
-- Security: RLS, composite constraints, helper functions, and create_organization_with_store RPC
-- ==============================================================================

-- 1. Prerequisites (Extensions & Auth Schema Setup for Test / Local Environments)
CREATE SCHEMA IF NOT EXISTS auth;

-- Standard helper returning authenticated user ID from JWT
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  );
$$;

-- Ensure auth.users exists (Supabase provides this; needed for standalone local test databases)
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Common updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(trim(full_name)) > 0),
  phone text CHECK (phone IS NULL OR char_length(trim(phone)) >= 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  slug text UNIQUE NOT NULL CHECK (char_length(trim(slug)) > 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Organization Memberships Table
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'staff', 'technician')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_org_membership_user UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_user_status ON public.organization_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_status ON public.organization_memberships(organization_id, status);

CREATE TRIGGER update_organization_memberships_updated_at
  BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Stores Table
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  code text NOT NULL CHECK (char_length(trim(code)) > 0),
  address text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_store_org_id UNIQUE (organization_id, id),
  CONSTRAINT uq_store_org_code UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_stores_org_active ON public.stores(organization_id, is_active);

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. Store Assignments Table (Composite Foreign Keys Guarantee No Cross-Org References)
CREATE TABLE IF NOT EXISTS public.store_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  store_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_store_assignment_store FOREIGN KEY (organization_id, store_id)
    REFERENCES public.stores(organization_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_store_assignment_membership FOREIGN KEY (organization_id, user_id)
    REFERENCES public.organization_memberships(organization_id, user_id) ON DELETE CASCADE,
  CONSTRAINT uq_store_assignment UNIQUE (store_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_store_assignments_user ON public.store_assignments(user_id, store_id);
CREATE INDEX IF NOT EXISTS idx_store_assignments_org_store ON public.store_assignments(organization_id, store_id);

-- 7. Platform Administrators Table (Separate Privileged Authority, Never an Org Role)
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 8. Helper Functions for RLS (SECURITY DEFINER with fixed search_path)
-- ==============================================================================

-- Check if current authenticated user is in platform_admins
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = auth.uid()
  );
$$;

-- Check if current authenticated user is an active member of organization
CREATE OR REPLACE FUNCTION public.is_active_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- Check if current authenticated user has an active membership with one of the allowed roles
CREATE OR REPLACE FUNCTION public.has_org_role(org_id uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role = ANY(allowed_roles)
  );
$$;

-- Check store access: owners/admins have access to all stores in org; staff/technicians require assignment
CREATE OR REPLACE FUNCTION public.has_store_access(org_id uuid, str_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
  ) OR EXISTS (
    SELECT 1 FROM public.organization_memberships m
    JOIN public.store_assignments a
      ON a.organization_id = m.organization_id
     AND a.user_id = m.user_id
    WHERE m.organization_id = org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND a.store_id = str_id
  );
$$;

-- ==============================================================================
-- 9. Trusted Self-Service Onboarding RPC Function
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_organization_with_store(
  p_org_name text,
  p_org_slug text,
  p_store_name text,
  p_store_code text,
  p_store_address text DEFAULT NULL,
  p_store_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_store_id uuid;
  v_trimmed_org_name text;
  v_trimmed_org_slug text;
  v_trimmed_store_name text;
  v_trimmed_store_code text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  v_trimmed_org_name := trim(p_org_name);
  v_trimmed_org_slug := lower(trim(p_org_slug));
  v_trimmed_store_name := trim(p_store_name);
  v_trimmed_store_code := upper(trim(p_store_code));

  IF v_trimmed_org_name IS NULL OR char_length(v_trimmed_org_name) = 0 THEN
    RAISE EXCEPTION 'Organization name cannot be empty' USING ERRCODE = '22023';
  END IF;

  IF v_trimmed_org_slug IS NULL OR char_length(v_trimmed_org_slug) = 0 THEN
    RAISE EXCEPTION 'Organization slug cannot be empty' USING ERRCODE = '22023';
  END IF;

  IF v_trimmed_store_name IS NULL OR char_length(v_trimmed_store_name) = 0 THEN
    RAISE EXCEPTION 'Store name cannot be empty' USING ERRCODE = '22023';
  END IF;

  IF v_trimmed_store_code IS NULL OR char_length(v_trimmed_store_code) = 0 THEN
    RAISE EXCEPTION 'Store code cannot be empty' USING ERRCODE = '22023';
  END IF;

  -- 1. Create Organization
  INSERT INTO public.organizations (name, slug, created_by)
  VALUES (v_trimmed_org_name, v_trimmed_org_slug, v_user_id)
  RETURNING id INTO v_org_id;

  -- 2. Add creator as Owner membership
  INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
  VALUES (v_org_id, v_user_id, 'owner', 'active');

  -- 3. Create the first store
  INSERT INTO public.stores (organization_id, name, code, address, phone, is_active)
  VALUES (v_org_id, v_trimmed_store_name, v_trimmed_store_code, p_store_address, p_store_phone, true)
  RETURNING id INTO v_store_id;

  -- 4. Assign the owner to this store
  INSERT INTO public.store_assignments (organization_id, store_id, user_id)
  VALUES (v_org_id, v_store_id, v_user_id);

  RETURN jsonb_build_object(
    'organization_id', v_org_id,
    'organization_name', v_trimmed_org_name,
    'organization_slug', v_trimmed_org_slug,
    'store_id', v_store_id,
    'store_name', v_trimmed_store_name,
    'store_code', v_trimmed_store_code
  );
END;
$$;

-- ==============================================================================
-- 10. Enable Row Level Security (RLS) on all tables
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Organizations Policies
CREATE POLICY "organizations_select_active_member_or_platform_admin"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.is_active_member(id) OR public.is_platform_admin());

CREATE POLICY "organizations_update_owner_or_admin"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (public.has_org_role(id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_org_role(id, ARRAY['owner', 'admin']));

-- Organization Memberships Policies
CREATE POLICY "memberships_select_active_member_or_platform_admin"
  ON public.organization_memberships FOR SELECT
  TO authenticated
  USING (public.is_active_member(organization_id) OR public.is_platform_admin());

CREATE POLICY "memberships_insert_owner_or_admin"
  ON public.organization_memberships FOR INSERT
  TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "memberships_update_owner_or_admin"
  ON public.organization_memberships FOR UPDATE
  TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "memberships_delete_owner"
  ON public.organization_memberships FOR DELETE
  TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner']));

-- Stores Policies
CREATE POLICY "stores_select_assigned_or_admin"
  ON public.stores FOR SELECT
  TO authenticated
  USING (public.has_store_access(organization_id, id) OR public.is_platform_admin());

CREATE POLICY "stores_insert_owner_or_admin"
  ON public.stores FOR INSERT
  TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "stores_update_owner_or_admin"
  ON public.stores FOR UPDATE
  TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "stores_delete_owner"
  ON public.stores FOR DELETE
  TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner']));

-- Store Assignments Policies
CREATE POLICY "store_assignments_select_active_member_or_platform_admin"
  ON public.store_assignments FOR SELECT
  TO authenticated
  USING (public.is_active_member(organization_id) OR public.is_platform_admin());

CREATE POLICY "store_assignments_insert_owner_or_admin"
  ON public.store_assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "store_assignments_delete_owner_or_admin"
  ON public.store_assignments FOR DELETE
  TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner', 'admin']));

-- Platform Admins Policies
CREATE POLICY "platform_admins_select_self"
  ON public.platform_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ==============================================================================
-- 11. Least-Privilege Grants
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Public anon cannot access internal tables directly
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
