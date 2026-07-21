# LitigApp — Frontend Web

Angular 20 frontend for LitigApp: SaaS that monitors Colombian court cases.

## Prerequisites

- Node.js 22+
- pnpm 11+
- (Mobile) Xcode 16+ (iOS) / Android Studio 2024+ (Android)

## Setup

```bash
pnpm install
```

## Commands

| Command | Description |
|---|---|
| `pnpm start` | Dev server at `http://localhost:4200` |
| `pnpm build` | Production build to `dist/` |
| `pnpm test` | Unit tests (Karma + ChromeHeadless, run-once) |
| `pnpm lint` | ESLint |
| `pnpm e2e` | Playwright E2E tests |
| `npx cap sync` | Sync build to iOS/Android after `pnpm build` |
| `npx cap open ios` | Open in Xcode |
| `npx cap open android` | Open in Android Studio |

## Tech Stack

Angular 20 standalone (zoneless) · TypeScript strict · Tailwind CSS v4 · lucide-angular · Capacitor 7 · PWA

## Architecture

```
src/app/
├── core/          # Singletons: auth, http, config
├── shared/
│   ├── ui/        # Pure presentational components
│   ├── util/      # Pipes, helpers
│   └── domain/    # Shared TypeScript types
├── data-access/   # HTTP services (no UI)
└── features/      # Self-contained screens
```

ESLint boundary rules enforce that layers don't import upward (see `eslint.config.js`).

## Environment

`src/environments/environment.ts` es **generado** por `scripts/set-env.js` en cada `pnpm start|build|test|lint` — no se versiona ni se edita a mano.

- **Local:** default `http://localhost:5119`. Override personal: `API_URL=http://otro-host:5119 pnpm start`
- **Prod (Vercel):** `API_URL` en el dashboard del proyecto.
- **Mobile:** `API_URL=https://<api-prod> pnpm build && npx cap sync`

## Build Order

This is **Step 14** (scaffolding). Subsequent steps:
- Step 15: Auth layout + JWT interceptor
- Step 16: Dashboard (Novedades / Procesos tabs)
- Step 17: Add process + import flows
- Step 18: Capacitor mobile packaging
