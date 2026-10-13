import React from 'react'
import type { Organization, Store, OrgRole, Profile } from '../types/database'

export interface DashboardProps {
  userProfile?: Profile | null
  userRole?: OrgRole
  organizations: Organization[]
  activeOrganization: Organization | null
  stores: Store[]
  activeStore: Store | null
  onSelectOrganization: (orgId: string) => void
  onSelectStore: (storeId: string) => void
  onSignOut?: () => void
  onReturnToSetup?: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({
  userProfile,
  userRole = 'owner',
  organizations,
  activeOrganization,
  stores,
  activeStore,
  onSelectOrganization,
  onSelectStore,
  onSignOut,
  onReturnToSetup,
}) => {

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-lg shadow-sm">
              S
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight block leading-tight">ShopOS</span>
              <span className="text-xs text-slate-400 block">Retail & Repair OS</span>
            </div>
          </div>

          {/* Tenant & Store Selectors */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Organization Selector */}
            <div className="relative">
              <label htmlFor="org-select" className="sr-only">Select Organization</label>
              <select
                id="org-select"
                aria-label="Active Organization"
                value={activeOrganization?.id || ''}
                onChange={(e) => onSelectOrganization(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    🏢 {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Store Selector */}
            <div className="relative">
              <label htmlFor="store-select" className="sr-only">Select Store</label>
              <select
                id="store-select"
                aria-label="Active Store"
                value={activeStore?.id || ''}
                onChange={(e) => onSelectStore(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    📍 {store.name} ({store.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Sign Out Button */}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Sign Out"
                className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Welcome & Role Banner */}
        <section aria-labelledby="welcome-heading" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase tracking-wider">
                  Role: {userRole}
                </span>
                <span className="text-xs text-slate-400">
                  {userProfile?.full_name ? `Logged in as ${userProfile.full_name}` : 'Authenticated Staff'}
                </span>
              </div>
              <h1 id="welcome-heading" className="text-2xl font-bold tracking-tight text-white">
                {activeOrganization ? activeOrganization.name : 'Shop Workspace'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Branch: <strong className="text-slate-200">{activeStore?.name || 'No store assigned'}</strong> ({activeStore?.code || '—'})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div role="status" aria-label="Tenant isolation active" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <span>Multi-Tenancy RLS Enforced</span>
              </div>
            </div>
          </div>
        </section>

        {/* Assigned Branch Cards */}
        <section aria-labelledby="stores-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="stores-heading" className="text-base font-semibold text-slate-200">
              Assigned Store Branches ({stores.length})
            </h2>
            <span className="text-xs text-slate-500">Authorized by PostgreSQL RLS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((store) => {
              const isCurrent = store.id === activeStore?.id
              return (
                <div
                  key={store.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-emerald-600 bg-slate-900 ring-1 ring-emerald-500/20'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-base">{store.name}</h3>
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {store.code}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {store.address || 'Address: Registered Retail Store'}
                      </p>
                      {store.phone && (
                        <p className="text-xs text-slate-400 mt-0.5">Contact: {store.phone}</p>
                      )}
                    </div>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => onSelectStore(store.id)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-800/80 bg-emerald-950/40 hover:bg-emerald-950 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Switch Store
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Feature Roadmap & Staged Readiness */}
        <section aria-labelledby="modules-heading" className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 id="modules-heading" className="text-base font-semibold text-slate-200">
            Operation Modules Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border border-emerald-800 bg-emerald-950/20">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Phase 1 · Complete</span>
              <p className="font-semibold text-white text-sm mt-1">Multi-Tenancy & Stores</p>
              <p className="text-xs text-slate-400 mt-1">PostgreSQL RLS, composite isolation, store assignment enforcement.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40 opacity-75">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Phase 2 · Next</span>
              <p className="font-semibold text-white text-sm mt-1">Catalog & Inventory</p>
              <p className="text-xs text-slate-400 mt-1">SKUs, IMEI identity tracking, store balances, opening stock.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40 opacity-50">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phase 3 · Queued</span>
              <p className="font-semibold text-white text-sm mt-1">Sales & Payments</p>
              <p className="text-xs text-slate-400 mt-1">Counter billing, invoice generation, UPI/cash payments.</p>
            </div>
          </div>
        </section>

        {onReturnToSetup && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onReturnToSetup}
              className="text-xs text-slate-500 hover:text-slate-400 underline"
            >
              Back to project foundation view
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        ShopOS · Phase 1 Multi-Tenancy Architecture Verified
      </footer>
    </div>
  )
}
