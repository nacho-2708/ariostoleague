# Foco actual — Ariosto League

_Actualizado: 2026-07-01_

- **En qué estaba:** Arrancó el módulo Home. Cerré el paso 1 del pipeline (ver tarjeta Notion "🧭 Home · orden de trabajo"): la capa de datos y lógica en `src/lib/**` (`league-state.ts`, `season-champions.ts`, `stats/season-awards.ts`, `home-ranking.ts`), sin tocar UI — commit `c390bf9`, tarjeta cerrada en Notion. Además armé la skill `ariosto-ref` (schema de Supabase + FPL Draft API + mapa de `src/lib`, commit `8bd387b`) y anoté en NOTEBOOK.md las decisiones de la sesión + un gotcha nuevo (dos IDs distintos por manager en la FPL API, commit `3d90076`). Todo pusheado a `main`.
- **Próximo paso:** El paso 2 del pipeline del Home (diseñar en Claude Design, de donde nace el design system nuevo) está en curso — Nacho lo está armando fuera de Claude Code y lo va a traer la próxima sesión. Cuando llegue el handoff, usar la skill `design-handoff` para traducirlo a código real (paso 3 del pipeline: ruta `/`, Hero, Premios, Ranking).
- **Notas:** `design/` sigue sin trackear — decisión pendiente en Notion, no tocar. Quedan 2 skills propuestas sin construir (`next16-gotchas`, `ariosto-ui` — esta última recién tiene sentido después del handoff de diseño), ver memoria de Claude Code si hace falta recordar el detalle.
