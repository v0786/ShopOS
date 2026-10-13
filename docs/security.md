# Security model and current status

## Implemented controls and boundaries

### 1. Browser & client configuration
- Vite automatic env exposure is disabled. Its `define` allowlist injects only the exact `SHOPOS_PUBLIC_SUPABASE_URL` and `SHOPOS_PUBLIC_SUPABASE_ANON_KEY` values into browser modules.
- `src/config/env.ts` trims and validates required values, requiring HTTP(S) protocol.
- Production build checks verify that service-role secrets and sentinels are completely absent from `dist/` assets.
- `src/lib/supabase.ts` uses lazy initialization with the public anon key only.

### 2. Multi-tenancy and store authorization (PostgreSQL & RLS)
- Every tenant table carries an explicit `organization_id` foreign key.
- Tables with store scope carry `(organization_id, store_id)` matching a composite unique constraint `(organization_id, id)` on `stores`.
- `store_assignments` enforces composite foreign keys `(organization_id, store_id)` and `(organization_id, user_id)`, guaranteeing at the database constraint level that cross-organization assignments are rejected.
- PostgreSQL Row-Level Security (RLS) is enabled on all tables: `profiles`, `organizations`, `organization_memberships`, `stores`, `store_assignments`, `platform_admins`.
- Client-supplied IDs are never trusted for authorization; access policies evaluate `auth.uid()` against active memberships and assignments via SECURITY DEFINER helper functions (`is_active_member`, `has_org_role`, `has_store_access`).
- Deactivated memberships immediately lose all access (`status = 'active'` required).
- Unassigned staff members are strictly denied access to unassigned branch stores.
- Platform administration is isolated in a separate `platform_admins` table with no client-writable access.

### 3. Automated security integration testing
- 15 automated integration tests in `src/data/database.test.ts` execute real PostgreSQL 18 with RLS via `@electric-sql/pglite`.
- Tests prove:
  - Atomic self-service onboarding via `create_organization_with_store`
  - Cross-organization read denial
  - Cross-organization store insertion denial
  - Cross-organization update denial
  - Unassigned store read denial for staff
  - Complete read/write denial for deactivated memberships
  - Composite foreign key constraint violation on cross-organization assignments
  - Platform administrator separation and client-write denial to platform_admins table

## Outstanding before production release

- Production Supabase cloud project deployment and connection of production Auth hooks.
- Session timeout and device tracking.
- Rate limiting at API gateway / edge.
- Audit logging for administrative events (Phase 5).
