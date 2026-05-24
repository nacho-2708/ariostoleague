# Notebook — Ariosto League

Cuadernola viva del proyecto. No es documentación, es el lugar donde caen las cosas que no caben en otro lado: deuda técnica detectada, decisiones tomadas con su porqué, ideas a explorar, gotchas del stack.

**Cómo usar este archivo:**
- Cada sección tiene su propio criterio (ver más abajo).
- Cuando algo de acá se resuelva, se mueve a "Resueltas" con la fecha.
- Si una sección crece demasiado, se rompe en otro archivo (ej: `NOTEBOOK-decisiones.md`).
- Si pasan 6 meses y una entrada sigue ahí sin moverse, probablemente no era importante. Borrala sin culpa.

---

## 🔧 Deuda técnica conocida

Cosas que funcionan pero deberían arreglarse en algún momento. No urgentes.

- **`src/lib/stats/manager-compare.ts` líneas 184-200** — Fallback de defensa redundante: si `scope === "season"` y hay exactamente 1 season sin fixtures, intenta llamar a la API. Pero la API solo devuelve la current season, así que si la pedida no es la current, no trae nada útil. Probablemente código muerto. Revisar y simplificar cuando se toque ese archivo. _Detectado: 2026-05-24._

- **Comillas mezcladas en `src/lib/stats/manager-compare.ts`** — Línea 184 usa dobles, el resto simples. Cosmético, Prettier/ESLint debería normalizar. Verificar que la config esté activa. _Detectado: 2026-05-24._

- **SQL schemas sueltos en `archivos/`** — No hay sistema de migraciones versionado (Supabase CLI). Si la DB de Supabase diverge de los .sql del repo, no hay forma de reproducirla. Migrar a Supabase CLI cuando el schema se estabilice. _Detectado: 2026-05-24._

---

## 🧭 Decisiones tomadas

Decisiones de diseño/arquitectura/proceso, con su porqué. Esto es lo más valioso del notebook a 6 meses vista — te recuerda p-05-24 — Consolidar documentación en un solo `CLAUDE.md`** — Tener `.cursorrules` + `CLAUDE.md` + `AGENTS.md` se contradecía solo. Migrado todo a `CLAUDE.md`; lo viejo archivado en `archivos/legacy/`. Razón: una sola fuente de verdad para Claude Code y Cursor.

- **2026-05-24 — Mergear branch `2026-04-07-wond` a main directamente** — La branch tenía 4 commits de trabajo continuo (stats subnav + helpers), sin trabajo paralelo en main. Merge fast-forward, sin conflictos. Razón: cerrar el ciclo abierto antes de seguir.

---

## ⚠️ Gotchas del stack

Cosas no obvias de las herramientas que usamos. Esto sirve para no volver a tropezar con la misma piedra.

- **Next 16 tiene breaking changes respecto al training de Claude por defecto.** Cuando Claude Code (o cualquier instancia de Claude) toque routing, server components, async params, o cualquier API de Next, hay que pedirle explícitamente que consulte los docs locales en `node_modules/next/dist/docs/`. Esto está en `CLAUDE.md` pero lo repetim fuente de bugs más probable del proyecto.

- **Supabase free tier pausa proyectos después de 7 días de inactividad.** Si dejás de tocar el proyecto una semana, hay que ir al dashboard a reanudarlo manualmente. No es destructivo (los datos siguen), pero molesta.

- **El contador de uso de Claude Code tiene lag.** No confiar en el porcentaje como señal precisa. Usar `/compact` proactivamente antes de que se vea crítico.

---

## 💡 Ideas a explorar

Cosas que no son tareas todavía. Si una idea pasa a ser tarea, se mueve al backlog real (issues de GitHub, o donde corresponda).

_(vacío por ahora)_

---

## ❓ Preguntas pendientes

Cosas que necesito resolver pero no tengo respuesta todavía.

- **¿Por qué pasé de Next 15 a Next 16?** No me acuerdo si fue intencional o si `create-next-app` instaló Next 16 por defecto cuando creé el proyecto. No es problema, pero queda la duda. _Anotado: 2026-05-24._

---

## ✅ Resueltas

Archivo histórico de cosas que estuvieron acá y se resolvieron. Útil o repetir discusiones.

_(vacío por ahora)_
