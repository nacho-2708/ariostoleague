import type { CSSProperties } from "react"

// ═══ El León de Ariosto — roundel generativo ═══
// Portado de archivados/Logo Ariosto League - Final.html (funciones lion/roundel).
// SVG puro y determinista (sin texto curvo → sin ids aleatorios), apto para SSR.

function petal(len: number, wid: number, curve = 0.82): string {
  return `M0,0 C ${-wid},${-len * 0.32} ${-wid * 0.7},${-len * curve} 0,${-len} C ${wid * 0.7},${-len * curve} ${wid},${-len * 0.32} 0,0 Z`
}

function mane(
  cx: number,
  cy: number,
  n: number,
  rBase: number,
  len: number,
  wid: number,
  fill: string,
  offset = 0,
  curve = 0.82,
): string[] {
  const paths: string[] = []
  for (let i = 0; i < n; i++) {
    const a = -90 + (i + offset) * (360 / n)
    const rad = (a * Math.PI) / 180
    const x = cx + rBase * Math.cos(rad)
    const y = cy + rBase * Math.sin(rad)
    paths.push(
      `<path d="${petal(len, wid, curve)}" fill="${fill}" transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(a + 90).toFixed(1)})"/>`,
    )
  }
  return paths
}

function face(cx: number, cy: number, r: number, fill: string, cut: string): string {
  const e = cut
  return `
    <ellipse cx="${cx}" cy="${cy + 3}" rx="${r}" ry="${r * 1.06}" fill="${fill}"/>
    <path d="M${cx - 27},${cy - 8} Q${cx - 13},${cy - 19} ${cx - 2},${cy - 9} L${cx - 2},${cy - 1} Q${cx - 13},${cy - 9} ${cx - 27},${cy - 1} Z" fill="${e}"/>
    <path d="M${cx + 27},${cy - 8} Q${cx + 13},${cy - 19} ${cx + 2},${cy - 9} L${cx + 2},${cy - 1} Q${cx + 13},${cy - 9} ${cx + 27},${cy - 1} Z" fill="${e}"/>
    <path d="M${cx},${cy + 21} C ${cx - 11},${cy + 13} ${cx - 9},${cy + 4} ${cx},${cy + 9} C ${cx + 9},${cy + 4} ${cx + 11},${cy + 13} ${cx},${cy + 21} Z" fill="${e}"/>
    <path d="M${cx},${cy + 21} L${cx},${cy + 27}" stroke="${e}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M${cx},${cy + 27} Q${cx - 10},${cy + 34} ${cx - 19},${cy + 27} M${cx},${cy + 27} Q${cx + 10},${cy + 34} ${cx + 19},${cy + 27}" stroke="${e}" stroke-width="3" fill="none" stroke-linecap="round"/>`
}

function lion(fill: string, cut: string): string {
  return [
    ...mane(100, 100, 14, 26, 54, 16, fill, 0, 0.82),
    ...mane(100, 100, 14, 30, 40, 13, fill, 0.5, 0.82),
    face(100, 100, 33, fill, cut),
  ].join("")
}

type RoundelProps = {
  size: number
  /** color del aro exterior */
  ring?: string
  /** color del león */
  lionFill?: string
  /** color de los recortes de la cara (ojos, hocico) */
  lionCut?: string
  className?: string
  style?: CSSProperties
}

export default function Roundel({
  size,
  ring = "#fff",
  lionFill = "#fff",
  lionCut = "#0B0F1A",
  className,
  style,
}: RoundelProps) {
  const markup = `
    <circle cx="100" cy="100" r="98" fill="#0B0F1A"/>
    <circle cx="100" cy="100" r="88" fill="none" stroke="${ring}" stroke-width="2"/>
    <g transform="translate(28,49.6) scale(0.72)">${lion(lionFill, lionCut)}</g>`

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
