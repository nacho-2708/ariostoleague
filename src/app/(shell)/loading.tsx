// Skeleton de navegación para las secciones del shell. El header y las tabs
// viven en (shell)/layout.tsx y persisten durante la navegación; este esqueleto
// ocupa solo el área de contenido, así el clic responde al instante en vez de
// quedarse en la página vieja hasta que el servidor termina de traer los datos.
export default function ShellLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      {/* Encabezado de página */}
      <div className="space-y-2">
        <div className="h-3 w-40 rounded bg-white/5" />
        <div className="h-8 w-64 rounded bg-white/10" />
      </div>

      {/* Tarjeta grande (tabla / grid) */}
      <div className="space-y-3 rounded-2xl border border-white/10 bg-ink-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-white/5" />
        ))}
      </div>
    </div>
  )
}
