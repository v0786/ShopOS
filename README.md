# ShopOS

Mobile-first shop management for Indian mobile retailers and repair teams. This repository contains the React/Vite frontend foundation, Supabase authentication and first-shop onboarding, an initial multi-tenant database migration, and a mobile retailer dashboard foundation. Inventory, billing, repair workflows, and other business operations remain on the implementation roadmap.

## Documentation

- [Product requirements (PRD)](docs/PRD.md)
- [Architecture](docs/architecture.md)
- [Engineering rules](docs/rules.md)
- [Product and interaction design](docs/design.md)
- [MVP implementation guide](docs/guide.md)
- [Documentation review prompt](docs/review-prompt.md)
- [Task queue](docs/tasks.md)
- [Project memory](docs/memory.md)
- [Working context](docs/context.md)
- [Detailed implementation checklist](docs/implementation-plan.md)
- [Database status](docs/database.md)
- [Security status](docs/security.md)

## Local setup

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```powershell
npm install
Copy-Item .env.example .env.local
```

The Supabase project URL is prefilled in `.env.example`. Set `SHOPOS_PUBLIC_SUPABASE_ANON_KEY` to the project's public anon/publishable key in `.env.local`. Never put the database password or a service-role key in browser settings or commit them to Git. The PostgreSQL connection string is for trusted server-side tools only; URL-encode special characters in its password. Vite automatic env exposure is disabled; only the two `SHOPOS_PUBLIC_*` keys are injected into browser modules.

The database migration is in `supabase/migrations/`. To link the Supabase CLI to the project, run `npx supabase link --project-ref twispldzctiqsgdgycik` and provide the database password when prompted. Applying migrations to the hosted database is a separate deployment action; do that only after reviewing the migration and confirming the target project.

```powershell
npm run dev
```

## Checks

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

The initial organization and store schema migration and local PostgreSQL integration tests are included. Cloud credentials are intentionally not included; see [docs/context.md](docs/context.md) and [docs/tasks.md](docs/tasks.md) for the next implementation steps.
