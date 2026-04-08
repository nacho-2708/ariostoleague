import type { PostgrestError } from "@supabase/supabase-js"

const DEFAULT_PAGE_SIZE = 1000

/**
 * PostgREST (Supabase) suele devolver como máximo ~1000 filas por petición.
 * Recorre con `.range()` hasta traer todas las filas. Requiere `.order()` estable (p. ej. por `id`).
 */
export async function fetchAllWithRange<T>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: PostgrestError | null }>,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const all: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await fetchPage(from, from + pageSize - 1)
    if (error) return { data: all, error }
    const batch = data ?? []
    if (batch.length === 0) break
    all.push(...batch)
    if (batch.length < pageSize) break
    from += pageSize
  }
  return { data: all, error: null }
}
