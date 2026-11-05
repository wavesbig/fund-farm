# PROJECT KNOWLEDGE BASE

**Commit:** 755962d
**Branch:** main

## OVERVIEW

Real-time mutual fund valuation tracker (养基场 / FundFarm). Next.js 16 App Router, full TypeScript (TSX), Node 22 native SQLite (`./data/fund.db`) backend with dual-layer localStorage synchronization. Glassmorphism UI with heavy custom CSS variables. Financial data via JSONP/script injection to external Chinese financial APIs (天天基金, 东方财富, 腾讯财经). Privacy lock screen and local-first architecture.

## STRUCTURE

```
real-time-fund/
├── app/                          # Next.js App Router root
│   ├── page.tsx                  # Main SPA orchestrator (~5400 lines) — state + logic + layout
│   ├── layout.tsx                # Root layout (theme init, PWA, GA, Toaster)
│   ├── globals.css               # Tailwind v4 + glassmorphism CSS variables
│   ├── api/                      # Fullstack API route handlers
│   │   ├── fund.ts               # ALL external data fetching (JSONP + script injection)
│   │   ├── sync/route.ts         # SQLite read/write API for real-time automatic persistence
│   │   ├── auth/route.ts         # Access password authentication & session management
│   │   └── ai/parse/route.ts     # OpenAI / DeepSeek / SiliconFlow OCR holdings extraction
│   ├── components/               # App-specific UI components (modals, cards, tables, charts)
│   ├── stores/                   # Zustand stores: storageStore, modalStore, settingsStore, authStore
│   ├── lib/                      # Core utilities: sqliteDb, sqliteClient, auth, tradingCalendar, valuationTimeseries
│   └── hooks/                    # Custom hooks: useFundFuzzyMatcher, useSyncManager, useRefreshManager, useScanImport
├── components/ui/                # shadcn/ui primitives (accordion, button, dialog, drawer, etc.)
├── lib/utils.ts                  # cn() helper (clsx + tailwind-merge)
├── public/                       # Static: allFund.json, fundSectors.json, PWA manifest, service worker, icon
├── data/                         # Persistent SQLite data directory (fund.db)
├── doc/                          # Documentation: localStorage schema, design system, screenshots
├── .github/workflows/            # CI/CD: nextjs.yml, docker-ci.yml (Docker build & health check)
├── .husky/                       # Pre-commit: lint-staged → ESLint + type-check
├── Dockerfile                    # Multi-stage: Node 22 build → Node 22 fullstack runner (with SQLite)
├── docker-compose.yml            # Docker Compose config (port 3000, volume ./data:/app/data)
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint flat config: next/core-web-vitals
├── postcss.config.mjs            # Tailwind v4 PostCSS plugin
├── components.json               # shadcn/ui config (new-york, TSX, RSC)
└── package.json                  # Node >= 22.0.0, dependencies & scripts
```

## WHERE TO LOOK

| Task                     | Location                                                                | Notes                                                |
| ------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| Fund valuation logic     | `app/api/fund.ts`                                                       | JSONP to 天天基金, script injection to 腾讯财经      |
| Main UI orchestration    | `app/page.tsx`                                                          | Coordinates hooks, views, and modal dispatcher       |
| Modal rendering layer    | `app/components/ModalsLayer.tsx`                                        | All modal rendering centralized from page.tsx        |
| Fund card display        | `app/components/FundCard/index.tsx`                                     | Individual fund card with holdings                   |
| Desktop table            | `app/components/PcFundTable.tsx`                                        | PC-specific table layout                             |
| Mobile table             | `app/components/MobileFundTable.tsx`                                    | Mobile-specific layout, swipe actions                |
| Holding calculations     | `app/page.tsx`                                                          | Profit/loss computation                              |
| SQLite persistence       | `app/lib/sqliteDb.ts`, `app/api/sync/route.ts`                          | Node native `node:sqlite` DB & auto-sync API         |
| Privacy password & lock  | `app/lib/auth.ts`, `app/api/auth/route.ts`, `LockScreen.tsx`            | Access password verification and screen lock         |
| Trading/DCA              | `app/components/TradeModal.tsx`, `DcaModal.tsx`                         | Buy/sell, dollar-cost averaging                      |
| Fund fuzzy search        | `app/hooks/useFundFuzzyMatcher.ts`                                      | Fuse.js based name/code matching                     |
| AI holdings extraction   | `app/api/ai/parse/route.ts`, `useScanImport.ts`                         | Client Tesseract.js / Server OpenAI-compatible LLM   |
| Valuation intraday chart | `app/lib/valuationTimeseries.ts`                                        | Time-series valuation caching                        |
| Trading calendar         | `app/lib/tradingCalendar.ts`                                            | Chinese holiday detection via CDN                    |
| Request caching          | TanStack Query (`app/lib/get-query-client.ts`, `app/lib/query-keys.ts`) | Dedup + staleTime/gcTime                             |
| UI primitives            | `components/ui/`                                                        | shadcn/ui — accordion, dialog, drawer, select, etc.  |
| Global styles            | `app/globals.css`                                                       | CSS variables, glassmorphism, responsive             |
| CI/CD                    | `.github/workflows/docker-ci.yml`, `nextjs.yml`                         | Docker container test & Next.js build verification   |
| Docker                   | `Dockerfile`, `docker-compose.yml`                                      | Multi-stage Node 22 build with SQLite persistence    |
| Data schema              | `doc/localStorage 数据结构.md`                                          | Documentation of stored data shapes                  |

## CONVENTIONS

- **TypeScript Standard** — Full TypeScript (`.tsx`/`.ts`) across UI components, layout, and pages. `tsx: true` in shadcn config.
- **No src/ directory** — app/, components/, lib/ at root level.
- **Fullstack Node 22** — Node 22 built-in `node:sqlite` for server-side persistence; static export is only triggered when `STATIC_EXPORT=true`.
- **JSONP + script injection** — all external financial API calls bypass CORS via `<script>` tags, not fetch().
- **Unified Data Access** — **Strict Requirement**: ALL data reads and writes MUST go through `storageStore` (or `useStorageStore` in React). Never use `window.localStorage` directly for business data to ensure state synchronization, SQLite automatic persistence, and data integrity.
- **Page Orchestration** — `app/page.tsx` acts as the main SPA orchestrator, coordinating hooks, sub-views, and `ModalsLayer`.
- **Dual responsive layouts** — `PcFundTable` and `MobileFundTable` switch at 640px breakpoint.
- **shadcn/ui conventions** — new-york style, CSS variables enabled, Lucide icons, path aliases (`@/components`, `@/lib/utils`).
- **Linting & Type-checking** — ESLint + `npm run type-check` + lint-staged on pre-commit.
- **Lodash for type checks** — 数据类型判断必须全部使用 lodash 方法（如 `isFunction`, `isObject`, `isString`, `isNumber`, `isBoolean`, `isArray`, `isNil`, `isEqual` 等），禁止使用原生 `Array.isArray` 和 `typeof` 判断数据类型（注意：检测全局环境对象如 `window`, `document`, `process`, `Intl`, `fetch` 等是否未定义时，为避免 ReferenceError 允许保留原生 `typeof === 'undefined'` 判断）。
- **React Compiler** — `reactCompiler: true` in next.config.ts (auto-memoization).
- **单位规范（px/rem）** — PC 端（`> 640px`）使用 `px`；全局（media query 外）的 `px` 由 `postcss-pxtorem`（`rootValue: 16`，`mediaQuery: false`）自动转换为 `rem`，PC 端 `html { font-size: 16px }` 保证 rem 与原 px 视觉完全一致。`@media (max-width: 640px)` 块**内**的 `px` 保留不转。移动端 `html { font-size: clamp(13px, 3.84vw, 16px) }` 让全局 rem 值随视口弹性缩放。`1px` 边框（`minPixelValue: 2`）保留为 px。如需阻止某个值被转换，使用大写 `PX` 书写。
- **Modal 写法规范** — 所有弹框统一按以下规则组织：
  1. **Modal state 归 Zustand** — 弹框开关状态、参数、data 全部放在 `app/stores/modalStore.ts` 的 Zustand store 中。不要在 page.tsx 中用 `useState` 管理弹框状态。
  2. **所有弹框渲染集中在 ModalsLayer** — 新增弹框在 `app/components/ModalsLayer.tsx` 中渲染，不放在 page.tsx。ModalsLayer 订阅 `useModalStore`，弹框开关时仅 ModalsLayer 重渲染，不触发 page.tsx 主体。
  3. **page.tsx 不订阅 modal state** — 弹框使用过程中需要的 page 级变量（callbacks、数据、refs）统一通过 `modalCbRef`（`useRef({})`）传递。page.tsx 中如需在 handler 中读取 modal state（如 `tradeModal.groupId`），使用 `useModalStore.getState().xxx` 而非 `useModalStore((s) => s.xxx)`（不订阅）。
  4. **低频弹框懒加载** — 低频弹框使用 `dynamic(() => import(...), { ssr: false })`。高频弹框静态 import。
  5. **setter 直接操作 Zustand** — 弹框 close handler 使用 `useModalStore.setState` / `useModalStore.getState` 直接读写 store，不走 page.tsx 的 setState。
  6. **弹框访问 page 级 function** — 通过 `cb.current.handleXxx` 调用。
- **Safari Input Zoom 防治规范** — 开发 `<input>`、`<Input>` 或任何可聚焦的输入组件时，务必确保其在移动端（或全局）的 `font-size` 计算值不小于 `16px`。应使用 `text-[16PX]`（大写 PX 以避免被插件转换为 rem）来强制规定字体大小，从而禁用 Safari 的自动缩放行为。

## COMMANDS

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run type-check       # Type check
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix

# Docker
docker compose up -d --build                                    # Build & run with compose
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data real-time-fund  # Run manually with volume mount

# Environment
cp env.example .env.local   # Copy template, fill optional values
```

## NOTES

- **Fund code format**: 6-digit numeric codes (e.g., 110022). Stored in `localFunds`.
- **Data sources**: 天天基金 (valuation JSONP), 东方财富 (holdings HTML parsing), 腾讯财经 (stock quotes script injection).
- **Node requirement**: >= 22.0.0 (required for built-in `node:sqlite`).
- **License**: AGPL-3.0 — derivative works must be open-sourced under same license.
- **Chinese UI** — all user-facing text is Chinese (zh-CN).
