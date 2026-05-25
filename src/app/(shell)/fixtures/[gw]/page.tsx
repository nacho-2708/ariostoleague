import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getLeagueFixtures, getGameInfo, aliasToSlug } from "@/lib/fpl-api"
import { getHistoricGameweekGroups } from "@/lib/historic-fixtures"
import { createClient } from "@/lib/supabase/server"
import type { GameweekGroup } from "@/lib/fpl-api"

export default async function GameweekPage({
  params,
  searchParams,
}: {
  params: Promise<{ gw: string }>
  searchParams: Promise<{ season?: string }>
}) {
  const { gw: gwParam } = await params
  const { season: seasonParam } = await searchParams
  const gw = parseInt(gwParam, 10)

  if (isNaN(gw) || gw < 1 || gw > 38) notFound()

  const supabase = await createClient()
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, is_current")
    .eq("has_full_data", true)
    .order("start_year", { ascending: false })

  if (!seasons?.length) notFound()

  const selectedName = seasonParam ?? seasons[0].name
  const season = seasons.find((s) => s.name === selectedName) ?? seasons[0]

  let gwGroups: GameweekGroup[]
  let currentGw: number | null = null

  if (season.is_current) {
    const [groups, gameInfo] = await Promise.all([getLeagueFixtures(), getGameInfo()])
    gwGroups = groups
    currentGw = gameInfo.currentGw
  } else {
    gwGroups = await getHistoricGameweekGroups(season.id)
  }

  const group = gwGroups.find((g) => g.gw === gw)
  if (!group) notFound()

  const availableGws = new Set(gwGroups.map((g) => g.gw))
  const prevGw = gw > 1 && availableGws.has(gw - 1) ? gw - 1 : null
  const nextGw = gw < 38 && availableGws.has(gw + 1) ? gw + 1 : null
  const qs = `?season=${encodeURIComponent(season.name)}`
  const isCurrent = currentGw != null && gw === currentGw

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/fixtures${qs}`}
            className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Todos los fixtures
          </Link>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Temporada {season.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Jornada {gw}</h1>
        </div>

        <div className="flex items-center gap-2">
          {prevGw ? (
            <Link href={`/fixtures/${prevGw}${qs}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white shadow-sm transition-colors hover:bg-muted/40">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : <div className="h-9 w-9" />}
          <span className="min-w-[4rem] text-center text-sm font-semibold">GW {gw}</span>
          {nextGw ? (
            <Link href={`/fixtures/${nextGw}${qs}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white shadow-sm transition-colors hover:bg-muted/40">
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : <div className="h-9 w-9" />}
        </div>
      </div>

      {/* Badge estado */}
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        group.finished ? "bg-emerald-50 text-emerald-700"
          : isCurrent ? "bg-[#3e1a5b]/10 text-[#3e1a5b]"
          : "bg-muted text-muted-foreground"
      }`}>
        {group.finished ? "Jornada finalizada" : isCurrent ? "En curso" : "Pendiente"}
      </span>

      {/* Cards de partidos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.fixtures.map((f, idx) => {
          const win1 = f.score1 > f.score2
          const win2 = f.score2 > f.score1
          const draw = f.score1 === f.score2
          const matchSlug = `${aliasToSlug(f.team1_alias)}-vs-${aliasToSlug(f.team2_alias)}`
          const matchHref = group.finished
            ? `/fixtures/${gw}/${matchSlug}?s1=${f.score1}&s2=${f.score2}&t1=${encodeURIComponent(f.team1)}&t2=${encodeURIComponent(f.team2)}&season=${encodeURIComponent(season.name)}`
            : undefined

          const card = (
            <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
              group.finished ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-[#3e1a5b]/30" : ""
            } border-border`}>
              <div className="flex items-stretch">
                {/* Equipo 1 */}
                <div className={`flex flex-1 flex-col items-center justify-center px-4 py-5 text-center ${win1 && group.finished ? "bg-[#3e1a5b]/5" : ""}`}>
                  <span className="text-xs font-medium text-muted-foreground mb-1">{f.team1_alias}</span>
                  <span className={`text-sm font-semibold leading-tight ${group.finished && !win1 && !draw ? "text-muted-foreground" : "text-foreground"}`}>
                    {f.team1}
                  </span>
                  {group.finished && (
                    <span className={`mt-2 text-3xl font-black tabular-nums ${win1 ? "text-[#3e1a5b]" : "text-muted-foreground"}`}>
                      {f.score1}
                    </span>
                  )}
                </div>

                {/* Centro */}
                <div className="flex flex-col items-center justify-center border-x border-border px-3 py-5">
                  <span className="text-xs font-bold text-muted-foreground">
                    {group.finished ? "–" : "vs"}
                  </span>
                </div>

                {/* Equipo 2 */}
                <div className={`flex flex-1 flex-col items-center justify-center px-4 py-5 text-center ${win2 && group.finished ? "bg-[#3e1a5b]/5" : ""}`}>
                  <span className="text-xs font-medium text-muted-foreground mb-1">{f.team2_alias}</span>
                  <span className={`text-sm font-semibold leading-tight ${group.finished && !win2 && !draw ? "text-muted-foreground" : "text-foreground"}`}>
                    {f.team2}
                  </span>
                  {group.finished && (
                    <span className={`mt-2 text-3xl font-black tabular-nums ${win2 ? "text-[#3e1a5b]" : "text-muted-foreground"}`}>
                      {f.score2}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border bg-muted/30 px-4 py-2 text-center">
                {group.finished ? (
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {win1 ? `Victoria ${f.team1} · +${f.score1 - f.score2} pts`
                      : win2 ? `Victoria ${f.team2} · +${f.score2 - f.score1} pts`
                      : `Empate · ${f.score1} pts`}
                    <span className="ml-2 text-[#3e1a5b]">Ver detalle →</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Pendiente</span>
                )}
              </div>
            </div>
          )

          return matchHref ? (
            <Link key={idx} href={matchHref}>{card}</Link>
          ) : (
            <div key={idx}>{card}</div>
          )
        })}
      </div>
    </div>
  )
}
