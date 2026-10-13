# ShopOS Foundation Implementation Plan

> **For agentic workers:** Native execution in this session is authorized by the user's request to start implementation. Follow the checklist task by task.

**Goal:** Establish a minimal typed React/Vite foundation with validated public Supabase configuration and project documentation for the staged ShopOS build.

**Architecture:** Keep the browser app small and modular. Parse only explicitly public Vite environment values through a typed module, validate the Supabase URL and anon key before client creation, and never accept privileged credentials in browser configuration. No tenant or financial operation is considered implemented by this foundation.

**Tech Stack:** React, Vite, strict TypeScript, Tailwind CSS, Supabase JS client, Vitest, React Testing Library.

**Spec:** User-provided ShopOS master build instructions, referenced in `docs/PRD.md`.

## Global Constraints

- Preserve an existing architecture when present; the workspace was empty, so create only the Phase 1 foundation.
- Enforce security on the server/database; browser configuration is not an authorization boundary.
- Never expose Supabase service-role credentials or other privileged secrets to the browser.
- Do not claim tenant security, authentication workflows, or RLS are complete until implemented and verified.
- Do not invent the unresolved financial, tax, subscription, offline, or retention policies.

## Review Focus

- Missing Supabase values must produce a clear configuration error.
- Malformed Supabase URLs must not initialize a client.
- Browser configuration must not include a service-role secret.
- Checklist status must not overstate work based on scaffold existence.
- Empty workspace must receive an explicit, repeatable local setup path.

---

### Task 1: Repository baseline and typed public configuration

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `src/**`, `src/config/env.ts`, `src/lib/supabase.ts`, `.gitignore`, `.env.example`
- Test: `src/config/env.test.ts`, `src/App.test.tsx`, `vite.config.test.ts`
- Create: `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/security.md`, `docs/implementation-plan.md`, `README.md`
- Create: this plan

**Interfaces:**
- `parsePublicEnv(source: Record<string, string | undefined>): PublicEnv` validates `SHOPOS_PUBLIC_SUPABASE_URL` and `SHOPOS_PUBLIC_SUPABASE_ANON_KEY` and returns the typed public configuration.
- `getPublicEnv()` selects only those exact properties from `import.meta.env` and delegates to `parsePublicEnv`.
- `createPublicEnvDefines(source)` creates build-time values for only those exact two keys while Vite automatic env exposure remains disabled.
- `supabase` is initialized only from validated public environment values.

- [x] Scaffold React/Vite/strict TypeScript and Tailwind CSS.
- [x] Add focused tests for valid/missing/malformed config, exact define allowlist, and the honest setup screen; observe the screen and missing allowlist tests fail against the starter/missing function.
- [x] Implement typed validation, exact-key Supabase client configuration, and responsive setup-in-progress screen.
- [x] Add PRD reference, architecture/security/database baseline, and requirement-by-requirement phase checklist; leave unimplemented capabilities visibly incomplete.
- [x] Run tests, strict typecheck, lint, and production build.
- [x] Build with similarly-prefixed URL/anon secrets and a service-role sentinel; confirm all are absent from production assets.

**Verification:** `npm test -- --reporter=dot` (7 passing), `npm run typecheck`, `npm run lint`, `npm run build`, `npm audit --omit=dev`, and the expanded secret-sentinel bundle check (all exit 0).

**Limitation:** The workspace did not contain Git metadata, so no branch/worktree isolation or commit was possible. No Supabase project, credentials, migrations, auth, RLS, or database integration test is present. Phase 1 exit gate remains unmet.
