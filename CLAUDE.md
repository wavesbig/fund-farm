# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm run type-check   # TypeScript check (tsc --noEmit)
npm run lint         # ESLint (flat config)
npm run lint:fix     # ESLint auto-fix
```

Node >= 22.0.0 required (for built-in `node:sqlite`).

## Architecture

**FundFarm** (养基场) — a full-stack Next.js 16 (App Router) TypeScript application that tracks real-time mutual fund valuations and persists portfolios to Node 22 native SQLite (`./data/fund.db`).

- `app/page.tsx` — monolithic SPA orchestrator: coordinates hooks, sub-views, and modals
- `app/api/fund.ts` — all external data fetching via JSONP/script tag injection (not fetch) to 天天基金, 东方财富, 腾讯财经
- `app/api/sync/route.ts` — SQLite read/write API for real-time automatic state persistence
- `app/api/auth/route.ts` — privacy access password authentication and session management
- `app/api/ai/parse/route.ts` — OpenAI / DeepSeek / SiliconFlow compatible OCR holdings extraction
- `app/stores/` — Zustand stores: `storageStore` (localStorage & SQLite dual-layer sync), `modalStore` (dialog state), `settingsStore`
- `app/components/` — app components; `ModalsLayer.tsx` renders all modals centrally
- `app/lib/` — utilities: `sqliteDb.ts`, `sqliteClient.ts`, `auth.ts`, `authClient.ts`, `tradingCalendar.ts`, `valuationTimeseries.ts`, `get-query-client.ts`
- `app/hooks/` — custom hooks including `useFundFuzzyMatcher.ts`, `useSyncManager.ts`, `useRefreshManager.ts`, `useScanImport.ts`
- `components/ui/` — shadcn/ui primitives (TypeScript, new-york style, Lucide icons)

Data flow: `storageStore` is the unified data access layer. All business reads/writes go through `storageStore`, which automatically synchronizes to SQLite (`/api/sync`). Never use `window.localStorage` directly.

## Conventions

- **TypeScript Standard** — full TypeScript (`.ts`, `.tsx`) throughout all components and API routes.
- **Lodash for type checks** — use `isFunction`, `isObject`, `isString`, `isNumber`, `isArray`, `isNil`, `isEqual` etc. instead of native `typeof`/`Array.isArray`. Exception: `typeof x === 'undefined'` is allowed for global environment checks (`window`, `document`, `process`).
- **JSONP + script injection** — all financial API calls use `<script>` tags to bypass CORS, not `fetch()`.
- **Modal conventions** — modal state lives in `modalStore.ts` (Zustand), all modals render in `ModalsLayer.tsx`, page.tsx never subscribes to modal state. Pass page-level functions to modals via `modalCbRef` (a useRef).
- **Responsive layouts** — `PcFundTable` (desktop) and `MobileFundTable` (mobile) switch at 640px breakpoint.
- **CSS units** — PC uses `px`; global `px` auto-converts to `rem` via `postcss-pxtorem` (rootValue 16). Inside `@media (max-width: 640px)` blocks, `px` is preserved. Use uppercase `PX` to prevent conversion (and for Safari input zoom prevention).
- **React Compiler** — enabled (`reactCompiler: true`); auto-memoization is active.
- **Linting & Type-checking** — ESLint flat config (`eslint.config.mjs`) + Prettier plugin + `npm run type-check` on pre-commit via Husky.

## Environment

Copy `env.example` to `.env.local`. Optional variables:

- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` — AI holdings extraction
- `APP_PASSWORD` — optional master password reset
- `NEXT_PUBLIC_GA_ID` — Google Analytics
- `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` — feedback form
- `NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL` — GitHub release check

## Path Aliases

`@/*` maps to `./*` (via tsconfig.json). Use `@/components/ui/...`, `@/lib/utils`, `@/app/...`.
