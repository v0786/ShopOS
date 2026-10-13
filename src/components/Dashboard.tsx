import type React from 'react'
import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChartNoAxesColumnIncreasing,
  FileText,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  Smartphone,
  UsersRound,
  X,
} from 'lucide-react'
import type { Organization, Store, OrgRole, Profile } from '../types/database'
import MobileShopSection, { type ShopBusinessProfile } from './MobileShopSection'
import { indianStates } from './mobileShopData'
import './mobile-shop.css'

type ShopSection = 'Dashboard' | 'Inventory' | 'Stock In' | 'Stock Out' | 'Billing' | 'Invoices' | 'Customers' | 'Reports' | 'Finance Partners' | 'Settings' | 'Help'
type StaffProfile = { name: string; email: string; role: string; mobile: string; staffId: string; aadhaar: string; pan: string }

const sections: { name: ShopSection; icon: typeof LayoutDashboard }[] = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Inventory', icon: Smartphone },
  { name: 'Stock In', icon: ArrowDownToLine },
  { name: 'Stock Out', icon: ArrowUpFromLine },
  { name: 'Billing', icon: ShoppingBag },
  { name: 'Invoices', icon: FileText },
  { name: 'Customers', icon: UsersRound },
  { name: 'Reports', icon: ChartNoAxesColumnIncreasing },
  { name: 'Finance Partners', icon: Handshake },
  { name: 'Settings', icon: Settings },
  { name: 'Help', icon: LifeBuoy },
]
const descriptions: Record<ShopSection, string> = {
  Dashboard: 'Your phone shop at a glance: sales, stock and customer activity.',
  Inventory: 'Track handset models, variants, IMEIs and available stock.',
  'Stock In': 'Review incoming supplier deliveries and stock received.',
  'Stock Out': 'Review phones sold, transferred, returned or written off.',
  Billing: 'Build a customer bill and review the amount due.',
  Invoices: 'Review customer bills and payment records.',
  Customers: 'Customer contacts, purchase history and warranty follow-ups.',
  Reports: 'Sales and stock performance across your shop.',
  'Finance Partners': 'Manage Bajaj Finance, TVS Credit and other lender arrangements.',
  Settings: 'Your profile and shop invoice details.',
  Help: 'Guidance for managing your mobile shop.',
}
const defaultShopProfile: ShopBusinessProfile = { shopName: 'Mobile Shop', legalName: '', gstin: '', address: '', phone: '', email: '', state: '', stateCode: '', invoicePrefix: 'MS' }
const defaultStaffProfile: StaffProfile = { name: 'Shop Manager', email: 'manager@shopos.local', role: 'Shop Owner', mobile: '', staffId: '', aadhaar: '', pan: '' }
const slug = (section: string) => section.toLowerCase().replaceAll(' ', '-')

function readSaved<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? { ...fallback as object, ...JSON.parse(value) as object } as T : fallback
  } catch {
    return fallback
  }
}

function ProfileSettings({ profile, onSave }: { profile: StaffProfile; onSave: (value: StaffProfile) => void }) {
  return <form className="shop-settings-form" onSubmit={event => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    onSave({ name: String(values.get('name')), email: String(values.get('email')), role: String(values.get('role')), mobile: String(values.get('mobile')), staffId: String(values.get('staffId')), aadhaar: String(values.get('aadhaar')), pan: String(values.get('pan')) })
  }} key={JSON.stringify(profile)}>
    <div className="profile-title"><span className="shop-profile-avatar">{profile.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><div><h2>Staff profile</h2><p>Contact and staff identity details for the shop team.</p></div></div>
    <div className="shop-settings-grid">
      <label>Full name<input name="name" required defaultValue={profile.name} /></label>
      <label>Email<input name="email" type="email" required defaultValue={profile.email} /></label>
      <label>Mobile number<input name="mobile" type="tel" defaultValue={profile.mobile} placeholder="+91 mobile number" /></label>
      <label>Role<input name="role" required defaultValue={profile.role} /></label>
      <label>Staff ID <span>(optional)</span><input name="staffId" defaultValue={profile.staffId} placeholder="e.g. STAFF-004" /></label>
      <label>Aadhaar number <span>(optional)</span><input name="aadhaar" inputMode="numeric" autoComplete="off" maxLength={12} pattern="[0-9]{12}" title="Enter 12 digits or leave blank" defaultValue={profile.aadhaar} placeholder="12 digits" /></label>
      <label>PAN <span>(optional)</span><input name="pan" autoComplete="off" maxLength={10} pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" title="Enter a valid 10-character PAN or leave blank" defaultValue={profile.pan} placeholder="ABCDE1234F" /></label>
    </div>
    <p className="shop-privacy-note">Demo profile values stay in this browser. Do not enter real Aadhaar or PAN details here.</p>
    <div className="form-actions"><button className="primary">Save profile</button></div>
  </form>
}

function ShopDetailsSettings({ shopProfile, onSave }: { shopProfile: ShopBusinessProfile; onSave: (value: ShopBusinessProfile) => void }) {
  return <form className="shop-settings-form" onSubmit={event => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const stateCode = String(values.get('stateCode'))
    onSave({ shopName: String(values.get('shopName')), legalName: String(values.get('legalName')), gstin: String(values.get('gstin')).trim().toUpperCase(), address: String(values.get('address')), phone: String(values.get('phone')), email: String(values.get('email')), state: indianStates.find(([, code]) => code === stateCode)?.[0] || '', stateCode, invoicePrefix: String(values.get('invoicePrefix')).trim().toUpperCase() || 'MS' })
  }} key={JSON.stringify(shopProfile)}>
    <div className="profile-title"><span className="shop-profile-avatar"><ShoppingBag size={20} /></span><div><h2>Shop details</h2><p>These details appear on printed sales receipts and invoices.</p></div></div>
    <div className="shop-settings-grid">
      <label>Shop display name<input name="shopName" required defaultValue={shopProfile.shopName} /></label>
      <label>Registered legal name<input name="legalName" defaultValue={shopProfile.legalName} placeholder="As shown on GST registration" /></label>
      <label>GSTIN <span>(leave blank if unregistered)</span><input name="gstin" autoComplete="off" maxLength={15} pattern="[0-9]{2}[A-Za-z0-9]{13}" title="Enter a 15-character GSTIN or leave blank" defaultValue={shopProfile.gstin} placeholder="15-character GSTIN" /></label>
      <label>Invoice number prefix<input name="invoicePrefix" maxLength={8} defaultValue={shopProfile.invoicePrefix} placeholder="MS" /></label>
      <label className="full">Registered business address<textarea name="address" rows={3} defaultValue={shopProfile.address} placeholder="Building, street, city, PIN code" /></label>
      <label>Business phone<input name="phone" type="tel" defaultValue={shopProfile.phone} /></label>
      <label>Business email<input name="email" type="email" defaultValue={shopProfile.email} /></label>
      <label>State of registration<select name="stateCode" defaultValue={shopProfile.stateCode}><option value="">Choose state</option>{indianStates.map(([name, code]) => <option key={code} value={code}>{name} ({code})</option>)}</select></label>
    </div>
    <p className="shop-privacy-note">Details stay in this browser. Verify your registered business details and tax treatment before issuing a real invoice.</p>
    <div className="form-actions"><button className="primary">Save shop details</button></div>
  </form>
}

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

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, userRole = 'owner', organizations, activeOrganization, stores, activeStore, onSelectOrganization, onSelectStore, onSignOut, onReturnToSetup }) => {
  const [section, setSection] = useState<ShopSection>(() => {
    const selected = sections.find(item => item.name.toLowerCase() === window.location.hash.slice(1).replaceAll('-', ' '))
    return selected?.name || 'Dashboard'
  })
  const [search, setSearch] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'Profile' | 'Shop details'>('Profile')
  const [shopProfile, setShopProfile] = useState<ShopBusinessProfile>(() => readSaved('shopos-shop-profile', defaultShopProfile))
  const [staffProfile, setStaffProfile] = useState<StaffProfile>(() => readSaved('shopos-staff-profile', defaultStaffProfile))

  useEffect(() => {
    try {
      localStorage.setItem('shopos-shop-profile', JSON.stringify(shopProfile))
      localStorage.setItem('shopos-staff-profile', JSON.stringify(staffProfile))
    } catch { /* Keep the current session state when browser storage is unavailable. */ }
  }, [shopProfile, staffProfile])
  useEffect(() => {
    const sync = () => {
      const found = sections.find(item => slug(item.name) === window.location.hash.slice(1))
      if (found) setSection(found.name)
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const navigate = (next: ShopSection) => {
    setSection(next)
    setSearch('')
    setMobileNavOpen(false)
    window.location.hash = slug(next)
  }
  const saveShopProfile = (value: ShopBusinessProfile) => setShopProfile(value)
  const saveStaffProfile = (value: StaffProfile) => setStaffProfile(value)
  const selectedDescription = descriptions[section]

  return <div className="shopos-app">
    <a className="shopos-skip" href="#shopos-content">Skip to content</a>
    <aside className={`shopos-sidebar ${mobileNavOpen ? 'open' : ''}`} id="workspace-navigation" aria-label="Shop navigation">
      <a className="shopos-brand" href="#dashboard" onClick={() => navigate('Dashboard')}><span className="shopos-brand-mark"><Smartphone size={21} /></span><span>{shopProfile.shopName || activeOrganization?.name || 'Mobile Shop'}<small>ShopOS</small></span></a>
      <div className="shopos-nav-label">MENU</div>
      <nav aria-label="Primary navigation">{sections.slice(0, 9).map(({ name, icon: Icon }) => <button type="button" key={name} className={section === name ? 'active' : ''} aria-current={section === name ? 'page' : undefined} onClick={() => navigate(name)}><Icon size={19} />{name}</button>)}</nav>
      <div className="shopos-nav-label general-label">GENERAL</div>
      <nav aria-label="General navigation">{sections.slice(9).map(({ name, icon: Icon }) => <button type="button" key={name} className={section === name ? 'active' : ''} aria-current={section === name ? 'page' : undefined} onClick={() => navigate(name)}><Icon size={19} />{name}</button>)}</nav>
      <div className="shopos-sidebar-store"><span>ACTIVE STORE</span><strong>{activeStore?.name || 'No store assigned'}</strong><small>{activeOrganization?.name} · {activeStore?.code || '—'}</small></div>
    </aside>
    {mobileNavOpen && <button className="shopos-nav-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
    <div className="shopos-workspace-body">
      <header className="shopos-topbar">
        <button type="button" className="shopos-menu-button" aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileNavOpen(value => !value)}>{mobileNavOpen ? <X size={21} /> : <Menu size={21} />}</button>
        <label className="shopos-global-search"><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={section === 'Billing' ? 'Search products, brand or IMEI' : 'Search products, IMEI or customers'} aria-label="Search products, IMEI or customers" /></label>
        <div className="shopos-topbar-controls">
          <label className="shopos-select-label"><span className="sr-only">Active Organization</span><select aria-label="Active Organization" value={activeOrganization?.id || ''} onChange={event => onSelectOrganization(event.target.value)}>{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
          <label className="shopos-select-label"><span className="sr-only">Active Store</span><select aria-label="Active Store" value={activeStore?.id || ''} onChange={event => onSelectStore(event.target.value)}>{stores.map(store => <option key={store.id} value={store.id}>{store.name} ({store.code})</option>)}</select></label>
          <button type="button" className="shopos-user" onClick={() => { setSettingsTab('Profile'); navigate('Settings') }} aria-label="Open staff profile"><span>{(userProfile?.full_name || staffProfile.name).split(' ').map(part => part[0]).slice(0, 2).join('')}</span><strong>{userProfile?.full_name || staffProfile.name}<small>{userRole}</small></strong></button>
          {onSignOut && <button type="button" className="shopos-signout" onClick={onSignOut}>Sign out</button>}
        </div>
      </header>
      <main id="shopos-content" className="shopos-main">
        <div className="shopos-page-heading"><div><span>{section === 'Dashboard' ? 'MOBILE RETAIL WORKSPACE' : 'SHOPOS · ' + section.toUpperCase()}</span><h1 id="welcome-heading">{section === 'Dashboard' ? activeOrganization?.name || 'Shop Workspace' : section}</h1><p>{section === 'Dashboard' ? `${selectedDescription} Branch: ${activeStore?.name || 'No store assigned'} (${activeStore?.code || '—'}).` : selectedDescription}</p></div></div>
        {sections.slice(0, 9).some(item => item.name === section) && <MobileShopSection section={section} onNavigate={(name) => navigate(name as ShopSection)} searchText={search} onSearchChange={setSearch} shopProfile={shopProfile} />}
        {section === 'Settings' && <div className="shop-settings-layout"><div className="card shop-settings-nav" role="tablist" aria-label="Settings sections"><button role="tab" aria-selected={settingsTab === 'Profile'} className={settingsTab === 'Profile' ? 'selected' : ''} onClick={() => setSettingsTab('Profile')}><UsersRound size={18} />Staff profile</button><button role="tab" aria-selected={settingsTab === 'Shop details'} className={settingsTab === 'Shop details' ? 'selected' : ''} onClick={() => setSettingsTab('Shop details')}><ShoppingBag size={18} />Shop details</button></div><article className="card shop-settings-content">{settingsTab === 'Profile' ? <ProfileSettings profile={staffProfile} onSave={saveStaffProfile} /> : <ShopDetailsSettings shopProfile={shopProfile} onSave={saveShopProfile} />}</article></div>}
        {section === 'Help' && <div className="shop-help-layout"><article className="card"><h2>Shop help and quick guides</h2><p>Get started with phones, stock, billing and customer care.</p>{[
          ['How do I add a phone to inventory?', 'Open Inventory and record brand, model, storage, color, purchase cost and IMEI.'],
          ['How do I receive a supplier delivery?', 'Open Stock In, enter the purchase reference and supplier, then check the device and IMEI.'],
          ['How do I complete a customer bill?', 'Open Billing, add products, enter customer details and select the payment method. This demo does not collect payment.'],
          ['Where is shop data saved?', 'Demo sales, stock, invoices and partner details stay in this browser. They are not yet backed by ShopOS database workflows.'],
        ].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</article><article className="card shop-help-shortcuts"><h2>Shop shortcuts</h2><p>Use Inventory, Stock In, Stock Out, Billing, Invoices, Customers and Reports to manage daily shop work.</p><button type="button" className="primary" onClick={() => navigate('Dashboard')}>Back to shop overview</button></article></div>}
        {section === 'Dashboard' && <section className="card shop-branches" aria-labelledby="stores-heading"><div className="card-heading"><h2 id="stores-heading">Shop locations ({stores.length})</h2><span>{userRole}</span></div><div className="shop-branches-grid">{stores.map(store => <article className={store.id === activeStore?.id ? 'active' : ''} key={store.id}><span className="shop-branch-icon"><Smartphone size={18} /></span><div><strong>{store.name}</strong><small>{store.code} · {store.address || 'Address not set'}</small></div>{store.id !== activeStore?.id && <button className="shop-table-action" onClick={() => onSelectStore(store.id)}>Switch store</button>}</article>)}</div></section>}
      </main>
      <footer className="shopos-footer">ShopOS · Phone sales, stock and service in one place{onReturnToSetup && <button onClick={onReturnToSetup}>Project setup</button>}</footer>
    </div>
  </div>
}
