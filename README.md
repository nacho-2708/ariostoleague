# Ariosto League

Plataforma web para una liga privada de Fantasy Premier League Draft de 12 managers.

Repo personal. No es un producto público.

## Setup rápido

```bash
npm install
cp .env.local.example .env.local   # llenar las variables (ver CLAUDE.md)
npm run dev
```

Abrir http://localhost:3000.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · shadcn/ui · Supabase · FPL Draft API

## Docs internas

- **[CLAUDE.md](./CLAUDE.md)** — instrucciones para Claude Code / Cursor, estructura del proyecto, regla crítica sobre Next 16
- **[NOTEBOOK.md](./NOTEBOOK.md)** — cuadernola viva: deuda técnica, decisiones, gotchas, ideas
- **[archivos/legacy/](./archivos/legacy/)** — docs viejos archivados

## Sync con FPL API

```bash
curl -X POST http://localhost:3000/api/sync -H "Authorization: Bearer $SYNC_SECRET"
```
