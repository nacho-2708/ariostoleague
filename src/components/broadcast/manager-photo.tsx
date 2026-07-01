import { clubColor, managerInitials } from "@/lib/club-colors"

// Primitivo ManagerPhoto (placeholder). Marco cuadrado color del club con las
// iniciales del manager y el corner tab lima (firma broadcast). Reserva el
// espacio del retrato real para swap-in futuro.
type ManagerPhotoProps = {
  alias: string
  size?: number
}

export default function ManagerPhoto({ alias, size = 44 }: ManagerPhotoProps) {
  const color = clubColor(alias)

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden"
      style={{ width: size, height: size, background: color, borderRadius: 5 }}
    >
      {/* corner tab lima (triángulo esquina sup-izq) */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bg-lime"
        style={{
          width: "34%",
          height: "34%",
          clipPath: "polygon(0 0,100% 0,0 100%)",
          opacity: 0.9,
        }}
      />
      {/* borde interior */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: 5, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)" }}
      />
      <span
        className="relative z-10 font-meta font-bold text-white"
        style={{ fontSize: Math.round(size * 0.34), letterSpacing: "0.02em" }}
      >
        {managerInitials(alias)}
      </span>
    </div>
  )
}
