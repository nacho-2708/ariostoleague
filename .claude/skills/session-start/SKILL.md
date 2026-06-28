---
name: session-start
description: Reconstruye dónde quedó el proyecto Ariosto League después de días sin tocarlo, en un solo comando. Use cuando Nacho arranca a trabajar y necesita reorientarse (e.g. "arranquemos", "dónde quedé", "retomemos", "session start", o /session-start). Hace git pull, lee CLAUDE.md y NOTEBOOK.md, resume el estado y propone por cuál tarea seguir.
---

# Session start — retomar Ariosto League sin tener que acordarme de nada

El objetivo es que después de días sin tocar el proyecto, Nacho corra un comando y
en pocas líneas sepa: qué cambió desde la última sesión, en qué módulo estamos,
qué se hizo en los últimos commits, qué deuda/decisión quedó pendiente, y por dónde
seguir. Nacho es novato — narrá en español, claro y sin jerga innecesaria.

Repo: `/Users/ignacioferrer/Proyectos/ariostoleague` (rama de trabajo: `main`).

El modelo de trabajo completo está en la sección **"Modelo de orquestación"** de
`CLAUDE.md`. Lo clave para esta skill: GitHub es la fuente de verdad de Claude Code,
Notion es la fuente de verdad del roadmap, y una tarea lista para ejecutar tiene
`Tool = "Claude Code"` y la spec adentro de la tarjeta.

## Pasos

1. **Saludo breve** y avisá que vas a reconstruir dónde quedó el proyecto.

2. **Leer el foco de la última sesión.** Leé `.claude/SESSION_STATE.md` si existe.
   - Es la nota que dejó `session-end` sobre dónde quedó Nacho: **la fuente más fresca y
     específica de todas.** Por eso se lee primero. El resumen final (paso 6) se ancla en
     ella ("la última sesión quedó en X, el próximo paso era Y"), no la trates como un
     archivo más.
   - **Si NO existe** (primera vez, o nunca se cerró sesión con `session-end`), no pasa
     nada: decilo y seguí reconstruyendo desde git + NOTEBOOK como siempre. Que la
     ausencia no rompa la skill.

3. **Traer lo último de GitHub.**
   - `git -C /Users/ignacioferrer/Proyectos/ariostoleague pull --ff-only`
   - Reportá si hubo cambios desde la última sesión: si el pull trajo commits, listá
     cuáles (`git log` de los nuevos). Si ya estaba al día ("Already up to date"),
     decilo y seguí.
   - Si el pull falla, **parate y avisá** — no fuerces nada y nunca hagas merges ni
     rebases automáticos. Explicale a Nacho en castellano simple qué pasó, distinguiendo
     los dos casos típicos (mirá `git status` para identificar cuál es):
     - **(a) Tenés commits locales sin pushear.** Decile que hay trabajo hecho en su compu
       que todavía no subió a GitHub, y **ofrecé hacer el push** (`git push origin main`)
       para dejarlo a salvo. Recordá que el trabajo no cuenta hasta estar en GitHub.
     - **(b) El remoto cambió y diverge de lo tuyo.** Explicale que GitHub tiene cambios
       nuevos que no encajan automáticamente con lo que él tiene local, que eso hay que
       integrarlo a mano, y **frená para que él decida** cómo seguir. No improvises.
     - Si es otra cosa (cambios locales sin commitear que bloquean el pull, etc.),
       describila en palabras simples y preguntá cómo seguir.

4. **Leer el estado del proyecto.** Leé:
   - `CLAUDE.md` — sobre todo la sección "Estado actual del proyecto" (qué está hecho /
     qué queda) y "Modelo de orquestación".
   - `NOTEBOOK.md` — decisiones tomadas, deuda técnica conocida y gotchas del stack.

5. **Mirar los últimos commits** para saber qué se trabajó al final:
   - `git -C /Users/ignacioferrer/Proyectos/ariostoleague log --oneline -10`

6. **Resumir en pocas líneas** (en español, formato compacto), anclado en el foco de la
   última sesión (paso 2) si existía:
   - **Dónde quedó la última sesión** — si había `SESSION_STATE.md`: en qué estaba y cuál
     era el próximo paso anotado.
   - **En qué módulo estamos** — inferí del estado del proyecto y los commits recientes
     (stats, foro, asistente de CM, etc.).
   - **Qué se hizo en los últimos commits** — 2-3 bullets de lo más reciente.
   - **Deuda / decisión pendiente** — lo más relevante anotado en NOTEBOOK.md y en la
     sección "Lo que queda" de CLAUDE.md.

7. **Proponer por cuál tarea seguir.** Una recomendación concreta (no un menú largo),
   con un porqué corto. Si hay varias candidatas razonables, nombralas pero marcá tu
   sugerida primero. Recordá que la priorización formal (Now/Next/Later) vive en Notion
   y la define Nacho — vos proponés, él decide.
   - Cerrá mandándolo explícitamente a la vista correcta: "Confirmá tu próxima tarea
     contra la vista 🔥 Now del board de Ariosto en Notion — esa es la autoridad real de
     prioridad. Mi sugerencia de arriba es un punto de partida, no la última palabra."

## Notas

- Esta skill es de solo lectura + `git pull`: no commitea, no pushea, no edita nada.
  Solo reorienta.
- Si `NOTEBOOK.md` o `.claude/SESSION_STATE.md` no existen o están vacíos, no pasa nada:
  avisalo y seguí con lo que haya en CLAUDE.md y el log de git.
- No inventes el estado de tarjetas de Notion: el plan actual no permite listar/buscar
  tarjetas por query (ver "Acceso a Notion" en CLAUDE.md). Si Nacho quiere arrancar una
  tarea puntual, que pegue la spec o el ID/URL de la tarjeta.
