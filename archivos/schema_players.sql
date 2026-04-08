-- =============================================================
-- ARIOSTO LEAGUE — Tablas de jugadores
-- Ejecutar en: Supabase → SQL Editor
-- =============================================================

-- Jugadores de la Premier League
create table players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  position   text not null check (position in ('GKP', 'DEF', 'MID', 'FWD')),
  club       text not null,
  fpl_code   integer,
  created_at timestamptz default now(),
  unique(name, position, club)
);

-- Stats de cada jugador por fecha, por equipo fantasy
create table player_gameweeks (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id),
  manager_id  uuid not null references managers(id),
  season_id   uuid not null references seasons(id),
  gameweek    int  not null check (gameweek between 1 and 38),
  is_starter  boolean not null default true,
  -- Stats del partido real
  minutes     int  default 0,
  goals       int  default 0,
  assists     int  default 0,
  clean_sheet int  default 0,
  goals_conceded int default 0,
  own_goals   int  default 0,
  penalties_saved  int default 0,
  penalties_missed int default 0,
  yellow_cards int  default 0,
  red_cards    int  default 0,
  saves        int  default 0,
  bonus        int  default 0,
  bps          int  default 0,   -- raw bonus point system score
  -- Índice ICT
  influence    numeric default 0,
  creativity   numeric default 0,
  threat       numeric default 0,
  ict_index    numeric default 0,
  -- Expected stats
  expected_goals            numeric default 0,
  expected_assists          numeric default 0,
  expected_goal_involvements numeric default 0,
  expected_goals_conceded   numeric default 0,
  created_at  timestamptz default now(),
  unique(player_id, manager_id, season_id, gameweek)
);

-- Seguridad: lectura pública
alter table players          enable row level security;
alter table player_gameweeks enable row level security;

create policy "Public read" on players          for select using (true);
create policy "Public read" on player_gameweeks for select using (true);
