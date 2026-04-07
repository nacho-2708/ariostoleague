import type { StandingRow } from "@/lib/standings"

function PositionIndicator({ pos }: { pos: number }) {
  if (pos <= 4) return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3e1a5b] text-[11px] font-bold text-white">
      {pos}
    </span>
  )
  if (pos >= 10) return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-600">
      {pos}
    </span>
  )
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
      {pos}
    </span>
  )
}

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              <th className="w-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipo</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Manager</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PJ</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PG</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PE</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PP</th>
              <th className="hidden px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">PF</th>
              <th className="hidden px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">PC</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">DP</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#3e1a5b]">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => {
              const pos = i + 1
              const isTop = pos <= 4
              const isBottom = pos >= 10
              return (
                <tr
                  key={row.manager_id}
                  className={`group transition-colors hover:bg-muted/40 ${
                    isTop ? "border-l-2 border-l-[#3e1a5b]" :
                    isBottom ? "border-l-2 border-l-rose-300" :
                    "border-l-2 border-l-transparent"
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <PositionIndicator pos={pos} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-foreground">{row.team_name}</span>
                  </td>
                  <td className="hidden px-4 py-3.5 sm:table-cell">
                    <span className="text-muted-foreground">{row.alias}</span>
                  </td>
                  <td className="px-3 py-3.5 text-center font-mono text-sm text-foreground">{row.pj}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-sm text-foreground">{row.pg}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-sm text-muted-foreground">{row.pe}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-sm text-muted-foreground">{row.pp}</td>
                  <td className="hidden px-3 py-3.5 text-center font-mono text-sm text-muted-foreground lg:table-cell">{row.pf}</td>
                  <td className="hidden px-3 py-3.5 text-center font-mono text-sm text-muted-foreground lg:table-cell">{row.pc}</td>
                  <td className={`px-3 py-3.5 text-center font-mono text-sm ${row.dp > 0 ? "text-emerald-600" : row.dp < 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                    {row.dp > 0 ? `+${row.dp}` : row.dp}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-lg bg-[#3e1a5b] px-2 font-bold text-white">
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
      <div className="flex items-center gap-6 border-t border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#3e1a5b]" />
          <span className="text-xs text-muted-foreground">Top 4</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="text-xs text-muted-foreground">Bottom 4</span>
        </div>
      </div>
    </div>
  )
}
