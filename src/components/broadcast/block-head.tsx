import type { ReactNode } from "react"

// Encabezado de sección Broadcast: índice Anton azul + título + caption + línea.
export default function BlockHead({
  index,
  title,
  caption,
  action,
}: {
  index: string
  title: string
  caption?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-[22px] flex items-center gap-4">
      <span className="font-display text-[15px] tracking-[0.02em] text-blue">{index}</span>
      <span className="font-display text-[26px] uppercase tracking-[0.01em] text-chalk">
        {title}
      </span>
      {caption && <span className="hidden font-meta text-xs text-gray sm:inline">{caption}</span>}
      <span className="h-px flex-1 bg-white/10" />
      {action}
    </div>
  )
}
