import { Suspense } from "react"
import ShellHeader from "@/components/shell-header"
import MobileTabs from "@/components/mobile-tabs"
import { getShellSeasons } from "@/lib/seasons"

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const seasons = await getShellSeasons()

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
