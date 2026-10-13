export type IntakeMethod = 'manual' | 'tally' | 'scan';

export type IntakeLine = {
  id: string;
  model: string;
  variant: string;
  quantity: number;
  unitCost: number | '';
  serialNumbers: string[];
  imeis: string[];
};

export type IntakeDraft = {
  supplier: string;
  invoiceNumber: string;
  invoiceDate: string;
  method: IntakeMethod;
  lines: IntakeLine[];
};

export type StockReceipt = IntakeDraft & {
  id: string;
  postedAt: string;
};

export type IntakeCatalogProduct = {
  model: string;
  brand: string;
  variant: string;
  stock: number;
};

export type TallyColumnMapping = {
  supplier: string;
  invoiceNumber: string;
  invoiceDate: string;
  model: string;
  variant: string;
  unitCost: string;
  serial: string;
  imei: string;
  quantity: string;
};

export type TallyParseResult = {
  columns: string[];
  rows: Record<string, unknown>[];
};

export type TallyMappingResult = {
  supplier: string;
  invoiceNumber: string;
  invoiceDate: string;
  lines: IntakeLine[];
  errors: string[];
};

export const MAX_INTAKE_FILE_SIZE = 15 * 1024 * 1024;

export function createIntakeLine(): IntakeLine {
  return { id: crypto.randomUUID(), model: '', variant: '', quantity: 1, unitCost: '', serialNumbers: [''], imeis: [''] };
}

export function createIntakeDraft(method: IntakeMethod = 'manual'): IntakeDraft {
  return { supplier: '', invoiceNumber: '', invoiceDate: new Date().toISOString().slice(0, 10), method, lines: [createIntakeLine()] };
}

function clean(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return String(value ?? '').trim();
}

function identity(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

function invoiceKey(supplier: string, invoice: string): string {
  return `${identity(supplier)}::${identity(invoice)}`;
}

export function validateIntakeDraft(draft: IntakeDraft, existingReceipts: StockReceipt[], products: IntakeCatalogProduct[]): string[] {
  const errors: string[] = [];
  if (!draft.supplier.trim()) errors.push('Enter the supplier name.');
  if (!draft.invoiceNumber.trim()) errors.push('Enter the supplier invoice number.');
  if (!draft.invoiceDate || Number.isNaN(Date.parse(draft.invoiceDate))) errors.push('Choose a valid supplier invoice date.');
  if (!draft.lines.length) errors.push('Add at least one handset.');
  if (existingReceipts.some(receipt => invoiceKey(receipt.supplier, receipt.invoiceNumber) === invoiceKey(draft.supplier, draft.invoiceNumber))) {
    errors.push('This supplier invoice number has already been posted.');
  }

  const knownImeis = new Set(existingReceipts.flatMap(receipt => receipt.lines.flatMap(line => line.imeis.map(identity))));
  const knownSerials = new Set(existingReceipts.flatMap(receipt => receipt.lines.flatMap(line => line.serialNumbers.map(identity))));
  const draftImeis = new Set<string>();
  const draftSerials = new Set<string>();

  draft.lines.forEach((line, index) => {
    const label = `Handset ${index + 1}`;
    const product = products.find(item => item.model === line.model && item.variant === line.variant);
    if (!line.model || !product) errors.push(`${label}: choose a phone model from the catalog.`);
    if (!line.variant.trim()) errors.push(`${label}: enter or choose a variant.`);
    const unitCost = Number(line.unitCost);
    if (!Number.isFinite(unitCost) || unitCost <= 0) errors.push(`${label}: unit cost must be greater than zero.`);
    if (!Number.isInteger(line.quantity) || line.quantity !== 1) errors.push(`${label}: each phone must be entered as one unit with its own identifiers.`);
    const imei = identity(line.imeis[0] ?? '');
    const serial = identity(line.serialNumbers[0] ?? '');
    if (!imei) errors.push(`${label}: enter the IMEI.`);
    else if (!/^\d{15}$/.test(imei)) errors.push(`${label}: IMEI must contain exactly 15 digits.`);
    else if (knownImeis.has(imei) || draftImeis.has(imei)) errors.push(`${label}: IMEI ${imei} is already recorded.`);
    if (!serial) errors.push(`${label}: enter the serial number.`);
    else if (knownSerials.has(serial) || draftSerials.has(serial)) errors.push(`${label}: serial number ${serial} is already recorded.`);
    if (imei) draftImeis.add(imei);
    if (serial) draftSerials.add(serial);
  });
  return [...new Set(errors)];
}

export async function readTallyWorkbook(file: File): Promise<TallyParseResult> {
  if (file.size > MAX_INTAKE_FILE_SIZE) throw new Error('Choose a file smaller than 15 MB.');
  if (/\.csv$/i.test(file.name)) {
    const table = parseCsv(await file.text());
    if (table.length < 2) throw new Error('No data rows were found in this CSV file.');
    const columns = table[0].map((value, index) => value.trim() || `Column ${index + 1}`);
    const rows = table.slice(1).filter(cells => cells.some(value => value.trim())).map(cells => Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? ''])));
    if (!rows.length) throw new Error('No data rows were found in this CSV file.');
    return { columns, rows };
  }
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Choose a Tally CSV or Excel workbook (.csv or .xlsx).');
  const { readSheet } = await import('read-excel-file/browser');
  const table = await readSheet(file);
  if (table.length < 2) throw new Error('No data rows were found in the first worksheet.');
  const columns = table[0].map((value, index) => clean(value) || `Column ${index + 1}`);
  const rows = table.slice(1).filter(cells => cells.some(value => value !== null && value !== undefined && value !== '')).map(cells => Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? ''])));
  if (!rows.length) throw new Error('No data rows were found in the first worksheet.');
  return { columns, rows };
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const input = content.replace(/^\uFEFF/, '');
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"' && cell.length === 0) quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += character;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  if (quoted) throw new Error('The CSV contains an unclosed quoted cell. Check the file and import again.');
  return rows;
}

export function mapTallyRows(rows: Record<string, unknown>[], mapping: TallyColumnMapping, products: IntakeCatalogProduct[]): TallyMappingResult {
  const errors: string[] = [];
  const lines: IntakeLine[] = [];
  let supplier = '';
  let invoiceNumber = '';
  let invoiceDate = '';
  rows.forEach((row, rowIndex) => {
    const get = (column: string) => clean(column ? row[column] : '');
    supplier ||= get(mapping.supplier);
    invoiceNumber ||= get(mapping.invoiceNumber);
    invoiceDate ||= normalizeImportDate(get(mapping.invoiceDate));
    const rawModel = get(mapping.model);
    const rawVariant = get(mapping.variant);
    const product = products.find(item => item.model.toLowerCase() === rawModel.toLowerCase())
      ?? products.find(item => `${item.brand} ${item.model}`.toLowerCase() === rawModel.toLowerCase());
    if (!product) {
      errors.push(`Row ${rowIndex + 2}: “${rawModel || 'model missing'}” does not match a catalog phone.`);
      return;
    }
    const variant = rawVariant || product.variant;
    if (variant.toLowerCase() !== product.variant.toLowerCase()) {
      errors.push(`Row ${rowIndex + 2}: variant “${variant}” does not match ${product.model} (${product.variant}).`);
      return;
    }
    const unitCost = Number(get(mapping.unitCost).replace(/[₹,\s]/g, ''));
    const quantity = Math.max(1, Math.floor(Number(get(mapping.quantity)) || 1));
    const imeis = get(mapping.imei).split(/[\s,;|]+/).filter(Boolean);
    const serials = get(mapping.serial).split(/[\n,;|]+/).map(value => value.trim()).filter(Boolean);
    if (!(unitCost > 0)) errors.push(`Row ${rowIndex + 2}: unit cost must be greater than zero.`);
    for (let index = 0; index < quantity; index += 1) {
      lines.push({
        id: crypto.randomUUID(), model: product.model, variant: product.variant, quantity: 1, unitCost: Number.isFinite(unitCost) ? unitCost : '',
        serialNumbers: [serials[index] ?? ''], imeis: [imeis[index] ?? ''],
      });
    }
    if (imeis.length !== quantity) errors.push(`Row ${rowIndex + 2}: expected ${quantity} IMEI value(s), found ${imeis.length}.`);
    if (serials.length !== quantity) errors.push(`Row ${rowIndex + 2}: expected ${quantity} serial value(s), found ${serials.length}.`);
  });
  if (!supplier) errors.push('Map a supplier column or enter the supplier after loading the draft.');
  if (!invoiceNumber) errors.push('Map a supplier invoice number column or enter it after loading the draft.');
  if (!invoiceDate) errors.push('Map a valid invoice date column or enter it after loading the draft.');
  return { supplier, invoiceNumber, invoiceDate, lines, errors };
}

function normalizeImportDate(value: string): string {
  if (!value) return '';
  const dayFirst = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dayFirst) {
    let [, first, second, year] = dayFirst;
    let day = Number(first);
    let month = Number(second);
    if (day <= 12 && month > 12) [day, month] = [month, day];
    const fullYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);
    const date = new Date(Date.UTC(fullYear, month - 1, day));
    if (date.getUTCFullYear() === fullYear && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) return date.toISOString().slice(0, 10);
    return '';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function suggestInvoiceDraft(text: string, products: IntakeCatalogProduct[]): Pick<IntakeDraft, 'supplier' | 'invoiceNumber' | 'invoiceDate' | 'lines'> {
  const lines = text.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  const invoiceMatch = text.match(/(?:invoice|bill|inv)\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]{2,})/i);
  const dateMatch = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/);
  const model = products.find(product => text.toLowerCase().includes(product.model.toLowerCase()));
  const productText = model ? lines.find(value => value.toLowerCase().includes(model.model.toLowerCase())) ?? '' : '';
  const priceMatch = productText.match(/(?:₹|rs\.?\s*)\s*([1-9]\d{3,}(?:,\d{3})*(?:\.\d{1,2})?)/i);
  const imeiMatch = text.match(/\bIMEI(?:\s*[12])?\s*[:#-]?\s*((?:\d[\s-]*){14}\d)\b/i);
  const serialMatch = text.match(/\b(?:serial(?:\s*(?:no\.?|number))?|s\/n)\s*[:#-]?\s*([A-Z0-9-]{4,})/i);
  const line = createIntakeLine();
  if (model) {
    line.model = model.model;
    line.variant = model.variant;
  }
  if (priceMatch) line.unitCost = Number(priceMatch[1].replaceAll(',', ''));
  if (imeiMatch) line.imeis = [imeiMatch[1].replace(/\D/g, '')];
  if (serialMatch) line.serialNumbers = [serialMatch[1]];
  const invoiceDate = dateMatch ? normalizeImportDate(dateMatch[1]) : '';
  const supplier = lines.find(value => /(?:mobiles?|distributors?|electronics?|traders?|communications?)/i.test(value) && !/invoice|gstin|date|phone/i.test(value)) ?? '';
  return { supplier, invoiceNumber: invoiceMatch?.[1] ?? '', invoiceDate, lines: [line] };
}
