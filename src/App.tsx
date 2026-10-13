import { useState } from 'react'
import './App.css'
import { Dashboard } from './components/Dashboard'
import { AuthScreen } from './components/AuthScreen'
import type { Organization, Store, OrgRole } from './types/database'
import { authService } from './features/auth/authService'
import { organizationService } from './features/organizations/organizationService'

// Default Phase 1 seed organizations for interactive workspace preview
const DEFAULT_ORGS: Organization[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Apex Mobiles',
    slug: 'apex-mobiles',
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2026-10-13T00:00:00Z',
    updated_at: '2026-10-13T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000001',
    name: 'Star Cellular',
    slug: 'star-cellular',
    created_by: '00000000-0000-0000-0000-000000000006',
    created_at: '2026-10-13T00:00:00Z',
    updated_at: '2026-10-13T00:00:00Z',
  },
]

const DEFAULT_STORES: Record<string, Store[]> = {
  '10000000-0000-0000-0000-000000000001': [
    {
      id: '12000000-0000-0000-0000-000000000001',
      organization_id: '10000000-0000-0000-0000-000000000001',
      name: 'Apex Downtown',
      code: 'APEX-DT',
      address: '12 MG Road, Bengaluru',
      phone: '+918012345678',
      is_active: true,
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
    {
      id: '12000000-0000-0000-0000-000000000002',
      organization_id: '10000000-0000-0000-0000-000000000001',
      name: 'Apex West',
      code: 'APEX-WST',
      address: '45 Indiranagar, Bengaluru',
      phone: '+918012345679',
      is_active: true,
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
  ],
  '20000000-0000-0000-0000-000000000001': [
    {
      id: '22000000-0000-0000-0000-000000000001',
      organization_id: '20000000-0000-0000-0000-000000000001',
      name: 'Star Central',
      code: 'STAR-CTR',
      address: '78 Linking Road, Mumbai',
      phone: '+912212345678',
      is_active: true,
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
    {
      id: '22000000-0000-0000-0000-000000000002',
      organization_id: '20000000-0000-0000-0000-000000000001',
      name: 'Star Express',
      code: 'STAR-EXP',
      address: '99 Andheri West, Mumbai',
      phone: '+912212345679',
      is_active: true,
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
  ],
}

export interface AppProps {
  initialView?: 'setup' | 'dashboard' | 'auth'
}

function App({ initialView = 'setup' }: AppProps) {
  const [view, setView] = useState<'setup' | 'dashboard' | 'auth'>(initialView)

  const [organizations, setOrganizations] = useState<Organization[]>(DEFAULT_ORGS)
  const [activeOrgId, setActiveOrgId] = useState<string>(DEFAULT_ORGS[0].id)
  const [activeStoreId, setActiveStoreId] = useState<string>(DEFAULT_STORES[DEFAULT_ORGS[0].id][0].id)
  const [role, setRole] = useState<OrgRole>('owner')

  const activeOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0]
  const currentOrgStores = DEFAULT_STORES[activeOrgId] || []
  const activeStore = currentOrgStores.find((s) => s.id === activeStoreId) || currentOrgStores[0]

  const handleSelectOrg = (orgId: string) => {
    setActiveOrgId(orgId)
    const storesForNewOrg = DEFAULT_STORES[orgId] || []
    if (storesForNewOrg.length > 0) {
      setActiveStoreId(storesForNewOrg[0].id)
    }
  }

  const handleSelectStore = (storeId: string) => {
    setActiveStoreId(storeId)
  }

  const handleSignIn = async (email: string, pass: string) => {
    await authService.signIn(email, pass)
    setView('dashboard')
  }

  const handleSignUpAndOnboard = async (params: {
    email: string
    password: string
    fullName: string
    orgName: string
    orgSlug: string
    storeName: string
    storeCode: string
  }) => {
    await authService.signUp({
      email: params.email,
      password: params.password,
      fullName: params.fullName,
    })

    const result = await organizationService.createOrganizationWithStore({
      orgName: params.orgName,
      orgSlug: params.orgSlug,
      storeName: params.storeName,
      storeCode: params.storeCode,
    })

    const newOrg: Organization = {
      id: result.organization_id,
      name: result.organization_name,
      slug: result.organization_slug,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const newStore: Store = {
      id: result.store_id,
      organization_id: result.organization_id,
      name: result.store_name,
      code: result.store_code,
      address: null,
      phone: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setOrganizations((prev) => [...prev, newOrg])
    DEFAULT_STORES[newOrg.id] = [newStore]
    setActiveOrgId(newOrg.id)
    setActiveStoreId(newStore.id)
    setRole('owner')
    setView('dashboard')
  }

  if (view === 'dashboard') {
    return (
      <Dashboard
        organizations={organizations}
        activeOrganization={activeOrg}
        stores={currentOrgStores}
        activeStore={activeStore}
        userRole={role}
        onSelectOrganization={handleSelectOrg}
        onSelectStore={handleSelectStore}
        onSignOut={() => setView('setup')}
        onReturnToSetup={() => setView('setup')}
      />
    )
  }

  if (view === 'auth') {
    return (
      <AuthScreen
        onSignIn={handleSignIn}
        onSignUpAndOnboard={handleSignUpAndOnboard}
        onCancel={() => setView('setup')}
      />
    )
  }

  return (
    <main className="setup-page">
      <header className="brand" aria-label="ShopOS">
        <span className="brand-mark" aria-hidden="true">S</span>
        <span>ShopOS</span>
      </header>

      <section className="setup-card" aria-labelledby="setup-title">
        <p className="eyebrow">Retail, repairs, all in one place</p>
        <h1 id="setup-title">A steadier way to run your shop.</h1>
        <p className="setup-copy">
          The Phase 1 multi-tenant architecture is in place with PostgreSQL RLS,
          organization and store boundaries, and automated integration tests.
        </p>

        <div className="setup-status" role="status">
          <span className="status-dot" aria-hidden="true" />
          <span>Phase 1 foundation · multi-tenancy & stores implemented</span>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-wrap gap-4 items-center text-sm">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault()
              setView('dashboard')
            }}
            className="text-emerald-400 hover:text-emerald-300 font-medium underline"
          >
            Open Phase 1 Multi-Store Dashboard &rarr;
          </a>
          <a
            href="#auth"
            onClick={(e) => {
              e.preventDefault()
              setView('auth')
            }}
            className="text-slate-400 hover:text-slate-200 underline"
          >
            Access / Sign In &rarr;
          </a>
        </div>
      </section>

      <footer>Built for independent mobile retailers and repair teams.</footer>
    </main>
  )
}

export default App
