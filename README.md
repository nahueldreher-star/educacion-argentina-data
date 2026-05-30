# Sistema Educativo Argentino — API de Datos Abiertos

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
