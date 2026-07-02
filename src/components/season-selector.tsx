"use client"

import { useRouter } from "next/navigation"

type Season = { id: string; name: string }

export default function SeasonSelector({
  seasons,
  current,
}: {
  seasons: Season[]
  current: string
}) {
  const router = useRouter()

  return (
    <select
      value={current}
      onChange={(e) => router.push(`?season=${encodeURIComponent(e.target.value)}`)}
      className="rounded-lg border border-white/10 bg-ink-2 px-3 py-1.5 font-meta text-sm text-chalk focus:outline-none focus:ring-2 focus:ring-lime/40"
    >
      {seasons.map((s) => (
        <option key={s.id} value={s.name} className="bg-ink-2 text-chalk">
          {s.name}
        </option>
      ))}
    </select>
  )
}
