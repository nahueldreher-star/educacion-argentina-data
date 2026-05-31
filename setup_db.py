import psycopg2

conn = psycopg2.connect('postgresql://educacion_argentina_db_user:oFiMCIv7GDa5gLM8hOwRXCXl5rv0rVxt@dpg-d8dn4sf40ujc73cs66ug-a.oregon-postgres.render.com/educacion_argentina_db')
conn.autocommit = True
cur = conn.cursor()

statements = [
    """CREATE TABLE IF NOT EXISTS dim_jurisdicciones (
        jurisdiccion_id       SMALLINT        NOT NULL,
        nombre_oficial        VARCHAR(100)    NOT NULL,
        nombre_corto          VARCHAR(40),
        region                VARCHAR(30)     NOT NULL,
        es_nacional           BOOLEAN         NOT NULL DEFAULT FALSE,
        granularidad          VARCHAR(20)     NOT NULL CHECK (granularidad IN ('PROVINCIAL', 'SUBPROVINCIAL')),
        jurisdiccion_padre_id SMALLINT        REFERENCES dim_jurisdicciones(jurisdiccion_id),
        created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        CONSTRAINT PK_dim_jurisdicciones PRIMARY KEY (jurisdiccion_id)
    )""",
    """CREATE TABLE IF NOT EXISTS dim_niveles_educativos (
        nivel_id         SMALLSERIAL     NOT NULL,
        codigo_redfie    VARCHAR(10)     NOT NULL,
        nombre_nivel     VARCHAR(80)     NOT NULL,
        orden_display    SMALLINT        NOT NULL,
        es_obligatorio   BOOLEAN,
        created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        CONSTRAINT PK_dim_niveles PRIMARY KEY (nivel_id),
        CONSTRAINT UQ_dim_niveles_codigo UNIQUE (codigo_redfie)
    )""",
    """CREATE TABLE IF NOT EXISTS dim_sectores (
        sector_id      SMALLSERIAL     NOT NULL,
        codigo_sector  CHAR(1)         NOT NULL,
        nombre_sector  VARCHAR(20)     NOT NULL,
        descripcion    VARCHAR(500),
        CONSTRAINT PK_dim_sectores PRIMARY KEY (sector_id),
        CONSTRAINT UQ_dim_sectores_codigo UNIQUE (codigo_sector)
    )""",
    """CREATE TABLE IF NOT EXISTS hechos_matricula_historica (
        matricula_id    BIGSERIAL       NOT NULL,
        anio_lectivo    SMALLINT        NOT NULL CHECK (anio_lectivo BETWEEN 1990 AND 2099),
        jurisdiccion_id SMALLINT        NOT NULL REFERENCES dim_jurisdicciones(jurisdiccion_id),
        nivel_id        SMALLINT        NOT NULL REFERENCES dim_niveles_educativos(nivel_id),
        sector_id       SMALLINT        NOT NULL REFERENCES dim_sectores(sector_id),
        total_alumnos   INTEGER         CHECK (total_alumnos >= 0),
        fuente_archivo  VARCHAR(200),
        fecha_ingesta   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        version_etl     VARCHAR(20)     NOT NULL DEFAULT '1.0',
        CONSTRAINT PK_hechos_matricula PRIMARY KEY (matricula_id),
        CONSTRAINT UQ_matricula_natural_key UNIQUE (anio_lectivo, jurisdiccion_id, nivel_id, sector_id)
    )""",
    "CREATE INDEX IF NOT EXISTS idx_hmh_anio_jur ON hechos_matricula_historica (anio_lectivo, jurisdiccion_id)",
    "CREATE INDEX IF NOT EXISTS idx_hmh_sector_nivel ON hechos_matricula_historica (sector_id, nivel_id)",
    """INSERT INTO dim_sectores (codigo_sector, nombre_sector, descripcion) VALUES
        ('E', 'Estatal', 'Gestion estatal'),
        ('P', 'Privado', 'Gestion privada')
        ON CONFLICT (codigo_sector) DO NOTHING""",
    """INSERT INTO dim_niveles_educativos (codigo_redfie, nombre_nivel, orden_display, es_obligatorio) VALUES
        ('INI', 'Educacion Inicial', 1, TRUE),
        ('PRI', 'Educacion Primaria', 2, TRUE),
        ('SEC', 'Educacion Secundaria', 3, TRUE),
        ('SUP', 'Educacion Superior No Universitaria', 4, FALSE),
        ('ESP', 'Educacion Especial', 5, NULL),
        ('ART', 'Educacion Artistica', 6, NULL),
        ('PER', 'Educacion Permanente EPJA', 7, FALSE)
        ON CONFLICT (codigo_redfie) DO NOTHING""",
    """INSERT INTO dim_jurisdicciones (jurisdiccion_id, nombre_oficial, nombre_corto, region, es_nacional, granularidad, jurisdiccion_padre_id) VALUES
        (0,   'Total Pais',             'Total Pais',         'NACIONAL',  TRUE,  'PROVINCIAL',    NULL),
        (2,   'Buenos Aires',           'Bs. As.',            'PAMPEANA',  FALSE, 'PROVINCIAL',    NULL),
        (6,   'Catamarca',              'Catamarca',          'NOA',       FALSE, 'PROVINCIAL',    NULL),
        (10,  'Chaco',                  'Chaco',              'NEA',       FALSE, 'PROVINCIAL',    NULL),
        (14,  'Chubut',                 'Chubut',             'PATAGONIA', FALSE, 'PROVINCIAL',    NULL),
        (18,  'Ciudad de Buenos Aires', 'CABA',               'GBA',       FALSE, 'PROVINCIAL',    NULL),
        (22,  'Cordoba',                'Cordoba',            'PAMPEANA',  FALSE, 'PROVINCIAL',    NULL),
        (26,  'Corrientes',             'Corrientes',         'NEA',       FALSE, 'PROVINCIAL',    NULL),
        (30,  'Entre Rios',             'Entre Rios',         'PAMPEANA',  FALSE, 'PROVINCIAL',    NULL),
        (34,  'Formosa',                'Formosa',            'NEA',       FALSE, 'PROVINCIAL',    NULL),
        (38,  'Jujuy',                  'Jujuy',              'NOA',       FALSE, 'PROVINCIAL',    NULL),
        (42,  'La Pampa',               'La Pampa',           'PAMPEANA',  FALSE, 'PROVINCIAL',    NULL),
        (46,  'La Rioja',               'La Rioja',           'NOA',       FALSE, 'PROVINCIAL',    NULL),
        (50,  'Mendoza',                'Mendoza',            'CUYO',      FALSE, 'PROVINCIAL',    NULL),
        (54,  'Misiones',               'Misiones',           'NEA',       FALSE, 'PROVINCIAL',    NULL),
        (58,  'Neuquen',                'Neuquen',            'PATAGONIA', FALSE, 'PROVINCIAL',    NULL),
        (62,  'Rio Negro',              'Rio Negro',          'PATAGONIA', FALSE, 'PROVINCIAL',    NULL),
        (66,  'Salta',                  'Salta',              'NOA',       FALSE, 'PROVINCIAL',    NULL),
        (70,  'San Juan',               'San Juan',           'CUYO',      FALSE, 'PROVINCIAL',    NULL),
        (74,  'San Luis',               'San Luis',           'CUYO',      FALSE, 'PROVINCIAL',    NULL),
        (78,  'Santa Cruz',             'Santa Cruz',         'PATAGONIA', FALSE, 'PROVINCIAL',    NULL),
        (82,  'Santa Fe',               'Santa Fe',           'PAMPEANA',  FALSE, 'PROVINCIAL',    NULL),
        (86,  'Santiago del Estero',    'Sgo. del Est.',      'NOA',       FALSE, 'PROVINCIAL',    NULL),
        (90,  'Tierra del Fuego',       'TDF',                'PATAGONIA', FALSE, 'PROVINCIAL',    NULL),
        (94,  'Tucuman',                'Tucuman',            'NOA',       FALSE, 'PROVINCIAL',    NULL),
        (201, 'GBA - Conurbano',        'Conurbano',          'GBA',       FALSE, 'SUBPROVINCIAL', 2),
        (202, 'GBA - Resto Provincia',  'Buenos Aires Resto', 'PAMPEANA',  FALSE, 'SUBPROVINCIAL', 2)
        ON CONFLICT (jurisdiccion_id) DO NOTHING""",
]

for i, stmt in enumerate(statements):
    cur.execute(stmt)
    print(f"Statement {i+1} OK")

cur.execute('SELECT COUNT(*) FROM dim_jurisdicciones')
print('Jurisdicciones:', cur.fetchone()[0])
cur.execute('SELECT COUNT(*) FROM dim_niveles_educativos')
print('Niveles:', cur.fetchone()[0])
cur.execute('SELECT COUNT(*) FROM dim_sectores')
print('Sectores:', cur.fetchone()[0])

cur.close()
conn.close()
print('DDL completado exitosamente.')
