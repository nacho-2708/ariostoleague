/** CDN oficial Premier League (mismo patrón que fantasy.premierleague.com). */
const FPL_PLAYER_PHOTO_BASE =
  "https://resources.premierleague.com/premierleague/photos/players/110x140"

/**
 * URL de la cabecina del jugador a partir de `elements[].code` del bootstrap-static.
 * Formato: p{code}.png (no usar element id).
 */
export function fplPlayerPhotoUrl(fplCode: number | null | undefined): string | null {
  if (fplCode == null || fplCode <= 0) return null
  return `${FPL_PLAYER_PHOTO_BASE}/p${fplCode}.png`
}
