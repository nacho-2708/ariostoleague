-- =============================================================
-- ARIOSTO LEAGUE — Nombres de equipos por temporada
-- Ejecutar en: Supabase → SQL Editor
-- =============================================================

-- Temporada 2023/24
insert into team_seasons (manager_id, season_id, team_name) values
  ((select id from managers where alias = 'Comandante'), (select id from seasons where name = '2023/24'), 'Comandantes'),
  ((select id from managers where alias = 'Marculi'),    (select id from seasons where name = '2023/24'), 'Marculis ⭐️'),
  ((select id from managers where alias = 'Varela'),     (select id from seasons where name = '2023/24'), 'Varela Futbol Club'),
  ((select id from managers where alias = 'Ignagoat'),   (select id from seasons where name = '2023/24'), 'Ignagol'),
  ((select id from managers where alias = 'Manoloto'),   (select id from seasons where name = '2023/24'), 'Los manolotos'),
  ((select id from managers where alias = 'Papezar'),    (select id from seasons where name = '2023/24'), 'Papezared ⭐️'),
  ((select id from managers where alias = 'Bebito'),     (select id from seasons where name = '2023/24'), 'Mi Bebito siu siu 0.2'),
  ((select id from managers where alias = 'Cunha'),      (select id from seasons where name = '2023/24'), 'Los Santiagueños ⭐️'),
  ((select id from managers where alias = 'Wawri'),      (select id from seasons where name = '2023/24'), 'Wawrinka F.C.'),
  ((select id from managers where alias = 'Sir Jagger'), (select id from seasons where name = '2023/24'), 'Ciclon Athletic'),
  ((select id from managers where alias = 'Canter'),     (select id from seasons where name = '2023/24'), 'MrCanter'),
  ((select id from managers where alias = 'RG'),         (select id from seasons where name = '2023/24'), 'Intocables');

-- Temporada 2024/25
insert into team_seasons (manager_id, season_id, team_name) values
  ((select id from managers where alias = 'Comandante'), (select id from seasons where name = '2024/25'), 'Comandantes'),
  ((select id from managers where alias = 'Marculi'),    (select id from seasons where name = '2024/25'), 'Marculis ⭐️'),
  ((select id from managers where alias = 'Varela'),     (select id from seasons where name = '2024/25'), 'Varela Futbol Club'),
  ((select id from managers where alias = 'Ignagoat'),   (select id from seasons where name = '2024/25'), 'Ignagol'),
  ((select id from managers where alias = 'Manoloto'),   (select id from seasons where name = '2024/25'), 'Los manolotos'),
  ((select id from managers where alias = 'Papezar'),    (select id from seasons where name = '2024/25'), 'Papezared ⭐️'),
  ((select id from managers where alias = 'Bebito'),     (select id from seasons where name = '2024/25'), 'Mi Bebito siu siu .3'),
  ((select id from managers where alias = 'Cunha'),      (select id from seasons where name = '2024/25'), 'Los Santiagueños ⭐️'),
  ((select id from managers where alias = 'Wawri'),      (select id from seasons where name = '2024/25'), 'Wawrinka F.C.'),
  ((select id from managers where alias = 'Sir Jagger'), (select id from seasons where name = '2024/25'), 'Jagger Athletic'),
  ((select id from managers where alias = 'Canter'),     (select id from seasons where name = '2024/25'), 'MrCanter'),
  ((select id from managers where alias = 'RG'),         (select id from seasons where name = '2024/25'), 'Intocables');
