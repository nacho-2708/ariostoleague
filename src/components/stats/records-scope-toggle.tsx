"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function RecordsScopeToggle() {
  const sp = useSearchParams()
  const scopeAll = sp.get("scope") === "all"

  const hrefSeason = (() => {
    const p = new URLSearchParams(sp.toString())
    p.delete("scope")
    const s = p.toString()
    return `/stats/records${s ? `?${s}` : ""}`
  })()

  const hrefAll = (() => {
    const p = new URLSearchParams(sp.toString())
    p.set("scope", "all")
    return `/stats/records?${p.toString()}`
  })()

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={hrefSeason}
        className={`rounded-lg px-4 py-2 font-meta text-sm font-semibold ${
          !scopeAll ? "bg-lime text-ink" : "border border-white/10 bg-ink-2 text-gray hover:bg-white/5"
        }`}
      >
        Esta temporada
      </Link>
      <Link
        href={hrefAll}
        className={`rounded-lg px-4 py-2 font-meta text-sm font-semibold ${
          scopeAll ? "bg-lime text-ink" : "border border-white/10 bg-ink-2 text-gray hover:bg-white/5"
        }`}
      >
        All-time
      </Link>
    </div>
  )
}
