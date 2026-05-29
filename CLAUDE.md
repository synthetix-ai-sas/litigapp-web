# LitigApp — Frontend Web

App Angular para LitigApp: SaaS que monitorea procesos judiciales en Colombia. El abogado ve un dashboard con novedades y su portafolio de procesos, importa por Excel, crea procesos manualmente y descarga PDFs.

## ⚠️ LO PRIMERO QUE DEBES HACER

Antes de escribir o diseñar cualquier cosa, lee estos archivos en orden:

1. `docs/blueprint.md` — **fuente de verdad completa** del sistema. Arquitectura, contratos de API, flujos, build order. NO empieces a codificar sin leerlo completo. Presta especial atención a las secciones 5 (API Design), 7 (Frontend Architecture) y 8 (Design System).
2. `docs/mockup.tsx` — **mockup visual aprobado**. Define el diseño, estructura de componentes y estilo que **DEBE seguirse**. No es una sugerencia, es el diseño aprobado. Es React pero se traduce 1:1 a Angular (Tailwind + lucide-angular).

Si algo que te pido contradice estos documentos, **detente y avísame antes de continuar**.

Este repo es **solo el frontend**. El backend (.NET) vive en un repo separado (`litigapp-backend`) y expone una API REST. Los contratos exactos están en la sección 5 del blueprint — consúmelos tal cual están definidos ahí. La base URL de la API se configura en `src/environments/`.

## Por dónde empezar

Sigue el **Build Order de la sección 11 del blueprint**, pasos frontend (Steps 14-18):
- Step 14: Scaffolding Angular 20 + Tailwind + Capacitor + ESLint boundaries.
- Step 15: Layout base + auth + interceptor JWT.
- Step 16: Dashboard (pestañas Novedades / Procesos).
- Step 17: Flujos de creación + importación.
- Step 18: Capacitor (empaque mobile).

Trabaja **incrementalmente**: completa y verifica un step antes de pasar al siguiente.

**Para construir UI usa el skill `/frontend-design`** — ayuda a producir interfaces de calidad alineadas al mockup.

## Commands

- `pnpm start` — dev server localhost:4200
- `pnpm build` — build prod a `dist/`
- `pnpm test` — unit tests (Vitest)
- `pnpm e2e` — Playwright
- `pnpm lint` — ESLint con boundaries de capas
- `npx cap sync` — sincronizar build a iOS/Android
- `npx cap open ios|android` — abrir en Xcode/Android Studio

## Tech Stack

Angular 20 standalone (zoneless) + TypeScript strict + Tailwind CSS v4 + lucide-angular + Capacitor 7 + PWA. Estado con Signals + RxJS (sin NgRx). Deploy en Vercel.

## Arquitectura — capas por carpeta con ESLint boundaries

- `core/` — singletons: auth, http interceptors, guards, config.
- `shared/ui/` — componentes puros sin estado (Button, Modal, Badge, Input, etc.).
- `shared/util/` — pipes, helpers, formatters.
- `shared/domain/` — interfaces/types compartidos (Process, User, Court).
- `data-access/` — servicios HTTP por feature. SIN componentes.
- `features/` — pantallas autocontenidas (auth, dashboard, process-add, process-import, process-detail, settings).

**Reglas de boundaries (ESLint las enforza, fallan el build si se rompen)**:
- `features` no se importan entre sí — solo vía `shared`.
- `shared/ui` y `shared/util` no importan `data-access` ni `features`.
- `data-access` no importa `features`.

### Data Flow
Componente (feature) → servicio (`data-access`) → `core/http/api-client` → API REST backend.
Estado local con `signal()`. Estado compartido en servicios singleton con signals.

## Design System (del mockup)

Tokens Tailwind: Primary 700 `#1d4ed8` (header), Primary 600 `#2563eb` (CTA), Background `#f8fafc`, Surface `#fff`, Border `#e2e8f0`, Text `#1e293b`, Muted `#64748b`. Warning amber-100/800, Success green-50/700, Danger red-50/700, Notif red-500.
Tipografía Inter. Radius: rounded-lg inputs/buttons, rounded-xl cards, rounded-2xl modales. Max-width 1280px. Ver sección 8 del blueprint para detalle completo.

## Detalles críticos de UX (del blueprint)

1. **Estado `partial` de proceso**: si `syncStatus != 'ok'`, mostrar banner "completando datos", deshabilitar "Descargar PDF", hacer polling cada 10s hasta `'ok'`.
2. **Bloqueo durante import**: mientras hay import activo (`GET /imports/active`), deshabilitar "Agregar Proceso" con tooltip. Banner global de progreso con polling cada 3s.
3. **Fin de import**: al detectar `status='completed'`, popup de resumen + redirigir a /processes + recargar lista.
4. **WhatsApp fuera del MVP**: NO mostrar toggle de WhatsApp en settings (o mostrarlo deshabilitado con "Próximamente").
5. **Mutación optimista** en "Marcar atendido".

## Code Organization Rules

1. **Standalone components**. Cero NgModules.
2. **Signals para estado, Observables solo para HTTP**.
3. **Reactive Forms** para todos los formularios (no Template-driven).
4. **Tailwind utility-first**: cero CSS custom salvo lo estrictamente necesario.
5. **lucide-angular para iconos**: no SVGs propios salvo el logo.
6. **ESLint boundaries activas desde el primer commit**.

## Reglas No Negociables

Ver sección 19 del blueprint. Las más importantes para frontend:

1. El mockup `docs/mockup.tsx` es la fuente de verdad visual.
2. Mobile = Angular + Capacitor, NO Ionic.
3. TypeScript strict.
4. ESLint boundaries no se saltan.
5. Respetar exactamente los contratos de API de la sección 5 del blueprint.
6. Partial sync UI guard: PDF deshabilitado + banner si `syncStatus != 'ok'`.
7. WhatsApp fuera del MVP en la UI.
