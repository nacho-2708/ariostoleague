# Ariosto League — Cursor Instructions

## Project Overview
Ariosto League is a private web platform for a 12-manager Fantasy Premier League Draft competition.
It displays historical and current season stats, match results, head-to-head records, and league
rankings. It also includes a basic forum tied to gameweeks, and tools to generate Instagram content.

## Stack
- Framework: Next.js 15 (App Router, TypeScript)
- Styling: Tailwind CSS + shadcn/ui
- Database: Supabase (PostgreSQL + Auth + Realtime)
- Deployment: Vercel

## Project Structure
- /src/app → Next.js App Router pages and layouts
- /src/components → Reusable UI components
- /src/lib → Utilities, Supabase client, helpers
- /src/types → TypeScript type definitions

## Domain Knowledge
- The league uses FPL Draft mode (private league, 12 managers)
- Each gameweek has fixtures between managers (head-to-head format)
- The league has 4 seasons of historical data
- Current season data is fetched from the FPL Draft API

## Key Entities
- Manager: a participant in the league
- Season: a full FPL season (e.g. 2024/25)
- Gameweek: a single round within a season (up to 38)
- Fixture: a head-to-head match between two managers in a gameweek
- Standing: league table position at a given point in the season

## Code Conventions
- Always use TypeScript with proper types
- Prefer server components in Next.js unless interactivity is needed
- Keep Supabase queries in /src/lib/supabase/
- Use shadcn/ui components when possible before building custom ones
- Comments in English, but you can respond to me in Spanish

## Product Context
- 12 managers, 4 seasons of historical data (stored in Excel, to be imported)
- Current season data comes from FPL Draft API (to be automated gameweek by gameweek)
- Historical data includes: match results, scores, team names, season champions
- Target users: the 12 managers + friends/family who follow the league
- The platform is semi-public (anyone can view, managers log in for forum/interactions)

## Modules to Build (in priority order)
1. Database schema design + historical data import
2. Current season dashboard (standings, fixtures, gameweek results)
3. Manager profiles (personal stats, head-to-head history)
4. Historical rankings (champions, records, all-time stats)
5. Forum tied to gameweeks (not a generic forum)
6. Instagram CM assistant (auto-generate weekly visual assets + copy suggestions)

## Current Status
- Next.js 15 project initialized with TypeScript, Tailwind, ESLint, App Router
- shadcn/ui: pending install
- Supabase: pending setup
- Next step: install shadcn/ui, then design the database schema based on Excel data