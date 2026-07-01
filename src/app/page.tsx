import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getLeagueState, getNextSeasonCountdown } from "@/lib/league-state"
import { getChampionsHistory, getSeasonChampion } from "@/lib/season-champions"
import { getHomeRankingHistorico } from "@/lib/home-ranking"
import {
  getSeasonBestGw,
  getSeasonBestiaNegra,
  getSeasonFarolilloRojo,
  getSeasonLongestStreak,
  getSeasonMVP,
  getSeasonTopAssister,
  getSeasonTopScorer,
} from "@/lib/stats/season-awards"
import HomeNav from "@/components/home/home-nav"
import HomeHero, { type HeroData, type HeroPill, type HeroStat } from "@/components/home/home-hero"
import BlockHead from "@/components/home/block-head"
import ChampionsStrip, { type ChampionCell } from "@/components/home/champions-strip"
import AwardsGrid, { type Award } from "@/components/home/awards"
import RankingTable from "@/components/home/ranking-table"
import HomeCloser from "@/components/home/home-closer"
import HomeFooter from "@/components/home/home-footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Ariosto League — Inicio",
}

// "2025/26" → "25/26"
function shortSeason(name: string): string {
  return name.length >= 4 ? name.slice(2) : name
}

// A partir de la última temporada ("2025/26") deriva la próxima ("2026/27" · "26 / 27").
function nextSeasonLabels(latestName: string | null): { name: string; label: string } {
  const startYear = latestName ? parseInt(latestName.slice(0, 4), 10) : NaN
  if (Number.isNaN(startYear)) return { name: "2026/27", label: "26 / 27" }
  const next = startYear + 1
  const endYY = String((next + 1) % 100).padStart(2, "0")
  return { name: `${next}/${endYY}`, label: `${String(next % 100).padStart(2, "0")} / ${endYY}` }
}

function crownWord(n: number): string {
  if (n === 2) return "Bicampeón"
  if (n === 3) return "Tricampeón"
  return `${n}× Campeón`
}

// Convierte el resultado de un premio (o null) en el view-model de la card.
function awardOrEmpty(label: string, award: Award | null): Award {
  return award ?? { label, crestAlias: null, who: "", value: "", empty: true }
}

export default async function HomePage() {
  const supabase = await createClient()

  const [leagueState, championsHistory, ranking] = await Promise.all([
    getLeagueState(),
    getChampionsHistory(),
    getHomeRankingHistorico(),
  ])

  // Última temporada de la historia (orden ascendente → última = la más nueva).
  const latest = championsHistory.length ? championsHistory[championsHistory.length - 1] : null
  const latestName = latest?.seasonName ?? leagueState.currentSeason?.name ?? null

  // Títulos de carrera por alias (para las estrellas de cada escudo).
  const careerTitles = new Map<string, number>()
  for (const c of championsHistory) {
    if (c.championAlias) careerTitles.set(c.championAlias, (careerTitles.get(c.championAlias) ?? 0) + 1)
  }

  // ── Hero: último campeón ──────────────────────────────────────────────
  const heroChampion = latest ? await getSeasonChampion(latest.seasonId) : null
  const heroAlias = heroChampion?.championAlias ?? null

  // Racha de títulos consecutivos que termina en la última temporada.
  const consecutive: string[] = []
  if (heroAlias) {
    for (let i = championsHistory.length - 1; i >= 0; i--) {
      if (championsHistory[i].championAlias === heroAlias) {
        consecutive.unshift(championsHistory[i].seasonName)
      } else {
        break
      }
    }
  }

  const heroRankingRow = heroAlias ? ranking.find((r) => r.alias === heroAlias) : undefined
  const heroTitles = heroAlias ? careerTitles.get(heroAlias) ?? 0 : 0

  const heroPills: HeroPill[] = []
  if (heroAlias) {
    heroPills.push({ label: "★ Campeón vigente", variant: "lime" })
    if (consecutive.length >= 2) {
      heroPills.push({
        label: `${crownWord(consecutive.length)} · ${consecutive.map(shortSeason).join(" · ")}`,
        variant: "ghost",
      })
    }
  }

  const heroStats: HeroStat[] = heroRankingRow
    ? [
        { k: "% Vic histórico", value: `${heroRankingRow.winPct}%` },
        { k: "PF prom.", value: `${heroRankingRow.avgPf}` },
        { k: "Títulos", value: `${heroTitles}`, stars: heroTitles, accent: true },
      ]
    : [{ k: "Títulos", value: `${heroTitles}`, stars: heroTitles, accent: true }]

  const statusLabel = leagueState.state === "offseason" ? "Finalizada" : "En curso"

  const hero: HeroData = {
    seasonName: latestName ? shortSeason(latestName) : null,
    statusLabel,
    teamName: heroChampion?.teamName ?? heroAlias ?? "Sin campeón",
    alias: heroAlias ?? "—",
    managerSubline: heroChampion?.championFullName
      ? `Manager · ${heroChampion.championFullName}`
      : "Manager",
    pills: heroPills,
    stats: heroStats,
    titles: heroTitles,
  }

  // ── Franja de campeones ───────────────────────────────────────────────
  const cells: ChampionCell[] = championsHistory.map((c, i) => ({
    season: shortSeason(c.seasonName),
    alias: c.championAlias,
    teamName: c.teamName,
    titles: c.championAlias ? careerTitles.get(c.championAlias) ?? 0 : 0,
    // En offseason el último campeón es el "vigente".
    current: i === championsHistory.length - 1 && !!c.championAlias,
    asterisk: c.seasonName === "2021/22" && !!c.championAlias,
  }))

  // ── Premios de la última temporada ────────────────────────────────────
  const seasonId = latest?.seasonId ?? null
  let awards: Award[] = []
  if (seasonId) {
    const [mvp, topScorer, bestGw, topAssister, bestiaNegra, streak, farolillo] = await Promise.all([
      getSeasonMVP(supabase, seasonId),
      getSeasonTopScorer(supabase, seasonId),
      getSeasonBestGw(supabase, seasonId),
      getSeasonTopAssister(supabase, seasonId),
      getSeasonBestiaNegra(supabase, seasonId),
      getSeasonLongestStreak(supabase, seasonId),
      getSeasonFarolilloRojo(supabase, seasonId),
    ])

    awards = [
      awardOrEmpty(
        "MVP · Más puntos",
        mvp && {
          label: "MVP · Más puntos",
          crestAlias: mvp.managerAlias,
          who: mvp.playerName,
          sub: mvp.managerAlias,
          value: `${mvp.value}`,
          unit: "pts",
          feat: true,
        },
      ),
      awardOrEmpty(
        "Bota de oro",
        topScorer && {
          label: "Bota de oro",
          crestAlias: null,
          who: topScorer.playerName,
          value: `${topScorer.value}`,
          unit: "goles",
        },
      ),
      awardOrEmpty(
        "Mejor GW individual",
        bestGw && {
          label: "Mejor GW individual",
          crestAlias: bestGw.managerAlias,
          who: bestGw.playerName,
          sub: bestGw.managerAlias,
          value: `${bestGw.value}`,
          unit: bestGw.gameweek ? `pts · J${bestGw.gameweek}` : "pts",
        },
      ),
      awardOrEmpty(
        "Rey de asistencias",
        topAssister && {
          label: "Rey de asistencias",
          crestAlias: null,
          who: topAssister.playerName,
          value: `${topAssister.value}`,
          unit: "asist.",
        },
      ),
      awardOrEmpty(
        "Bestia negra",
        bestiaNegra && {
          label: "Bestia negra",
          crestAlias: bestiaNegra.winnerAlias,
          who: bestiaNegra.winnerAlias,
          value: `${bestiaNegra.wins}–${bestiaNegra.losses}`,
          unit: `sobre ${bestiaNegra.loserAlias}`,
        },
      ),
      awardOrEmpty(
        "Racha más larga",
        streak && {
          label: "Racha más larga",
          crestAlias: streak.managerAlias,
          who: streak.managerAlias,
          value: `${streak.length}`,
          unit: "victorias",
        },
      ),
      awardOrEmpty(
        "Farolillo rojo",
        farolillo && {
          label: "Farolillo rojo",
          crestAlias: farolillo.managerAlias,
          crestClub: farolillo.teamName ?? farolillo.managerAlias,
          who: farolillo.teamName ?? farolillo.managerAlias,
          sub: farolillo.managerAlias,
          value: `${farolillo.pts}`,
          unit: "pts",
        },
      ),
    ]
  }

  // ── Closer / próxima temporada ────────────────────────────────────────
  const countdown = getNextSeasonCountdown()
  const next = nextSeasonLabels(latestName)

  return (
    <div className="flex min-h-screen flex-col bg-ink font-ui text-chalk">
      <HomeNav seasonName={hero.seasonName} statusLabel={statusLabel} />

      <main>
        <HomeHero hero={hero} />

        <section className="px-6 pb-2 pt-11 md:px-10">
          <div className="mx-auto max-w-[1200px]">
            <BlockHead index="01" title="Campeones" caption="cinco temporadas · 21/22 → 25/26" />
            <ChampionsStrip cells={cells} />
          </div>
        </section>

        <section className="px-6 pb-2 pt-11 md:px-10">
          <div className="mx-auto max-w-[1200px]">
            <BlockHead index="02" title="Premios de la temporada" caption={`el balance del ${hero.seasonName ?? ""}`} />
            {awards.length ? (
              <AwardsGrid awards={awards} />
            ) : (
              <p className="font-meta text-sm text-gray-2">Sin datos de temporada disponibles.</p>
            )}
          </div>
        </section>

        <section className="px-6 pb-2 pt-11 md:px-10">
          <div className="mx-auto max-w-[1200px]">
            <BlockHead
              index="03"
              title="Ranking histórico"
              caption="las cinco temporadas juntas"
              action={
                <Link
                  href="/managers"
                  className="inline-flex items-center gap-1.5 font-meta text-[11px] font-bold uppercase tracking-[0.1em] text-lime"
                >
                  Ver managers →
                </Link>
              }
            />
            <RankingTable rows={ranking} />
          </div>
        </section>
      </main>

      <HomeCloser seasonLabel={next.label} seasonName={next.name} countdown={countdown} />
      <HomeFooter />
    </div>
  )
}
