"use client"

import { useState } from "react"

// Logo de la liga por convención de path. Cuando exista el asset real, se
// instala dropeándolo en `public/assets/logo/ariosto-league.svg` — sin tocar
// código. Mientras no exista, cae a un placeholder neutro: el wordmark
// "Ariosto League" en la tipografía display.
//
// El logo oficial todavía no está diseñado (el León / Roundel es prototipo y
// vive como primitivo decorativo, NO como logo). Por eso este componente trata
// el logo igual que los escudos y las fotos: placeholder hasta que llegue el
// asset real.
const LOGO_SRC = "/assets/logo/ariosto-league.svg"

type LeagueLogoProps = {
  /** alto del logo en px cuando el asset real existe */
  height?: number
  /** clases para el wordmark placeholder (tamaño / color heredado del contenedor) */
  className?: string
}

export default function LeagueLogo({ height = 24, className = "text-[19px]" }: LeagueLogoProps) {
  const [failed, setFailed] = useState(false)

  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- fallback en runtime: <img> es necesario para onError
      <img
        src={LOGO_SRC}
        alt="Ariosto League"
        style={{ height, width: "auto" }}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span className={`font-display uppercase leading-none tracking-[0.01em] ${className}`}>
      Ariosto <span className="text-blue">League</span>
    </span>
  )
}
