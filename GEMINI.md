# Real-Time Fund Valuation (基估宝)

## Project Overview

This is a **Next.js (App Router)** based real-time mutual fund valuation and portfolio tracking application. It utilizes a **Glassmorphism** UI design and is fully responsive for both mobile and PC. The project is built with **TypeScript (TSX)** and **shadcn/ui** components.

### Key Features & Architecture
- **Offline-First & Persistence**: Uses `localStorage` as the primary database for tracking user portfolios, watchlists, transaction histories, and DCA (Dollar-Cost Averaging) plans.
- **Optional Cloud Sync**: Integrates with **Supabase** (PostgreSQL, Auth, Edge Functions, Realtime) to synchronize data across multiple devices. Uses `update_user_config_partial` for incremental sync and `postgres_changes` for real-time broadcasts.
- **CORS Bypass via JSONP**: Fetches financial data directly from Chinese financial APIs (Eastmoney, Tencent, Tiantian Fund) using JSONP and `<script>` tag injection to avoid CORS restrictions in the browser.
- **Static Export**: The Next.js app is configured for static export (`output: 'export'`), making it highly portable and deployable via GitHub Pages or simple Nginx containers.
- **Image/OCR Integration**: Uses `tesseract.js` for on-device OCR or a Supabase Edge Function to analyze and import fund holdings from screenshots.
- **Tech Stack**: Next.js 16 (App Router), React 18, React Query, Zustand, Tailwind CSS v4, Framer Motion, shadcn/ui components, and Supabase.

## Building and Running

### Prerequisites
- Node.js >= 20.9.0
- npm

### Development
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables based on `env.example`:
   ```bash
   cp env.example .env.local
   ```
   *(Ensure you configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if testing cloud sync features).*
3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

### Production Build
Since the app uses `output: 'export'`, building it generates a static `out/` directory:
```bash
npm run build
```

### Docker
The project includes a `Dockerfile` for containerized deployments using Nginx.
- **Build image**:
  ```bash
  docker build -t real-time-fund .
  ```
- **Run container**:
  ```bash
  docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name real-time-fund real-time-fund
  ```
  *(Environment variables can also be injected at runtime using `-e` or `--env-file`).*

## Development Conventions

- **Language**: TypeScript (`.ts`, `.tsx`) for all UI and page components, with strict type-checking.
- **Formatting & Linting**: 
  - Code is verified via `npm run type-check` and linted via ESLint. Use `npm run lint` and `npm run lint:fix`.
  - The project uses `husky` and `lint-staged` to enforce linting on commits.
- **State Management**:
  - `localStorage` is tightly coupled with React state via a custom `storageHelper` (in `app/page.tsx`) which manages local persistence and orchestrates Supabase cloud syncing.
  - Complex state, such as real-time pricing and query caching, is handled by **React Query** (`app/api/fund.js`).
- **Styling**: Relies heavily on native CSS variables (e.g., `globals.css`) alongside Tailwind CSS utilities for layout and layout components.
- **Data Integrity**: When working with the synchronization engine (`app/page.tsx`), be extremely careful with merges. Complex structures (like `holdings`, `transactions`, `fundDailyEarnings`) require precise deep-merges or latest-write-wins strategies using unique IDs or timestamps rather than shallow overwrites.