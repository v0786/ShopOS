# Database design and current status

## Current status

Phase 1 foundation and multi-tenancy schema has been implemented in versioned migration `supabase/migrations/20261013000001_phase1_foundation_and_multitenancy.sql` and verified via 15 PostgreSQL integration tests running in Vitest. Seed fixtures for two organizations, multiple stores, staff assignments, deactivated membership, and a platform admin are in `supabase/seed.sql`.

## Phase 1 Schema Definition

### Tables

1. **`public.profiles`**:
   - `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `full_name text NOT NULL CHECK (char_length(trim(full_name)) > 0)`
   - `phone text CHECK (phone IS NULL OR char_length(trim(phone)) >= 10)`
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - `updated_at timestamptz NOT NULL DEFAULT now()`

2. **`public.organizations`**:
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `name text NOT NULL CHECK (char_length(trim(name)) > 0)`
   - `slug text UNIQUE NOT NULL CHECK (char_length(trim(slug)) > 0)`
   - `created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL`
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - `updated_at timestamptz NOT NULL DEFAULT now()`

3. **`public.organization_memberships`**:
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
   - `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
   - `role text NOT NULL CHECK (role IN ('owner', 'admin', 'staff', 'technician'))`
   - `status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated'))`
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - `updated_at timestamptz NOT NULL DEFAULT now()`
   - **Constraint**: `CONSTRAINT uq_org_membership_user UNIQUE (organization_id, user_id)`
   - **Indexes**: `(user_id, status)`, `(organization_id, status)`

4. **`public.stores`**:
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
   - `name text NOT NULL CHECK (char_length(trim(name)) > 0)`
   - `code text NOT NULL CHECK (char_length(trim(code)) > 0)`
   - `address text`, `phone text`
   - `is_active boolean NOT NULL DEFAULT true`
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - `updated_at timestamptz NOT NULL DEFAULT now()`
   - **Constraint**: `CONSTRAINT uq_store_org_id UNIQUE (organization_id, id)` — composite unique key enabling foreign key containment for store-owned child records.
   - **Constraint**: `CONSTRAINT uq_store_org_code UNIQUE (organization_id, code)`
   - **Index**: `(organization_id, is_active)`

5. **`public.store_assignments`**:
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `organization_id uuid NOT NULL`
   - `store_id uuid NOT NULL`
   - `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - **Constraint**: `CONSTRAINT fk_store_assignment_store FOREIGN KEY (organization_id, store_id) REFERENCES public.stores(organization_id, id) ON DELETE CASCADE`
   - **Constraint**: `CONSTRAINT fk_store_assignment_membership FOREIGN KEY (organization_id, user_id) REFERENCES public.organization_memberships(organization_id, user_id) ON DELETE CASCADE`
   - **Constraint**: `CONSTRAINT uq_store_assignment UNIQUE (store_id, user_id)`
   - *Integrity Guarantee*: It is physically impossible to assign a user to a store in Organization A if they are only a member of Organization B.

6. **`public.platform_admins`**:
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE`
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - Dedicated boundary; never an organization role or profile attribute.

## Row-Level Security (RLS) & Helper Functions

All tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Helper functions use `SECURITY DEFINER` and fixed `SET search_path = public`:

- **`is_platform_admin()`**: returns true if `auth.uid()` exists in `platform_admins`.
- **`is_active_member(org_id)`**: returns true if `auth.uid()` has an `active` membership in `org_id`.
- **`has_org_role(org_id, allowed_roles)`**: returns true if `auth.uid()` has an `active` membership with `role = ANY(allowed_roles)`.
- **`has_store_access(org_id, str_id)`**: returns true if `auth.uid()` is an active owner/admin in `org_id` OR has an explicit `store_assignments` record for `(org_id, str_id, auth.uid())`.

### Access Rules Summary

- **Deactivated memberships**: `is_active_member` checks `status = 'active'`; deactivated users are denied all reads/writes.
- **Cross-organization denial**: queries only return records matching the user's active membership or store assignment.
- **Store scoping**: staff only see stores they are assigned to.
- **Role permissions**: store creation and assignments require `owner` or `admin` role.

## Trusted Self-Service RPC: `create_organization_with_store`

Transactionally executes on signup:
1. Validates non-empty names and slug.
2. Inserts `organizations` record.
3. Inserts creator as `owner` in `organization_memberships`.
4. Inserts the first `stores` record.
5. Inserts initial `store_assignments` record.
Returns atomic JSON containing `organization_id` and `store_id`. All operations succeed or roll back atomically.

## Seed Fixtures (`supabase/seed.sql`)

Two organizations:
- **Apex Mobiles** (`apex-mobiles`): Stores `Apex Downtown` (`APEX-DT`), `Apex West` (`APEX-WST`).
  - Owner (`apex_owner`), Admin (`apex_admin`), Staff 1 (DT only), Staff 2 (West only), Deactivated Staff.
- **Star Cellular** (`star-cellular`): Stores `Star Central` (`STAR-CTR`), `Star Express` (`STAR-EXP`).
  - Owner (`star_owner`), Admin (`star_admin`), Staff (`star_staff`).
- **Platform Admin** (`platform_admin`) in `platform_admins`.
