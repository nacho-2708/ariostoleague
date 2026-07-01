// Skeleton del Home (ruta /). Es la página más pesada (estado de liga + FPL +
// varias queries de Supabase + premios), así que un esqueleto instantáneo evita
// la sensación de "clic muerto" al entrar. La barra del Home se renderiza dentro
// de la página, por eso el esqueleto incluye una barra falsa arriba.
export default function HomeLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-ink" aria-hidden>
      <div className="h-16 border-b border-white/10" />
      <div className="mx-auto w-full max-w-[1200px] flex-1 animate-pulse space-y-8 px-6 py-12 md:px-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="h-3 w-56 rounded bg-white/5" />
          <div className="h-16 w-3/4 rounded bg-white/10" />
          <div className="flex gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-28 rounded bg-white/5" />
            ))}
          </div>
        </div>
        {/* Franja de campeones */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}
