'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { GWDataPoint } from '@/lib/manager-stats'

// Paleta de colores para las líneas
const ALIAS_COLORS: Record<string, string> = {
  Comandante: '#7c3aed',
  Marculi:    '#2563eb',
  Varela:     '#059669',
  Ignagoat:   '#f97316',
  Manoloto:   '#0891b2',
  Papezar:    '#e11d48',
  Bebito:     '#ec4899',
  Cunha:      '#0d9488',
  Wawri:      '#6366f1',
  'Sir Jagger': '#d97706',
  Canter:     '#dc2626',
  RG:         '#65a30d',
}

type Tab = 'ranking' | 'points' | 'compare'

type AllManagerGW = {
  alias: string
  team: string
  gwData: { gw: number; pos: number; cumPts: number }[]
}

function CustomTooltip({ active, payload, label, inverted }: any) {
  if (!active || !payload?.length) return null
  const sorted = [...payload].sort((a, b) =>
    inverted ? a.value - b.value : b.value - a.value
  )
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2.5 shadow-lg text-xs">
      <p className="mb-1.5 font-bold text-muted-foreground uppercase tracking-wider">GW {label}</p>
      {sorted.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span className="font-medium text-foreground">{entry.name}</span>
          </span>
          <span className="font-bold tabular-nums text-foreground">
            {inverted ? `${entry.value}°` : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Ranking evolution ──────────────────────────────────────────────────

function RankingChart({ gwData, alias }: { gwData: GWDataPoint[]; alias: string }) {
  if (!gwData.length) return <EmptyState />
  const color = ALIAS_COLORS[alias] ?? '#3e1a5b'

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={gwData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="gw"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Jornada', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#9ca3af' }}
        />
        <YAxis
          reversed
          domain={[1, 12]}
          ticks={[1, 3, 6, 9, 12]}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}°`}
        />
        <Tooltip content={<CustomTooltip inverted />} />
        <ReferenceLine y={4} stroke="#3e1a5b" strokeDasharray="4 4" strokeWidth={1} opacity={0.4} />
        <Line
          type="monotone"
          dataKey="pos"
          stroke={color}
          strokeWidth={2.5}
          dot={{ fill: color, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
          name={alias}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Tab: Cumulative points ──────────────────────────────────────────────────

function PointsChart({ gwData, alias }: { gwData: GWDataPoint[]; alias: string }) {
  if (!gwData.length) return <EmptyState />
  const color = ALIAS_COLORS[alias] ?? '#3e1a5b'

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={gwData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="gw"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Jornada', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#9ca3af' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip inverted={false} />} />
        <Line
          type="monotone"
          dataKey="cumPts"
          stroke={color}
          strokeWidth={2.5}
          dot={{ fill: color, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
          name={alias}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Tab: Compare ranking ────────────────────────────────────────────────────

function CompareChart({
  myAlias,
  allManagersGW,
}: {
  myAlias: string
  allManagersGW: AllManagerGW[]
}) {
  const others = allManagersGW.filter((m) => m.alias !== myAlias)
  const [selected, setSelected] = useState<string[]>(
    others.slice(0, 3).map((m) => m.alias)
  )

  const toggleAlias = (alias: string) => {
    setSelected((prev) =>
      prev.includes(alias) ? prev.filter((a) => a !== alias) : [...prev, alias]
    )
  }

  // Merge all GW data into one dataset
  const myData = allManagersGW.find((m) => m.alias === myAlias)?.gwData ?? []
  const allGWs = [...new Set(myData.map((d) => d.gw))].sort((a, b) => a - b)

  const chartData = allGWs.map((gw) => {
    const row: Record<string, any> = { gw }
    const toShow = [myAlias, ...selected]
    for (const alias of toShow) {
      const mgr = allManagersGW.find((m) => m.alias === alias)
      const pt = mgr?.gwData.find((d) => d.gw === gw)
      row[alias] = pt?.pos ?? null
    }
    return row
  })

  if (!chartData.length) return <EmptyState />

  return (
    <div className="space-y-4">
      {/* Selector de rivals */}
      <div className="flex flex-wrap gap-1.5">
        {others.map((m) => {
          const active = selected.includes(m.alias)
          const color = ALIAS_COLORS[m.alias] ?? '#6b7280'
          return (
            <button
              key={m.alias}
              onClick={() => toggleAlias(m.alias)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                active
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-border bg-white text-muted-foreground hover:border-foreground/20'
              }`}
              style={active ? { background: color } : {}}
            >
              {m.alias}
            </button>
          )
        })}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="gw"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            reversed
            domain={[1, 12]}
            ticks={[1, 3, 6, 9, 12]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}°`}
          />
          <Tooltip content={<CustomTooltip inverted />} />
          <ReferenceLine y={4} stroke="#3e1a5b" strokeDasharray="4 4" strokeWidth={1} opacity={0.4} />
          {/* This manager — always shown, thicker */}
          <Line
            key={myAlias}
            type="monotone"
            dataKey={myAlias}
            stroke={ALIAS_COLORS[myAlias] ?? '#3e1a5b'}
            strokeWidth={3}
            dot={{ fill: ALIAS_COLORS[myAlias] ?? '#3e1a5b', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            name={myAlias}
            connectNulls
          />
          {selected.map((alias) => (
            <Line
              key={alias}
              type="monotone"
              dataKey={alias}
              stroke={ALIAS_COLORS[alias] ?? '#9ca3af'}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              name={alias}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <p className="text-sm text-muted-foreground">Sin datos de jornadas finalizadas</p>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function ManagerCharts({
  alias,
  gwData,
  allManagersGW,
}: {
  alias: string
  gwData: GWDataPoint[]
  allManagersGW: AllManagerGW[]
}) {
  const [tab, setTab] = useState<Tab>('ranking')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ranking', label: 'Ranking' },
    { key: 'points', label: 'Puntos acum.' },
    { key: 'compare', label: 'Comparar' },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t.key
                ? 'border-b-2 border-[#3e1a5b] text-[#3e1a5b]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab descriptions */}
      <div className="px-5 pt-4 pb-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {tab === 'ranking' && 'Evolución del ranking — temporada 2025/26'}
          {tab === 'points' && 'Puntos de liga acumulados — temporada 2025/26'}
          {tab === 'compare' && 'Comparación de ranking jornada a jornada'}
        </p>
      </div>

      {/* Chart */}
      <div className="px-2 pb-4">
        {tab === 'ranking' && <RankingChart gwData={gwData} alias={alias} />}
        {tab === 'points' && <PointsChart gwData={gwData} alias={alias} />}
        {tab === 'compare' && (
          <CompareChart myAlias={alias} allManagersGW={allManagersGW} />
        )}
      </div>

      {tab === 'ranking' && gwData.length > 0 && (
        <p className="px-5 pb-4 text-[10px] text-muted-foreground">
          — La línea punteada indica el umbral de clasificación (Top 4)
        </p>
      )}
    </div>
  )
}
