"use client"

import Image from "next/image"
import { useState } from "react"
import { fplPlayerPhotoUrl } from "@/lib/fpl-assets"

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

type Props = {
  fplCode: number | null
  name: string
  className?: string
}

/**
 * Cabecina oficial (CDN Premier League). Si no hay `fpl_code` o falla la carga, iniciales.
 */
export default function FplPlayerPhoto({ fplCode, name, className = "" }: Props) {
  const [failed, setFailed] = useState(false)
  const src = fplPlayerPhotoUrl(fplCode)

  if (!src || failed) {
    return (
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 font-meta text-[10px] font-bold leading-none text-gray ${className}`}
        title={name}
      >
        {initials(name)}
      </div>
    )
  }

  return (
    <div className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10 ${className}`}>
      <Image
        src={src}
        alt=""
        width={44}
        height={44}
        className="h-full w-full object-cover object-top"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  )
}
