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

- **~~2025/26 — `player_gameweeks` incompleto y con huecos.~~ RESUELTO 2026-06-28.** La temporada terminada tenía datos de jugador incompletos (el `count:exact` total daba 5760 < 6840 esperado). **Resuelto con el resync por tramos** tras el fix del pipeline — ahora las 38 GW tienen 180 filas exactas (6840 total). Ver Resueltas. _(Ojo: el desglose "por GW" del diagnóstico Fase 1 — {1,2,3,4,5,6,16,18} con filas 180→7 — estaba distorsionado por el cap de 1000 filas de Supabase en `.select()`; ver Gotchas. El total sí era correcto y la conclusión "incompleta" también.)_

- **`src/lib/stats/manager-compare.ts` líneas 184-200** — Fallback de defensa redundante: si `scope === "season"` y hay exactamente 1 season sin fixtures, intenta llamar a la API. Pero la API solo devuelve la current season, así que si la pedida no es la current, no trae nada útil. Probablemente código muerto. Revisar y simplificar cuando se toque ese archivo. _Detectado: 2026-05-24._

- **Comillas mezcladas en `src/lib/stats/manager-compare.ts`** — Línea 184 usa dobles, el resto simples. Cosmético, Prettier/ESLint debería normalizar. Verificar que la config esté activa. _Detectado: 2026-05-24._

- **SQL schemas sueltos en `archivos/`** — No hay sistema de migraciones versionado (Supabase CLI). Si la DB de Supabase diverge de los .sql del repo, no hay forma de reproducirla. Migrar a Supabase CLI cuando el schema se estabilice. _Detectado: 2026-05-24._

---

## 🧭 Decisiones tomadas

Decisiones de diseño/arquitectura/proceso, con su porqué. Esto es lo más valioso del notebook a 6 meses vista — te recuerda por qué hiciste lo que hiciste.

- **2026-05-24 — Consolidar documentación en un solo `CLAUDE.md`** — Tener `.cursorrules` + `CLAUDE.md` + `AGENTS.md` se contradecía solo. Migrado todo a `CLAUDE.md`; lo viejo archivado en `archivos/legacy/`. Razón: una sola fuente de verdad para Claude Code y Cursor.

- **2026-05-24 — Mergear branch `2026-04-07-wond` a main directamente** — La branch tenía 4 commits de trabajo continuo (stats subnav + helpers), sin trabajo paralelo en main. Merge fast-forward, sin conflictos. Razón: cerrar el ciclo abierto antes de seguir.

- **2026-07-01 — Capa de datos del Home separada de la UI, en 4 archivos por tema** (`src/lib/league-state.ts`, `season-champions.ts`, `stats/season-awards.ts`, `home-ranking.ts`). Razón: es el paso 1 de un pipeline de 4 pasos (ver tarjeta Notion "🧭 Home · orden de trabajo") donde el diseño visual todavía no existe — separar datos de UI deja esta capa reusable sin importar cómo termine viéndose el Home. "Bestia negra" (premio de temporada) exige mínimo 2 cruces entre el mismo par de managers para no premiar un enfrentamiento de un solo partido — umbral elegido, no medido.

- **2026-07-01 — Home implementado en dirección "Broadcast" (offseason)** — Paso 3 del pipeline. Página propia en `src/app/page.tsx` (antes redirigía a `/standings`), fuera del grupo `(shell)`, con su **propio chrome oscuro** (nav + footer Broadcast). El resto de la app mantiene el shell violeta claro; sólo se le agregó "Inicio" al `shell-header` y `mobile-tabs`, y el logo ahora apunta a `/`. El restyle Broadcast del shell completo queda **diferido al epic 4** (propagación), como sugiere el handoff. Tokens Broadcast (ink/blue/lime + fuentes Anton/Archivo/Space Grotesk) volcados a `globals.css` vía `@theme` y usables como utilidades Tailwind (`bg-ink`, `text-lime`, `font-display`). Componentes en `src/components/home/**`.

- **2026-07-01 — Propagación Broadcast · Fundación (kit + shell + superficie oscura)** — Paso 1 del epic de propagación. (a) Los 6 primitivos (`roundel`, `pill`, `eyebrow`, `block-head`, `club-crest`, `manager-photo`) se movieron de `src/components/home/` a **`src/components/broadcast/`** (kit compartido, importable por cualquier página); los componentes de *contenido* del Home quedan en `home/`. (b) Nace **`LeagueLogo`** (`broadcast/league-logo.tsx`): trae el logo real por convención de path (`/assets/logo/ariosto-league.svg`) y, si no existe, cae al wordmark "Ariosto League" en tipografía display. El logo real se instala **dropeando el archivo, sin tocar código**. El Roundel/León queda como primitivo **decorativo** (watermarks del Home), NO como logo oficial (el logo aún no está diseñado). (c) Shell (`shell-header`, `mobile-tabs`) reskineado a tokens Broadcast, coherente con `HomeNav`. El Home mantiene su `HomeNav` propia (landing); unificar navegación es discusión aparte.

- **2026-07-01 — Propagación Broadcast por página: Standings, Fixtures, Managers hechos; Stats pendiente** — Reskin del contenido de cada sección a superficie oscura (solo estilos, lógica/datos intactos). Standings fue el stress test (tabla densa) y aguantó. El **recetario de reskin** (claro→oscuro, cuándo lime vs blue, tipografía, primitivos, charts) quedó documentado en la nueva **skill `ariosto-ui`** (`.claude/skills/ariosto-ui/`) — leerla antes de reskinear. Falta **Stats** (`(shell)/stats/**` + componentes de leaderboards/compare/records): sigue en modo "isla" (clara sobre fondo oscuro, legible) hasta su tarjeta. Todo en la rama `2026-07-01-home-broadcast` / PR #1, sin mergear.

- **2026-07-01 — Superficie oscura: "islas claras sobre fondo oscuro" (decisión de Nacho)** — Al oscurecer la app apareció un problema de acoplamiento: las páginas de contenido están hechas con "texto oscuro sobre tarjetas blancas" y usan tokens semánticos compartidos, así que dar vuelta *todos* los tokens vuelve ilegible el texto dentro de las tablas (texto claro sobre tarjeta blanca). Solución elegida: **solo `--background` pasa a `ink`**; el resto de los tokens quedan claros → las tarjetas de contenido siguen legibles como "islas" hasta su reskin por página. Los **títulos `<h1>`/`<h2>` que quedaban sobre el fondo oscuro** (usaban `text-foreground` oscuro o heredaban el color → invisibles) se parchearon a `text-chalk`, y los kickers/labels bare a `text-gray`. Los `text-muted-foreground` (gris medio) quedan legibles sobre oscuro y no se tocaron. **Esto NO es el reskin del contenido** — cada página se oscurece de verdad en su tarjeta de reskin (Standings es la próxima). Ver `globals.css` (bloque `:root`) y `(shell)/layout.tsx` (wrapper `bg-background`).

- **2026-07-01 — Stat blocks del Hero: currículum all-time honesto, no stats de la temporada** — El mock del Hero muestra Puntos / Récord / Dif / Títulos de la temporada campeona, pero la capa de datos permitida (`getSeasonChampion`, `getHomeRankingHistorico`) **no expone** el récord/puntos/diferencia por temporada del campeón. En vez de inventar esos números (regla "no inventes campos" / honestidad de datos), el Hero muestra **% Vic histórico · PF prom. · Títulos** tomados de `getHomeRankingHistorico`. Si algún día se quiere el récord de la temporada, hay que agregar una función a la capa de datos, no hardcodearlo. Los primitivos `ClubCrest`/`ManagerPhoto` son placeholders (inicial/iniciales sobre chip de color de club en `src/lib/club-colors.ts`); swap-in de escudos/fotos reales sin tocar layout.

---

## ⚠️ Gotchas del stack

Cosas no obvias de las herramientas que usamos. Esto sirve para no volver a tropezar con la misma piedra.

- **Next 16 tiene breaking changes respecto al training de Claude por defecto.** Cuando Claude Code (o cualquier instancia de Claude) toque routing, server components, async params, o cualquier API de Next, hay que pedirle explícitamente que consulte los docs locales en `node_modules/next/dist/docs/`. Esto está en `CLAUDE.md` pero lo repetimos acá porque es la fuente de bugs más probable del proyecto.

- **Supabase free tier pausa proyectos después de 7 días de inactividad.** Si dejás de tocar el proyecto una semana, hay que ir al dashboard a reanudarlo manualmente. No es destructivo (los datos siguen), pero molesta.

- **El contador de uso de Claude Code tiene lag.** No confiar en el porcentaje como señal precisa. Usar `/compact` proactivamente antes de que se vea crítico.

- **`ls` no es lo mismo que `git ls-files`.** Un archivo puede existir en disco y NO estar trackeado por git si el `.gitignore` lo excluye. Para saber qué tiene git en el index, usar siempre `git ls-files`, no asumir desde `ls`. _Anotado: 2026-05-24._

- **Prompts con bloques grandes de texto literal se truncan.** Cuando el prompt incluye >30-40 líneas de contenido para escribir literal (especificaciones de archivos, plantillas), el contenido se trunca en uno o más puntos sin previo aviso. La forma de evitarlo es usar modo plan en Claude Code: el paso de planificación revisa el input antes de tocar archivos y detecta truncados. _Anotado: 2026-05-24._

- **`git check-ignore -v` exit code 0 no significa que el archivo esté ignorado.** El exit code es 0 cuando encuentra una regla aplicable, incluida una regla de negación (`!`). Para confirmar si un archivo está ignorado, mirar la regla que aparece en el output: si empieza con `!`, NO está ignorado. Verificación cruzada: `git status` — si aparece como "untracked", no está ignorado. _Anotado: 2026-05-24._

- **Supabase limita `.select()` a 1000 filas por defecto.** Un `.from(t).select("col").eq(...)` devuelve como máximo 1000 filas aunque haya más — sin error ni aviso. Si contás filas haciendo `.length` sobre eso, el número queda truncado en 1000 y es MENTIRA. Para contar usá `.select("*", { count: "exact", head: true })` (devuelve el count real sin traer filas); para traer más de 1000 filas, paginar con `.range()`. _Mordió el 2026-06-28: un script de verificación del resync contó 1000 y pareció que se habían perdido datos; en realidad estaban las 6840. El desglose "por GW" del diagnóstico Fase 1 también estaba distorsionado por esto (el total con count:exact sí era correcto)._

- **El sync de `player_gameweeks` falla en SILENCIO — por diseño, no por un bug puntual.** (Diagnóstico Fase 1 de la tarjeta de datos 25/26, 2026-06-28.) Cuatro capas que hacen que un sync incompleto se vea como éxito:
  1. **Sin chequeo de completitud.** `syncAllGWs(upTo)` (en `src/lib/fpl-sync.ts`) toma `upTo` de `getGameInfo().currentGw` (la GW actual en vivo de la FPL API), no de "la temporada tiene 38 GW". Nada compara lo guardado contra lo esperado (38 GW × ~180 filas). Una temporada a medio llenar es indistinguible de una completa.
  2. **Sin trigger automático.** El único workflow de CI es `supabase-keepalive` (pinguea la DB lun/jue); **no hay nada que llame a `/api/sync`**. El sync dependía de que Nacho corriera `curl` a mano. Cuando dejó de correrlo (~era GW18), los datos se congelaron. Esa es la causa próxima de que falten 19–38.
  3. **Errores por jugador/manager se tragan.** `fetchPicks` devuelve `null` en respuesta no-ok → se empuja un `error` string blando y se hace `continue` (no throw). Lo mismo `if (!element || !live) continue` y el `continue` del fallback de upsert de `players`. Esto explica el desangrado dentro de cada GW (180→179→171→75→28→7): fallos transitorios de la API que dropearon picks/managers sin avisar.
  4. **Señal de éxito engañosa.** El handler `POST /api/sync` (path `all`) devuelve `ok:true` + HTTP 200 aunque el array `errors` venga lleno o `playersUpserted` sea 0 para algunos managers. Quien mira solo el status ve verde.
  **Veredicto: SISTEMÁTICO, no puntual.** Antes de la Fase 2 (resync) hay que: (a) chequeo de completitud por GW (assert ~180 filas, fallar fuerte si falta); (b) hacer ruidosos los fallos (que `ok:false`/non-200 cuando una GW queda corta); (c) para temporada terminada, sincronizar rango fijo 1..38, no `currentGw`; (d) reintento ante fallos transitorios de `event/{gw}/live` y `entry/{id}/event/{gw}`. La fuente está viva hoy (`/game` = event 38 finished, `next_event:null`; `event/25/live` y `entry/5642/event/25` responden 200) pero la ventana se cierra cuando la API rote a 26/27. Nota: re-syncar GW1-6,16,18 es idempotente (upsert por `player_id,manager_id,season_id,gameweek`) y de paso completaría sus filas faltantes.
  **→ RESUELTO el 2026-06-28: las cuatro capas (a/b/c/d) ya están tapadas en el pipeline (ver Resueltas). Falta la Fase 2 (resync de las GW faltantes), que es otra tarjeta.**

- **La FPL Draft API usa DOS IDs distintos para el mismo manager, según la familia de endpoint.** El id que identifica a un manager en `/league/{id}/details` (mapeado en `ENTRY_ALIAS` dentro de `src/lib/fpl-api.ts`) NO es el mismo número que lo identifica en `/entry/{entry_id}/event/{gw}` (mapeado en `ENTRY_ID_TO_ALIAS` dentro de `src/lib/fpl-sync.ts`). Son valores parecidos pero no intercambiables (ej. RG es `5644` en un mapa y `5642` en el otro). Si se agrega un manager nuevo o se depura un alias mal mapeado, hay que tocar los DOS mapas. Documentado en detalle en la skill `ariosto-ref`. _Anotado: 2026-07-01, detectado armando esa skill._

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

- **2026-06-28 — Resync de la 25/26: las 38 GW de `player_gameweeks` completas.** Con el pipeline ya endurecido, se trajeron los datos de jugador faltantes corriendo `POST /api/sync {gw:N}` para N=1..38 **por tramos de 5** (un GW tarda ~37s; los 38 juntos exceden el límite de Vercel). Idempotente: re-correr GW ya presentes completó sus huecos sin duplicar. Resultado: **38/38 GW devolvieron 200 / 180 / complete en la primera pasada, sin un solo 422 ni reintento.** Verificación independiente desde la DB (con `count:exact`, no `.select()`): las 38 GW con 180 filas exactas, total **6840 = 38×180**. El chequeo de completitud del fix anterior fue lo que dio la confianza GW por GW. _(Local tardó ~23 min total. En Vercel habría que correrlo por tramos igual o subir `maxDuration`.)_

- **2026-06-28 — Fix del sync de `player_gameweeks` para que no falle en silencio.** Se taparon las 4 capas del fallo silencioso (diagnóstico arriba): **(a)** chequeo de completitud — tras sincronizar una GW se cuentan las filas REALMENTE guardadas en la DB (`countSavedRows`) y se comparan contra lo esperado (`EXPECTED_ROWS_PER_GW` = 12 mgr × 15 = 180); **(b)** fallos ruidosos — `POST /api/sync` ahora devuelve `ok:false` + HTTP 422 si alguna GW queda corta o hubo errores por manager (antes: `ok:true`/200 a ciegas); **(c)** rango fijo — temporada terminada (`is_current=false`) sincroniza 1..38 vía `resolveUpTo`, ya no depende de `getGameInfo().currentGw`; **(d)** reintentos — `fetchWithRetry` reintenta 5xx/red en `bootstrap`, `event/{gw}/live` y `entry/{id}/event/{gw}`, y un fallo transitorio persistente se registra como error (nunca se confunde con "sin datos"). Lógica pura aislada en `src/lib/fpl-sync-guards.ts` para testearla sin DB. **Validación:** 13 asserts unitarios (completitud, 422, rango fijo) con `node --experimental-strip-types`; happy-path real `POST /api/sync {gw:1}` → 200 `ok:true` 180/180; e input inválido `{gw:99}` → 500 con el error real (no silencio). NO se hizo el resync de las GW faltantes (es otra tarjeta). Archivos: `src/lib/fpl-sync.ts`, `src/lib/fpl-sync-guards.ts` (nuevo), `src/app/api/sync/route.ts`. **Heads-up para la tarjeta de resync:** un solo GW tardó ~40s local; los 38 en un request van a exceder el límite de funciones de Vercel → correr por tramos y/o subir `maxDuration`.

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
