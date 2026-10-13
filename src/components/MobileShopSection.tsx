import type React from 'react';
import { indianStates, createCurrentDate } from './mobileShopData';

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
const StockIntakePanel = lazy(() => import('./StockIntakePanel'));
import { validateIntakeDraft, type StockReceipt } from '../features/stock-intake/stockIntake';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Barcode,
  Check,
  CircleAlert,
  FileText,
  Handshake,
  Package,
  Printer,
  Plus,
  Minus,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  UsersRound,
} from 'lucide-react';

export type ShopBusinessProfile = {
  shopName: string;
  legalName: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  state: string;
  stateCode: string;
  invoicePrefix: string;
};

type Product = { model: string; brand: string; variant: string; imei: string; stock: number; price: number; status: string; hsn: string; gstRate: number };
type CartItem = { model: string; quantity: number };
type InvoiceLine = { model: string; variant: string; hsn: string; quantity: number; unitPrice: number; gstRate: number; taxableValue: number; taxAmount: number };
type SaleInvoice = { id: string; createdAt: string; customer: string; phone: string; address: string; state: string; stateCode: string; gstin: string; paymentMethod: string; financePartner: string; lines: InvoiceLine[]; taxableValue: number; taxAmount: number; total: number; interState: boolean; shop: ShopBusinessProfile };
type FinancePartner = { id: string; name: string; type: string; contact: string; status: 'Active' | 'Paused'; notes: string };

const products = [
  { model: 'iPhone 15', brand: 'Apple', variant: '128 GB · Black', imei: '•••• 4821', stock: 2, price: 69900, status: 'Low stock', hsn: '8517', gstRate: 18 },
  { model: 'Samsung Galaxy S24', brand: 'Samsung', variant: '256 GB · Gray', imei: '•••• 1904', stock: 8, price: 74999, status: 'In stock', hsn: '8517', gstRate: 18 },
  { model: 'OnePlus 12', brand: 'OnePlus', variant: '256 GB · Flowy Emerald', imei: '•••• 7732', stock: 5, price: 64999, status: 'In stock', hsn: '8517', gstRate: 18 },
  { model: 'Google Pixel 8a', brand: 'Google', variant: '128 GB · Aloe', imei: '•••• 2088', stock: 1, price: 52999, status: 'Low stock', hsn: '8517', gstRate: 18 },
  { model: 'Redmi Note 13 Pro', brand: 'Xiaomi', variant: '256 GB · Midnight Black', imei: '•••• 6610', stock: 12, price: 25999, status: 'In stock', hsn: '8517', gstRate: 18 },
];

const invoices = [
  { id: 'INV-2026-1048', customer: 'Aarav Mehta', date: '13 Oct 2026', amount: 74999, status: 'Paid' },
  { id: 'INV-2026-1047', customer: 'Diya Shah', date: '13 Oct 2026', amount: 25999, status: 'Paid' },
  { id: 'INV-2026-1046', customer: 'Kabir Nair', date: '12 Oct 2026', amount: 69900, status: 'Due' },
  { id: 'INV-2026-1045', customer: 'Ishita Rao', date: '12 Oct 2026', amount: 64999, status: 'Paid' },
];

const stockOutRows = [
  { ref: 'OUT-391', device: 'Samsung Galaxy S24', details: 'IMEI ending 1904', reason: 'Sale · INV-1048', units: 1, date: '13 Oct 2026' },
  { ref: 'OUT-390', device: 'Redmi Note 13 Pro', details: 'IMEI ending 6610', reason: 'Sale · INV-1047', units: 1, date: '13 Oct 2026' },
  { ref: 'OUT-389', device: 'OnePlus 12', details: 'IMEI ending 7732', reason: 'Store transfer', units: 1, date: '12 Oct 2026' },
];

const customers = [
  { name: 'Aarav Mehta', phone: '+91 98765 43210', last: '13 Oct 2026', purchases: 3, spent: 146898 },
  { name: 'Diya Shah', phone: '+91 98123 45670', last: '13 Oct 2026', purchases: 1, spent: 25999 },
  { name: 'Kabir Nair', phone: '+91 99001 23456', last: '12 Oct 2026', purchases: 2, spent: 104899 },
  { name: 'Ishita Rao', phone: '+91 98450 11223', last: '12 Oct 2026', purchases: 1, spent: 64999 },
];

const money = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const sampleSales = [
  { id: 'INV-2026-1048', customer: 'Aarav Mehta', date: '2026-10-13', amount: 74999, status: 'Paid', units: 1, payment: 'UPI' },
  { id: 'INV-2026-1047', customer: 'Diya Shah', date: '2026-10-13', amount: 25999, status: 'Paid', units: 1, payment: 'Cash' },
  { id: 'INV-2026-1046', customer: 'Kabir Nair', date: '2026-10-12', amount: 69900, status: 'Due', units: 1, payment: 'Card' },
  { id: 'INV-2026-1045', customer: 'Ishita Rao', date: '2026-10-12', amount: 64999, status: 'Paid', units: 1, payment: 'UPI' },
];

function useBrowserSaved<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(key);
        if (saved) setValue(JSON.parse(saved) as T);
      } catch { /* Keep the demo defaults if browser storage is unavailable. */ }
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [key]);
  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(value));
  }, [key, ready, value]);
  return [value, setValue];
}

function toIsoDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportSalesReport(rows: { id: string; date: string; customer: string; amount: number; units: number; payment: string }[]) {
  const csv = ['Invoice,Date,Customer,Amount,Units,Payment', ...rows.map(row => [row.id, row.date, `"${row.customer.replaceAll('"', '""')}"`, row.amount, row.units, row.payment].join(','))].join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = 'mobile-shop-sales.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="shop-page-title"><div><span className="shop-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}

function Metric({ label, value, note, icon: Icon, tone = '' }: { label: string; value: string; note: string; icon: React.ElementType; tone?: string }) {
  return <article className="card shop-metric"><span className={`shop-metric-icon ${tone}`}><Icon size={19} /></span><span className="shop-metric-label">{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="card shop-table-card"><div className="shop-table-scroll"><table className="shop-table"><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div></div>;
}

export default function MobileShopSection({ section, onNavigate, searchText = '', onSearchChange = () => {}, shopProfile }: { section: string; onNavigate: (name: string) => void; searchText?: string; onSearchChange?: (value: string) => void; shopProfile: ShopBusinessProfile }) {
  const [inventory, setInventory] = useBrowserSaved<Product[]>('shopos-demo-inventory', products);
  const [stockReceipts, setStockReceipts] = useBrowserSaved<StockReceipt[]>('shopos-demo-stock-receipts', []);
  const [sales, setSales] = useBrowserSaved<SaleInvoice[]>('shopos-demo-sales', []);
  const [partners, setPartners] = useBrowserSaved<FinancePartner[]>('shopos-finance-partners', [
    { id: 'bajaj', name: 'Bajaj Finance', type: 'Consumer durable loan', contact: '', status: 'Active', notes: 'EMI at point of sale' },
    { id: 'tvs', name: 'TVS Credit', type: 'Consumer durable loan', contact: '', status: 'Active', notes: 'Phone financing' },
  ]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState('All');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', state: '', stateCode: '', gstin: '', payment: 'UPI', financePartner: '' });
  const [billError, setBillError] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<SaleInvoice | null>(null);
  const [partnerDraft, setPartnerDraft] = useState({ name: '', type: 'Consumer durable loan', contact: '', notes: '' });
  const [reportPeriod, setReportPeriod] = useState('Monthly');
  const [reportNow] = useState(() => new Date());
  const [reportStart, setReportStart] = useState(() => toIsoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [reportEnd, setReportEnd] = useState(() => toIsoDate(new Date()));
  const filteredProducts = useMemo(() => inventory.filter(product => (category === 'All' || product.brand === category) && `${product.model} ${product.brand} ${product.variant} ${product.imei}`.toLowerCase().includes(searchText.toLowerCase())), [inventory, category, searchText]);
  const filteredCustomers = customers.filter(customer => `${customer.name} ${customer.phone}`.toLowerCase().includes(searchText.toLowerCase()));
  const cartProducts = cart.map(item => ({ product: inventory.find(product => product.model === item.model), quantity: item.quantity })).filter((item): item is { product: Product; quantity: number } => Boolean(item.product));
  const subtotal = cartProducts.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = shopProfile.gstin ? cartProducts.reduce((sum, item) => sum + Math.round(item.product.price * item.quantity * item.product.gstRate / 100), 0) : 0;
  const reportRows = useMemo(() => {
    const samples = sampleSales.map(row => ({ ...row }));
    const saved = sales.map(row => ({ id: row.id, customer: row.customer, date: row.createdAt.slice(0, 10), amount: row.total, status: 'Paid', units: row.lines.reduce((sum, line) => sum + line.quantity, 0), payment: row.paymentMethod }));
    const all = [...saved, ...samples];
    const today = toIsoDate(reportNow);
    const monthStart = toIsoDate(new Date(reportNow.getFullYear(), reportNow.getMonth(), 1));
    const subtractDays = (days: number) => { const date = new Date(reportNow); date.setDate(date.getDate() - days); return toIsoDate(date); };
    const start = reportPeriod === 'Daily' ? today : reportPeriod === 'Monthly' ? monthStart : reportPeriod === '7 days' ? subtractDays(6) : reportPeriod === '30 days' ? subtractDays(29) : reportPeriod === 'Custom' ? reportStart : subtractDays(89);
    const end = reportPeriod === 'Custom' ? reportEnd : today;
    return all.filter(row => row.date >= start && row.date <= end).sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, reportPeriod, reportStart, reportEnd, reportNow]);
  const reportTotal = reportRows.reduce((sum, row) => sum + row.amount, 0);
  const reportUnits = reportRows.reduce((sum, row) => sum + row.units, 0);
  const reportAverage = reportRows.length ? Math.round(reportTotal / reportRows.length) : 0;
  const reportPayments = ['UPI', 'Card', 'Cash', 'Finance'].map(method => ({ method, amount: reportRows.filter(row => row.payment === method).reduce((sum, row) => sum + row.amount, 0) }));

  useEffect(() => {
    if (!activeInvoice) return;
    const afterPrint = () => setActiveInvoice(null);
    window.addEventListener('afterprint', afterPrint);
    const timer = window.setTimeout(() => window.print(), 150);
    return () => { window.clearTimeout(timer); window.removeEventListener('afterprint', afterPrint); };
  }, [activeInvoice]);

  const addProduct = (product: Product) => {
    setBillError('');
    setCart(items => {
      const current = items.find(item => item.model === product.model)?.quantity ?? 0;
      if (current >= product.stock) return items;
      return current ? items.map(item => item.model === product.model ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { model: product.model, quantity: 1 }];
    });
  };

  const completeSale = () => {
    setBillError('');
    if (!cartProducts.length) return;
    const total = subtotal + tax;
    if (!customer.name.trim() || !customer.phone.trim()) { setBillError('Enter the customer name and phone number to complete the bill.'); return; }
    if (shopProfile.gstin && (!shopProfile.shopName.trim() || !shopProfile.legalName.trim() || !shopProfile.address.trim() || !shopProfile.stateCode.trim())) { setBillError('Complete your shop name, legal name, registered address and state in Settings → Shop details before issuing a GST tax invoice.'); return; }
    if (customer.gstin && (!customer.address.trim() || !customer.stateCode)) { setBillError('For a registered customer, enter their GSTIN, billing address and state.'); return; }
    if (subtotal >= 50000 && !customer.gstin && (!customer.address.trim() || !customer.stateCode)) { setBillError('For an unregistered customer and taxable value of ₹50,000 or more, enter their address and state.'); return; }
    if (customer.payment === 'Finance' && !customer.financePartner) { setBillError('Choose an active finance partner for this bill.'); return; }
    const now = createCurrentDate();
    const financialYear = now.getMonth() >= 3 ? `${String(now.getFullYear()).slice(-2)}-${String(now.getFullYear() + 1).slice(-2)}` : `${String(now.getFullYear() - 1).slice(-2)}-${String(now.getFullYear()).slice(-2)}`;
    const sequence = String(sales.length + 1).padStart(4, '0');
    const invoice: SaleInvoice = {
      id: `${shopProfile.invoicePrefix || 'MS'}/${financialYear}/${sequence}`,
      createdAt: now.toISOString(), customer: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim(), state: customer.state, stateCode: customer.stateCode, gstin: customer.gstin.trim().toUpperCase(), paymentMethod: customer.payment, financePartner: customer.financePartner,
      lines: cartProducts.map(({ product, quantity }) => ({ model: product.model, variant: product.variant, hsn: product.hsn, quantity, unitPrice: product.price, gstRate: product.gstRate, taxableValue: product.price * quantity, taxAmount: shopProfile.gstin ? Math.round(product.price * quantity * product.gstRate / 100) : 0 })),
      taxableValue: subtotal, taxAmount: tax, total, interState: Boolean(customer.stateCode && shopProfile.stateCode && customer.stateCode !== shopProfile.stateCode), shop: shopProfile,
    };
    setInventory(items => items.map(product => { const sold = cart.find(item => item.model === product.model)?.quantity ?? 0; const stock = Math.max(0, product.stock - sold); return { ...product, stock, status: stock <= 2 ? 'Low stock' : 'In stock' }; }));
    setSales(items => [...items, invoice]);
    setCart([]);
    setCustomer({ name: '', phone: '', address: '', state: '', stateCode: '', gstin: '', payment: 'UPI', financePartner: '' });
    setActiveInvoice(invoice);
  };

  const postStockReceipt = (receipt: StockReceipt) => {
    if (validateIntakeDraft(receipt, stockReceipts, inventory).length) return false;
    setInventory(items => items.map(product => {
      const received = receipt.lines.filter(line => line.model === product.model && line.variant === product.variant).length;
      if (!received) return product;
      const stock = product.stock + received;
      return { ...product, stock, status: stock <= 2 ? 'Low stock' : 'In stock' };
    }));
    setStockReceipts(items => [...items, receipt]);
    return true;
  };

  if (!(['Dashboard', 'Inventory', 'Stock In', 'Stock Out', 'Billing', 'Invoices', 'Customers', 'Reports', 'Finance Partners'] as string[]).includes(section)) return null;

  return <>
  <div className="shop-section">
    {section === 'Dashboard' && <>
      <PageTitle eyebrow="STORE OVERVIEW" title="Today at your shop" description="A quick view of sales, handset stock and customer payments." action={<><button className="outline" onClick={() => onNavigate('Stock In')}><ArrowDownToLine size={17} />Receive stock</button><button className="primary" onClick={() => onNavigate('Billing')}><Plus size={17} />New bill</button></>} />
      <div className="shop-metrics"><Metric label="Sales today" value="₹3,18,490" note="12 bills · 4.8% above yesterday" icon={ShoppingBag} /><Metric label="Phones in stock" value="128" note="38 models across 12 brands" icon={Package} tone="mint" /><Metric label="Low stock alerts" value="8 models" note="Review reorder quantities" icon={CircleAlert} tone="amber" /><Metric label="Payments due" value="₹69,900" note="1 invoice awaiting payment" icon={FileText} tone="lilac" /></div>
      <div className="shop-overview-grid"><article className="card"><div className="card-heading"><div><h2>Recent invoices</h2><p className="shop-muted">Latest customer bills</p></div><button className="shop-table-action" onClick={() => onNavigate('Invoices')}>All invoices <FileText size={15} /></button></div><Table headers={['INVOICE', 'CUSTOMER', 'AMOUNT', 'STATUS']}>
        {invoices.slice(0, 3).map(invoice => <tr key={invoice.id}><td><strong className="shop-mono">{invoice.id}</strong></td><td>{invoice.customer}</td><td><strong>{money(invoice.amount)}</strong></td><td><span className={`shop-status ${invoice.status === 'Paid' ? 'success' : 'warning'}`}>{invoice.status}</span></td></tr>)}
      </Table></article><article className="card shop-low-stock"><div className="card-heading"><div><h2>Reorder soon</h2><p className="shop-muted">Handsets with 2 or fewer on hand</p></div><CircleAlert size={18} className="shop-alert-icon" /></div>{products.filter(product => product.stock <= 2).map(product => <div className="shop-low-stock-row" key={product.model}><span className="shop-product-glyph"><Smartphone size={19} /></span><span><strong>{product.model}</strong><small>{product.variant}</small></span><b>{product.stock} left</b></div>)}<button className="outline shop-wide-action" onClick={() => onNavigate('Inventory')}>Open inventory</button></article></div>
    </>}
    {section === 'Inventory' && <>
      <PageTitle eyebrow="CATALOG & STOCK" title="Phone inventory" description="Track each handset by model, storage, color and IMEI." />
      <div className="shop-metrics"><Metric label="Models in catalog" value="38" note="Across 12 brands" icon={Smartphone} /><Metric label="Handsets in stock" value="128" note="Across all locations" icon={Package} tone="mint" /><Metric label="Low stock" value="8" note="Reorder soon" icon={CircleAlert} tone="amber" /><Metric label="Stock value" value="₹42.8L" note="At purchase cost" icon={Barcode} tone="lilac" /></div>
      <div className="shop-toolbar"><label className="shop-search"><Search size={17} /><input value={searchText} onChange={event => onSearchChange(event.target.value)} placeholder="Search model, variant or IMEI" /></label><span>{filteredProducts.length} products shown</span></div>
      <Table headers={['PHONE / VARIANT', 'IMEI', 'SELLING PRICE', 'ON HAND', 'STATUS']}>
        {filteredProducts.map(product => <tr key={product.model}><td><strong>{product.model}</strong><small>{product.variant}</small></td><td className="shop-mono">{product.imei}</td><td>{money(product.price)}</td><td>{product.stock} units</td><td><span className={`shop-status ${product.status === 'Low stock' ? 'warning' : 'success'}`}>{product.status}</span></td></tr>)}
      </Table>
      <p className="shop-footnote">Demo stock figures. Record the full IMEI and warranty details when adding a handset.</p>
    </>}

    {section === 'Stock In' && <>
      <PageTitle eyebrow="PURCHASES" title="Stock received" description="Log supplier deliveries and add each device to available stock." />
      <div className="shop-metrics"><Metric label="Received today" value={`${stockReceipts.filter(receipt => receipt.postedAt.slice(0, 10) === toIsoDate(reportNow)).reduce((sum, receipt) => sum + receipt.lines.length, 0)} units`} note="Posted supplier receipts" icon={ArrowDownToLine} /><Metric label="Handsets in stock" value={String(inventory.reduce((sum, product) => sum + product.stock, 0))} note="Current browser inventory" icon={Package} tone="mint" /><Metric label="Supplier receipts" value={String(stockReceipts.length)} note="Saved in this browser" icon={ShoppingBag} tone="lilac" /></div>
      <Suspense fallback={<div className="card shop-loading">Loading stock intake…</div>}><StockIntakePanel products={inventory} receipts={stockReceipts} onPostReceipt={postStockReceipt} /></Suspense>
    </>}

    {section === 'Stock Out' && <>
      <PageTitle eyebrow="STOCK MOVEMENTS" title="Stock out" description="See phones sold, transferred, returned or written off." />
      <div className="shop-metrics"><Metric label="Sold today" value="6 phones" note="₹3,18,490 sales value" icon={ShoppingBag} /><Metric label="Transfers" value="2 phones" note="Between store locations" icon={ArrowUpFromLine} tone="mint" /><Metric label="Returns / service" value="1 phone" note="Awaiting inspection" icon={CircleAlert} tone="amber" /></div>
      <Table headers={['MOVEMENT', 'DEVICE / IMEI', 'REASON', 'QTY', 'DATE']}>
        {stockOutRows.map(row => <tr key={row.ref}><td><strong className="shop-mono">{row.ref}</strong></td><td><strong>{row.device}</strong><small>{row.details}</small></td><td>{row.reason}</td><td>{row.units}</td><td>{row.date}</td></tr>)}
      </Table>
    </>}

    {section === 'Billing' && <>
      <PageTitle eyebrow="POINT OF SALE" title="Create a bill" description="Add phones and accessories, then capture payment and customer details." />
      <div className="shop-billing-layout"><article className="card shop-bill-builder">
        <div className="card-heading"><div><h2>Choose products</h2><p className="shop-muted">Search the demo catalog, then add items to the bill.</p></div><span className="shop-muted">{inventory.length} products</span></div>
        <label className="shop-search shop-billing-search"><Search size={17}/><input value={searchText} onChange={event => onSearchChange(event.target.value)} placeholder="Search product name, brand or IMEI" aria-label="Search products to bill"/></label>
        <div className="shop-category-filters" aria-label="Filter products by brand">{['All', ...new Set(inventory.map(product => product.brand))].map(item => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="shop-product-picker">{filteredProducts.length ? filteredProducts.map(product => <button key={product.model} disabled={product.stock < 1} onClick={() => addProduct(product)}><span className="shop-product-glyph"><Smartphone size={20} /></span><span><strong>{product.model}</strong><small>{product.brand} · {product.variant} · {product.stock} left</small></span><b>{money(product.price)}</b><Plus size={17} /></button>) : <p className="shop-empty">No products match this search and category.</p>}</div>
      </article><article className="card shop-cart">
        <div className="card-heading"><h2>Current bill</h2><span className="shop-status neutral">Draft</span></div>
        <div className="shop-customer-fields">
          <label className="shop-field">Customer name<input value={customer.name} onChange={event => setCustomer(value => ({ ...value, name: event.target.value }))} placeholder="Customer name" required /></label>
          <label className="shop-field">Mobile number<input type="tel" value={customer.phone} onChange={event => setCustomer(value => ({ ...value, phone: event.target.value }))} placeholder="+91 mobile number" required /></label>
          <label className="shop-field">Customer GSTIN (optional)<input value={customer.gstin} onChange={event => setCustomer(value => ({ ...value, gstin: event.target.value.toUpperCase() }))} placeholder="GSTIN / UIN" maxLength={15} /></label>
          {(subtotal >= 50000 || customer.address || customer.gstin) && <><label className="shop-field">Customer address<input value={customer.address} onChange={event => setCustomer(value => ({ ...value, address: event.target.value }))} placeholder="Billing / delivery address" /></label><label className="shop-field">Place of supply<select value={customer.stateCode} onChange={event => { const option = event.target.selectedOptions[0]; setCustomer(value => ({ ...value, stateCode: event.target.value, state: option?.textContent || '' })); }}><option value="">Choose state</option>{indianStates.map(([name, code]) => <option key={code} value={code}>{name}</option>)}</select></label></>}
          <label className="shop-field">Payment method<select value={customer.payment} onChange={event => setCustomer(value => ({ ...value, payment: event.target.value, financePartner: '' }))}><option>UPI</option><option>Cash</option><option>Card</option><option>Finance</option><option>Bank transfer</option></select></label>
          {customer.payment === 'Finance' && <label className="shop-field">Finance partner<select required value={customer.financePartner} onChange={event => setCustomer(value => ({ ...value, financePartner: event.target.value }))}><option value="">Choose active partner</option>{partners.filter(partner => partner.status === 'Active').map(partner => <option key={partner.id} value={partner.name}>{partner.name}</option>)}</select></label>}
        </div>
        <div className="shop-cart-lines">{cartProducts.length ? cartProducts.map(({ product, quantity }) => <div key={product.model} className="shop-cart-line"><span><strong>{product.model}</strong><small>{product.variant}</small></span><div className="shop-quantity-control"><button type="button" aria-label={`Decrease ${product.model} quantity`} disabled={quantity <= 1} onClick={() => setCart(items => items.map(item => item.model === product.model ? { ...item, quantity: item.quantity - 1 } : item))}><Minus size={13}/></button><b>{quantity}</b><button type="button" aria-label={`Increase ${product.model} quantity`} disabled={quantity >= product.stock} onClick={() => addProduct(product)}><Plus size={13}/></button></div><b>{money(product.price * quantity)}</b><button type="button" className="shop-remove-line" aria-label={`Remove ${product.model}`} onClick={() => setCart(items => items.filter(item => item.model !== product.model))}><Trash2 size={15}/></button></div>) : <p className="shop-empty">Choose a product to add it to this bill.</p>}</div>
        <div className="shop-total-line"><span>Taxable value</span><b>{money(subtotal)}</b></div>
        {shopProfile.gstin ? <><div className="shop-total-line"><span>{cartProducts.length > 0 && customer.stateCode && shopProfile.stateCode && customer.stateCode !== shopProfile.stateCode ? 'IGST' : 'CGST + SGST'} (18%)</span><b>{money(tax)}</b></div></> : <p className="shop-footnote">GST is not added until your shop GSTIN is configured.</p>}
        <div className="shop-total-line shop-grand-total"><span>Total payable</span><b>{money(subtotal + tax)}</b></div>
        {billError && <p className="shop-form-error" role="alert">{billError}</p>}
        <button className="primary shop-complete" disabled={!cartProducts.length} onClick={completeSale}><Printer size={17}/>Complete sale &amp; print invoice</button>
        <small className="shop-demo-note">Local preview only. No payment is collected; tax details must be checked before issuing a real GST invoice.</small>
      </article></div>
    </>}

    {section === 'Invoices' && <>
      <PageTitle eyebrow="SALES RECORDS" title="Invoices" description="Review payment status, balances and recent customer bills." action={<button className="primary" onClick={() => onNavigate('Billing')}><Plus size={17} />New invoice</button>} />
      <div className="shop-metrics"><Metric label="Saved invoices" value={String(sales.length)} note="Bills completed in this browser" icon={FileText} /><Metric label="Sales recorded" value={money(sales.reduce((sum, invoice) => sum + invoice.total, 0))} note="Payment is not processed" icon={Check} tone="mint" /><Metric label="Recent sample invoices" value={String(sampleSales.length)} note="Illustrative starting data" icon={CircleAlert} tone="amber" /></div>
      <Table headers={['INVOICE', 'CUSTOMER', 'DATE', 'AMOUNT', 'PAYMENT', 'ACTION']}>
        {sales.map(invoice => <tr key={invoice.id}><td><strong className="shop-mono">{invoice.id}</strong></td><td>{invoice.customer}</td><td>{dateLabel(invoice.createdAt.slice(0, 10))}</td><td><strong>{money(invoice.total)}</strong></td><td><span className="shop-status neutral">{invoice.paymentMethod} · not processed</span></td><td><button className="shop-table-action" onClick={() => setActiveInvoice(invoice)}><Printer size={15}/>Print</button></td></tr>)}
        {sampleSales.map(invoice => <tr key={invoice.id}><td><strong className="shop-mono">{invoice.id}</strong></td><td>{invoice.customer}</td><td>{dateLabel(invoice.date)}</td><td><strong>{money(invoice.amount)}</strong></td><td><span className={`shop-status ${invoice.status === 'Paid' ? 'success' : 'warning'}`}>{invoice.status}</span></td><td><span className="shop-muted">Sample</span></td></tr>)}
      </Table>
      <p className="shop-footnote">Invoices created here are stored in this browser only. Sample rows are illustrative and cannot be reprinted.</p>
    </>}

    {section === 'Customers' && <>
      <PageTitle eyebrow="CUSTOMER BOOK" title="Customers" description="Keep purchase history and contact details together for service and warranty follow-up." />
      <div className="shop-metrics"><Metric label="Customers" value="684" note="38 added this month" icon={UsersRound} /><Metric label="Warranty follow-ups" value="14" note="Due in the next 7 days" icon={Smartphone} tone="amber" /><Metric label="Repeat customers" value="31%" note="Returned for another purchase" icon={ShoppingBag} tone="mint" /></div>
      <div className="shop-toolbar"><label className="shop-search"><Search size={17} /><input value={searchText} onChange={event => onSearchChange(event.target.value)} placeholder="Search customer name or phone" /></label><span>{filteredCustomers.length} customers shown</span></div>
      <Table headers={['CUSTOMER', 'PHONE', 'LAST PURCHASE', 'BILLS', 'LIFETIME SPEND']}>
        {filteredCustomers.map(customer => <tr key={customer.phone}><td><strong>{customer.name}</strong></td><td>{customer.phone}</td><td>{customer.last}</td><td>{customer.purchases}</td><td><strong>{money(customer.spent)}</strong></td></tr>)}
      </Table>
    </>}

    {section === 'Reports' && <>
      <PageTitle eyebrow="SHOP PERFORMANCE" title="Sales & stock reports" description="Daily, monthly or custom date-range performance for sales, payments and stock." action={<button className="outline" onClick={() => exportSalesReport(reportRows)}><FileText size={17} />Export CSV</button>} />
      <div className="shop-report-periods" role="group" aria-label="Report date range">{['Daily', 'Monthly', '7 days', '30 days', '90 days', 'Custom'].map(period => <button key={period} className={reportPeriod === period ? 'selected' : ''} onClick={() => setReportPeriod(period)}>{period}</button>)}</div>
      {reportPeriod === 'Custom' && <div className="shop-custom-dates"><label>From<input type="date" value={reportStart} max={reportEnd} onChange={event => setReportStart(event.target.value)} /></label><label>To<input type="date" value={reportEnd} min={reportStart} max={toIsoDate(reportNow)} onChange={event => setReportEnd(event.target.value)} /></label></div>}
      <div className="shop-metrics"><Metric label="Sales in period" value={money(reportTotal)} note={`${reportRows.length} invoices in selected range`} icon={ShoppingBag} /><Metric label="Units sold" value={String(reportUnits)} note="From invoices in this period" icon={Smartphone} tone="mint" /><Metric label="Average bill" value={money(reportAverage)} note="Sales divided by invoice count" icon={FileText} tone="lilac" /><Metric label="Low-stock products" value={String(inventory.filter(product => product.stock <= 2).length)} note="2 or fewer units on hand" icon={CircleAlert} tone="amber" /></div>
      <div className="shop-report-grid"><article className="card"><div className="card-heading"><div><h2>Sales by date</h2><p className="shop-muted">Revenue from invoices in the selected period</p></div><span className="shop-muted">{reportRows.length} bills</span></div>{Object.entries(reportRows.reduce<Record<string, number>>((daily, row) => { daily[row.date] = (daily[row.date] || 0) + row.amount; return daily; }, {})).sort(([a], [b]) => b.localeCompare(a)).map(([date, amount]) => <div className="shop-report-row" key={date}><span><strong>{dateLabel(date)}</strong><small>{reportRows.filter(row => row.date === date).length} invoices</small></span><div><i style={{ width: `${Math.max(4, amount / Math.max(1, ...Object.values(reportRows.reduce<Record<string, number>>((daily, row) => { daily[row.date] = (daily[row.date] || 0) + row.amount; return daily; }, {}))) * 100)}%` }} /></div><b>{money(amount)}</b></div>)}{!reportRows.length && <p className="shop-empty">No invoices in this date range yet.</p>}</article><article className="card shop-payment-mix"><h2>Payment methods</h2><p className="shop-muted">Invoice value by method</p><div className="shop-payment-total">{money(reportTotal)}</div>{reportPayments.map(({ method, amount }) => <div className="shop-payment-row" key={method}><span><i />{method}</span><strong>{reportTotal ? `${Math.round(amount / reportTotal * 100)}%` : '0%'}</strong><small>{money(amount)}</small></div>)}</article></div>
      <article className="card shop-report-stock"><div className="card-heading"><div><h2>Stock status</h2><p className="shop-muted">Current stock snapshot</p></div><button className="shop-table-action" onClick={() => onNavigate('Inventory')}>Open inventory <Package size={15}/></button></div><Table headers={['PRODUCT', 'BRAND', 'ON HAND', 'STATUS']}>{inventory.map(product => <tr key={product.model}><td><strong>{product.model}</strong><small>{product.variant}</small></td><td>{product.brand}</td><td>{product.stock}</td><td><span className={`shop-status ${product.stock <= 2 ? 'warning' : 'success'}`}>{product.stock <= 2 ? 'Reorder soon' : 'In stock'}</span></td></tr>)}</Table></article>
      <p className="shop-footnote">Reports combine sample invoices with sales saved in this browser. They are not accounting records.</p>
    </>}

    {section === 'Finance Partners' && <>
      <PageTitle eyebrow="PAYMENT OPTIONS" title="Finance partners" description="Configure the lenders your shop works with for customer phone financing." />
      <form className="card shop-partner-form" onSubmit={event => { event.preventDefault(); if (!partnerDraft.name.trim()) return; setPartners(items => [...items, { ...partnerDraft, id: crypto.randomUUID(), status: 'Active' }]); setPartnerDraft({ name: '', type: 'Consumer durable loan', contact: '', notes: '' }); }}>
        <h2>Add a finance partner</h2><div className="shop-partner-fields"><label className="shop-field">Provider name<input value={partnerDraft.name} onChange={event => setPartnerDraft(draft => ({ ...draft, name: event.target.value }))} placeholder="e.g. Bajaj Finance" required/></label><label className="shop-field">Finance type<select value={partnerDraft.type} onChange={event => setPartnerDraft(draft => ({ ...draft, type: event.target.value }))}><option>Consumer durable loan</option><option>No-cost EMI</option><option>Credit card EMI</option><option>BNPL</option><option>Other</option></select></label><label className="shop-field">Partner contact<input value={partnerDraft.contact} onChange={event => setPartnerDraft(draft => ({ ...draft, contact: event.target.value }))} placeholder="Representative / phone / email"/></label><label className="shop-field">Shop notes<input value={partnerDraft.notes} onChange={event => setPartnerDraft(draft => ({ ...draft, notes: event.target.value }))} placeholder="Settlement terms or scheme notes"/></label></div><button className="primary"><Plus size={16}/>Add partner</button></form>
      <div className="shop-partner-grid">{partners.map(partner => <article className="card shop-partner-card" key={partner.id}><div className="shop-partner-icon"><Handshake size={21}/></div><div className="shop-partner-title"><span><h2>{partner.name}</h2><small>{partner.type}</small></span><span className={`shop-status ${partner.status === 'Active' ? 'success' : 'neutral'}`}>{partner.status}</span></div><label className="shop-field">Partner contact<input value={partner.contact} onChange={event => setPartners(items => items.map(item => item.id === partner.id ? { ...item, contact: event.target.value } : item))} placeholder="Representative / phone / email"/></label><label className="shop-field">Notes<textarea value={partner.notes} onChange={event => setPartners(items => items.map(item => item.id === partner.id ? { ...item, notes: event.target.value } : item))} rows={3}/></label><div className="shop-partner-actions"><button className="outline" onClick={() => setPartners(items => items.map(item => item.id === partner.id ? { ...item, status: item.status === 'Active' ? 'Paused' : 'Active' } : item))}>{partner.status === 'Active' ? 'Pause partner' : 'Activate partner'}</button><button className="text-button" onClick={() => setPartners(items => items.filter(item => item.id !== partner.id))}>Remove</button></div></article>)}</div>
      <p className="shop-footnote">This is a local configuration list only. It does not connect to lender systems or submit finance applications.</p>
    </>}
  </div>
  {activeInvoice && <section id="shop-invoice-print" className="shop-invoice-print" aria-label="Invoice print preview">
    <header className="shop-invoice-header"><div><h1>{activeInvoice.shop.legalName || activeInvoice.shop.shopName || 'Mobile Shop'}</h1><p>{activeInvoice.shop.address || 'Shop address not configured'}</p>{activeInvoice.shop.phone && <p>Phone: {activeInvoice.shop.phone}</p>}{activeInvoice.shop.email && <p>Email: {activeInvoice.shop.email}</p>}{activeInvoice.shop.gstin && <p><strong>GSTIN:</strong> {activeInvoice.shop.gstin}</p>}</div><div className="shop-invoice-heading"><h2>{activeInvoice.shop.gstin ? 'TAX INVOICE' : 'SALES RECEIPT'}</h2><strong>{activeInvoice.id}</strong><span>Issued: {dateLabel(activeInvoice.createdAt.slice(0, 10))}</span></div></header>
    <div className="shop-invoice-parties"><div><h3>Bill to</h3><strong>{activeInvoice.customer}</strong><span>{activeInvoice.phone}</span>{activeInvoice.address && <span>{activeInvoice.address}</span>}{activeInvoice.gstin && <span>GSTIN / UIN: {activeInvoice.gstin}</span>}</div><div><h3>Supply details</h3><span>Place of supply: {activeInvoice.state || activeInvoice.shop.state || 'Not provided'}{activeInvoice.stateCode ? ` (${activeInvoice.stateCode})` : ''}</span><span>Delivery address: {activeInvoice.address || 'Same as billing address'}</span><span>Reverse charge: No</span><span>Payment method selected: {activeInvoice.paymentMethod}{activeInvoice.financePartner ? ` · ${activeInvoice.financePartner}` : ''} (not processed)</span></div></div>
    <table className="shop-invoice-table"><thead><tr><th>#</th><th>HSN</th><th>Description</th><th>Qty / UQC</th><th>Unit rate</th><th>Taxable value</th><th>GST rate</th><th>Tax amount</th></tr></thead><tbody>{activeInvoice.lines.map((line, index) => <tr key={`${line.model}-${index}`}><td>{index + 1}</td><td>{line.hsn}</td><td><strong>{line.model}</strong><small>{line.variant}</small></td><td>{line.quantity} / pcs</td><td>{money(line.unitPrice)}</td><td>{money(line.taxableValue)}</td><td>{activeInvoice.shop.gstin ? `${line.gstRate}%` : '—'}</td><td>{money(line.taxAmount)}</td></tr>)}</tbody></table>
    <div className="shop-invoice-totals"><div><span>Taxable value</span><strong>{money(activeInvoice.taxableValue)}</strong></div>{activeInvoice.taxAmount > 0 && (activeInvoice.interState ? <div><span>IGST ({activeInvoice.lines[0]?.gstRate ?? 18}%)</span><strong>{money(activeInvoice.taxAmount)}</strong></div> : <><div><span>CGST ({(activeInvoice.lines[0]?.gstRate ?? 18) / 2}%)</span><strong>{money(Math.floor(activeInvoice.taxAmount / 2))}</strong></div><div><span>SGST / UTGST ({(activeInvoice.lines[0]?.gstRate ?? 18) / 2}%)</span><strong>{money(activeInvoice.taxAmount - Math.floor(activeInvoice.taxAmount / 2))}</strong></div></>)}<div className="shop-invoice-grand"><span>Total payable</span><strong>{money(activeInvoice.total)}</strong></div><div><span>Amount paid in this demo</span><strong>{money(0)}</strong></div><div><span>Balance due</span><strong>{money(activeInvoice.total)}</strong></div></div>
    <footer className="shop-invoice-footer"><p>Thank you for shopping with us.</p><span>For {activeInvoice.shop.legalName || activeInvoice.shop.shopName || 'Mobile Shop'}</span><div className="shop-signature-line">Authorized signature</div><small>Print preview for this local demo. Verify seller, HSN, tax treatment, place of supply and invoice settings before issuing a real tax invoice. E-invoice IRN / QR data is not generated by this demo.</small></footer>
  </section>}
  </>;
}
