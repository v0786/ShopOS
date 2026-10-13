# Stock Intake Design

**Date:** 13 October 2026  
**Product:** ShopOS mobile retail workspace

## Intent

Make Stock In a receiving workflow that records supplier purchase details and updates the shop’s available stock only after a person reviews and posts the delivery. Support the three intake methods requested: manual entry, Tally ERP, and supplier-document scanning.

## Goals

- Record supplier name, supplier invoice number/date, phone model and variant, unit cost, serial number, and IMEI for each handset received.
- Offer three intake paths: manual entry, Tally import/live connection, and scanned supplier invoice.
- Normalize every path into the same reviewable receiving draft before posting.
- Prevent duplicate serials and IMEIs and make the stock change traceable to the supplier invoice.
- Keep the workflow usable on mobile and desktop.

## Proposed workflow

1. Open **Stock In** and choose **Manual entry**, **Tally ERP**, or **Scan supplier invoice**.
2. Add supplier and invoice details, then capture or import line items.
3. Review all mapped/extracted values, validation errors, and the projected stock increase.
4. Confirm **Post stock receipt**. The preview updates the browser-local inventory and adds a receiving record; it does not create a production stock transaction.

### Manual entry

- Supplier name, supplier invoice number, and invoice date are required.
- Each phone is tracked as an individual unit: model, variant, unit cost, serial number, and IMEI are required for every handset.
- Accessories may be received as quantity-based lines without an IMEI.
- Only products already in the catalog can be posted in this first intake flow; unknown catalog lines must be mapped or removed before posting.

### Tally ERP

- **Import:** accept a Tally-exported CSV or `.xlsx` stock voucher, map its supplier/invoice/product/quantity/cost fields, preview rows, and report missing/duplicate data before creating a draft.
- **Live connection:** expose setup and connection status for a secure local connector running beside Tally. Do not connect a hosted browser directly to Tally or claim a live sync until the local connector and authenticated ShopOS server endpoint exist.
- Both Tally paths end in the same ShopOS review and post step. Do not automatically post imported vouchers.

### Scan supplier invoice

- Accept a phone photo or supported PDF and extract invoice/supplier/line-item values into an editable draft.
- Show a clear **OCR draft—review required** state. Do not add stock until the user confirms the parsed product, cost, serial, and IMEI values.
- Keep the uploaded document and extracted values in the browser session only for this demo; do not upload supplier documents to an external OCR provider.
- OCR is best-effort. If extraction cannot read an IMEI or serial, require manual entry before posting.

## Validation and stock behavior

- Require supplier invoice reference/date and positive unit cost/quantity.
- For each phone, require a unique IMEI and serial number; reject duplicates within the draft and against the current store inventory.
- Make invoice reference duplicate detection visible before posting. A repeated supplier invoice for the same shop/store must not silently increase stock.
- Show a line-level error and keep the draft editable when data is missing or invalid.
- Record an auditable local receiving row with supplier invoice reference, received date, products, quantity, and unit cost, and update matching demo inventory counts only after confirmation.

## Scope and limitations

- This is a frontend demo extension to the current dashboard. Inventory and receiving data remain browser-local and are not authoritative or synchronized across devices.
- Tally CSV/`.xlsx` parsing and document OCR run in the browser without sending supplier documents to a third party. The live Tally option is connection setup/status only until a secure local connector and backend endpoint are available.
- Production stock posting must later use a trusted transactional ShopOS API/database workflow with organization/store isolation, duplicate protection, and audit history.
- This design does not determine GST/input-tax treatment, purchase accounting, landed cost, returns to supplier, or new-product creation. Do not derive or post tax values in this stock receipt flow.

## Success criteria

- A user can manually receive handset stock with supplier invoice, unit cost, serial, and IMEI, review it, and see the local inventory increase after posting.
- Tally-exported rows can be previewed, mapped, validated, and reviewed before posting.
- A scanned invoice can create an editable OCR draft; the user must correct/confirm extracted handset identifiers before stock changes.
- Invalid or duplicate handset identity, missing invoice reference, or repeated supplier invoice prevents posting and explains the error.
- Dashboard mobile navigation and existing organization/store selectors remain intact.
