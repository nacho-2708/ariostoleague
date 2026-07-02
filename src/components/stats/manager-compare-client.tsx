"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { ManagerCompareResult } from "@/lib/stats/manager-compare"
import { ManagerCompareCharts } from "@/components/stats/compare-metric-charts"

type ManagerOption = { id: string; alias: string }

export default function ManagerCompareClient({
  managers,
  data,
}: {
  managers: ManagerOption[]
  data: ManagerCompareResult | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const m1 = searchParams.get("m1") ?? ""
  const m2 = searchParams.get("m2") ?? ""
  const cmp = searchParams.get("cmp") === "all" ? "all" : "season"

  function update(next: { m1?: string; m2?: string; cmp?: string }) {
    const p = new URLSearchParams(searchParams.toString())
    if (next.m1 !== undefined) p.set("m1", next.m1)
    if (next.m2 !== undefined) p.set("m2", next.m2)
    if (next.cmp !== undefined) {
      if (next.cmp === "all") p.set("cmp", "all")
      else p.delete("cmp")
    }
    router.push(`/stats/compare?${p.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block font-meta text-xs font-semibold uppercase tracking-wider text-gray">
            Manager A
          </label>
          <select
            value={m1}
            onChange={(e) => update({ m1: e.target.value })}
            className="min-w-[160px] rounded-lg border border-white/10 bg-ink-2 px-3 py-2 text-sm text-chalk"
          >
            <option value="" className="bg-ink-2 text-chalk">Elegir…</option>
            {managers.map((x) => (
              <option key={x.id} value={x.alias} className="bg-ink-2 text-chalk">
                {x.alias}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-meta text-xs font-semibold uppercase tracking-wider text-gray">
            Manager B
          </label>
          <select
            value={m2}
            onChange={(e) => update({ m2: e.target.value })}
            className="min-w-[160px] rounded-lg border border-white/10 bg-ink-2 px-3 py-2 text-sm text-chalk"
          >
            <option value="" className="bg-ink-2 text-chalk">Elegir…</option>
            {managers.map((x) => (
              <option key={x.id} value={x.alias} className="bg-ink-2 text-chalk">
                {x.alias}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-meta text-xs font-semibold uppercase tracking-wider text-gray">
            Ámbito
          </label>
          <select
            value={cmp}
            onChange={(e) => update({ cmp: e.target.value })}
            className="rounded-lg border border-white/10 bg-ink-2 px-3 py-2 text-sm text-chalk"
          >
            <option value="season" className="bg-ink-2 text-chalk">Temporada (selector arriba)</option>
            <option value="all" className="bg-ink-2 text-chalk">Todas las temporadas</option>
          </select>
        </div>
      </div>

      {!m1 || !m2 ? (
        <p className="font-meta text-sm text-gray">Selecciona dos managers distintos para comparar.</p>
      ) : m1 === m2 ? (
        <p className="font-meta text-sm text-rose-400">Elige dos managers diferentes.</p>
      ) : !data ? (
        <p className="font-meta text-sm text-gray">No hay datos para esta comparación.</p>
      ) : (
        <>
          <p className="font-meta text-xs font-medium uppercase tracking-widest text-gray">
            {data.seasonLabel}
            {data.scopeAll ? " · todas las temporadas con datos" : ""}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-ink-2 p-5">
              <p className="text-lg font-black text-chalk">{data.m1.teamName}</p>
              <p className="font-meta text-sm text-gray">{data.m1.alias}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray">PJ</dt>
                  <dd className="font-mono font-bold tabular-nums text-chalk">{data.m1.pj}</dd>
                </div>
                <div>
                  <dt className="text-gray">Pts liga</dt>
                  <dd className="font-mono font-bold tabular-nums text-lime">{data.m1.pts}</dd>
                </div>
                <div>
                  <dt className="text-gray">PG / PE / PP</dt>
                  <dd className="font-mono font-semibold tabular-nums text-chalk">
                    {data.m1.pg} / {data.m1.pe} / {data.m1.pp}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray">% victorias</dt>
                  <dd className="font-mono font-bold tabular-nums text-chalk">{data.m1.winPct}%</dd>
                </div>
                <div>
                  <dt className="text-gray">PF / PC</dt>
                  <dd className="font-mono font-semibold tabular-nums text-chalk">
                    {data.m1.pf} / {data.m1.pc}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray">Prom. PF</dt>
                  <dd className="font-mono font-bold tabular-nums text-chalk">{data.m1.avgPf}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-white/10 bg-ink-2 p-5">
              <p className="text-lg font-black text-chalk">{data.m2.teamName}</p>
              <p className="font-meta text-sm text-gray">{data.m2.alias}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray">PJ</dt>
                  <dd className="font-mono font-bold tabular-nums text-chalk">{data.m2.pj}</dd>
                </div>
                <div>
                  <dt className="text-gray">Pts liga</dt>
                  <dd className="font-mono font-bold tabular-nums text-lime">{data.m2.pts}</dd>
                </div>
                <div>
                  <dt className="text-gray">PG / PE / PP</dt>
                  <dd className="font-mono font-semibold tabular-nums text-chalk">
                    {data.m2.pg} / {data.m2.pe} / {data.m2.pp}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray">% victorias</dt>
                  <dd className="font-mono font-bold tabular-nums text-chalk">{data.m2.winPct}%</dd>
                </div>
                <div>
                  <dt className="text-gray">PF / PC</dt>
                  <dd className="font-mono font-semibold tabular-nums text-chalk">
                    {data.m2.pf} / {data.m2.pc}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray">Prom. PF</dt>
                  <dd className="font-mono font-bold tabular-nums text-chalk">{data.m2.avgPf}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-xl border border-blue/30 bg-ink-2 p-5">
            <h3 className="font-meta text-xs font-bold uppercase tracking-widest text-blue">Cara a cara (H2H)</h3>
            {data.h2h.fixtures === 0 ? (
              <p className="mt-2 font-meta text-sm text-gray">No se han enfrentado en el ámbito seleccionado.</p>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-6 text-sm">
                <p>
                  <span className="font-semibold text-chalk">{data.m1.alias}</span>{" "}
                  <span className="font-black text-lime">{data.h2h.m1Wins}</span> victorias
                </p>
                <p>
                  <span className="font-meta text-gray">Empates</span>{" "}
                  <span className="font-mono font-bold tabular-nums text-chalk">{data.h2h.draws}</span>
                </p>
                <p>
                  <span className="font-semibold text-chalk">{data.m2.alias}</span>{" "}
                  <span className="font-black text-lime">{data.h2h.m2Wins}</span> victorias
                </p>
                <p className="font-meta text-gray">
                  PF en el duelo: {data.m1.alias} {data.h2h.pf1} — {data.h2h.pf2} {data.m2.alias}
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-1 text-sm font-bold text-chalk">Gráficos comparativos</h3>
            <p className="mb-4 font-meta text-xs text-gray">
              Un bloque por métrica: la escala del eje X es independiente en cada uno, para que PF (miles) no aplaste
              PG o PJ (decenas).
            </p>
            <ManagerCompareCharts data={data} />
          </div>
        </>
      )}
    </div>
  )
}
