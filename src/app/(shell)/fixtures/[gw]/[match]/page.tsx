import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Star, Sword, Shield, Zap } from "lucide-react"
import { getMatchDetail } from "@/lib/match-detail"
import type { PlayerRow } from "@/lib/match-detail"
import { slugToAlias } from "@/lib/fpl-api"

const POSITION_ORDER = { GKP: 0, DEF: 1, MID: 2, FWD: 3 }
const POSITION_LABEL: Record<string, string> = { GKP: 'POR', DEF: 'DEF', MID: 'MED', FWD: 'DEL' }
const POSITION_COLOR: Record<string, string> = {
  GKP: 'bg-amber-100 text-amber-700',
  DEF: 'bg-blue-100 text-blue-700',
  MID: 'bg-emerald-100 text-emerald-700',
  FWD: 'bg-rose-100 text-rose-700',
}

function PlayerCard({ player, isMOTM }: { player: PlayerRow; isMOTM: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
      isMOTM
        ? "border-amber-300 bg-amber-50"
        : player.is_starter
          ? "border-border bg-white"
          : "border-border/50 bg-muted/20 opacity-70"
    }`}>
      {/* Posición */}
      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${POSITION_COLOR[player.position]}`}>
        {POSITION_LABEL[player.position]}
      </span>

      {/* Nombre + labels */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isMOTM && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
          <span className="truncate text-sm font-semibold text-foreground">{player.name}</span>
          {!player.is_starter && (
            <span className="shrink-0 text-[10px] text-muted-foreground">(suplente)</span>
          )}
        </div>
        {player.labels.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {player.labels.map((l, i) => (
              <span key={i} className="text-[10px] font-medium text-muted-foreground">{l}</span>
            ))}
          </div>
        )}
      </div>

      {/* Puntos */}
      <span className={`shrink-0 text-base font-black tabular-nums ${
        isMOTM ? "text-amber-600" : player.pts > 0 ? "text-foreground" : "text-muted-foreground"
      }`}>
        {player.pts}
      </span>
    </div>
  )
}

function TeamColumn({
  teamName,
  alias,
  score,
  players,
  motmName,
  isWinner,
}: {
  teamName: string
  alias: string
  score: number
  players: PlayerRow[]
  motmName: string | null
  isWinner: boolean
}) {
  const starters = players.filter((p) => p.is_starter)
    .sort((a, b) => POSITION_ORDER[a.position as keyof typeof POSITION_ORDER] - POSITION_ORDER[b.position as keyof typeof POSITION_ORDER])
  const bench = players.filter((p) => !p.is_starter)
  const totalPts = starters.reduce((s, p) => s + p.pts, 0)

  return (
    <div className="flex-1 space-y-3">
      {/* Header equipo */}
      <div className={`rounded-2xl p-4 text-center ${isWinner ? "bg-[#3e1a5b]" : "bg-muted/50 border border-border"}`}>
        <p className={`text-xs font-semibold uppercase tracking-wider ${isWinner ? "text-white/60" : "text-muted-foreground"}`}>
          {alias}
        </p>
        <p className={`mt-0.5 text-base font-bold ${isWinner ? "text-white" : "text-foreground"}`}>
          {teamName}
        </p>
        <p className={`mt-1 text-4xl font-black tabular-nums ${isWinner ? "text-white" : "text-foreground"}`}>
          {score}
        </p>
        <p className={`mt-1 text-xs ${isWinner ? "text-white/60" : "text-muted-foreground"}`}>
          {totalPts} pts totales
        </p>
      </div>

      {/* Titulares */}
      <div className="space-y-2">
        {starters.map((p) => (
          <PlayerCard key={p.name} player={p} isMOTM={p.name === motmName} />
        ))}
      </div>

      {/* Suplentes */}
      {bench.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Banco
          </p>
          {bench.map((p) => (
            <PlayerCard key={p.name} player={p} isMOTM={false} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Stat extra: comparación por línea ──────────────────────────────────────

function LineComparison({ players1, players2, position, label, icon: Icon }: {
  players1: PlayerRow[]
  players2: PlayerRow[]
  position: string
  label: string
  icon: React.ElementType
}) {
  const sum = (ps: PlayerRow[]) =>
    ps.filter((p) => p.is_starter && p.position === position).reduce((s, p) => s + p.pts, 0)

  const pts1 = sum(players1)
  const pts2 = sum(players2)
  const total = pts1 + pts2

  if (total === 0) return null

  const pct1 = total > 0 ? Math.round((pts1 / total) * 100) : 50
  const pct2 = 100 - pct1

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="w-8 text-right font-bold tabular-nums text-[#3e1a5b]">{pts1}</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="bg-[#3e1a5b] transition-all" style={{ width: `${pct1}%` }} />
          <div className="bg-rose-400 transition-all" style={{ width: `${pct2}%` }} />
        </div>
        <span className="w-8 font-bold tabular-nums text-rose-500">{pts2}</span>
      </div>
    </div>
  )
}

// ─── Página ─────────────────────────────────────────────────────────────────

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ gw: string; match: string }>
  searchParams: Promise<{ season?: string; s1?: string; s2?: string; t1?: string; t2?: string }>
}) {
  const { gw: gwParam, match } = await params
  const { season, s1, s2, t1, t2 } = await searchParams

  const gw = parseInt(gwParam, 10)
  if (isNaN(gw)) notFound()

  // Extraer aliases del slug "alias1-vs-alias2"
  const parts = match.split('-vs-')
  if (parts.length !== 2) notFound()

  const [rawAlias1, rawAlias2] = parts

  // Reconstruir alias canónico desde slug (maneja "sir-jagger" → "Sir Jagger", "rg" → "RG")
  const alias1 = slugToAlias(rawAlias1)
  const alias2 = slugToAlias(rawAlias2)

  const score1 = parseInt(s1 ?? '0', 10)
  const score2 = parseInt(s2 ?? '0', 10)
  const team1Name = t1 ?? alias1
  const team2Name = t2 ?? alias2
  const seasonName = season ?? '2025/26'

  const detail = await getMatchDetail(
    alias1, alias2, gw, seasonName,
    score1, score2, team1Name, team2Name,
  )

  const win1 = score1 > score2
  const win2 = score2 > score1
  const gwQs = season ? `?season=${encodeURIComponent(season)}` : ""

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div>
        <Link
          href={`/fixtures/${gw}${gwQs}`}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Jornada {gw}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {team1Name} vs {team2Name}
        </h1>
        <p className="text-sm text-muted-foreground">Jornada {gw} · Temporada {seasonName}</p>
      </div>

      {/* Score central */}
      <div className="flex items-center justify-center gap-6 rounded-2xl border border-border bg-white py-6 shadow-sm">
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground">{alias1}</p>
          <p className="text-lg font-bold">{team1Name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-5xl font-black tabular-nums ${win1 ? "text-[#3e1a5b]" : "text-muted-foreground"}`}>
            {score1}
          </span>
          <span className="text-2xl font-bold text-muted-foreground">–</span>
          <span className={`text-5xl font-black tabular-nums ${win2 ? "text-[#3e1a5b]" : "text-muted-foreground"}`}>
            {score2}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground">{alias2}</p>
          <p className="text-lg font-bold">{team2Name}</p>
        </div>
      </div>

      {!detail ? (
        /* Sin datos de jugadores */
        <div className="rounded-2xl border border-border bg-white px-6 py-10 text-center shadow-sm">
          <p className="font-semibold text-foreground">Datos de jugadores no disponibles</p>
          <p className="mt-1 text-sm text-muted-foreground">
            El desglose por jugadores está disponible para la temporada 2024/25.
          </p>
        </div>
      ) : (
        <>
          {/* MOTM */}
          {detail.motm && (
            <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400">
                <Star className="h-5 w-5 fill-white text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Man of the Match
                </p>
                <p className="mt-0.5 font-bold text-foreground">{detail.motm.name}</p>
                <p className="text-xs text-amber-700">
                  {detail.motm.team} · {detail.motm.pts} puntos
                  {detail.motm.labels.length > 0 && ` · ${detail.motm.labels.join(', ')}`}
                </p>
              </div>
            </div>
          )}

          {/* Comparación por línea */}
          <div className="rounded-2xl border border-border bg-white px-5 py-5 shadow-sm space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Batalla por línea
            </p>
            <LineComparison players1={detail.players1} players2={detail.players2} position="GKP" label="Portería" icon={Shield} />
            <LineComparison players1={detail.players1} players2={detail.players2} position="DEF" label="Defensa" icon={Shield} />
            <LineComparison players1={detail.players1} players2={detail.players2} position="MID" label="Mediocampo" icon={Zap} />
            <LineComparison players1={detail.players1} players2={detail.players2} position="FWD" label="Delantera" icon={Sword} />
          </div>

          {/* Alineaciones */}
          <div className="flex gap-4">
            <TeamColumn
              teamName={detail.team1_name}
              alias={detail.alias1}
              score={detail.score1}
              players={detail.players1}
              motmName={detail.motm?.team === detail.team1_name ? detail.motm.name : null}
              isWinner={win1}
            />
            <TeamColumn
              teamName={detail.team2_name}
              alias={detail.alias2}
              score={detail.score2}
              players={detail.players2}
              motmName={detail.motm?.team === detail.team2_name ? detail.motm.name : null}
              isWinner={win2}
            />
          </div>
        </>
      )}
    </div>
  )
}
