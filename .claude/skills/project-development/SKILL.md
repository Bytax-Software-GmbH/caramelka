---
name: project-development
description: Use when planning, implementing, debugging, refactoring, reviewing, or verifying product work in Caramelka, including its TanStack Start storefront/admin routes, bilingual content, Better Auth, Drizzle/PostgreSQL, Tailwind, and server functions.
---

# Caramelka Development

- Use pnpm and obey `AGENTS.md`. Run `pnpm intent list` before substantial work.
- This is a React/TanStack Start app with file routes, TanStack Query, Better Auth, Drizzle/PostgreSQL, Tailwind, and shadcn/Base UI primitives.
- Keep customer routes outside protected admin groups unless authentication is part of the requirement. Preserve German/Russian content behavior and existing locale/cart persistence.
- Keep database and filesystem imports behind server functions or `*.server.ts`; loaders stay isomorphic and should use existing query-option patterns.
- Add UI primitives through `pnpm ui add`; extend `src/components/ck` and `src/components/ui` rather than inventing a parallel system.
- Verify with `pnpm format:check` and `pnpm lint`. Start `pnpm dev`, then use Playwright or a deliberate manual pass on every changed route, locale, and responsive state; describe this as browser smoke coverage, not an automated test suite. `pnpm check` rewrites formatting. Run `pnpm build` for bundler, SSR, or deployment-sensitive changes. The repository has no general test script, so do not claim automated tests ran.
