// Eyebrow diamante del sistema Broadcast: label lima en mayúsculas precedido de
// un cuadrado 7px rotado 45°. `tone="ink"` lo invierte para el closer lima.
export default function Eyebrow({
  children,
  tone = "lime",
}: {
  children: React.ReactNode
  tone?: "lime" | "ink"
}) {
  const isInk = tone === "ink"
  return (
    <span
      className={`inline-flex items-center gap-2 font-meta text-[11px] font-bold uppercase tracking-[0.22em] ${
        isInk ? "text-ink/55" : "text-lime"
      }`}
    >
      <span
        aria-hidden
        className={`h-[7px] w-[7px] rotate-45 ${isInk ? "bg-ink" : "bg-lime"}`}
      />
      {children}
    </span>
  )
}
