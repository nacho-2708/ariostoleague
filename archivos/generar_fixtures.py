"""
Lee el Excel de historial y genera un archivo SQL con todos los fixtures.
Ejecutar desde la raiz del proyecto: python3 archivos/generar_fixtures.py
"""
import zipfile
import xml.etree.ElementTree as ET

# Mapeo de nombre de equipo en el Excel → alias del manager en la DB
TEAM_TO_ALIAS = {
    "MARCULIS":      "Marculi",
    "COMANDANTES":   "Comandante",
    "INTOCABLES":    "RG",
    "SANTIAGUEÑOS":  "Cunha",
    "SANTIGUEÑOS":   "Cunha",   # typo en el Excel
    "MANOLOTOS":     "Manoloto",
    "IGNAGOL":       "Ignagoat",
    "JAGGER":        "Sir Jagger",
    "PAPEZARED":     "Papezar",
    "BEBITO":        "Bebito",
    "WAWRINKA":      "Wawri",
    "VARELA":        "Varela",
    "CANTER":        "Canter",
}

# Columnas del Excel → temporada
# D,E,F,G = partidos de la temporada 2023/24
# I,J,K,L = partidos de la temporada 2024/25
SEASON_2324 = ["D", "E", "F", "G"]
SEASON_2425 = ["I", "J", "K", "L"]

def parse_excel(path):
    with zipfile.ZipFile(path) as z:
        with z.open("xl/sharedStrings.xml") as f:
            tree = ET.parse(f)
            ns = {"ns": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            strings = [
                si.find(".//ns:t", ns).text
                for si in tree.findall(".//ns:si", ns)
                if si.find(".//ns:t", ns) is not None
            ]

        with z.open("xl/worksheets/sheet1.xml") as f:
            tree = ET.parse(f)
            ns = {"ns": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            rows = {}
            for row in tree.findall(".//ns:row", ns):
                rownum = int(row.get("r"))
                cells = {}
                for cell in row.findall("ns:c", ns):
                    ref = cell.get("r")
                    col = "".join(c for c in ref if c.isalpha())
                    t = cell.get("t")
                    v = cell.find("ns:v", ns)
                    if v is not None:
                        if t == "s":
                            cells[col] = strings[int(v.text)]
                        else:
                            try:
                                cells[col] = int(float(v.text))
                            except ValueError:
                                cells[col] = v.text
                rows[rownum] = cells
    return rows

def generar_fixture_sql(alias1, alias2, score1, score2, season_name):
    return (
        f"insert into fixtures (season_id, manager1_id, manager2_id, score1, score2) values ("
        f"(select id from seasons where name = '{season_name}'), "
        f"(select id from managers where alias = '{alias1}'), "
        f"(select id from managers where alias = '{alias2}'), "
        f"{score1}, {score2});"
    )

def main():
    rows = parse_excel("archivos/historial_ariosto_league.xlsx")

    fixtures_sql = []
    errores = []

    # Los datos empiezan en fila 7, grupos de 3 filas (manager1, manager2, empates)
    start_row = 7
    total_rows = max(rows.keys())

    i = start_row
    while i <= total_rows - 2:
        row1 = rows.get(i, {})
        row2 = rows.get(i + 1, {})
        # row3 = empates, no la necesitamos (lo calculamos desde scores)

        name1 = row1.get("C")
        name2 = row2.get("C")

        # Saltar filas que no son pares de managers
        if not name1 or not name2:
            i += 1
            continue
        if name1 not in TEAM_TO_ALIAS or name2 not in TEAM_TO_ALIAS:
            i += 3
            continue

        alias1 = TEAM_TO_ALIAS[name1]
        alias2 = TEAM_TO_ALIAS[name2]

        # Temporada 2023/24 (columnas D, E, F, G)
        for col in SEASON_2324:
            s1 = row1.get(col)
            s2 = row2.get(col)
            if isinstance(s1, int) and isinstance(s2, int):
                fixtures_sql.append(generar_fixture_sql(alias1, alias2, s1, s2, "2023/24"))

        # Temporada 2024/25 (columnas I, J, K, L)
        for col in SEASON_2425:
            s1 = row1.get(col)
            s2 = row2.get(col)
            if isinstance(s1, int) and isinstance(s2, int):
                fixtures_sql.append(generar_fixture_sql(alias1, alias2, s1, s2, "2024/25"))

        i += 3

    # Escribir archivo SQL
    output = "-- Fixtures importados del Excel histórico\n"
    output += f"-- Total partidos: {len(fixtures_sql)}\n\n"
    output += "\n".join(fixtures_sql)
    output += "\n"

    with open("archivos/fixtures_import.sql", "w") as f:
        f.write(output)

    print(f"✓ Generados {len(fixtures_sql)} fixtures → archivos/fixtures_import.sql")
    if errores:
        print(f"  Errores: {errores}")

if __name__ == "__main__":
    main()
