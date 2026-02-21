# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` workspace with apps in `apps/*` and shared libraries in `packages/*`.
- `apps/web`: Next.js 14 frontend (`src/app`, `src/components`, `src/lib`).
- `apps/api`: NestJS backend (`src/modules`, `src/common`, `prisma/`).
- `apps/worker`: containerized worker scaffold.
- `packages/contracts`, `packages/logging`, `packages/ui`: shared types, logging, and UI primitives.
- `docs/`: product and implementation documentation.

Treat `dist/` and `.next/` as build output; do not edit generated files manually.

## Build, Test, and Development Commands
- `pnpm install`: install workspace dependencies.
- `pnpm dev`: run all workspace `dev` scripts in parallel.
- `pnpm dev:web` / `pnpm dev:api`: run only one app.
- `pnpm build`: build all packages/apps.
- `pnpm lint` / `pnpm lint:fix`: lint or auto-fix.
- `pnpm format:check` / `pnpm format`: validate or apply Prettier formatting.
- `pnpm test`: run workspace tests.
- `pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:down`: local DB lifecycle.

Docker users can also run `make up`, `make logs`, `make test`, and `make down`.

## Coding Style & Naming Conventions
Use TypeScript with strict compiler settings. Formatting is enforced by Prettier (`.prettierrc`): 2-space indent, semicolons, double quotes, trailing commas (`es5`), and 100-character line width.

Naming patterns:
- React components: `PascalCase.tsx`
- Hooks: `useSomething.ts`
- Nest modules/services/controllers/DTOs: `*.module.ts`, `*.service.ts`, `*.controller.ts`, `*.dto.ts`

## Testing Guidelines
API tests use Jest (`apps/api/jest.config.cjs`).
- Unit tests: `*.spec.ts`
- Integration tests: `*.integration.spec.ts` (run with `pnpm --filter @nexusops/api test:integration`)

Place tests close to source in `apps/api/src`. For frontend changes, include manual verification steps (and screenshots for UI-impacting PRs) until dedicated web test coverage is introduced.

## Commit & Pull Request Guidelines
Git history is currently minimal (repo initialized on February 21, 2026), so no project-specific commit pattern is established yet. Use Conventional Commits:
- `feat(api): add SLA pause/resume audit trail`
- `fix(web): handle empty dashboard state`

PRs should include:
- clear summary and scope
- linked issue/ticket
- test evidence (commands run + results)
- screenshots for `apps/web` UI changes
- migration notes for changes under `apps/api/prisma/migrations`

## Security & Configuration Tips
Copy `.env.example` to `.env` for local setup and never commit secrets. Validate DB/Redis/JWT settings before sharing environments. With Docker Compose, Postgres is exposed on `localhost:5433`, while API/web run on `3001`/`3000`.
