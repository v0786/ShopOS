# ShopOS engineering rules

These constraints derive from the canonical [PRD](PRD.md). They do not imply that controls are implemented. Current status and evidence are in [implementation-plan.md](implementation-plan.md).

## Tenant and store access

1. Every organization-owned table has an explicit tenant key; store-owned data has appropriate organization and store scope.
2. Enable RLS and least-privilege grants for every applicable table. Hidden UI, URL secrecy, and client-side checks are never authorization controls.
3. Derive access from the authenticated user, active organization membership, role, and store assignment. Re-check on every sensitive database operation.
4. Use database constraints, including composite foreign keys where needed, to prevent cross-organization references.
5. Deactivated memberships lose access. Store assignments are explicit.
6. Platform administration is separately privileged; an organization role never implies platform-admin authority.
7. Test permitted and denied paths: different organization, changed IDs, unassigned store, inactive membership, and unauthorized operation.

## Secrets and authentication

- Only the Supabase URL and public anon/publishable key may reach browser code.
- Never put service-role keys, signing secrets, webhook secrets, or privileged credentials in browser variables, source, samples, logs, or client storage.
- Validate runtime configuration and fail clearly when required public values are absent or malformed.
- Store server credentials in a trusted deployment secret manager. Rotate credentials if exposed.
- Protect recovery and session transitions; do not log passwords, tokens, or recovery links.

## Money, invoices, and payments

- Store money with fixed-precision PostgreSQL numeric types and document scale/currency.
- The trusted database/server path is authoritative for unit price, discounts, tax, totals, payment allocation, and balances.
- Commit invoice, sale items, payments, and inventory changes in one transaction.
- Make retryable operations idempotent. A retry must return or identify the original result rather than duplicate it.
- Treat posted invoices/payment records as immutable history. Correct them with reversals, refunds, or adjustments linked to the original.
- Require permission checks and auditable actors for discounts, refunds, manual payment methods, and other sensitive changes.
- Do not implement unresolved GST, credit, refund allocation, invoice, or costing policies by assumption.

## Inventory and devices

- Preserve an append-only movement history with actor, time, reason, and source/destination where applicable.
- Reconcile balances to movements; keep adjustments explicit and authorized.
- Protect concurrent inventory operations so available quantity cannot be oversold.
- Prevent duplicate active allocation/sale of a tracked IMEI/serial under the approved identity policy.
- Receive transfers into destination stock only after the corresponding source/in-transit record and authorized receipt.

## Application and workflow quality

- Use strict TypeScript; avoid `any` unless its boundary and reason are documented.
- Separate feature UI, input validation, and data access without creating unused abstractions.
- Validate input both for useful UI feedback and again at the trusted database/server boundary.
- Provide loading, empty, success, validation, network, error, and permission-denied feedback as workflows require.
- Every visible control must perform its stated action or clearly indicate it is unavailable; do not ship placeholder actions.
- Confirm destructive and financially significant actions. Preserve history rather than silently rewriting committed records.
- Do not present offline drafts as saved/posted server transactions.

## Tests, migrations, and scope

- Write behavior-focused tests for meaningful logic and authorization; database/RLS tests include both allowed and denied cases.
- Run relevant tests, strict typecheck, lint, and build before reporting completion; state exact commands and outcomes.
- Keep migrations versioned and review schema, grants, constraints, indexes, RLS, and rollback/restore implications together.
- Document transaction boundaries and reporting definitions, including returns, discounts, taxes, and costing.
- Update implementation status and relevant docs with code changes. Never report a gate as satisfied without evidence.
- Work one phase at a time. Preserve existing architecture and data; avoid unrelated refactors, unnecessary dependencies, microservices, and infrastructure.
- Resolve routine implementation details conservatively. Record decisions affecting business rules, money, access, retention, or data migration.
