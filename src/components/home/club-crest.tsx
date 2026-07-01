import { clubColor, clubInitial } from "@/lib/club-colors"

// Primitivo ClubCrest (placeholder). Escudo heptágono con la inicial del club y
// estrellas de título en arco encima. Reserva exactamente el espacio del asset
// real (SVG de escudo) para un swap-in futuro sin tocar el layout.
type ClubCrestProps = {
  /** nombre de equipo (para la inicial); si falta, se usa el alias */
  club: string
  /** alias del manager, para resolver el color propio del club */
  alias?: string
  /** cantidad de títulos → estrellas lima en arco */
  titles?: number
  size?: number
}

const SHIELD_CLIP = "polygon(8% 0,92% 0,100% 18%,100% 66%,50% 100%,0 66%,0 18%)"

export default function ClubCrest({ club, alias, titles = 0, size = 64 }: ClubCrestProps) {
  const color = clubColor(alias ?? club)

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: size }}
    >
      <div
        className="flex justify-center"
        style={{ height: size * 0.16, marginBottom: 3, gap: 2 }}
      >
        {Array.from({ length: titles }).map((_, i) => (
          <span
            key={i}
            className="leading-none text-lime"
            style={{ fontSize: size * 0.15 }}
          >
            ★
          </span>
        ))}
      </div>
      <div
        className="flex w-full items-center justify-center"
        style={{
          aspectRatio: "0.86",
          background: color,
          border: "2px solid rgba(0,0,0,0.35)",
          borderRadius: 4,
          clipPath: SHIELD_CLIP,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
        }}
      >
        <span
          className="font-display leading-none text-white"
          style={{ fontSize: size * 0.46, textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}
        >
          {clubInitial(club)}
        </span>
      </div>
    </div>
  )
}
