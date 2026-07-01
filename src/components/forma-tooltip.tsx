'use client'

import { useState } from 'react'
import type { FormaMatch } from '@/lib/manager-stats'

const FORMA_COLORS = {
  W: 'bg-emerald-500 text-white',
  D: 'bg-amber-400 text-white',
  L: 'bg-rose-400 text-white',
}

const RESULT_LABEL = { W: 'Victoria', D: 'Empate', L: 'Derrota' }
const RESULT_TEXT = { W: 'text-emerald-300', D: 'text-amber-300', L: 'text-rose-300' }

export function FormaTooltip({ formaDetalle }: { formaDetalle: FormaMatch[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  if (formaDetalle.length === 0) return null

  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="font-meta text-[10px] font-semibold uppercase tracking-wider text-gray">
        Últimos {formaDetalle.length}
      </span>
      {formaDetalle.map((m, i) => (
        <div key={i} className="relative">
          <button
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${FORMA_COLORS[m.result]} cursor-pointer`}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
            onFocus={() => setActiveIdx(i)}
            onBlur={() => setActiveIdx(null)}
          >
            {m.result}
          </button>
          {activeIdx === i && (
            <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-ink-3 px-3 py-2.5 shadow-lg text-left">
              <p className={`font-meta text-[10px] font-bold uppercase tracking-wider ${RESULT_TEXT[m.result]}`}>
                {RESULT_LABEL[m.result]}{m.gw ? ` · GW${m.gw}` : ''}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-chalk">
                vs {m.rival_team}
              </p>
              <p className="font-meta text-xs text-gray">
                {m.my_score} – {m.rival_score}
              </p>
              {/* Arrow */}
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#1B2136]" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
