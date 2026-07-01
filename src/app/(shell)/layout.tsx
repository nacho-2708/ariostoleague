import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import ShellHeader from "@/components/shell-header"
import MobileTabs from "@/components/mobile-tabs"

async function getSeasons() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("has_full_data", true)
    .order("start_year", { ascending: false })
  return data ?? []
}

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const seasons = await getSeasons()

  return (
    <div className="flex min-h-full flex-col bg-background">
      <Suspense>
        <ShellHeader seasons={seasons} />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-24 md:px-6 md:pb-10">
        {children}
      </main>
      <Suspense>
        <MobileTabs />
      </Suspense>
    </div>
  )
}
