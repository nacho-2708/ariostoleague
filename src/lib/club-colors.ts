// Colores propios de club (provisorios) del handoff "Home Broadcast". Cuando
// existan escudos/fotos reales se hace swap-in sin tocar estos valores.
// Keyed por alias normalizado (sin espacios, minúsculas) para tolerar variantes
// como "Sir Jagger" / "SirJagger".
const CLUB_COLORS: Record<string, string> = {
  comandante: "#0F3A2E",
  marculi: "#8A0E2E",
  varela: "#1B2D6B",
  ignagoat: "#2E4B1F",
  manoloto: "#0F4150",
  papezar: "#5D2A0F",
  bebito: "#2D1E55",
  cunha: "#5C3A1F",
  wawri: "#3F1A55",
  sirjagger: "#6E3812",
  canter: "#4A1C1C",
  rg: "#0A3A4F",
}

function normalize(alias: string): string {
  return alias.toLowerCase().replace(/[^a-z0-9]/g, "")
}

// Hash determinista del alias → hue, para clubes sin color asignado. Devuelve un
// color oscuro y saturado, coherente con la paleta de tinta nocturna.
function hashColor(alias: string): string {
  let hash = 0
  for (let i = 0; i < alias.length; i++) {
    hash = (hash * 31 + alias.charCodeAt(i)) & 0xffffffff
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 45% 22%)`
}

export function clubColor(alias: string | null | undefined): string {
  if (!alias) return "#1B2136" // ink-3, escudo genérico
  return CLUB_COLORS[normalize(alias)] ?? hashColor(alias)
}

// Iniciales del manager (alias) para ManagerPhoto: 2 letras si hay 2 palabras,
// si no las 2 primeras del alias.
export function managerInitials(alias: string): string {
  const words = alias.trim().split(/\s+/)
  const raw = words.length > 1 ? words[0][0] + words[1][0] : alias.slice(0, 2)
  return raw.toUpperCase()
}

// Inicial del club (primera letra del nombre de equipo) para ClubCrest.
export function clubInitial(teamOrAlias: string): string {
  return teamOrAlias.trim().charAt(0).toUpperCase()
}
