"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ManagerCompareResult } from "@/lib/stats/manager-compare"

const COLOR_A = "#7c3aed"
const COLOR_B = "#0891b2"

function MiniCompareBar({
  title,
  subtitle,
  valueA,
  valueB,
  labelA,
  labelB,
  formatValue = (n: number) => String(Math.round(n)),
}: {
  title: string
  subtitle?: string
  valueA: number
  valueB: number
  labelA: string
  labelB: string
  formatValue?: (n: number) => string
}) {
  const max = Math.max(valueA, valueB, 1e-6)
  const domainMax = max * 1.18

  const data = [
    { name: labelA, v: valueA, fill: COLOR_A },
    { name: labelB, v: valueB, fill: COLOR_B },
  ]

  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      {subtitle && <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{subtitle}</p>}
      <div className="h-[132px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 2, right: 8, left: 2, bottom: 2 }}
            barCategoryGap="22%"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/80" />
            <XAxis
              type="number"
              domain={[0, domainMax]}
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => formatValue(Number(v))}
            />
            <YAxis type="category" dataKey="name" width={76} tick={{ fontSize: 10 }} interval={0} />
            <Tooltip
              formatter={(v) => [formatValue(Number(v ?? 0)), ""]}
              labelFormatter={(l) => String(l)}
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
            />
            <Bar dataKey="v" radius={[0, 4, 4, 0]} maxBarSize={26}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ManagerCompareCharts({ data }: { data: ManagerCompareResult }) {
  const a = data.m1
  const b = data.m2

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
          Partidos y balance
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Cada gráfico usa su propia escala; las barras son comparables solo dentro de esa métrica.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniCompareBar
            title="Partidos (PJ)"
            valueA={a.pj}
            valueB={b.pj}
            labelA={a.alias}
            labelB={b.alias}
          />
          <MiniCompareBar
            title="Victorias (PG)"
            valueA={a.pg}
            valueB={b.pg}
            labelA={a.alias}
            labelB={b.alias}
          />
          <MiniCompareBar
            title="Empates (PE)"
            valueA={a.pe}
            valueB={b.pe}
            labelA={a.alias}
            labelB={b.alias}
          />
          <MiniCompareBar
            title="Derrotas (PP)"
            valueA={a.pp}
            valueB={b.pp}
            labelA={a.alias}
            labelB={b.alias}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
          Puntos fantasy acumulados
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MiniCompareBar
            title="PF (a favor)"
            subtitle="Suma de puntos fantasy a favor"
            valueA={a.pf}
            valueB={b.pf}
            labelA={a.alias}
            labelB={b.alias}
          />
          <MiniCompareBar
            title="PC (en contra)"
            subtitle="Suma encajada"
            valueA={a.pc}
            valueB={b.pc}
            labelA={a.alias}
            labelB={b.alias}
          />
          <MiniCompareBar
            title="Prom. PF / partido"
            valueA={a.avgPf}
            valueB={b.avgPf}
            labelA={a.alias}
            labelB={b.alias}
            formatValue={(n) => n.toFixed(1)}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
          Clasificación
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniCompareBar
            title="Pts (liga)"
            subtitle="Puntos de clasificación (3-1-0)"
            valueA={a.pts}
            valueB={b.pts}
            labelA={a.alias}
            labelB={b.alias}
          />
          <MiniCompareBar
            title="% victorias"
            valueA={a.winPct}
            valueB={b.winPct}
            labelA={a.alias}
            labelB={b.alias}
            formatValue={(n) => `${Math.round(n)}%`}
          />
        </div>
      </div>
    </div>
  )
}
