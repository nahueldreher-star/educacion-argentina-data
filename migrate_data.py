import pyodbc
import psycopg2

print("Conectando a SQL Server local...")
sql_conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=educacion_argentina;"
    "Trusted_Connection=yes;"
)

print("Conectando a PostgreSQL Render...")
pg_conn = psycopg2.connect("postgresql://educacion_argentina_db_user:oFiMCIv7GDa5gLM8hOwRXCXl5rv0rVxt@dpg-d8dn4sf40ujc73cs66ug-a.oregon-postgres.render.com/educacion_argentina_db")
pg_conn.autocommit = False
pg_cur = pg_conn.cursor()

sql_cur = sql_conn.cursor()
sql_cur.execute("""
    SELECT
        h.anio_lectivo,
        j.nombre_oficial,
        n.codigo_redfie,
        s.codigo_sector,
        h.total_alumnos,
        h.fuente_archivo
    FROM dbo.hechos_matricula_historica h
    JOIN dbo.dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
    JOIN dbo.dim_niveles_educativos n ON h.nivel_id = n.nivel_id
    JOIN dbo.dim_sectores s ON h.sector_id = s.sector_id
""")

filas = sql_cur.fetchall()
print(f"Filas a migrar: {len(filas)}")

insertadas = 0
errores = []

for fila in filas:
    anio, jur_nombre, cod_nivel, cod_sector, total, fuente = fila

    pg_cur.execute("SELECT jurisdiccion_id FROM dim_jurisdicciones WHERE LOWER(nombre_oficial) = LOWER(%s) OR LOWER(nombre_corto) = LOWER(%s)", (jur_nombre, jur_nombre))
    jur = pg_cur.fetchone()

    pg_cur.execute("SELECT nivel_id FROM dim_niveles_educativos WHERE codigo_redfie = %s", (cod_nivel,))
    nivel = pg_cur.fetchone()

    pg_cur.execute("SELECT sector_id FROM dim_sectores WHERE codigo_sector = %s", (cod_sector,))
    sector = pg_cur.fetchone()

    if not jur or not nivel or not sector:
        errores.append(f"No mapeado: {jur_nombre} / {cod_nivel} / {cod_sector}")
        continue

    pg_cur.execute("""
        INSERT INTO hechos_matricula_historica
            (anio_lectivo, jurisdiccion_id, nivel_id, sector_id, total_alumnos, fuente_archivo, version_etl)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (anio_lectivo, jurisdiccion_id, nivel_id, sector_id)
        DO UPDATE SET total_alumnos = EXCLUDED.total_alumnos, fecha_ingesta = NOW()
    """, (anio, jur[0], nivel[0], sector[0], total, fuente, "1.2"))
    insertadas += 1

pg_conn.commit()
print(f"Migracion completa: {insertadas} filas insertadas | {len(errores)} errores")
if errores:
    for e in errores:
        print(f"  ERROR: {e}")

pg_cur.close()
pg_conn.close()
sql_cur.close()
sql_conn.close()
