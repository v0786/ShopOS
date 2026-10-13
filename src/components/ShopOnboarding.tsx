import type React from 'react'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Smartphone, Store } from 'lucide-react'
import type { ShopBusinessProfile } from './MobileShopSection'
import { indianStates } from './mobileShopData'
import './mobile-shop.css'

type OnboardingProfile = ShopBusinessProfile & { ownerPhone: string; businessType: string; city: string; pincode: string }

const blankProfile = (shopName: string): OnboardingProfile => ({
  shopName: shopName || '', legalName: '', gstin: '', address: '', phone: '', email: '', state: '', stateCode: '', invoicePrefix: 'MS',
  ownerPhone: '', businessType: 'Mobile phones & accessories', city: '', pincode: '',
})

export function ShopOnboarding({ initialShopName, onComplete }: { initialShopName: string; onComplete: (profile: OnboardingProfile) => void }) {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<OnboardingProfile>(() => blankProfile(initialShopName))
  const [error, setError] = useState('')
  const update = (field: keyof OnboardingProfile, value: string) => setProfile(current => ({ ...current, [field]: value }))
  const continueSetup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setStep(2)
  }
  const finishSetup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (profile.gstin && !/^[0-9]{2}[A-Z0-9]{13}$/.test(profile.gstin.toUpperCase())) {
      setError('Enter a valid 15-character GSTIN or leave the field blank.')
      return
    }
    onComplete(profile)
  }
  return <main className="shop-onboarding-screen">
    <a className="shop-onboarding-brand" href="#dashboard"><span><Smartphone size={21} /></span>ShopOS</a>
    <div className="shop-onboarding-card">
      <section className="shop-onboarding-intro"><span className="shop-onboarding-mark"><Store size={21} /></span><small>MOBILE SHOP SETUP</small><h1>Make your shop ready for business.</h1><p>Add a few details so your workspace and printed invoices can show the right shop information.</p><div><Smartphone size={17} /> Built for phone sales, stock and service</div></section>
      <form className="shop-onboarding-form" onSubmit={step === 1 ? continueSetup : finishSetup}>
        <div className="shop-onboarding-stepper"><span className={step === 1 ? 'complete' : 'complete'}><i>{step === 2 ? <Check size={14} /> : '1'}</i>Shop basics</span><b /><span className={step === 2 ? 'complete' : ''}><i>2</i>Billing details</span></div>
        {step === 1 ? <><small className="shop-onboarding-eyebrow">STEP 1 OF 2</small><h2>Tell us about your shop</h2><p>This is how your store will appear in the workspace.</p>
          <label>Shop or business name<input required autoFocus value={profile.shopName} onChange={event => update('shopName', event.target.value)} placeholder="e.g. City Mobile Hub" /></label>
          <label>Owner or manager mobile<input required type="tel" minLength={10} maxLength={18} pattern="[0-9+() -]{10,18}" value={profile.ownerPhone} onChange={event => update('ownerPhone', event.target.value)} placeholder="+91 98765 43210" /></label>
          <label>What do you sell?<select value={profile.businessType} onChange={event => update('businessType', event.target.value)}><option>Mobile phones & accessories</option><option>Mobile phones only</option><option>Phones, accessories & repairs</option></select></label>
          <button className="primary shop-onboarding-next">Continue to billing details <ArrowRight size={17} /></button>
        </> : <><small className="shop-onboarding-eyebrow">STEP 2 OF 2</small><h2>Set up invoice details</h2><p>These details may appear on customer invoices. GSTIN is optional.</p>
          <label>Shop address<input required autoFocus value={profile.address} onChange={event => update('address', event.target.value)} placeholder="Street, building or market" /></label>
          <div className="shop-onboarding-fields"><label>City<input required value={profile.city} onChange={event => update('city', event.target.value)} placeholder="City" /></label><label>PIN code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={profile.pincode} onChange={event => update('pincode', event.target.value)} placeholder="6 digits" /></label></div>
          <label>State or union territory<select required value={profile.stateCode} onChange={event => { const match = indianStates.find(([, code]) => code === event.target.value); setProfile(current => ({ ...current, state: match?.[0] || '', stateCode: event.target.value })) }}><option value="">Choose state or union territory</option>{indianStates.map(([name, code]) => <option key={code} value={code}>{name}</option>)}</select></label>
          <label>GSTIN <span>(optional)</span><input maxLength={15} value={profile.gstin} onChange={event => update('gstin', event.target.value.toUpperCase())} placeholder="15-character GST identification number" /></label>
          {error && <p className="shop-onboarding-error" role="alert">{error}</p>}
          <div className="shop-onboarding-actions"><button type="button" className="outline" onClick={() => { setError(''); setStep(1) }}><ArrowLeft size={16} /> Back</button><button className="primary">Finish shop setup <Check size={17} /></button></div>
        </>}
        <small className="shop-onboarding-local-note">Setup profile is saved in this browser for the demo.</small>
      </form>
    </div>
  </main>
}
