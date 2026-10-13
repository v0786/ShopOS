# ShopOS MVP implementation guide

**Purpose:** Give implementation work a safe, ordered path from the current frontend foundation to a usable first release. This guide follows [PRD.md](PRD.md), [architecture.md](architecture.md), and [rules.md](rules.md). It does not approve unresolved tax, accounting, or legal policy.

**Status:** Planning guide. The current application is still a setup screen. No step below is complete unless the [implementation checklist](implementation-plan.md) records evidence.

## 1. Recommended MVP boundary

Assumption for planning: the MVP serves one Indian phone retailer organization with multiple stores, staff access, catalog/inventory, and counter sales. Keep the data model multi-tenant from the first migration. MVP release scope:

1. Owner signup/login/recovery and organization plus first-store setup.
2. Organization memberships, roles, store assignments, selectors, and a useful daily dashboard.
3. Product catalog for phones/accessories, product search/barcodes, store pricing, quantity stock, individually tracked IMEI/serial devices.
4. Opening stock, authorized stock receipts/adjustments, and stock history so inventory can be loaded and reconciled.
5. Counter sales with invoice snapshot, cash/UPI/card recording, stock deduction, idempotency, receipt/print view, sales history, and a controlled return/refund path.
6. Minimal customers without credit/dues; daily sales and low-stock views reconciled to source records.

Defer supplier balances/purchase orders, repairs, branch transfers, advanced reporting/accounting, expenses, subscriptions, platform admin, offline commits, and PWA install support until after MVP core workflows are secure and used. This is a recommended scope, not a change to the PRD; get product-owner approval before reducing any stated product requirement. Keep implementation order and prior-phase exit gates from the PRD even where an MVP outcome uses capabilities listed in a later phase.

## 2. Required decisions before affected implementation

Document the approved answer, owner, date, and affected schema/workflows in `docs/decisions/` (create that folder when needed) before coding dependent behavior:

- GST/tax registration, tax calculation, invoice numbering/fields, and whether invoices vary by store.
- MVP discount authority and whether prices are tax-inclusive or tax-exclusive.
- Inventory costing and what MVP profit/valuation numbers mean. Until decided, do not report authoritative profit or inventory valuation.
- Returns/refunds, payment allocation, partial refunds, and stock disposition for returned items.
- Whether customer purchase history needs a persistent customer record and what personal data is necessary. Credit/dues remain out of scope until specified.
- Supported scanners/printers and receipt format; browser print is a provisional path only if approved.
- Account invitation method, password policy, and who can create additional stores.

Do not encode guessed rates, legal invoice language, credit limits, or refund rules.

## 3. Stack and boundaries

- **React + Vite + strict TypeScript:** UI and routing. Keep feature workflows in `src/features/<feature>/`; keep shared UI in `src/components/` only when reused.
- **Tailwind CSS:** responsive layout and shared visual tokens; preserve accessible contrast, focus, and status states.
- **React Router:** add when login, organization setup, dashboard, inventory, and billing become real routes.
- **Zustand:** add only for concrete cross-route UI state such as active organization/store if router/provider state does not cover it. Never use it as the source of truth for money, permissions, or stock.
- **Supabase Auth + PostgreSQL:** identity, relational data, RLS, constraints, migrations, seeds, and transactional database functions/RPC.
- **Browser Supabase client:** use only the project URL and anon/publishable key. Keep service-role keys and signing secrets out of frontend code and variables.
- **Hosting:** deploy the static frontend and managed Supabase only after migration, RLS, and release gates are verified.

Recommended structure, created incrementally rather than as empty scaffolding:

```text
src/
  app/                  # route table, providers, protected shell
  components/           # shared accessible primitives
  features/
    auth/ organizations/ stores/
    catalog/ inventory/ purchasing/ sales/ customers/ reports/
  data/                 # typed Supabase boundary, if shared
  config/
supabase/
  migrations/
  seed.sql
```

## 4. Implementation sequence and exit checks

### Step A — local backend and Phase 1 tenancy

1. Set up local Supabase CLI/database workflow and document prerequisites.
2. Design profiles, organizations, memberships, stores, and store assignments. Define owner/admin/staff roles and active/deactivated membership behavior.
3. Add migrations with tenant-safe composite keys, constraints, indexes, grants, and RLS. Keep platform-admin authority separate; do not create a client-writable platform-admin flag.
4. Implement signup/login/logout/recovery/session and organization + first-store creation through trusted database operations.
5. Add store assignment and organization/store selection; build the functional dashboard.
6. Seed two organizations with multiple stores.
7. Test authorized and denied reads/writes using separate users, including changed IDs, cross-organization references, unassigned stores, deactivated membership, and platform-admin separation.

**Gate:** Every Phase 1 acceptance criterion in the PRD passes. Do not start Phase 2 until this gate passes or its remaining blockers are explicitly documented.

### Step B — catalog and inventory

1. Decide category/brand/model fields and product identity policy. Separate catalog products from physical units when phones require unique IMEI/serial identity.
2. Add products, categories, brands/models, SKU/barcode, and approved tax attributes.
3. Add store prices/reorder thresholds, quantity balances, tracked-device records, and an append-only stock movement ledger.
4. Implement receiving, opening stock, adjustments with actor/time/reason, counts, and reconciliation.
5. Make stock changes transactional, lock/constrain concurrent changes, and require idempotency keys for retryable receipts/adjustments.
6. Test stock balance equals movement sum, duplicate active IMEI policy, concurrency, permissions, and cross-store/tenant denial.

**Gate:** Inventory acceptance criteria in Phase 2 pass before sales work depends on stock.

### Step C — transactional billing

1. Build counter search/cart and device selection against authorized store inventory.
2. Put authoritative price/tax/discount calculation, invoice numbering/snapshot, stock allocation, sale items, payment records, and ledger movements into one trusted transaction.
3. Use idempotency keys for checkout. Reject stale/insufficient stock and concurrent sale of a tracked device.
4. Add approved cash/UPI/card/manual payment entry, sales search/history, receipt/print view, and approved returns/refunds/reversals.
5. Test success, validation/permission rejection, transaction rollback, duplicate retry, partial/failed payment as specified, return/refund history, and simultaneous IMEI checkout.

**Gate:** Invoice, payment, and stock records reconcile after success, failure, retry, and reversal; Phase 3 acceptance criteria pass.

### Step D — complete the agreed MVP

Add only the customer, supplier, low-stock, and daily sales views required by the agreed MVP. Reports must name their definitions and reconcile with the source ledger. Keep credit, profit, valuation, and advanced accounting out until their definitions are approved.

## 5. Data and transaction rules

- Money columns use PostgreSQL `numeric` with chosen precision/scale and an explicit currency. Do not use floating-point for posted money.
- Tenant tables carry `organization_id`; store-owned rows also carry `store_id`. Use composite constraints so a store from another organization cannot be referenced.
- A stock balance is a derived/maintained transactional value whose changes are supported by immutable movement rows. Document the chosen balance strategy.
- Tracked phone identities must be normalized and protected by the approved unique active identity rule.
- Posted invoices/payments are not edited in place. Corrections create linked reversal/refund/adjustment records.
- Multi-record operations use database transactions, actor checks, idempotency, and appropriate locks/constraints.
- UI-computed totals are previews only; database/trusted functions are authoritative.

See [database.md](database.md) for schema documentation expectations and [rules.md](rules.md) for security and integrity rules.

## 6. Tests and release evidence

Use the smallest test layer that proves each boundary:

- **Vitest:** pure validation, formatting, and UI behavior.
- **React Testing Library:** accessible form and screen states.
- **Supabase/Postgres integration:** migrations, constraints, RLS, RPC transactions, permitted/denied access, rollback, idempotency, concurrency.
- **Playwright:** owner setup, staff store assignment, inventory receipt, checkout, receipt, and unauthorized navigation flows.

For each vertical workflow, provide:

1. Migration/reset evidence.
2. Allowed and denied RLS results.
3. Transaction/integrity tests.
4. `npm test`, strict typecheck, lint, and production build results.
5. Updated checklist, architecture/database/security docs, and known limitations.

Do not put real customer or production data in seeds or tests. Do not claim production readiness from a successful frontend build.

## 7. PWA and later work

Only after the online workflows and server integrity are proven, add manifest/icons/service worker and explicitly approved offline drafts. Persist drafts locally with visible unsynced state; detect conflicts and never show a draft as a posted sale. Add subscriptions, provider webhooks, platform administration, monitoring, backups, and restore drills only after their owners, provider, policies, and release gates are defined.

## 8. Work checklist source of truth

Use [tasks.md](tasks.md) for the immediate queue and [implementation-plan.md](implementation-plan.md) for requirement-to-status/test mapping. At the end of each bounded implementation task:

- Update both if scope or status changed.
- Record decisions in `memory.md` only when durable/approved; put temporary state in `context.md`.
- Never mark a phase complete until its PRD exit gate is evidenced.
