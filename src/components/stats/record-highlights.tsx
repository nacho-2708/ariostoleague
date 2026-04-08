import type { H2HRecordsResult } from "@/lib/stats/h2h-records"
import { RecordsUiTooltip, StreakRowTooltip, H2hPairsTable } from "@/components/stats/records-ui-tooltip"

function Card({
  title,
  titleTooltip,
  children,
}: {
  title: string
  titleTooltip?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {titleTooltip ? (
            <RecordsUiTooltip label={titleTooltip}>
              <span className="cursor-default border-b border-dotted border-muted-foreground/50">{title}</span>
            </RecordsUiTooltip>
          ) : (
            title
          )}
        </p>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function MatchLine({ m }: { m: { seasonName: string; gameweek: number | null; alias1: string; alias2: string; score1: number; score2: number } }) {
  const gw = m.gameweek != null ? ` · J${m.gameweek}` : ""
  return (
    <p className="text-xs text-muted-foreground">
      {m.seasonName}
      {gw} · {m.alias1} {m.score1}-{m.score2} {m.alias2}
    </p>
  )
}

const TIP_BIGGEST_WIN =
  "Mayor diferencia de puntos fantasy entre los dos equipos en un solo duelo del período seleccionado (margen = valor absoluto de la diferencia)."
const TIP_HIGHEST_SINGLE =
  "Mayor puntuación fantasy obtenida por un manager en un único partido (el rival puede haber anotado más o menos)."
const TIP_COMBINED = "Suma más alta de puntos fantasy de ambos managers en el mismo duelo (anotación + anotación)."
const TIP_DRAW = "Empate con más puntos fantasy por bando: ambos equipos marcan el mismo total en ese partido."
const TIP_STREAKS_SECTION =
  "Racha máxima de victorias consecutivas según el orden cronológico de los partidos (jornada o fecha aproximada). Pasa el cursor por el icono junto al número para ver cada victoria."

export default function RecordHighlights({ data }: { data: H2HRecordsResult }) {
  const {
    biggestWin,
    highestSingleScore,
    highestCombined,
    highestScoringDraw,
    h2hPairs,
    longestWinStreaks,
    streaksApproximate,
  } = data

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {biggestWin && (
          <Card title="Mayor victoria (margen)" titleTooltip={TIP_BIGGEST_WIN}>
            <p className="text-2xl font-black tabular-nums text-foreground">+{biggestWin.margin} pts</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {biggestWin.winnerAlias} {biggestWin.winnerScore}-{biggestWin.loserScore} {biggestWin.loserAlias}
            </p>
            <MatchLine m={biggestWin.match} />
          </Card>
        )}

        <Card title="Mayor puntuación individual" titleTooltip={TIP_HIGHEST_SINGLE}>
          <p className="text-2xl font-black tabular-nums text-foreground">{highestSingleScore.points} pts</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {highestSingleScore.alias} vs {highestSingleScore.rivalAlias} ({highestSingleScore.rivalScore})
          </p>
          <MatchLine m={highestSingleScore.match} />
        </Card>

        <Card title="Partido con más puntos (suma)" titleTooltip={TIP_COMBINED}>
          <p className="text-2xl font-black tabular-nums text-foreground">{highestCombined.total} pts</p>
          <MatchLine m={highestCombined.match} />
        </Card>

        {highestScoringDraw ? (
          <Card title="Empate con más puntos" titleTooltip={TIP_DRAW}>
            <p className="text-2xl font-black tabular-nums text-foreground">
              {highestScoringDraw.points}-{highestScoringDraw.points}
            </p>
            <MatchLine m={highestScoringDraw.match} />
          </Card>
        ) : (
          <Card title="Empate con más puntos" titleTooltip={TIP_DRAW}>
            <p className="text-sm text-muted-foreground">No hay empates en el período seleccionado.</p>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <RecordsUiTooltip label={TIP_STREAKS_SECTION}>
            <span className="cursor-default border-b border-dotted border-muted-foreground/50">
              Racha de victorias (máx.)
            </span>
          </RecordsUiTooltip>
        </h2>
        {streaksApproximate && (
          <p className="mb-2 text-xs text-amber-700">
            Orden de jornadas aproximado en datos históricos sin GW en base de datos.
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {longestWinStreaks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos de rachas.</p>
          ) : (
            longestWinStreaks.map((s) => (
              <StreakRowTooltip
                key={s.alias}
                alias={s.alias}
                length={s.length}
                wins={s.wins}
                approximate={streaksApproximate}
              />
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <RecordsUiTooltip label="Cada fila es el duelo directo entre dos managers (orden alfabético de alias: Manager A antes que B). Columna A/E/B: victorias de A, empates, victorias de B. PF = puntos fantasy sumados en esos duelos. El detalle lista cada partido en orden cronológico.">
            <span className="cursor-default border-b border-dotted border-muted-foreground/50">
              Duelos H2H (todas las parejas)
            </span>
          </RecordsUiTooltip>
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {h2hPairs.length} parejas con al menos un partido en el período. Columna «A / E / B»: victorias A · empates ·
          victorias B.
        </p>
        <H2hPairsTable pairs={h2hPairs} />
      </div>

      <p className="text-xs text-muted-foreground">Partidos analizados: {data.fixtureCount}</p>
    </div>
  )
}
