import React, { useState } from 'react'

export interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUpAndOnboard: (params: {
    email: string
    password: string
    fullName: string
    orgName: string
    orgSlug: string
    storeName: string
    storeCode: string
  }) => Promise<void>
  onCancel?: () => void
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  onSignUpAndOnboard,
  onCancel,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeCode, setStoreCode] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (tab === 'signin') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password.')
        }
        await onSignIn(email.trim(), password)
      } else {
        if (!email.trim() || !password) {
          throw new Error('Please enter email and password.')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.')
        }
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.')
        }
        if (!orgName.trim()) {
          throw new Error('Please enter your organization or shop name.')
        }
        if (!storeName.trim() || !storeCode.trim()) {
          throw new Error('Please specify your first store branch name and code.')
        }

        const orgSlug = orgName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')

        await onSignUpAndOnboard({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          orgName: orgName.trim(),
          orgSlug: orgSlug || 'my-shop',
          storeName: storeName.trim(),
          storeCode: storeCode.trim().toUpperCase(),
        })
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-xl bg-emerald-500 text-slate-950 font-bold items-center justify-center text-xl shadow mb-3">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ShopOS Access</h1>
          <p className="text-xs text-slate-400 mt-1">Multi-tenant retail and repair platform</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 mb-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'signin'}
            onClick={() => {
              setTab('signin')
              setError(null)
            }}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'signin'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'signup'}
            onClick={() => {
              setTab('signup')
              setError(null)
            }}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'signup'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register & Onboard
          </button>
        </div>

        {error && (
          <div role="alert" className="p-3 mb-5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="retailer@example.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {tab === 'signup' && (
            <>
              <div>
                <label htmlFor="auth-fullname" className="block text-xs font-medium text-slate-300 mb-1">
                  Owner Full Name
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="auth-orgname" className="block text-xs font-medium text-slate-300 mb-1">
                  Organization / Shop Name
                </label>
                <input
                  id="auth-orgname"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Om Telecom"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="auth-storename" className="block text-xs font-medium text-slate-300 mb-1">
                    First Store Branch
                  </label>
                  <input
                    id="auth-storename"
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Main Market"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="auth-storecode" className="block text-xs font-medium text-slate-300 mb-1">
                    Store Code
                  </label>
                  <input
                    id="auth-storecode"
                    type="text"
                    required
                    value={storeCode}
                    onChange={(e) => setStoreCode(e.target.value)}
                    placeholder="e.g. MAIN"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
          >
            {loading ? 'Processing...' : tab === 'signin' ? 'Sign In to ShopOS' : 'Create Organization & First Store'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full text-xs text-slate-400 hover:text-slate-300 py-1.5 transition-colors"
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
