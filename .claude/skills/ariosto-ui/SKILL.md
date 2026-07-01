---
name: ariosto-ui
description: Reglas de uso del sistema de diseño Broadcast de Ariosto League (tinta nocturna + azul señal + verde destello, sobre la marca del León). Use al construir o reskinear cualquier pantalla/card/tabla/gráfico del frontend, para aplicar los tokens y el kit de forma consistente y no driftear. Es un PUNTERO a la fuente de verdad (tokens en globals.css @theme + kit en src/components/broadcast/), no una copia de valores.
---

# Ariosto League — sistema de diseño Broadcast

Puntero de uso, **no** copia de valores. La fuente de verdad son:
- **Tokens:** `src/app/globals.css` bloque `@theme` (ink/blue/lime + fuentes) y `:root`.
- **Kit:** `src/components/broadcast/`.
- **Handoff original:** tarjeta Notion "Handoff · Home Broadcast — sistema + spec".

Si un valor no coincide con el código, confiá en el código y avisá para corregir esta skill. Nunca re-pegues hex acá (driftea): usá las utilidades Tailwind (`bg-ink`, `text-lime`, `font-display`, …).

## Cuándo cada color

- **Superficies:** `ink` = fondo base de la app · `ink-2` = card/panel · `ink-3` = card destacada / tooltip / hover elevado.
- **Texto:** `chalk` = principal · `gray` = secundario/labels · `gray-2` = meta/dim.
- **`blue` (azul señal) = estructura:** posiciones (top-4), barras de acento, umbrales, "activo de sistema". Es el acento primario sobrio.
- **`lime` (verde destello) = "mirá acá":** el dato clave y los destellos — Pts, campeón, estrellas de título, tab activo, eyebrow, CTA, item de nav activo. Usar **con moderación** (acento, nunca relleno de fondo).
- **Semánticos** (resultado/estado): `emerald` (victoria/positivo), `rose` (derrota/negativo/último), `amber` (títulos/MOTM). **Siempre en variante dark:** texto `-300`, fondos `/15`–`/20`. Nunca fondos claros `-50/-100` ni textos `-600/-700` sobre oscuro.

## Tipografía (3 familias, por rol)

- **`font-display`** (Anton): cifras grandes, títulos hero, posiciones, mayúsculas. Solo uppercase.
- **`font-ui`** (Archivo, 500–900): nombres de club, body, botones.
- **`font-meta`** (Space Grotesk): eyebrows, labels, y **TODOS los numerales** → siempre con `tabular-nums`.

## Superficie y cards

- Página sobre `bg-background` (ya es `ink`). Card = `bg-ink-2 border border-white/10 rounded-{lg|xl|2xl}`.
- Hover/borde fuerte: `hover:border-white/25`. Divisores de tabla/lista: `divide-white/10` / `border-white/10`.
- Overlays sutiles (header de tabla, hover de fila, footer de card): `bg-white/5`. Chip inerte: `bg-white/10 text-gray`.
- Único gradiente permitido: el sutil "luz de estudio" del hero. Nada de gradientes brillantes de relleno.

## Primitivos (`src/components/broadcast/`)

- **`ClubCrest`** — escudo (heptágono) con inicial del club + estrellas de título. Escudos de club.
- **`ManagerPhoto`** — foto/avatar cuadrado con corner-tab lima. Fotos de manager.
- **`Pill`** — badge `lime` | `blue` | `ghost`. Honores y estados.
- **`Eyebrow`** — label lima en mayúsculas con diamante. `tone="ink"` para el closer lima.
- **`BlockHead`** — encabezado de sección (índice display + título + caption + línea).
- **`Roundel`** — el León, **decorativo** (watermarks). NO es el logo.
- **`LeagueLogo`** — logo oficial por convención de path con fallback al wordmark. Va en barras/footer. (El logo real se instala dropeando `public/assets/logo/ariosto-league.svg`, sin tocar código.)

## Recetario: migrar una página clara existente → Broadcast

Reemplazos mecánicos (solo estilos, nunca lógica ni datos):
- `bg-white` → `bg-ink-2` · `border-border` → `border-white/10` · `divide-border` → `divide-white/10`
- `text-foreground` → `text-chalk` · `text-muted-foreground` → `text-gray`
- `bg-muted/XX` → `bg-white/5` · `bg-muted` (sólido) → `bg-white/10`
- Violeta viejo `#3e1a5b`: si es posición/estructura → `blue`; si es valor/destacado (Pts, activo) → `lime`.
- Semánticos claros (`-50/-100` bg, `-600/-700` text) → variantes dark (`/15` bg, `-300` text).
- **Cada texto necesita color claro explícito.** `--foreground` sigue siendo oscuro (para las "islas" claras aún sin reskinear), así que un elemento sin color hereda oscuro y queda **invisible** sobre `ink`: darle `text-chalk`/`text-gray`.
- Numerales → `font-meta tabular-nums`. Cifras grandes → `font-display`.
- Charts (recharts): grilla `stroke="rgba(255,255,255,0.08)"`, tooltip `bg-ink-3`, ejes en gris; las líneas de identidad por manager se conservan.

## Modo "islas" (transición del epic de propagación)

Mientras una página no esté reskineada, queda como **tarjeta clara sobre fondo oscuro** (legible, no rota). Al reskinear se oscurece con el recetario de arriba. El fondo base ya es oscuro desde la Fundación.

## Ejemplos ya hechos (mirar como referencia)

- **Home:** `src/app/page.tsx` + `src/components/home/**` (hero, franja, premios, ranking, closer, footer).
- **Shell:** `src/components/shell-header.tsx`, `mobile-tabs.tsx`.
- **Reskins de contenido:** Standings (`standings-table.tsx`), Fixtures (`(shell)/fixtures/**`), Managers (`(shell)/managers/**` + `manager-charts.tsx`, `forma-tooltip.tsx`).
- **Pendiente:** Stats (`(shell)/stats/**` + componentes de leaderboards/compare/records) — aún en modo "isla".
