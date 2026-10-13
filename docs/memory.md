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

Only the frontend foundation/configuration and informational setup screen exist. No authentication, database migrations, RLS, organizations, stores, business modules, PWA, subscriptions, or platform admin are implemented. Phase 1 is incomplete. See [context.md](context.md) for the current workspace snapshot.
