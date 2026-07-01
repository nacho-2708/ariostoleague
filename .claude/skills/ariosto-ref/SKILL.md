---
name: ariosto-ref
description: Referencia del schema de Supabase y de la FPL Draft API de Ariosto League — tablas, columnas, relaciones, endpoints, y el mapa de qué función de src/lib hace qué. Use antes de escribir o leer código que toque la base de datos, la API de FPL, o cualquier archivo de src/lib/**, para no tener que re-descubrir el schema greppeando archivos/*.sql cada vez.
---

# Ariosto League — referencia de datos

Repo: `/Users/ignacioferrer/Proyectos/ariostoleague`. Esta skill es solo de **lectura/consulta** — un mapa para orientarse rápido, no reemplaza leer el archivo real antes de editarlo. El schema vive suelto en `archivos/*.sql` (no hay Supabase CLI migrations todavía); si algo acá no coincide con lo que ves en el código, confiá en el código y avisá para corregir esta skill.

## Schema de Supabase

Fuente: `archivos/schema.sql` (core) + `archivos/schema_players.sql` (jugadores). RLS en todas las tablas: lectura pública, escritura solo con `SUPABASE_SERVICE_ROLE_KEY` (cliente admin).

```
managers
  id, full_name, alias (unique)

seasons
  id, name (unique, "2023/24"), start_year, end_year,
  is_current (bool), has_full_data (bool — false = solo campeón, sin partidos),
  champion_id → managers.id

team_seasons
  id, manager_id → managers.id, season_id → seasons.id,
  team_name, unique(manager_id, season_id)

fixtures
  id, season_id → seasons.id, gameweek (null en datos históricos viejos),
  manager1_id / manager2_id → managers.id, score1, score2
  check: manager1_id != manager2_id

players
  id, name, position ('GKP'|'DEF'|'MID'|'FWD'), club, fpl_code (int, para fotos)
  unique(name, position, club)

player_gameweeks
  id, player_id → players.id, manager_id → managers.id, season_id → seasons.id,
  gameweek (1-38), is_starter,
  minutes, goals, assists, clean_sheet, goals_conceded, own_goals,
  penalties_saved, penalties_missed, yellow_cards, red_cards, saves, bonus, bps,
  influence, creativity, threat, ict_index,
  expected_goals, expected_assists, expected_goal_involvements, expected_goals_conceded
  unique(player_id, manager_id, season_id, gameweek)
```

**Estado real de los datos por temporada** (auditado 2026-06-28, ver NOTEBOOK.md si querés la foto completa):

| Temporada | is_current | has_full_data | fixtures | player_gameweeks | team_seasons |
|---|---|---|---|---|---|
| 2025/26 | false (finalizada) | true | sí | completo (38 GW) | sí |
| 2024/25 | false | true | sí | completo (38 GW) | sí |
| 2023/24 | false | true | sí | **vacío** | sí |
| 2022/23 | false | false | no | no | no |
| 2021/22 | false | false | no | no | no |

Cualquier función que agregue stats de jugador (`player_gameweeks`) debe degradar con gracia (devolver `null`/vacío, no romper) para 21/22, 22/23 y 23/24 — ver `src/lib/stats/season-awards.ts` como ejemplo del patrón.

## FPL Draft API

Base: `https://draft.premierleague.com/api` — pública, sin auth. `LEAGUE_ID = 1722`.

| Endpoint | Qué trae | Se usa en |
|---|---|---|
| `/league/1722/details` | standings + fixtures + league_entries (temporada en vivo) | `fpl-api.ts` |
| `/game` | GW actual, si terminó, próxima GW | `fpl-api.ts` (`getGameInfo`) |
| `/bootstrap-static` | catálogo de jugadores PL + equipos | `fpl-sync.ts` |
| `/event/{gw}/live` | stats reales de jugadores en esa GW (indexado por element id) | `fpl-sync.ts` |
| `/entry/{entry_id}/event/{gw}` | picks de un manager en esa GW (pos 1-11 titular, 12-15 banco) | `fpl-sync.ts` |

### ⚠️ Gotcha grande: dos IDs distintos para la misma persona

La API usa **dos namespaces de ID diferentes** para cada manager, según la familia de endpoint:

- **`league_entry` id** (endpoints `/league/{id}/details`) → mapeado en `ENTRY_ALIAS` dentro de `src/lib/fpl-api.ts`.
- **`entry` id** (endpoints `/entry/{entry_id}/...`, para picks) → mapeado en `ENTRY_ID_TO_ALIAS` dentro de `src/lib/fpl-sync.ts`.

Son números parecidos pero **no intercambiables** (ej. RG es `5644` en un mapa y `5642` en el otro). Si necesitás agregar un manager nuevo o depurar un alias mal mapeado, tocás los DOS mapas, no uno.

### Otros gotchas de la API

- `getGameInfo().nextGw` puede venir `null` cuando la temporada terminó y la próxima todavía no arrancó (la API real lo hace, aunque durante un tiempo el tipo TS decía lo contrario — ya corregido). No asumas que siempre es un número.
- Cuando la API rota a la temporada siguiente, los datos de la temporada recién terminada dejan de estar disponibles — por eso el resync de una temporada cerrada hay que hacerlo con urgencia (ver NOTEBOOK.md, caso 25/26).
- Fotos de jugador: `fplPlayerPhotoUrl()` en `fpl-assets.ts` arma la URL con `elements[].code` del bootstrap (**no** con `element.id`).

## Mapa de `src/lib/**`

**FPL API / fixtures en vivo**
- `fpl-api.ts` — `getGameInfo()`, `getLeagueStandings()`, `getLeagueFixtures()`, helpers de alias↔slug.
- `fpl-points.ts` — `calcPuntosFantasy(stats, position)` (fórmula oficial FPL), `statLabels()`.
- `fpl-assets.ts` — `fplPlayerPhotoUrl(fplCode)`.
- `standings.ts` — `calcularTabla(fixtures, teamNames)`, tipos `StandingRow`/`FixtureRow`. Reusar esto en vez de reimplementar una tabla de posiciones.
- `historic-fixtures.ts` — fixtures agrupados por GW desde Supabase (temporadas históricas).
- `match-detail.ts` — `getMatchDetail()`, detalle de un partido con plantillas.

**Sync (escribe a Supabase, cliente admin)**
- `fpl-sync.ts` — `syncGW()`, `syncGWChecked()` (con chequeo de completitud), `syncAllGWs()`, `backfillFixtures()`, `backfillTeamSeasons()`, `finalizeSeason()`.
- `fpl-sync-guards.ts` — lógica pura testeable: `expectedRowsPerGW()`, `isGWComplete()`, `resolveUpTo()`, `summarizeReports()`.
- Ruta: `POST /api/sync` (protegida con `SYNC_SECRET`), consumida por estas funciones.

**Managers**
- `manager-stats.ts` — `getManagersOverview()` (grid), `getManagerProfile(alias)` (perfil individual con H2H, forma, gráficos).

**Stats (todas reciben `supabase: SupabaseClient` como parámetro, no lo crean)**
- `stats/player-leaderboards.ts` — `getPlayerLeaderboard(supabase, seasonId, position)`: rankings de jugadores por manager y liga.
- `stats/h2h-records.ts` — `getH2HRecords(supabase, { scope, seasonId })`: récords cabeza a cabeza, rachas, pares de managers.
- `stats/manager-compare.ts` — `getManagerCompare(...)`: comparador de dos managers.
- `stats/api-fixtures.ts` — `getApiStatsFixturesForCurrentSeason()`: fixtures en vivo con la misma forma que `fixtures` de Supabase, para que el resto de `stats/*` no tenga que distinguir origen. Ojo: fabrica un `id` sintético (`api-{gw}-{id1}-{id2}`) y un `created_at` falso que codifica la GW — es un truco, no un dato real.
- `stats/season-awards.ts` — premios de temporada (MVP, bota de oro, bestia negra, etc.), degradan a `null` sin datos.

**Home (capa de datos, sin UI)**
- `league-state.ts` — `getLeagueState()` (offseason/in_season), `getNextSeasonCountdown()`.
- `season-champions.ts` — `getSeasonChampion(seasonId)`, `getChampionsHistory()`.
- `home-ranking.ts` — `getHomeRankingHistorico()`.

**Supabase**
- `supabase/client.ts` — cliente browser.
- `supabase/server.ts` — cliente SSR (`createClient()` async, usa `cookies()` de `next/headers` — solo funciona dentro de una request de Next, no en un script standalone).
- `supabase/admin.ts` — `createAdminClient()`, service role, para escritura (sync).
- `supabase/fetch-all-range.ts` — `fetchAllWithRange()`: pagina con `.range()` para esquivar el cap de 1000 filas de PostgREST. Usar siempre que se traigan más de ~1000 filas de una tabla (típicamente `player_gameweeks`).

## Otros gotchas conocidos (ver NOTEBOOK.md para el detalle completo)

- **Cap de 1000 filas de Supabase `.select()`.** Nunca uses `.length` sobre un `.select()` sin paginar para contar — usa `count: 'exact', head: true` (contar) o `fetchAllWithRange()` (traer todo).
- **Next.js 16 tiene breaking changes** respecto al conocimiento por defecto. Antes de tocar routing/server components/params/cookies, consultá `node_modules/next/dist/docs/`.
- **`team_seasons` solo tiene filas para temporadas `has_full_data = true`** con datos completos (21/22 y 22/23 no tienen, son champion-only).
- **En temporada de receso (offseason), puede no haber NINGUNA fila con `is_current = true`** en `seasons` — no asumas que siempre hay una temporada "actual" marcada.
