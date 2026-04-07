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
      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
    >
      {seasons.map((s) => (
        <option key={s.id} value={s.name}>
          {s.name}
        </option>
      ))}
    </select>
  )
}
