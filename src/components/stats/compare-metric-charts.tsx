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

// Mismo par que la "batalla por línea" de Fixtures (match-detail): A = azul
// señal, B = verde destello. Hex literal porque recharts pinta SVG (fill/
// stroke), no admite clases Tailwind — deben coincidir con --color-blue /
// --color-lime de globals.css si esos tokens cambian.
const COLOR_A = "#2230FF"
const COLOR_B = "#C6FF3A"
const AXIS_TICK = { fontSize: 10, fill: "#8A92A6" } // --color-gray
const GRID_STROKE = "rgba(255,255,255,0.08)"

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
    <div className="rounded-xl border border-white/10 bg-ink-2 p-3">
      <p className="font-meta text-[10px] font-bold uppercase tracking-wider text-gray">{title}</p>
      {subtitle && <p className="mt-0.5 font-meta text-[10px] leading-tight text-gray">{subtitle}</p>}
      <div className="h-[132px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 2, right: 8, left: 2, bottom: 2 }}
            barCategoryGap="22%"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
            <XAxis
              type="number"
              domain={[0, domainMax]}
              tick={AXIS_TICK}
              tickFormatter={(v) => formatValue(Number(v))}
            />
            <YAxis type="category" dataKey="name" width={76} tick={AXIS_TICK} interval={0} />
            <Tooltip
              formatter={(v) => [formatValue(Number(v ?? 0)), ""]}
              labelFormatter={(l) => String(l)}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#1B2136",
                color: "#F3F4F8",
                fontSize: 12,
              }}
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
        <h3 className="mb-3 font-meta text-xs font-bold uppercase tracking-widest text-chalk">
          Partidos y balance
        </h3>
        <p className="mb-3 font-meta text-xs text-gray">
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
        <h3 className="mb-3 font-meta text-xs font-bold uppercase tracking-widest text-chalk">
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
        <h3 className="mb-3 font-meta text-xs font-bold uppercase tracking-widest text-chalk">
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
