import { createClient } from "@/lib/supabase/server"

export type ShellSeason = { id: string; name: string }

// Temporadas con datos completos, la más nueva primero. Usada por la barra del
// shell: alimenta el selector y, cuando no hay ?season en la URL (ej. el Home,
// que es cross-temporada), el default de los links de nav apunta a la más
// reciente — nunca a una temporada vacía.
export async function getShellSeasons(): Promise<ShellSeason[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("has_full_data", true)
    .order("start_year", { ascending: false })
  return data ?? []
}
