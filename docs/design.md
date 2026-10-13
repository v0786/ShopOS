# ShopOS product and interaction design

**Status:** Direction derived from the PRD, not a final screen specification. No business workflow has been approved through user research or implemented. The current setup screen is a temporary, truthful project-state screen.

## Product experience

ShopOS should feel dependable, quick to scan, and usable while staff serve customers. Prioritize fewer steps, clear prices/status, forgiving search, and safe transaction review. Retailers and repair teams may use phones at the counter; layouts adapt to narrow screens first and expand to a useful desktop workspace.

## Information structure

The expected application shell will provide:

- Clear organization and active-store selectors.
- Store-aware navigation to dashboard, billing, products/inventory, purchases, customers, expenses, repairs, transfers, and reports as capabilities become available.
- A prominent billing action for authorized staff.
- Desktop sidebar navigation and compact mobile navigation.
- Search entry points for products, IMEI/serial, customer, invoice, and repair ticket.

Do not show navigation for unfinished modules as if the user can complete those jobs. Introduce routes alongside functional workflows.

## Visual direction

Use a calm, high-contrast retail interface with a restrained green/neutral base, legible typography, clear numeric hierarchy, and compact tables/cards where density helps. Keep status colors consistent and never communicate status by color alone. Use Tailwind for common layout/spacing/typography and feature CSS only where it adds reusable meaning. Keep animation minimal and avoid decoration that competes with pricing, customer details, or device identity.

The setup screen currently uses a responsive neutral/green treatment and an explicit “setup in progress” status. It does not define the final dashboard visual system.

## Interaction and accessibility

- Forms support keyboard operation, labels, visible focus, readable contrast, and specific inline validation.
- Important financial values and device identifiers remain visible during review and confirmation.
- Destructive, stock-changing, refund, and other financially significant actions require clear confirmation and explain the result.
- Show loading, empty/no-results, successful save, validation failure, network failure, and permission denial where relevant.
- Make save/submit state clear. Prevent accidental double-submit in UI and enforce idempotency at the trusted boundary.
- Format INR amounts, dates, and quantities consistently after locale and tax rules are decided.
- Receipts/invoices must be printable and shareable after source transactions and legal format rules are defined.

## Core workflow constraints

**Billing:** Fast product lookup, cart review, tracked-device selection, explicit discount/tax/payment breakdown, final confirmation, receipt. The browser presents estimates only; trusted server/database values authorize and commit the sale.

**Repair:** Intake captures the device, condition, accessories, and customer; estimate/approval and technician assignment precede status updates; parts and charges use auditable operations; delivery closes the lifecycle.

**Transfer:** Select source/destination and items; authorized dispatch creates in-transit state; receiving records actual quantities and discrepancies; destination inventory changes only through the transactionally linked receipt.

Tax, refund, credit, printing/scanner, offline, and other unsettled product decisions are tracked in [tasks.md](tasks.md). Do not invent dependent behavior before those decisions are settled.
