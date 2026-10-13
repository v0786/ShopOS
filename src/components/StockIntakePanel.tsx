import { useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, Check, ChevronDown, CircleAlert, FileSpreadsheet, FileText, LoaderCircle, Plus, ScanLine, Trash2, Upload, WifiOff } from 'lucide-react';
import {
  createIntakeDraft, createIntakeLine, mapTallyRows, readTallyWorkbook, suggestInvoiceDraft,
  validateIntakeDraft, type IntakeCatalogProduct, type IntakeDraft, type IntakeLine, type IntakeMethod,
  type StockReceipt, type TallyColumnMapping, type TallyParseResult,
} from '../features/stock-intake/stockIntake';
import { extractInvoiceText } from '../features/stock-intake/stockIntakeOcr';

type Props = {
  products: IntakeCatalogProduct[];
  receipts: StockReceipt[];
  onPostReceipt: (receipt: StockReceipt) => boolean;
};

const methodLabels: { id: IntakeMethod; title: string; description: string; icon: typeof FileText }[] = [
  { id: 'manual', title: 'Manual entry', description: 'Enter invoice and phone details', icon: FileText },
  { id: 'tally', title: 'Tally ERP', description: 'Import a voucher or set up a connector', icon: FileSpreadsheet },
  { id: 'scan', title: 'Scan invoice', description: 'Read a photo or PDF on this device', icon: ScanLine },
];

const mappingFields: { key: keyof TallyColumnMapping; label: string; required?: boolean }[] = [
  { key: 'supplier', label: 'Supplier', required: true }, { key: 'invoiceNumber', label: 'Supplier invoice number', required: true },
  { key: 'invoiceDate', label: 'Invoice date', required: true }, { key: 'model', label: 'Phone model', required: true },
  { key: 'variant', label: 'Variant' }, { key: 'unitCost', label: 'Unit cost', required: true },
  { key: 'serial', label: 'Serial number', required: true }, { key: 'imei', label: 'IMEI', required: true }, { key: 'quantity', label: 'Quantity' },
];

function guessColumn(columns: string[], field: keyof TallyColumnMapping): string {
  const patterns: Record<keyof TallyColumnMapping, RegExp> = {
    supplier: /supplier|party|ledger/i, invoiceNumber: /invoice|voucher|bill.*no|ref/i,
    invoiceDate: /date/i, model: /model|product|item|stock.*name/i, variant: /variant|description|colour|color/i,
    unitCost: /unit.*cost|cost|rate|price/i, serial: /serial|s\/n/i, imei: /imei/i, quantity: /qty|quantity|units/i,
  };
  return columns.find(column => patterns[field].test(column)) ?? '';
}

export default function StockIntakePanel({ products, receipts, onPostReceipt }: Props) {
  const [method, setMethod] = useState<IntakeMethod>('manual');
  const [draft, setDraft] = useState<IntakeDraft>(() => createIntakeDraft());
  const [tallyFile, setTallyFile] = useState<TallyParseResult | null>(null);
  const [tallyName, setTallyName] = useState('');
  const [mapping, setMapping] = useState<TallyColumnMapping>({ supplier: '', invoiceNumber: '', invoiceDate: '', model: '', variant: '', unitCost: '', serial: '', imei: '', quantity: '' });
  const [scanName, setScanName] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [fileError, setFileError] = useState('');
  const [postedMessage, setPostedMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const postingRef = useRef(false);
  const errors = useMemo(() => validateIntakeDraft(draft, receipts, products), [draft, receipts, products]);
  const tallyPreview = useMemo(() => tallyFile ? mapTallyRows(tallyFile.rows, mapping, products) : null, [tallyFile, mapping, products]);

  const changeMethod = (next: IntakeMethod) => {
    setMethod(next);
    setDraft(current => ({ ...current, method: next }));
    setFileError('');
    setPostedMessage('');
  };

  const updateLine = (id: string, update: Partial<IntakeLine>) => {
    setDraft(current => ({ ...current, lines: current.lines.map(line => line.id === id ? { ...line, ...update } : line) }));
  };

  const updateIdentity = (line: IntakeLine, field: 'serialNumbers' | 'imeis', value: string) => updateLine(line.id, { [field]: [value] });

  const selectProduct = (line: IntakeLine, model: string) => {
    const product = products.find(item => item.model === model);
    updateLine(line.id, { model, variant: product?.variant ?? '' });
  };

  const importTallyRows = () => {
    if (!tallyPreview) return;
    setDraft({ supplier: tallyPreview.supplier, invoiceNumber: tallyPreview.invoiceNumber, invoiceDate: tallyPreview.invoiceDate, method: 'tally', lines: tallyPreview.lines.length ? tallyPreview.lines : [createIntakeLine()] });
    setFileError(tallyPreview.errors.length ? `${tallyPreview.errors.length} import issue(s) found. Review the draft and correct missing data before posting.` : '');
  };

  const handleTallyFile = async (file?: File) => {
    if (!file) return;
    setFileError('');
    try {
      const parsed = await readTallyWorkbook(file);
      setTallyFile(parsed);
      setTallyName(file.name);
      setMapping(current => Object.fromEntries(mappingFields.map(field => [field.key, current[field.key] || guessColumn(parsed.columns, field.key)])) as TallyColumnMapping);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Could not read this Tally export.');
    }
  };

  const handleScanFile = async (file?: File) => {
    if (!file) return;
    setFileError('');
    setScanName(file.name);
    setOcrText('');
    setOcrBusy(true);
    setOcrProgress(0);
    try {
      const text = await extractInvoiceText(file, setOcrProgress);
      if (!text.trim()) throw new Error('No text could be read. Enter the invoice details and phone identifiers manually.');
      setOcrText(text);
      const suggestions = suggestInvoiceDraft(text, products);
      setDraft(current => ({
        ...current,
        method: 'scan',
        supplier: suggestions.supplier || current.supplier,
        invoiceNumber: suggestions.invoiceNumber || current.invoiceNumber,
        invoiceDate: suggestions.invoiceDate || current.invoiceDate,
        lines: suggestions.lines[0]?.model ? suggestions.lines : current.lines,
      }));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Could not read this invoice.');
    } finally {
      setOcrBusy(false);
    }
  };

  const postReceipt = () => {
    setPostedMessage('');
    if (errors.length || postingRef.current) return;
    postingRef.current = true;
    setPosting(true);
    const receipt: StockReceipt = { ...draft, id: crypto.randomUUID(), postedAt: new Date().toISOString() };
    try {
      if (onPostReceipt(receipt)) {
        setPostedMessage(`Stock receipt ${receipt.invoiceNumber} posted. Inventory has been updated in this browser.`);
        setDraft(createIntakeDraft(method));
        setOcrText('');
        setScanName('');
      } else {
        setFileError('This receipt could not be posted. Check for a duplicate invoice or identifier, then try again.');
      }
    } finally {
      postingRef.current = false;
      setPosting(false);
    }
  };

  const invoiceTotal = draft.lines.reduce((total, line) => total + (Number(line.unitCost) || 0), 0);

  return <section className="stock-intake" aria-label="Stock receiving workflow">
    <div className="stock-intake-methods" role="tablist" aria-label="Stock intake method">
      {methodLabels.map(({ id, title, description, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={method === id} className={`stock-intake-method${method === id ? ' active' : ''}`} onClick={() => changeMethod(id)}>
        <span><Icon size={19} /></span><strong>{title}</strong><small>{description}</small>
      </button>)}
    </div>

    {method === 'tally' && <div className="card stock-intake-source">
      <div className="stock-intake-section-title"><div><span className="shop-eyebrow">TALLY ERP</span><h3>Bring in a purchase voucher</h3><p>Import a Tally CSV or Excel export and map its columns to your shop catalog.</p></div><FileSpreadsheet size={21} /></div>
      <label className="stock-file-picker"><Upload size={18} /><span>{tallyName || 'Choose Tally CSV / Excel file'}</span><input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => void handleTallyFile(event.target.files?.[0])} /></label>
      {tallyFile && <>
        <div className="stock-mapping-grid">{mappingFields.map(field => <label key={field.key}>{field.label}{field.required && <i> required</i>}<span className="stock-select-wrap"><select aria-label={`Map ${field.label}`} value={mapping[field.key]} onChange={event => setMapping(current => ({ ...current, [field.key]: event.target.value }))}><option value="">Choose column</option>{tallyFile.columns.map(column => <option key={column} value={column}>{column}</option>)}</select><ChevronDown size={15} /></span></label>)}</div>
        <div className="stock-import-preview"><strong>{tallyFile.rows.length} voucher rows · preview</strong><div className="shop-table-scroll"><table className="shop-table"><thead><tr>{tallyFile.columns.slice(0, 5).map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{tallyFile.rows.slice(0, 3).map((row, index) => <tr key={index}>{tallyFile.columns.slice(0, 5).map(column => <td key={column}>{String(row[column] ?? '')}</td>)}</tr>)}</tbody></table></div></div>
        {tallyPreview && <div className="stock-import-result"><span>{tallyPreview.lines.length} handset lines mapped</span><span className={tallyPreview.errors.length ? 'warning' : 'success'}>{tallyPreview.errors.length ? `${tallyPreview.errors.length} issue(s) to review` : 'Ready to review'}</span><button type="button" className="outline" onClick={importTallyRows}>Load into review</button></div>}
      </>}
      <div className="stock-connector"><span className="stock-connector-icon"><WifiOff size={18} /></span><div><strong>Live Tally connector · Not connected</strong><p>A secure connector running beside Tally and an authenticated ShopOS service are required. This demo can import exported files; live sync is not enabled here.</p></div></div>
    </div>}

    {method === 'scan' && <div className="card stock-intake-source">
      <div className="stock-intake-section-title"><div><span className="shop-eyebrow">DOCUMENT SCAN</span><h3>Read a supplier invoice</h3><p>Text recognition runs in this browser. The file is not sent to an OCR service.</p></div><ScanLine size={21} /></div>
      <label className="stock-file-picker"><Upload size={18} /><span>{scanName || 'Choose invoice photo or PDF'}</span><input type="file" accept="image/*,.pdf,application/pdf" onChange={event => void handleScanFile(event.target.files?.[0])} /></label>
      {ocrBusy && <div className="stock-ocr-progress"><LoaderCircle size={17} className="stock-spin" /><span>Reading invoice locally…</span><progress max="1" value={ocrProgress} /><b>{Math.round(ocrProgress * 100)}%</b></div>}
      {ocrText && <div className="stock-ocr-notice"><Check size={16} /><strong>OCR draft — review required</strong><details><summary>View extracted text</summary><pre>{ocrText}</pre></details></div>}
      <p className="stock-limit-note">Images and PDFs up to 15 MB; PDF invoices up to 4 pages. Check every value and enter each phone’s IMEI and serial manually if they were not read.</p>
    </div>}

    {method === 'tally' && !tallyFile && <div className="stock-tally-hint"><CircleAlert size={16} />Use a Tally purchase voucher export. Supplier, invoice, product, unit cost, serial and IMEI columns are required for a postable receipt.</div>}

    {fileError && <p className="stock-intake-message error" role="alert"><CircleAlert size={17} />{fileError}</p>}
    {postedMessage && <p className="stock-intake-message success" role="status"><Check size={17} />{postedMessage}</p>}

    <div className="card stock-draft-card">
      <div className="stock-intake-section-title"><div><span className="shop-eyebrow">RECEIVING DRAFT</span><h3>Supplier and invoice</h3><p>Review the source values and add one row for each phone received.</p></div><span className="stock-local-badge">Browser-local demo</span></div>
      <div className="stock-invoice-fields">
        <label>Supplier name<input value={draft.supplier} onChange={event => setDraft(current => ({ ...current, supplier: event.target.value }))} placeholder="e.g. Metro Mobile Distributors" /></label>
        <label>Supplier invoice no.<input value={draft.invoiceNumber} onChange={event => setDraft(current => ({ ...current, invoiceNumber: event.target.value }))} placeholder="e.g. MMD/INV/2026/108" /></label>
        <label>Invoice date<input type="date" value={draft.invoiceDate} onChange={event => setDraft(current => ({ ...current, invoiceDate: event.target.value }))} /></label>
      </div>
      <div className="stock-lines-heading"><div><h4>Phone units</h4><span>{draft.lines.length} handset{draft.lines.length === 1 ? '' : 's'} in draft</span></div><button type="button" className="outline" onClick={() => setDraft(current => ({ ...current, lines: [...current.lines, createIntakeLine()] }))}><Plus size={15} />Add phone</button></div>
      <div className="stock-intake-lines">{draft.lines.map((line, index) => <article className="stock-intake-line" key={line.id}>
        <div className="stock-line-title"><strong>Phone {index + 1}</strong>{draft.lines.length > 1 && <button type="button" aria-label={`Remove phone ${index + 1}`} onClick={() => setDraft(current => ({ ...current, lines: current.lines.filter(item => item.id !== line.id) }))}><Trash2 size={15} /></button>}</div>
        <div className="stock-line-fields">
          <label>Catalog model<select value={line.model} onChange={event => selectProduct(line, event.target.value)}><option value="">Choose phone</option>{products.map(product => <option key={product.model} value={product.model}>{product.brand} · {product.model}</option>)}</select></label>
          <label>Variant<input value={line.variant} onChange={event => updateLine(line.id, { variant: event.target.value })} placeholder="Storage · colour" /></label>
          <label>Unit cost (₹)<input inputMode="decimal" type="number" min="0.01" step="0.01" value={line.unitCost} onChange={event => updateLine(line.id, { unitCost: event.target.value === '' ? '' : Number(event.target.value) })} placeholder="Purchase cost" /></label>
          <label>Serial number<input value={line.serialNumbers[0] ?? ''} onChange={event => updateIdentity(line, 'serialNumbers', event.target.value)} placeholder="Device serial" /></label>
          <label>IMEI<input inputMode="numeric" value={line.imeis[0] ?? ''} onChange={event => updateIdentity(line, 'imeis', event.target.value)} placeholder="15-digit IMEI" /></label>
        </div>
      </article>)}</div>
      <div className="stock-review-bar"><div><span>Draft purchase cost</span><strong>₹{invoiceTotal.toLocaleString('en-IN')}</strong><small>Unit costs only · no tax calculated</small></div><div><span>Posting checks</span><strong className={errors.length ? 'has-errors' : 'ready'}>{errors.length ? `${errors.length} to fix` : 'Ready to post'}</strong><small>Invoice and device identifiers checked</small></div></div>
      {errors.length > 0 && <ul className="stock-validation-errors" aria-label="Posting validation errors">{errors.slice(0, 8).map(error => <li key={error}><CircleAlert size={14} />{error}</li>)}{errors.length > 8 && <li>And {errors.length - 8} more issue(s).</li>}</ul>}
      <button type="button" className="primary stock-post-button" disabled={Boolean(errors.length) || posting || ocrBusy} onClick={postReceipt}><ArrowDownToLine size={17} />{posting ? 'Posting…' : 'Post stock receipt'}</button>
      <p className="stock-footnote">Stock changes only after posting. The receipt and phone identifiers stay in this browser and are not synced to another device.</p>
    </div>

    <div className="stock-history-heading"><div><span className="shop-eyebrow">RECEIVING HISTORY</span><h3>Posted supplier receipts</h3></div><span>{receipts.length} receipt{receipts.length === 1 ? '' : 's'}</span></div>
    {receipts.length ? <div className="stock-receipt-list">{[...receipts].reverse().map(receipt => <details className="card stock-receipt" key={receipt.id}><summary><span><strong>{receipt.invoiceNumber}</strong><small>{receipt.supplier} · {new Date(`${receipt.invoiceDate}T12:00:00`).toLocaleDateString('en-IN')}</small></span><span>{receipt.lines.length} phone{receipt.lines.length === 1 ? '' : 's'}</span><b>₹{receipt.lines.reduce((sum, line) => sum + (Number(line.unitCost) || 0), 0).toLocaleString('en-IN')}</b></summary><div className="stock-receipt-units">{receipt.lines.map((line, index) => <div key={`${receipt.id}-${line.id}-${index}`}><span><strong>{line.model}</strong><small>{line.variant} · Serial {line.serialNumbers[0] || '—'} · IMEI {line.imeis[0] || '—'}</small></span><b>₹{Number(line.unitCost).toLocaleString('en-IN')}</b></div>)}</div><small className="stock-receipt-source">Received {new Date(receipt.postedAt).toLocaleString('en-IN')} · {receipt.method === 'tally' ? 'Tally import' : receipt.method === 'scan' ? 'Invoice scan' : 'Manual entry'}</small></details>)}</div> : <div className="card stock-empty-history"><span><FileText size={20} /></span><strong>No supplier receipts posted yet</strong><p>Start with manual entry, import a Tally voucher, or scan a supplier invoice.</p></div>}
  </section>;
}
