# Real-Time Fund Valuation (养基场 / FundFarm)

## Project Overview

This is a **Next.js (App Router)** based real-time mutual fund valuation and portfolio tracking application. It utilizes a **Glassmorphism** UI design and is fully responsive for both mobile and PC. The project is built with **TypeScript (TSX)** and **shadcn/ui** components.

### Key Features & Architecture
- **Offline-First & SQLite Persistence**: Uses `localStorage` combined with Node 22 native `node:sqlite` (`./data/fund.db`) via `/api/sync` for dual-layer persistence and multi-device LAN auto-save.
- **Privacy Lock System**: Built-in access password protection and screen lock (`/api/auth`), intercepting unauthorized requests with 401.
- **CORS Bypass via JSONP**: Fetches financial data directly from Chinese financial APIs (Eastmoney, Tencent, Tiantian Fund) using JSONP and `<script>` tag injection to avoid CORS restrictions in the browser.
- **Image/OCR Integration**: Uses client-side `tesseract.js` for on-device OCR or server-side `/api/ai/parse` compatible with OpenAI / DeepSeek / SiliconFlow models to analyze and import fund holdings from screenshots.
- **Tech Stack**: Next.js 16 (App Router, Full TypeScript), React 18, React Query, Zustand, Tailwind CSS v4, Framer Motion, and shadcn/ui components.

## Building and Running

### Prerequisites
- Node.js >= 22.0.0 (required for native `node:sqlite`)
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
3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

### Production Build
```bash
npm run build
```

### Docker
The project includes a multi-stage `Dockerfile` and `docker-compose.yml` based on Node 22 Alpine:
- **Run via Docker Compose**:
  ```bash
  docker compose up -d --build
  ```
- **Run container manually**:
  ```bash
  docker build -t real-time-fund .
  docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name real-time-fund real-time-fund
  ```

## Development Conventions

- **Language**: TypeScript (`.ts`, `.tsx`) for all UI and page components, with strict type-checking.
- **Formatting & Linting**: 
  - Code is verified via `npm run type-check` and linted via ESLint. Use `npm run lint` and `npm run lint:fix`.
  - The project uses `husky` and `lint-staged` to enforce linting on commits.
- **State Management**:
  - `localStorage` is tightly coupled with React state via `storageStore` which manages local persistence and automatically syncs to SQLite via `/api/sync`.
  - Complex state, such as real-time pricing and query caching, is handled by **React Query** (`app/api/fund.ts`).
- **Styling**: Relies heavily on native CSS variables (e.g., `globals.css`) alongside Tailwind CSS utilities for layout and layout components.
- **Data Integrity**: When working with the synchronization engine (`app/page.tsx`), be extremely careful with merges. Complex structures (like `holdings`, `transactions`, `fundDailyEarnings`) require precise deep-merges or latest-write-wins strategies using unique IDs or timestamps rather than shallow overwrites.