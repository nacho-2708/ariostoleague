# Foco actual — Ariosto League
_Actualizado: 2026-07-02_

- **En qué estaba:** Epic de propagación Broadcast cerrado (Fundación + Standings + Fixtures + Managers en `main` vía PR #1; Stats en PR #2). Además se hizo un fix de coherencia (season-selector + button usaban variantes `dark:` muertas) en PR #3.
- **Próximo paso:** Revisar y mergear los dos PRs abiertos — **PR #2** (`2026-07-01-stats-broadcast`, reskin de Stats — ojo especial a los charts de Comparar, necesitan tu ojo en navegador real) y **PR #3** (`2026-07-02-fix-dark-variants`, fix de season-selector/button). Ambos parten de después del PR #1 y son independientes entre sí.
- **Notas:** Quedan sin usar en la app `season-selector.tsx` y `ui/button.tsx` (0 imports) — el fix del PR #3 es preventivo, no cambia nada visible todavía. Deploy a Vercel sigue pendiente (no confundir "está en main" con "está en producción").
