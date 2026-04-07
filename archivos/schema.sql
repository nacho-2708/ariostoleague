-- =============================================================
-- ARIOSTO LEAGUE — Database Schema
-- Ejecutar en: Supabase → SQL Editor
-- =============================================================

-- ---------------------------------------------------------------
-- TABLAS
-- ---------------------------------------------------------------

create table managers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  alias       text not null unique,
  created_at  timestamptz default now()
);

create table seasons (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,       -- "2023/24"
  start_year    int  not null,
  end_year      int  not null,
  is_current    boolean not null default false,
  has_full_data boolean not null default true,  -- false = solo campeón, sin partidos
  champion_id   uuid references managers(id),
  created_at    timestamptz default now()
);

create table team_seasons (
  id          uuid primary key default gen_random_uuid(),
  manager_id  uuid not null references managers(id),
  season_id   uuid not null references seasons(id),
  team_name   text not null,
  created_at  timestamptz default now(),
  unique(manager_id, season_id)
);

create table fixtures (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid not null references seasons(id),
  gameweek    int,                              -- null en datos históricos
  manager1_id uuid not null references managers(id),
  manager2_id uuid not null references managers(id),
  score1      int  not null check (score1 >= 0),
  score2      int  not null check (score2 >= 0),
  created_at  timestamptz default now(),
  check (manager1_id != manager2_id)
);

-- ---------------------------------------------------------------
-- SEGURIDAD (RLS): lectura pública, escritura solo por servidor
-- ---------------------------------------------------------------

alter table managers    enable row level security;
alter table seasons     enable row level security;
alter table team_seasons enable row level security;
alter table fixtures    enable row level security;

create policy "Public read" on managers     for select using (true);
create policy "Public read" on seasons      for select using (true);
create policy "Public read" on team_seasons for select using (true);
create policy "Public read" on fixtures     for select using (true);

-- ---------------------------------------------------------------
-- DATOS: Managers
-- ---------------------------------------------------------------

insert into managers (full_name, alias) values
  ('Ignacio Ferrer',       'Comandante'),
  ('Marcos Arocena',       'Marculi'),
  ('Felipe Arricar',       'Varela'),
  ('Ignacio Arricar',      'Ignagoat'),
  ('Manuel Gallinal',      'Manoloto'),
  ('Juan Martin Gallinal', 'Papezar'),
  ('Rafael Gallinal',      'Bebito'),
  ('Santiago Gonzalez',    'Cunha'),
  ('Javier Villamil',      'Wawri'),
  ('Diego Abreu',          'Sir Jagger'),
  ('Rodrigo Garcia',       'RG'),
  ('Martin Cantera',       'Canter');

-- ---------------------------------------------------------------
-- DATOS: Temporadas (con campeones)
-- ---------------------------------------------------------------

insert into seasons (name, start_year, end_year, is_current, has_full_data, champion_id) values
  ('2021/22', 2021, 2022, false, false, (select id from managers where alias = 'Marculi')),
  ('2022/23', 2022, 2023, false, false, (select id from managers where alias = 'Cunha')),
  ('2023/24', 2023, 2024, false, true,  (select id from managers where alias = 'Papezar')),
  ('2024/25', 2024, 2025, false, true,  (select id from managers where alias = 'RG')),
  ('2025/26', 2025, 2026, true,  true,  null);
