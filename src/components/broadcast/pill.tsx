import type { ReactNode } from "react"

// Badge / pill del sistema Broadcast. Honores y estados ("Campeón vigente",
// "Próximamente", "Offseason").
type PillVariant = "lime" | "blue" | "ghost"

const VARIANTS: Record<PillVariant, string> = {
  lime: "bg-lime text-ink",
  blue: "bg-blue text-white",
  ghost: "bg-transparent text-gray border border-white/[0.18]",
}

export default function Pill({
  variant = "ghost",
  children,
}: {
  variant?: PillVariant
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-meta text-[10px] font-bold uppercase tracking-[0.14em] ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  )
}
