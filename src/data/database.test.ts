import { describe, it, expect, beforeEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Test user fixtures from seed.sql
const APEX_OWNER = '00000000-0000-0000-0000-000000000001'
const APEX_ADMIN = '00000000-0000-0000-0000-000000000002'
const APEX_STAFF1 = '00000000-0000-0000-0000-000000000003'
const APEX_STAFF2 = '00000000-0000-0000-0000-000000000004'
const APEX_DEACTIVATED = '00000000-0000-0000-0000-000000000005'
const STAR_OWNER = '00000000-0000-0000-0000-000000000006'
const PLATFORM_ADMIN = '00000000-0000-0000-0000-000000000009'
const UNREGISTERED_USER = '00000000-0000-0000-0000-000000000099'

const APEX_ORG = '10000000-0000-0000-0000-000000000001'
const STAR_ORG = '20000000-0000-0000-0000-000000000001'
const APEX_STORE_DT = '12000000-0000-0000-0000-000000000001'
const APEX_STORE_WST = '12000000-0000-0000-0000-000000000002'
const STAR_STORE_CTR = '22000000-0000-0000-0000-000000000001'

describe('ShopOS Phase 1 Database & Multi-Tenancy Security', () => {
  let db: PGlite

  // Helper to run queries as a specific authenticated user
  async function queryAsUser<T = any>(userId: string, sql: string, params: any[] = []): Promise<T[]> {
    // Set authenticated role and user claim
    await db.exec(`
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${userId}';
    `)
    try {
      const res = await db.query<T>(sql, params)
      return res.rows
    } finally {
      // Reset role back to postgres superuser
      await db.exec(`
        RESET ROLE;
        RESET request.jwt.claim.sub;
      `)
    }
  }

  // Helper to execute commands as a specific user expecting an error
  async function execAsUser(userId: string, sql: string): Promise<void> {
    await db.exec(`
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${userId}';
    `)
    try {
      await db.exec(sql)
    } finally {
      await db.exec(`
        RESET ROLE;
        RESET request.jwt.claim.sub;
      `)
    }
  }

  beforeEach(async () => {
    db = new PGlite()

    // 1. Create standard Supabase roles if not present in PGlite
    await db.exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
          CREATE ROLE service_role;
        END IF;
      END
      $$;
    `)

    // 2. Read and apply the migration file
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20261013000001_phase1_foundation_and_multitenancy.sql'
    )
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')
    await db.exec(migrationSql)

    // 3. Read and apply the seed file
    const seedPath = path.resolve(process.cwd(), 'supabase/seed.sql')
    const seedSql = fs.readFileSync(seedPath, 'utf8')
    await db.exec(seedSql)
  })

  describe('Self-service Onboarding (create_organization_with_store)', () => {
    it('allows an authenticated user to create an organization and first store atomically', async () => {
      // Create user in auth.users first
      await db.exec(`
        INSERT INTO auth.users (id, email) VALUES ('${UNREGISTERED_USER}', 'new_owner@shopos.local');
        INSERT INTO public.profiles (id, full_name) VALUES ('${UNREGISTERED_USER}', 'New Business Owner');
      `)

      const result = await queryAsUser(
        UNREGISTERED_USER,
        `SELECT public.create_organization_with_store(
          'Mobile Junction',
          'mobile-junction',
          'Main Branch',
          'MJ-MAIN',
          '100 Market St',
          '+919988776655'
        ) AS created;`
      )

      expect(result).toHaveLength(1)
      const data = (result[0] as any).created
      expect(data.organization_name).toBe('Mobile Junction')
      expect(data.organization_slug).toBe('mobile-junction')
      expect(data.store_name).toBe('Main Branch')
      expect(data.store_code).toBe('MJ-MAIN')

      // Verify the new owner can read their organization
      const orgs = await queryAsUser(
        UNREGISTERED_USER,
        `SELECT id, name, slug FROM public.organizations WHERE id = '${data.organization_id}';`
      )
      expect(orgs).toHaveLength(1)
      expect(orgs[0].name).toBe('Mobile Junction')

      // Verify owner can read their store
      const stores = await queryAsUser(
        UNREGISTERED_USER,
        `SELECT id, name, code FROM public.stores WHERE id = '${data.store_id}';`
      )
      expect(stores).toHaveLength(1)
      expect(stores[0].name).toBe('Main Branch')
    })

    it('rejects organization creation when not authenticated', async () => {
      await expect(
        db.query(`SELECT public.create_organization_with_store('Fail Org', 'fail-org', 'Store', 'STR');`)
      ).rejects.toThrow(/Not authenticated/)
    })

    it('rejects organization creation with invalid inputs', async () => {
      await expect(
        queryAsUser(
          UNREGISTERED_USER,
          `SELECT public.create_organization_with_store('', 'slug', 'Store', 'STR');`
        )
      ).rejects.toThrow(/Organization name cannot be empty/)

      await expect(
        queryAsUser(
          UNREGISTERED_USER,
          `SELECT public.create_organization_with_store('Valid Org', 'slug', ' ', 'STR');`
        )
      ).rejects.toThrow(/Store name cannot be empty/)
    })
  })

  describe('Tenant Isolation & Cross-Organization Protection', () => {
    it('restricts organization visibility strictly to active members of that organization', async () => {
      // Apex owner sees Apex Mobiles only
      const apexOrgs = await queryAsUser(APEX_OWNER, 'SELECT id, name FROM public.organizations;')
      expect(apexOrgs).toHaveLength(1)
      expect(apexOrgs[0].name).toBe('Apex Mobiles')

      // Star owner sees Star Cellular only
      const starOrgs = await queryAsUser(STAR_OWNER, 'SELECT id, name FROM public.organizations;')
      expect(starOrgs).toHaveLength(1)
      expect(starOrgs[0].name).toBe('Star Cellular')
    })

    it('prevents users from querying stores belonging to another organization', async () => {
      // Apex owner queries all stores accessible to them
      const apexStores = await queryAsUser(APEX_OWNER, 'SELECT id, organization_id, name FROM public.stores;')
      expect(apexStores).toHaveLength(2)
      expect(apexStores.every((s: any) => s.organization_id === APEX_ORG)).toBe(true)
      expect(apexStores.map((s: any) => s.name)).toEqual(['Apex Downtown', 'Apex West'])

      // Explicitly trying to query Star store by ID yields 0 rows for Apex Owner
      const starStoreQuery = await queryAsUser(
        APEX_OWNER,
        `SELECT id FROM public.stores WHERE id = '${STAR_STORE_CTR}';`
      )
      expect(starStoreQuery).toHaveLength(0)
    })

    it('denies cross-organization store insertion attempts', async () => {
      // Apex Admin attempts to insert a store into Star Cellular
      await expect(
        execAsUser(
          APEX_ADMIN,
          `INSERT INTO public.stores (organization_id, name, code)
           VALUES ('${STAR_ORG}', 'Malicious Store', 'MAL-01');`
        )
      ).rejects.toThrow()
    })

    it('denies cross-organization update attempts', async () => {
      // Apex Owner attempts to rename Star Cellular
      await execAsUser(
        APEX_OWNER,
        `UPDATE public.organizations SET name = 'Hacked Name' WHERE id = '${STAR_ORG}';`
      )

      // Verify name was not changed in database
      const res = await db.query(`SELECT name FROM public.organizations WHERE id = '${STAR_ORG}';`)
      expect((res.rows[0] as any).name).toBe('Star Cellular')
    })
  })

  describe('Store-Level Scoping & Unassigned Store Denial', () => {
    it('restricts staff to assigned stores only', async () => {
      // Staff 1 is assigned only to Apex Downtown
      const staff1Stores = await queryAsUser(
        APEX_STAFF1,
        'SELECT id, name FROM public.stores;'
      )
      expect(staff1Stores).toHaveLength(1)
      expect(staff1Stores[0].id).toBe(APEX_STORE_DT)
      expect(staff1Stores[0].name).toBe('Apex Downtown')

      // Staff 2 is assigned only to Apex West
      const staff2Stores = await queryAsUser(
        APEX_STAFF2,
        'SELECT id, name FROM public.stores;'
      )
      expect(staff2Stores).toHaveLength(1)
      expect(staff2Stores[0].id).toBe(APEX_STORE_WST)
      expect(staff2Stores[0].name).toBe('Apex West')
    })

    it('allows owners and admins to access all stores in their organization', async () => {
      const adminStores = await queryAsUser(
        APEX_ADMIN,
        'SELECT id, name FROM public.stores;'
      )
      expect(adminStores).toHaveLength(2)
      expect(adminStores.map((s: any) => s.name).sort()).toEqual(['Apex Downtown', 'Apex West'])
    })

    it('denies staff from creating new stores or modifying store assignments', async () => {
      await expect(
        execAsUser(
          APEX_STAFF1,
          `INSERT INTO public.stores (organization_id, name, code)
           VALUES ('${APEX_ORG}', 'Unauthorized Store', 'UNAUTH-01');`
        )
      ).rejects.toThrow()

      await expect(
        execAsUser(
          APEX_STAFF1,
          `INSERT INTO public.store_assignments (organization_id, store_id, user_id)
           VALUES ('${APEX_ORG}', '${APEX_STORE_WST}', '${APEX_STAFF1}');`
        )
      ).rejects.toThrow()
    })
  })

  describe('Deactivated Membership Access Denial', () => {
    it('completely denies data access to users with deactivated memberships', async () => {
      // Deactivated user cannot see organization
      const orgs = await queryAsUser(
        APEX_DEACTIVATED,
        'SELECT id, name FROM public.organizations;'
      )
      expect(orgs).toHaveLength(0)

      // Deactivated user cannot see stores
      const stores = await queryAsUser(
        APEX_DEACTIVATED,
        'SELECT id, name FROM public.stores;'
      )
      expect(stores).toHaveLength(0)

      // Deactivated user cannot see memberships
      const memberships = await queryAsUser(
        APEX_DEACTIVATED,
        'SELECT id FROM public.organization_memberships;'
      )
      expect(memberships).toHaveLength(0)
    })
  })

  describe('Database Constraints & Integrity Enforcement', () => {
    it('enforces composite foreign key integrity preventing cross-organization assignments', async () => {
      // Attempting to create a store assignment linking Star store with Apex user
      // violates composite foreign key constraint fk_store_assignment_store or fk_store_assignment_membership
      await expect(
        db.exec(`
          INSERT INTO public.store_assignments (organization_id, store_id, user_id)
          VALUES ('${STAR_ORG}', '${STAR_STORE_CTR}', '${APEX_STAFF1}');
        `)
      ).rejects.toThrow(/violates foreign key constraint/)
    })

    it('enforces unique store codes per organization', async () => {
      // Inserting duplicate store code in Apex Mobiles fails
      await expect(
        db.exec(`
          INSERT INTO public.stores (organization_id, name, code)
          VALUES ('${APEX_ORG}', 'Another Downtown', 'APEX-DT');
        `)
      ).rejects.toThrow(/duplicate key value violates unique constraint/)
    })
  })

  describe('Platform Administrator Boundary Separation', () => {
    it('allows platform administrators to view cross-organization data through platform admin policies', async () => {
      const allOrgs = await queryAsUser(
        PLATFORM_ADMIN,
        'SELECT id, name FROM public.organizations ORDER BY name;'
      )
      expect(allOrgs).toHaveLength(2)
      expect(allOrgs.map((o: any) => o.name)).toEqual(['Apex Mobiles', 'Star Cellular'])

      const allStores = await queryAsUser(
        PLATFORM_ADMIN,
        'SELECT id, name FROM public.stores ORDER BY name;'
      )
      expect(allStores).toHaveLength(4)
    })

    it('keeps platform administration strictly separated from normal organization users', async () => {
      // Regular Apex Owner cannot read platform admin records
      const adminRows = await queryAsUser(
        APEX_OWNER,
        'SELECT id, user_id FROM public.platform_admins;'
      )
      expect(adminRows).toHaveLength(0)

      // Regular Apex Owner cannot insert themselves into platform_admins
      await expect(
        execAsUser(
          APEX_OWNER,
          `INSERT INTO public.platform_admins (user_id) VALUES ('${APEX_OWNER}');`
        )
      ).rejects.toThrow()
    })
  })
})
