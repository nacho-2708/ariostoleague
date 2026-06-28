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

- **2025/26 — `player_gameweeks` incompleto (8 de 38 GW).** La temporada está terminada (`is_current=false`, campeón RG) y tiene los 38 GW de fixtures (228 filas), pero `player_gameweeks` solo cubre 8 gameweeks distintos (GW1 a GW18, 5760 filas). La 24/25 sí tiene los 38 GW (6270 filas). El sync de datos de jugadores parece haberse cortado a mitad de temporada (~GW18). Hasta resolverlo, /stats y los perfiles de manager muestran la 25/26 con datos de jugador parciales. Arreglo: resync de las GW faltantes vía `/api/sync`. _Detectado: 2026-06-28 (auditoría de datos)._

- **`src/lib/stats/manager-compare.ts` líneas 184-200** — Fallback de defensa redundante: si `scope === "season"` y hay exactamente 1 season sin fixtures, intenta llamar a la API. Pero la API solo devuelve la current season, así que si la pedida no es la current, no trae nada útil. Probablemente código muerto. Revisar y simplificar cuando se toque ese archivo. _Detectado: 2026-05-24._

- **Comillas mezcladas en `src/lib/stats/manager-compare.ts`** — Línea 184 usa dobles, el resto simples. Cosmético, Prettier/ESLint debería normalizar. Verificar que la config esté activa. _Detectado: 2026-05-24._

- **SQL schemas sueltos en `archivos/`** — No hay sistema de migraciones versionado (Supabase CLI). Si la DB de Supabase diverge de los .sql del repo, no hay forma de reproducirla. Migrar a Supabase CLI cuando el schema se estabilice. _Detectado: 2026-05-24._

---

## 🧭 Decisiones tomadas

Decisiones de diseño/arquitectura/proceso, con su porqué. Esto es lo más valioso del notebook a 6 meses vista — te recuerda por qué hiciste lo que hiciste.

- **2026-05-24 — Consolidar documentación en un solo `CLAUDE.md`** — Tener `.cursorrules` + `CLAUDE.md` + `AGENTS.md` se contradecía solo. Migrado todo a `CLAUDE.md`; lo viejo archivado en `archivos/legacy/`. Razón: una sola fuente de verdad para Claude Code y Cursor.

- **2026-05-24 — Mergear branch `2026-04-07-wond` a main directamente** — La branch tenía 4 commits de trabajo continuo (stats subnav + helpers), sin trabajo paralelo en main. Merge fast-forward, sin conflictos. Razón: cerrar el ciclo abierto antes de seguir.

---

## ⚠️ Gotchas del stack

Cosas no obvias de las herramientas que usamos. Esto sirve para no volver a tropezar con la misma piedra.

- **Next 16 tiene breaking changes respecto al training de Claude por defecto.** Cuando Claude Code (o cualquier instancia de Claude) toque routing, server components, async params, o cualquier API de Next, hay que pedirle explícitamente que consulte los docs locales en `node_modules/next/dist/docs/`. Esto está en `CLAUDE.md` pero lo repetimos acá porque es la fuente de bugs más probable del proyecto.

- **Supabase free tier pausa proyectos después de 7 días de inactividad.** Si dejás de tocar el proyecto una semana, hay que ir al dashboard a reanudarlo manualmente. No es destructivo (los datos siguen), pero molesta.

- **El contador de uso de Claude Code tiene lag.** No confiar en el porcentaje como señal precisa. Usar `/compact` proactivamente antes de que se vea crítico.

- **`ls` no es lo mismo que `git ls-files`.** Un archivo puede existir en disco y NO estar trackeado por git si el `.gitignore` lo excluye. Para saber qué tiene git en el index, usar siempre `git ls-files`, no asumir desde `ls`. _Anotado: 2026-05-24._

- **Prompts con bloques grandes de texto literal se truncan.** Cuando el prompt incluye >30-40 líneas de contenido para escribir literal (especificaciones de archivos, plantillas), el contenido se trunca en uno o más puntos sin previo aviso. La forma de evitarlo es usar modo plan en Claude Code: el paso de planificación revisa el input antes de tocar archivos y detecta truncados. _Anotado: 2026-05-24._

- **`git check-ignore -v` exit code 0 no significa que el archivo esté ignorado.** El exit code es 0 cuando encuentra una regla aplicable, incluida una regla de negación (`!`). Para confirmar si un archivo está ignorado, mirar la regla que aparece en el output: si empieza con `!`, NO está ignorado. Verificación cruzada: `git status` — si aparece como "untracked", no está ignorado. _Anotado: 2026-05-24._

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

Archivo histórico de cosas que estuvieron acá y se resolvieron. Útil para auditoría y para no repetir discusiones.

- **2026-06-28 — Auditoría de datos reales por temporada (solo lectura).** Foto exacta de la DB, conteos por temporada:

  | Temporada | is_current | full_data | campeón | fixtures | player_gw (GW distintos) | team_seasons (nombres) |
  |---|---|---|---|---|---|---|
  | 2025/26 | false | true | RG | 228 | 5760 (8 GW: 1–18) | 12/12 |
  | 2024/25 | false | true | RG | 228 | 6270 (38 GW) | 12/12 |
  | 2023/24 | false | true | Papezar | 228 | 0 | 12/12 |
  | 2022/23 | false | false | Cunha | 0 | 0 | 0 |
  | 2021/22 | false | false | Marculi | 0 | 0 | 0 |

  Totales: 684 fixtures, 12030 player_gameweeks, 36 team_seasons, 12 managers, 522 players. **Cruce vs. esperado:** 2024/25, 2023/24, 2022/23 y 2021/22 coinciden con lo previsto. **Gap detectado:** 2025/26 con `player_gameweeks` parcial (ver Deuda técnica). **Hallazgo de proceso:** la tarjeta Notion "Finalizar temporada 2025/26" (Next) ya está satisfecha por los datos (is_current=false, campeón RG, 12 nombres) — la finalizó el commit `2eb00dd`; queda a criterio de Nacho cerrarla. Nota: el "24 vs 60" de team_seasons era falso problema y quedó confirmado: 36 filas (3 temporadas full-data × 12), todas con nombre.

- **2026-06-28 — Verificación end-to-end de la app (chequeo cero de Cimientos)** — `npm run dev` levanta limpio (Next 16.2.2 / Turbopack, ready en ~350ms). Las 4 páginas principales responden HTTP 200 y renderizan datos reales de Supabase: `/` → 307 a `/standings` (OK), `/standings`, `/fixtures`, `/managers`, `/stats/records` (aparecen nombres de managers/campeones: Intocables, Cunha, Marculi, RG, Bebito, Jagger). Sin overlay de error de Next, sin warnings en consola. **Hallazgo lateral:** el `NEXT_PUBLIC_SUPABASE_ANON_KEY` mide 46 chars (corto vs. el JWT clásico de ~200) — NO está truncado, es el formato nuevo de key publicable de Supabase; la conexión funciona, confirmado por los datos que cargan. Tarjeta Notion: "Verificar que la app corre end-to-end (npm run dev)".
