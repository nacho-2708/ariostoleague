import type { StandingRow } from "@/lib/standings"
import ClubCrest from "@/components/broadcast/club-crest"

function PositionIndicator({ pos }: { pos: number }) {
  if (pos <= 4) return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue text-[11px] font-bold text-white">
      {pos}
    </span>
  )
  if (pos >= 10) return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-[11px] font-bold text-rose-300">
      {pos}
    </span>
  )
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-gray">
      {pos}
    </span>
  )
}

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="w-10 px-4 py-3 text-left font-meta text-xs font-semibold uppercase tracking-wider text-gray">#</th>
              <th className="px-4 py-3 text-left font-meta text-xs font-semibold uppercase tracking-wider text-gray">Equipo</th>
              <th className="hidden px-4 py-3 text-left font-meta text-xs font-semibold uppercase tracking-wider text-gray sm:table-cell">Manager</th>
              <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PJ</th>
              <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PG</th>
              <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PE</th>
              <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PP</th>
              <th className="hidden px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray lg:table-cell">PF</th>
              <th className="hidden px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray lg:table-cell">PC</th>
              <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">DP</th>
              <th className="px-4 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-lime">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row, i) => {
              const pos = i + 1
              const isTop = pos <= 4
              const isBottom = pos >= 10
              return (
                <tr
                  key={row.manager_id}
                  className={`group transition-colors hover:bg-white/5 ${
                    isTop ? "border-l-2 border-l-blue" :
                    isBottom ? "border-l-2 border-l-rose-400/60" :
                    "border-l-2 border-l-transparent"
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <PositionIndicator pos={pos} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <ClubCrest club={row.team_name} alias={row.alias} size={24} />
                      <span className="font-semibold text-chalk">{row.team_name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3.5 sm:table-cell">
                    <span className="text-gray">{row.alias}</span>
                  </td>
                  <td className="px-3 py-3.5 text-center font-mono text-sm text-chalk">{row.pj}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-sm text-chalk">{row.pg}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-sm text-gray">{row.pe}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-sm text-gray">{row.pp}</td>
                  <td className="hidden px-3 py-3.5 text-center font-mono text-sm text-gray lg:table-cell">{row.pf}</td>
                  <td className="hidden px-3 py-3.5 text-center font-mono text-sm text-gray lg:table-cell">{row.pc}</td>
                  <td className={`px-3 py-3.5 text-center font-mono text-sm ${row.dp > 0 ? "text-emerald-400" : row.dp < 0 ? "text-rose-400" : "text-gray"}`}>
                    {row.dp > 0 ? `+${row.dp}` : row.dp}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-lg bg-lime px-2 font-bold text-ink">
                      {row.pts}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-6 border-t border-white/10 bg-white/5 px-5 py-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-blue" />
          <span className="font-meta text-xs text-gray">Top 4</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
          <span className="font-meta text-xs text-gray">Bottom 4</span>
        </div>
      </div>
    </div>
  )
}
