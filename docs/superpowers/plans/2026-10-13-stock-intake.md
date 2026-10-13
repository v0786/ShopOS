# Stock Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a review-before-post Stock In workflow for manual receiving, Tally imports, and supplier invoice scans.

**Architecture:** Put receiving types, validation, import parsing, and OCR helpers in a focused stock-intake feature module. Add a dedicated responsive panel and connect successful receipt posting to the existing browser-saved inventory and receiving history; clearly label all data as local demo data.

**Tech Stack:** React 19, TypeScript, Vite, browser File APIs, a quoted-cell-aware CSV reader and `read-excel-file` for `.xlsx` import, `tesseract.js` for local OCR, and `pdfjs-dist` for local PDF page rendering.

**Spec:** `docs/superpowers/specs/2026-10-13-stock-intake-design.md`

## Global Constraints

- Inventory and receipts remain browser-local and are not synchronized across devices.
- Manual, Tally-imported, and scanned values use one editable draft and review/post flow.
- A receipt changes stock only after explicit confirmation.
- Every handset line requires a catalog model, variant, positive unit cost, serial number, and unique IMEI.
- A repeated supplier invoice reference or duplicate device identity must block posting with a clear reason.
- The live Tally screen is setup/status only; do not claim live sync without a secure connector and server endpoint.
- Supplier files and OCR stay in the browser; never upload them to an external OCR provider.
- Do not derive or post tax/accounting values in this stock-receipt workflow.
- Do not run or add tests unless requested; use build, lint, and interactive browser verification.

## Review Focus

- Repeated clicks or a repeated invoice must not post a receipt twice.
- IMEI and serial duplicates must be rejected both within a draft and against saved receipts.
- A malformed/unsupported import must show an actionable error and preserve existing draft data.
- OCR can miss critical identifiers; extracted values stay editable and cannot bypass identifier validation.
- Large PDFs or image files must fail gracefully without crashing Stock In.

## Files

- Create `src/features/stock-intake/stockIntake.ts` for draft/receipt types, normalization, validation, CSV/XLSX parsing, and supported-file helpers.
- Create `src/features/stock-intake/stockIntakeOcr.ts` for browser-local image/PDF OCR.
- Create `src/components/StockIntakePanel.tsx` for intake methods, shared draft review, and Tally connector setup/status.
- Modify `src/components/MobileShopSection.tsx` to persist and post receipts, update product quantities, and mount the panel.
- Modify `src/components/mobile-shop.css` with responsive intake workflow styles.
- Modify `package.json` and `package-lock.json` for spreadsheet parsing and OCR/PDF support.

### Task 1: Intake data and validation

**Interfaces:** `IntakeMethod = 'manual' | 'tally' | 'scan'`; `IntakeLine` contains `id`, `model`, `variant`, `quantity`, `unitCost`, `serialNumbers`, and `imeis`; `IntakeDraft` contains `supplier`, `invoiceNumber`, `invoiceDate`, `method`, and `lines`; `StockReceipt` adds an immutable `id`, `postedAt`, and totals. Export `validateIntakeDraft(draft, existingReceipts): string[]` and catalog matching/normalization helpers. For phones, require quantity 1 per identity-bearing row; support multiple rows for same model.

- [ ] Define normalized intake and receipt types in `stockIntake.ts`.
- [ ] Implement validation for required supplier/invoice/date, catalog model/variant, positive cost, one serial and IMEI per phone, in-draft identity uniqueness, and duplicate invoice/identities in existing receipts.
- [ ] Implement a parser that normalizes Tally CSV/XLSX columns into draft lines and returns row-level mapping/validation errors without mutating input.
- [ ] Install and verify `read-excel-file`, `tesseract.js`, and `pdfjs-dist` dependencies in package manifests; parse CSV locally with a quoted-cell-aware parser.

### Task 2: Browser-local OCR

**Interfaces:** `extractInvoiceText(file: File, onProgress: (progress: number) => void): Promise<string>` accepts image or PDF, uses Tesseract in-browser, and renders PDF pages through `pdfjs-dist` before OCR.

- [ ] Add supported image/PDF checks, a 15 MB file-size limit, and one-page-at-a-time PDF OCR in `stockIntakeOcr.ts`.
- [ ] Report progress and surface unreadable/unsupported files as recoverable errors; do not send files off-device.
- [ ] Add conservative text-to-draft suggestions for supplier, invoice number/date, catalog-matched phone models, and unit cost; leave serial and IMEI empty unless clearly matched and editable.

### Task 3: Stock intake panel

**Interfaces:** `StockIntakePanel` receives `products`, `receipts`, `onPostReceipt(receipt)`, and optional `onReceiptPosted`; it emits one complete normalized receipt only after all validation passes and explicit confirmation.

- [ ] Add Manual entry, Tally ERP, and Scan invoice methods that create/update the same draft model.
- [ ] Add editable supplier/invoice fields and handset rows with model/variant, unit cost, serial, IMEI, add/remove row controls, and inline field errors.
- [ ] Add Tally CSV/XLSX upload, column mapping, import preview, and an editable draft; retain draft when a new file fails parsing.
- [ ] Add Tally live connector setup/status panel with clear local connector/backend prerequisite and no fake connection action.
- [ ] Add invoice image/PDF selection, local OCR progress/results, `OCR draft — review required` state, and manual correction before posting.
- [ ] Add review summary, duplicate/error prevention, and explicit Post stock receipt confirmation.

### Task 4: Shop inventory and receiving history integration

- [ ] Replace the static Stock In rows in `MobileShopSection.tsx` with browser-saved receipts using key `shopos-demo-stock-receipts`.
- [ ] On successful receipt post, persist receipt and increment matching catalog product counts exactly once; preserve all existing product fields and sales behavior.
- [ ] Show receiving history including supplier invoice, supplier, units, cost total, received date, and intake source; link posted receipt detail to per-unit IMEI/serial.
- [ ] Mount the intake panel in Stock In and retain the dashboard’s current organization/store navigation behavior.

### Task 5: Responsive styling, verification, and result

- [ ] Style intake method selector, editable lines, imports, OCR progress, errors, review totals, connector status, and history in `mobile-shop.css` with mobile layout behavior.
- [ ] Run `npm run build` and `npm run lint`; resolve introduced diagnostics.
- [ ] Launch or reuse the local app, open `#stock-in`, and interactively verify manual draft, import file selection/mapping, scan selection/OCR state, duplicate validation, and post-to-inventory result.
- [ ] Leave the browser on the completed Stock In page and summarize the local-demo and live-connector limitations.
