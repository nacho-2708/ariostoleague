---
name: session-end
description: Cierra una sesión de trabajo en Ariosto League de forma ordenada — complementaria a session-start. Use cuando Nacho termina de trabajar y quiere dejar todo prolijo (e.g. "cerremos", "terminamos por hoy", "cierre de sesión", "session end", o /session-end). Resume la sesión, actualiza NOTEBOOK.md si hace falta, commitea, pushea a main, cierra la tarjeta en Notion y deja escrito el foco actual para la próxima vez.
---

# Session end — cerrar la jornada de Ariosto League sin dejar cabos sueltos

El objetivo es cerrar cada sesión de trabajo de forma ordenada: que el código llegue a
GitHub, que la deuda nueva quede anotada, que la tarjeta de Notion se cierre solo cuando
corresponde, y que quede escrito en qué andaba para que `session-start` lo retome la
próxima vez. Es el espejo de `session-start`. Nacho es novato — narrá en español, claro
y sin jerga innecesaria, y **no commitees, pushees ni cierres tarjetas sin mostrarle qué
vas a hacer primero**.

Repo: `/Users/ignacioferrer/Proyectos/ariostoleague` (rama de trabajo: `main`).

El modelo de trabajo completo está en la sección **"Modelo de orquestación"** de
`CLAUDE.md`. Lo clave para esta skill:
- **GitHub es la fuente de verdad.** El trabajo no cuenta hasta estar pusheado a `main`.
- **Claude Code solo cierra en Notion tarjetas que ejecutó** — nunca crea ni reprioriza.
- Cada commit que cierra una tarea lleva prefijo (`feat:`/`fix:`/`docs:`/`chore:`/
  `refactor:`) + referencia a la tarjeta de Notion que originó el trabajo.

## Pasos — EN ESTE ORDEN (el orden importa)

1. **Resumen de la sesión.** Mostrá qué se tocó y los cambios principales:
   - `git -C /Users/ignacioferrer/Proyectos/ariostoleague status --short`
   - `git -C /Users/ignacioferrer/Proyectos/ariostoleague diff --stat` (y un resumen en
     palabras de los cambios principales, no el diff crudo entero).
   - **Pará y pedí confirmación:** preguntale a Nacho si eso es lo que esperaba antes de
     seguir. Si algo no cierra, resolvelo acá antes de avanzar.

2. **Actualizar `NOTEBOOK.md` si hace falta.** Si en la sesión surgió:
   - **deuda técnica** → sección "Deuda técnica conocida",
   - **una decisión de diseño no obvia** → sección "Decisiones tomadas",
   - **un gotcha del stack** → sección "Gotchas del stack".
   Anotalo en la sección que corresponda. **Si no surgió nada de esto, decilo
   explícitamente y salteá este paso** — no inventes entradas para llenar.

3. **Commit siguiendo la convención del proyecto.**
   - Prefijo correcto (`feat:`/`fix:`/`docs:`/`chore:`/`refactor:`) según lo que originó
     el cambio.
   - En el **cuerpo** del commit, una referencia a la tarjeta de Notion que originó el
     trabajo (URL o nombre de la tarjeta).
   - **Si no sabés a qué tarjeta corresponde, preguntáselo a Nacho ANTES de commitear.**
     No commitees sin la referencia.

4. **PUSH a `main`** — paso explícito y propio:
   - `git -C /Users/ignacioferrer/Proyectos/ariostoleague push origin main`
   - **Si el push falla por cualquier razón, FRENÁ ACÁ. No sigas al paso 5.** Explicale a
     Nacho en castellano simple qué pasó (remoto cambió y diverge, sin conexión, permisos,
     etc.) y qué hacer. Nunca hagas merges ni rebases automáticos.
   - **Una tarjeta no se cierra NUNCA si el código no llegó a GitHub.**

5. **Cerrar la tarjeta en Notion** — SOLO si el push del paso 4 salió bien.
   - Usá el MCP de Notion conectado: mové la tarjeta a **Done** y dejá la referencia del
     commit (hash o mensaje) en el cuerpo de la tarjeta o como comentario.
   - **El plan de Notion no permite buscar tarjetas por query**, así que pedile a Nacho el
     **ID o la URL** de la tarjeta que estás cerrando. No intentes adivinarla.
   - Recordá: solo cerrás tarjetas que se ejecutaron en esta sesión. No creás ni
     repriorizás nada.

6. **Escribir el foco actual** en `.claude/SESSION_STATE.md` (crealo si no existe).
   Sobrescribilo cada vez — es una foto del "ahora", no un historial. Corto, 3-4 líneas:
   ```
   # Foco actual — Ariosto League
   _Actualizado: <fecha>_

   - **En qué estaba:** <lo que se trabajó esta sesión>
   - **Próximo paso:** <lo más lógico para retomar>
   - **Notas:** <algo a tener en cuenta al volver, si aplica>
   ```
   Esto es lo que `session-start` lee la próxima vez para que Nacho no tenga que
   acordarse de nada.

7. **Commit + push del foco** — paso final, SIEMPRE después de cerrar Notion.
   - `.claude/SESSION_STATE.md` está versionado, así que el foco viaja con el repo.
   - Es un **commit aparte, de cierre**, que NO se mezcla con el commit del trabajo de la
     sesión (paso 3): `chore: update session state`. Como no sale de una tarjeta, **sin
     referencia a Notion**.
   - `git -C /Users/ignacioferrer/Proyectos/ariostoleague add .claude/SESSION_STATE.md`
     → commit → `git push origin main`.
   - Si el push de este commit falla, avisá en castellano simple — pero el trabajo de la
     sesión ya está a salvo (se pusheó en el paso 4); esto es solo el foco.

## Notas

- El orden es sagrado: **trabajo → push → Notion → y recién al final, commit+push del
  foco.** Si el push del paso 4 no salió, la tarjeta queda abierta. Punto.
- Si no hay nada para commitear (working tree limpio), no fuerces un commit vacío:
  avisá que no hubo cambios y pasá directo a escribir el foco actual (paso 6).
- Esta skill es el espejo de `session-start`. Si cambia un path o una convención en una,
  revisá la otra.
