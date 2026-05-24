import { redirect } from "next/navigation"

export default async function StatsRootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const p = await searchParams
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) {
    if (v) qs.set(k, v)
  }
  const s = qs.toString()
  redirect(s ? `/stats/records?${s}` : "/stats/records")
}
