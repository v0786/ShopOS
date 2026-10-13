# ShopOS project memory

Durable project facts and decisions. Update this file when the product owner approves a decision or architecture changes. Time-sensitive progress belongs in [context.md](context.md); requirement status belongs in [implementation-plan.md](implementation-plan.md).

## Product facts

- ShopOS serves mobile phone retailers and repair businesses in India.
- One SaaS instance serves multiple organizations; organizations can have multiple stores.
- Organization/store isolation must be enforced in PostgreSQL/trusted code, not only in the browser.
- Platform-admin authority is separate from organization membership and roles.
- Device identity includes IMEI/serial tracking; posted money and stock history must remain auditable.
- The product is mobile-first and must support real workflows, not decorative screens.

## Approved technical baseline

- Frontend: React, Vite, strict TypeScript, Tailwind CSS.
- Authentication and data: Supabase Auth and PostgreSQL.
- Authorization: RLS, grants, constraints, trusted transactional functions.
- Routing/state: React Router when real multi-screen workflows exist; Zustand only for demonstrated shared state needs.
- PWA and offline drafts are Phase 6; only explicitly supported workflows may sync.
- Current browser settings: `SHOPOS_PUBLIC_SUPABASE_URL` and `SHOPOS_PUBLIC_SUPABASE_ANON_KEY`. Vite automatic env exposure is disabled; config injects only those exact keys.

## Invariants

- Never place service-role or other privileged secrets in browser code/config or versioned env files.
- Browser-calculated prices, tax, totals, access decisions, stock, and posted transaction state are never authoritative.
- Critical financial/inventory operations are transactional and idempotent; tracked-device allocation is concurrency-safe.
- Preserve posted history through linked reversals/adjustments.
- Test both allowed and denied access; report only verified checks.
- Do not invent open business rules. See [tasks.md](tasks.md).

## Decisions not yet made

No approved decisions exist for GST/invoicing, costing, store-specific tax/invoice variation, customer credit, refund/payment allocation, printer/scanner support, subscription plans/provider, offline workflows, retention/export, backup retention, or recovery objectives.

## Current implementation reality

- The Vite application has Supabase Auth, organization/store onboarding, and the Phase 1 multi-tenant schema and RLS foundation. ShopOS users can switch organization and store context in the dashboard.
- The mobile-retail workspace includes dashboard, inventory, stock in/out, billing, invoices, customers, reports, finance-partner configuration, shop settings, and help screens.
- First sign-up continues into a two-step shop profile setup for shop name, contact, business category, address, state, and optional GSTIN.
- Sales, inventory demo figures, sample invoices/customers, finance partners, and shop/staff settings currently use browser local storage or illustrative seed data. These screens are not yet connected to ShopOS catalog, inventory, sales, invoice, payment, customer, reporting, or lender database workflows.
- Billing can print a local receipt/invoice preview. No payment is collected, invoice/stock writes are not server-authoritative, and e-invoice IRN/QR generation is not implemented. Verify tax and invoice requirements before real use.
- Optional Aadhaar and PAN inputs exist only in the local demo staff profile and are labeled with a warning not to enter real identity numbers. A production design must use a suitable secure backend and access policy before collecting these identifiers.
- The preview has no promotional mobile-app sidebar card; mobile navigation is responsive and retains the active store selector.

See [context.md](context.md) for current verification and remaining work.
