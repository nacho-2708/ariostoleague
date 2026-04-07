"""
Lee los CSVs de jugadores y genera SQL para importar players y player_gameweeks.
Ejecutar desde la raiz del proyecto: python3 archivos/generar_players.py
"""
import csv
import os

FOLDER = "archivos/Ariosto League/data/fpl/participantes/"
SEASON = "2024/25"

# Mapeo de nombre de equipo fantasy → alias del manager en la DB
TEAM_TO_ALIAS = {
    "Comandantes":          "Comandante",
    "Ignagol":              "Ignagoat",
    "Jagger Athletic":      "Sir Jagger",
    "Los Santiagueños ⭐️": "Cunha",
    "Los manolotos":        "Manoloto",
    "Marculis ⭐️":         "Marculi",
    "Mi Bebito siu siu .3": "Bebito",
    "MrCanter":             "Canter",
    "Papezared ⭐️":        "Papezar",
    "Varela Futbol Club":   "Varela",
    "Wawrinka F.C.":        "Wawri",
}

def leer_todos_los_csv():
    files = sorted([f for f in os.listdir(FOLDER) if f.endswith(".csv")])
    all_rows = []
    for f in files:
        with open(FOLDER + f, encoding="utf-8") as fp:
            reader = csv.DictReader(fp)
            all_rows.extend(list(reader))
    print(f"  Leidos {len(all_rows)} registros de {len(files)} archivos")
    return all_rows

def safe(val, type_=float, default=0):
    try:
        return type_(val) if val not in ("", None) else default
    except (ValueError, TypeError):
        return default

def main():
    rows = leer_todos_los_csv()

    # 1. Jugadores únicos (name + position + club)
    players = {}  # (name, position, club) → True
    for r in rows:
        key = (r["Player"], r["Position"], r["Team"])
        players[key] = True

    print(f"  Jugadores únicos: {len(players)}")

    # 2. Generar INSERT de players
    players_sql = []
    for (name, position, club) in sorted(players.keys()):
        name_esc = name.replace("'", "''")
        club_esc = club.replace("'", "''")
        players_sql.append(
            f"insert into players (name, position, club) values "
            f"('{name_esc}', '{position}', '{club_esc}') "
            f"on conflict (name, position, club) do nothing;"
        )

    # 3. Generar INSERT de player_gameweeks
    pgw_sql = []
    for r in rows:
        alias = TEAM_TO_ALIAS.get(r["Fantasy_team"])
        if not alias:
            print(f"  WARNING: Fantasy_team desconocido: {r['Fantasy_team']}")
            continue

        name_esc  = r["Player"].replace("'", "''")
        club_esc  = r["Team"].replace("'", "''")
        position  = r["Position"]
        gw        = int(r["GW"])
        is_starter = "true" if r["Is_starter"] == "True" else "false"

        pgw_sql.append(
            f"insert into player_gameweeks "
            f"(player_id, manager_id, season_id, gameweek, is_starter, "
            f"minutes, goals, assists, clean_sheet, goals_conceded, own_goals, "
            f"penalties_saved, penalties_missed, yellow_cards, red_cards, saves, "
            f"bonus, bps, influence, creativity, threat, ict_index, "
            f"expected_goals, expected_assists, expected_goal_involvements, expected_goals_conceded) "
            f"values ("
            f"(select id from players where name='{name_esc}' and position='{position}' and club='{club_esc}'), "
            f"(select id from managers where alias='{alias}'), "
            f"(select id from seasons where name='{SEASON}'), "
            f"{gw}, {is_starter}, "
            f"{safe(r['MP'], int)}, {safe(r['GS'], int)}, {safe(r['A'], int)}, "
            f"{safe(r['CS'], int)}, {safe(r['GC'], int)}, {safe(r['OG'], int)}, "
            f"{safe(r['PS'], int)}, {safe(r['PM'], int)}, {safe(r['YC'], int)}, "
            f"{safe(r['RC'], int)}, {safe(r['S'], int)}, "
            f"{safe(r['B'], int)}, {safe(r['BPS'], int)}, "
            f"{safe(r['I'])}, {safe(r['C'])}, {safe(r['T'])}, {safe(r['II'])}, "
            f"{safe(r['EG'])}, {safe(r['EA'])}, {safe(r['EGI'])}, {safe(r['EGC'])}"
            f") on conflict (player_id, manager_id, season_id, gameweek) do nothing;"
        )

    # 4. Escribir archivos
    with open("archivos/players_import.sql", "w") as f:
        f.write(f"-- Players únicos de la temporada {SEASON}\n")
        f.write(f"-- Total: {len(players_sql)} jugadores\n\n")
        f.write("\n".join(players_sql))
        f.write("\n")

    with open("archivos/player_gameweeks_import.sql", "w") as f:
        f.write(f"-- Player gameweeks — temporada {SEASON}\n")
        f.write(f"-- Total: {len(pgw_sql)} registros\n\n")
        f.write("\n".join(pgw_sql))
        f.write("\n")

    print(f"  ✓ {len(players_sql)} jugadores → archivos/players_import.sql")
    print(f"  ✓ {len(pgw_sql)} registros  → archivos/player_gameweeks_import.sql")

if __name__ == "__main__":
    main()
