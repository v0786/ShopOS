# ShopOS Product Requirements Document

**Status:** Product requirements baseline
**Source:** User-provided “ShopOS — Master Build Instructions for Codex” (13 October 2026)
**Change control:** This is the repository's canonical PRD. Update it only when requirements are clarified or changed by the product owner. Implementation status belongs in [implementation-plan.md](implementation-plan.md); task sequencing belongs in [tasks.md](tasks.md).

## 1. Product vision

ShopOS is a mobile-first shop management platform for independent mobile phone retailers and repair businesses in India. It helps owners manage retail operations across branches from one system while keeping each business's data isolated and keeping inventory and financial history auditable.

The product must support real work at a retail counter. Screens without a working workflow or a clear explanation that a capability is unavailable do not count as a delivered feature.

## 2. Users and organizations

- **Business owner:** creates an organization and its first store, oversees staff and consolidated operations.
- **Organization administrator:** manages organization settings, stores, memberships, and authorized business workflows.
- **Store staff:** performs only authorized actions and accesses only assigned stores.
- **Technician:** handles assigned repair jobs and permitted tasks.
- **Platform administrator:** administers the SaaS platform through a separate privileged authorization boundary, not through an organization role.

One organization may have multiple stores. Organizations share the SaaS application but must not be able to read or modify one another's records. Store-scoped data must also be restricted to assigned stores where applicable.

## 3. Product outcomes

1. Give retailers and repair teams a quick mobile-friendly workflow for daily store operations.
2. Keep a shared organization catalog with inventory, device identity, and pricing scoped correctly to stores.
3. Record purchases, sales, payments, returns, refunds, repairs, transfers, and expenses with consistent history.
4. Give owners useful branch-level and organization-wide reports that reconcile with source transactions.
5. Work as an installable PWA when production readiness is reached, while accurately showing offline and sync state.
6. Support subscription limits and separate platform administration after plans and enforcement rules are approved.

## 4. Product scope by phase

### Phase 1 — foundation and multi-tenancy

Typed environment configuration; Supabase Auth and PostgreSQL setup; profiles; signup, login, logout, recovery and sessions; organizations and memberships; owner/admin permissions; stores and assignments; organization/store selectors; minimal functional dashboard; tenant and branch RLS; separate platform-admin authorization; seed data for at least two organizations with multiple stores; setup, migration, configuration, and test documentation.

**Exit gate:** A person can create an organization and first store without manual database changes. ID/request manipulation cannot cross organizations. Users cannot access unassigned stores. Deactivated memberships lose protected access. Platform-admin privileges are separate. Automated tests prove allowed and denied access.

### Phase 2 — catalog and inventory

Products, categories, brands/models, SKUs, barcodes, tax configuration, store prices and reorder thresholds; quantity stock; individually identified IMEI/serial devices; receipts, opening stock, adjustments, movement history, counts, reconciliation, and low-stock reporting; concurrency and idempotency controls.

**Exit gate:** Stock balances reconcile to movements; active IMEI allocation follows a documented identity policy and cannot race; every adjustment has an authorized actor, timestamp, and reason.

### Phase 3 — sales and payments

Counter billing, product and IMEI search, cart, authoritative price/tax calculation, discount permissions, invoice numbering and immutable snapshots, cash/UPI/card/permitted manual payments, optional split payments, receipts, sales search, customer purchase history, returns, refunds, reversals, transactional stock deduction, and idempotency.

**Exit gate:** Invoice, sale items, payments, and stock movements commit atomically; failures leave no partial sale; retries do not duplicate; a device cannot be concurrently sold twice; returns/refunds preserve original history.

### Phase 4 — purchases, customers, expenses, and reporting

Suppliers, purchase orders and direct/partial receiving, supported supplier balances/payments; customer records and auditable ledgers; credit only after rules are defined; expenses with attachments/filtering/exports; branch and consolidated sales/payment/inventory/low-stock reports; profit, expense, inventory valuation, and outstanding-balance reports.

**Exit gate:** Purchase receipts apply exactly once; balances reconcile to ledger entries; reports reconcile to source transactions and define returns, discounts, taxes, and costing.

### Phase 5 — repairs, transfers, and permissions

Repair intake, device condition and accessories, estimates and approvals where specified, technician assignments, status history, parts consumption, labor, deposits and payments, repair receipts and delivery; branch transfers with dispatch, in-transit, receiving, and discrepancy resolution; granular staff permissions and audit logs.

**Exit gate:** Repair lifecycles remain auditable; parts affect stock movements; transfer operations are idempotent; destination stock requires source/in-transit history; sensitive operations are tested against permissions.

### Phase 6 — PWA, subscriptions, and production readiness

Manifest, icons, service worker, installation, appropriate caching, network/save/sync states, explicitly supported offline drafts and conflict resolution; server-enforced plans/limits/renewals/status; payment-provider integration only after approval, verified/idempotent webhooks; separate platform administration; monitoring, secure storage, backup/restore, production security/performance, deployment/release checks.

**Exit gate:** Supported Android browsers can install; offline drafts are never presented as confirmed transactions; subscription enforcement is server-side; webhook retries are safe; restore is demonstrated outside production; release gates are complete or limitations documented.

## 5. Non-functional requirements

### Security and tenancy

- Enforce tenant/store access in PostgreSQL RLS, constraints, trusted functions, and server boundaries, not only in UI.
- Prevent cross-organization references with database constraints.
- Enforce permissions for every sensitive operation and separate platform administration.
- Never ship service-role keys or other privileged secrets to the browser.
- Test denied access as carefully as allowed access, including changed IDs and deactivated/unassigned memberships.

### Financial and inventory integrity

- Use fixed-precision database money types and database-authoritative calculations.
- Perform critical multi-record operations transactionally and protect retries with idempotency.
- Prevent concurrent allocation/sale of the same tracked phone.
- Keep invoices, payments, and movements consistent; preserve posted history through reversals/adjustments.
- Record auditable stock movements and actors.

### Engineering quality

- Use React, Vite, TypeScript, Tailwind, React Router, Supabase Auth/PostgreSQL and RLS unless a justified existing architecture is present.
- Keep modules typed and maintainable; avoid unnecessary dependencies and infrastructure.
- Validate untrusted input at UI and trusted data boundaries.
- Provide loading, empty, success, validation, error, and permission-denied states where workflows require them.
- Add automated tests for meaningful behavior. Document checks that cannot run and why.
- Update migrations and docs alongside implementation. Report only verified behavior.

### User experience

- Mobile-first responsive layouts, desktop sidebar, compact mobile navigation, prominent billing action, clear organization/store selectors, and fast search.
- Accessible forms, keyboard navigation, readable contrast, visible focus, and confirmation for destructive/financial operations.
- Consistent currency/date/number formatting, recovery states, printable invoices and receipts.
- No placeholder buttons or nonfunctional forms.

## 6. Out of scope until approved

Do not silently choose business rules for GST/invoices; costing; store-specific tax/invoice variation; customer credit/dues; refund and payment allocation; printer/scanner compatibility; subscription pricing/limits; offline operations; retention/deletion/export; backup retention and recovery objectives. Track them in [design.md](design.md) and [tasks.md](tasks.md) before implementing dependent behavior.

## 7. Current product status

Only a frontend foundation and informational setup screen exist. Authentication, tenant/store data, migrations, RLS, business workflows, PWA, subscription behavior, and platform administration are not implemented. No phase exit gate is currently met. The [implementation checklist](implementation-plan.md) tracks actual status and evidence.
