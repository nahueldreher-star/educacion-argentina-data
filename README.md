# Sistema Educativo Argentino — API de Datos Abiertos

## Qué muestra

En Argentina la trayectoria teórica dice que un alumno entra a los 6 años y
termina la secundaria a los 17. Los datos muestran otra cosa: **1 de cada 12
alumnos de secundaria no vuelve al año siguiente**. En Misiones esa proporción
es 1 de cada 8; en Neuquén, 1 de cada 19.

Mapa interactivo: https://educacion-argentina-data.vercel.app

*(Fuente: Ministerio de Educación de la Nación — Abandono interanual secundaria 2024)*

API pública con datos de matrícula del sistema educativo argentino por nivel, sector y jurisdicción.

## Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/matricula` | Matrícula con filtros opcionales |
| GET | `/api/v1/matricula/resumen-nacional/{anio}` | Totales nacionales por año |
| GET | `/api/v1/matricula/serie-temporal` | Evolución histórica |

## Filtros disponibles

`?anio=2025` `?nivel=PRI` `?sector=E` `?region=NOA` `?incluir_subprovincial=true`

## Niveles

| Código | Nivel |
|--------|-------|
| INI | Educación Inicial |
| PRI | Educación Primaria |
| SEC | Educación Secundaria |
| SUP | Educación Superior No Universitaria |

## Fuente

Anuarios Estadísticos — Ministerio de Educación de la Nación (RedFIE).

## Autor

Nahuel Dreher — Analista de Datos & BI | Trabajo Social (UBA)
[LinkedIn](https://www.linkedin.com/in/nahuel-dreher-00594a22a/)
