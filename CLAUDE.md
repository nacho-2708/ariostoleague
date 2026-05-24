# CLAUDE.md — Ariosto League

Instrucciones operativas para Claude Code y Cursor cuando trabajan en este proyecto. Si sos una instancia de Claude leyendo esto, este es tu briefing.

---

## Qué es este proyecto

**Ariosto League** es una plataforma web para una liga privada de Fantasy Premier League (FPL) Draft de 12 managers, con 4 temporadas de historia. Tres módulos principales:

1. **Stats & resultados** — dashboards, perfiles de manager, rankings históricos
2. **Comunidad** — discusión atada a cada gameweek
3. **Asistente de CM para Instagram** — generación de posts semanales

La liga corre en modo Draft oficial de FPL (head-to-head privado). Datos históricos en Excel; datos de la temporada actual vía FPL Draft API.

---

## Stack real (actualizado 2026-05-24)

- **Next.js 16.2.2** con App Router y TypeScript
- **React 19.2.4**
- **Tailwind CSS 4** con tw-animate-css
- **shadcn/ui** configurado (estilo radix-nova), aunque por ahora solo `button.tsx` instalado
- **Supabase** con las 3 capas configuradas:
  - `src/lib/supabase/admin.ts` — service role (server-side, operaciones privilegiadas)
  - `src/lib/supabase/server.ts` — SSR (server components, route handlers)
  - `src/lib/supabase/client.ts` — browser
- **Vercel** para deploy (a configurar / verificar)
- **FPL Draft API** vía helpers en `src/lib/fpl-*.ts`

---

## ⚠️ Regla crítica: Next 16

Este proyecto usa **Next.js 16**, que tiene breaking changes respecto al conocimiento de Claude por defecto (que cubre versiones anteriores). Antes de tocar cualquier API de Next.js (routing, server components, async params, middleware, headers/cookies, etc.):

1. **Consultá los docs locales** en `node_modules/next/dist/docs/` ANTES de escribir código
2. Si no estás seguro de una API, decilo explícitamente y verificá
3. NO asumas que algo funciona como en Next 14 o 15

Esta es la fuente de bugs más probable del proyecto. Tomarse 30 segundos para verificar > 30 minutos debuggeando.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (shell)/              # Grupo de rutas con layout compartido (header + tabs)
│   │   ├── standings/        # Tabla de posiciones
│   │   ├── fixtures/[gw]/[match]/   # Fixtures por gameweek
│   │   ├── managers/[alias]/ # Perfiles de manager
│   │   ├── stats/            # /stats redirige a /stats/records
│   │   │   ├── records/
│   │   │   ├── players/
│   │   │   └── compare/
│   ├── api/
│   │   └── sync/route.ts     # POST protegido con SYNC_SECRET
│   ├── page.tsx              # Redirige a /standings
│   └── layout.tsx            # Fuentes (Plus Jakarta Sans + DM Mono) + metadata
├── components/
│   ├── ui/                   # shadcn components
│   ├── stats/                # Components específicos de stats
│   └── ...                   # Components compartidos (header, mobile-tabs, etc.)
└── lib/
    ├── fpl-*.ts              # Integración con FPL Draft API
    ├── stats/                # Lógica de stats (manager-compare, api-fixtures, etc.)
    └── supabase/             # 3 clientes + helpers
```

Schemas SQL viven sueltos en `archivos/` (no hay Supabase CLI migrations todavía — ver NOTEBOOK.md).

---

## Variables de entorno

`.env.local` debe contener:

- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — clave pública de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — clave de servicio (NUNCA exponer al cliente)
- `SYNC_SECRET` — token para autenticar el endpoint `/api/sync`

---

## Comandos

```bash
npm run dev      # Dev server (Next 16 con Turbopack por defecto)
npm run build    # Build de producción
npm run lint     # ESLint
```

Para sincronizar datos desde FPL Draft API:
```bash
curl -X POST http://localhost:3000/api/sync -H "Authorization: Bearer $SYNC_SECRET"
```

---

## Cómo trabajar en este repo

**Antes de empezar cualquier tarea:**
1. Leé `NOTEBOOK.md` — ahí están las decisiones tomadas, deuda técnica conocida y gotchas
2. Si la tarea toca Next.js APIs, consultá `node_modules/next/dist/docs/` (ver regla crítica arriba)
3. Si la tarea toca el schema de Supabase, revisá los SQL en `archivos/`

**Convenciones:**
- TypeScript estricto. Si algo es `any`, dejalo marcado con un comentario.
- Imports con alias `@/` (apunta a `src/`).
- Componentes en PascalCase, helpers en camelCase, archivos de helpers en kebab-case.
- Server components por defecto. Solo usar "use client" cuando hay interactividad real.

**Git workflow:**
- Trabajar directo en `main` mientras el proyecto sea solo de Nacho
- Commits descriptivos en inglés con prefijos: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Si una tarea es grande o experimental, crear una branch con formato `YYYY-MM-DD-descripcion`

**Cuando encuentres algo raro:**
- Deuda técnica → anotar en `NOTEBOOK.md` sección "Deuda técnica conocida"
- Decisión tomada que no es obvia → anotar en `NOTEBOOK.md` sección "Decisiones tomadas"
- Gotcha del stack → anotar en `NOTEBOOK.md` sección "Gotchas del stack"

---

## Estado actual del proyecto (2026-05-24)

Lo que está hecho:
- Scaffolding completo de Next + Tailwind + shadcn + Supabase (3 capas)
- Rutas: standings, fixtures, managers, stats (con compare/players/records), forum
- Integración con FPL Draft API (sync route protegida)
- Datos históricos importados a Supabase desde Excel (vía SQL sueltos en `archivos/`)
- Components de UI básicos: header, mobile-tabs, season-selector, standings-table, manager-charts
- Workflow CI de keep-alive para Supabase (`.github/workflows/supabase-keepalive.yml`) que pinguea la DB lunes y jueves para evitar el pause del free tier
- Template `.env.local.example` para que `cp .env.local.example .env.local` del README funcione

Lo que queda:
- Verificar costos operativos de Supabase (plan free tier confirmado activo al 2026-05-24)
- Definir si migrar SQL sueltos a Supabase CLI migrations
- Completar módulo de Foro
- Construir asistente de CM para Instagram (módulo 3)
- Refinamiento de UI / pulir páginas existentes
- Completar `team_name` para las temporadas faltantes en `team_seasons` (solo 24 / hasta 60 rows pobladas)

---

## Archivos legacy

`.cursorrules` y `AGENTS.md` viejos están en `archivos/legacy/`. NO editar, solo referencia histórica.
