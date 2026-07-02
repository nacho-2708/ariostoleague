"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import type { H2HPairSummary, StreakWinDetail } from "@/lib/stats/h2h-records"

type RecordsUiTooltipProps = {
  label: string
  children: React.ReactNode
}

/** Tooltip accesible (hover + foco) con icono de ayuda junto al título de una card. */
export function RecordsUiTooltip({ label, children }: RecordsUiTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <span className="relative inline-flex">
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray hover:bg-white/10 hover:text-chalk focus:outline-none focus:ring-2 focus:ring-lime/30"
          aria-label={label}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <Info className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        {open && (
          <span
            role="tooltip"
            className="absolute bottom-full left-1/2 z-50 mb-2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-white/10 bg-ink-3 px-3 py-2 text-left font-meta text-xs leading-snug text-gray shadow-lg"
          >
            {label}
          </span>
        )}
      </span>
    </span>
  )
}

export function StreakRowTooltip({
  alias,
  length,
  wins,
  approximate,
}: {
  alias: string
  length: number
  wins: StreakWinDetail[]
  approximate: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex w-full items-center justify-between rounded-lg border border-white/10 bg-ink-2 px-4 py-3">
      <span className="font-semibold text-chalk">{alias}</span>
      <div className="relative flex items-center gap-1">
        <span className="font-display text-lg tabular-nums text-lime">{length} W</span>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray hover:bg-white/10 hover:text-chalk focus:outline-none focus:ring-2 focus:ring-lime/30"
          aria-label={`Detalle de las ${length} victorias seguidas de ${alias}`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <Info className="h-4 w-4" />
        </button>
        {open && (
          <div
            className="absolute right-0 top-full z-50 mt-1 max-h-64 w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-white/10 bg-ink-3 px-3 py-2.5 text-left shadow-xl"
            role="tooltip"
          >
            <p className="font-meta text-[10px] font-bold uppercase tracking-wider text-lime">
              Victorias en la racha
              {approximate && (
                <span className="ml-1 font-normal normal-case text-amber-300">(orden de jornadas aproximado)</span>
              )}
            </p>
            <ul className="mt-2 space-y-1.5">
              {wins.map((w, i) => (
                <li key={i} className="text-xs text-chalk">
                  <span className="font-semibold">
                    {w.seasonName}
                    {w.gameweek != null ? ` · J${w.gameweek}` : ""}
                  </span>
                  {" · "}
                  vs {w.rivalAlias}{" "}
                  <span className="font-meta tabular-nums text-gray">
                    {w.myScore}–{w.rivalScore}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function PairDetailButton({ pair }: { pair: H2HPairSummary }) {
  const [open, setOpen] = useState(false)

  return (
    <td className="relative px-3 py-2 text-right">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-lime hover:bg-lime/10 focus:outline-none focus:ring-2 focus:ring-lime/30"
        aria-label={`Historial entre ${pair.aliasA} y ${pair.aliasB}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        Detalle
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 max-h-72 w-[min(22rem,85vw)] overflow-y-auto rounded-xl border border-white/10 bg-ink-3 px-3 py-2.5 text-left shadow-xl"
          role="tooltip"
        >
          <p className="font-meta text-[10px] font-bold uppercase tracking-wider text-gray">
            {pair.aliasA} vs {pair.aliasB} ({pair.played} partidos)
          </p>
          <p className="mt-1 font-meta text-[10px] text-gray">
            Marcador: {pair.aliasA} · {pair.aliasB}
          </p>
          <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto">
            {pair.matches.map((m, i) => (
              <li key={i} className="text-xs tabular-nums text-chalk">
                {m.seasonName}
                {m.gameweek != null ? ` · J${m.gameweek}` : ""} — {m.scoreA} · {m.scoreB}
              </li>
            ))}
          </ul>
        </div>
      )}
    </td>
  )
}

export function H2hPairsTable({ pairs }: { pairs: H2HPairSummary[] }) {
  if (!pairs.length) return null

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-ink-2">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-left font-meta text-[10px] font-bold uppercase tracking-wider text-gray">
            <th className="px-3 py-3">Manager A</th>
            <th className="px-3 py-3">Manager B</th>
            <th className="px-3 py-3 text-center">PJ</th>
            <th className="px-3 py-3 text-center">A / E / B</th>
            <th className="px-3 py-3 text-right">PF A</th>
            <th className="px-3 py-3 text-right">PF B</th>
            <th className="w-28 px-3 py-3 text-right">Historial</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((p) => (
            <tr key={`${p.aliasA}-${p.aliasB}`} className="border-b border-white/10 last:border-0">
              <td className="px-3 py-2 font-medium text-chalk">{p.aliasA}</td>
              <td className="px-3 py-2 font-medium text-chalk">{p.aliasB}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-gray">{p.played}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums">
                <span className="text-emerald-400">{p.winsA}</span>
                <span className="text-gray"> / </span>
                <span className="text-amber-300">{p.draws}</span>
                <span className="text-gray"> / </span>
                <span className="text-rose-400">{p.winsB}</span>
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-chalk">{p.pfA}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-chalk">{p.pfB}</td>
              <PairDetailButton pair={p} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
