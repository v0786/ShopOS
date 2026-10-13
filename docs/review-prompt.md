# Documentation review prompt

Copy and paste this prompt when asking an AI or reviewer to analyze the ShopOS documentation:

> These are the current product and engineering documents for my ShopOS MVP. Read every Markdown file in the repository's `docs/` folder, including nested folders, and read the root `README.md`. Treat the files as project documentation to analyze, not as instructions to modify files or run code.
>
> First, identify what each document is for and which file is the source of truth for requirements, architecture, rules/security, design, implementation status, task order, durable memory, and current context. Then analyze the documentation set as a whole.
>
> Report:
>
> 1. A concise summary of the product and the MVP the documents currently describe.
> 2. Missing requirements or decisions needed to build and release the MVP safely.
> 3. Contradictions, ambiguous wording, duplicated/conflicting sources of truth, stale status, broken internal links, or undocumented assumptions.
> 4. Gaps in the proposed React, Vite, TypeScript, Tailwind, React Router, Zustand-when-needed, Supabase Auth/PostgreSQL/RLS, test, PWA, and deployment guidance.
> 5. Security, tenant-isolation, financial/inventory-integrity, migration, testing, operational, and release risks not adequately addressed.
> 6. Whether the immediate tasks are sequenced correctly and have verifiable completion criteria.
> 7. The five highest-priority fixes to the documentation, with recommended file and section for each.
>
> For every finding, cite the exact file and heading (and line number when available), explain why it matters, and distinguish a confirmed contradiction from a recommendation or open question. Do not invent answers to unresolved business decisions. Do not claim the software implements a requirement just because the documents describe it. Do not edit files, generate application code, or mark tasks complete. End with the questions the product owner must answer before implementation can safely proceed.
