from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from api.database import get_db
from api.models.schemas import IndicadorResponse

router = APIRouter(prefix="/indicadores", tags=["Indicadores"])

INDICADORES_VALIDOS = ("REP", "ABN", "SOB")
NIVELES_VALIDOS = ("INI", "PRI", "SEC", "SUP", "ESP", "PER")


@router.get("", response_model=IndicadorResponse, summary="Consultar indicadores de trayectoria")
async def get_indicadores(
    indicador: Optional[str] = Query(None, description="REP=Repitencia, ABN=Abandono, SOB=Sobreedad"),
    nivel: Optional[str] = Query(None, description="INI, PRI, SEC, SUP"),
    anio: Optional[int] = Query(None, ge=2007, le=2099),
    jurisdiccion_id: Optional[int] = Query(None),
    anio_estudio: Optional[str] = Query(None, description="Total, 1°, 2°, etc."),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    filtros = []
    params = {"limit": limit, "offset": offset}

    if indicador:
        indicador = indicador.upper()
        if indicador not in INDICADORES_VALIDOS:
            raise HTTPException(status_code=400, detail=f"Indicador inválido. Usá: {', '.join(INDICADORES_VALIDOS)}")
        filtros.append("i.codigo = :indicador")
        params["indicador"] = indicador

    if nivel:
        nivel = nivel.upper()
        if nivel not in NIVELES_VALIDOS:
            raise HTTPException(status_code=400, detail=f"Nivel inválido. Usá: {', '.join(NIVELES_VALIDOS)}")
        filtros.append("n.codigo_redfie = :nivel")
        params["nivel"] = nivel

    if anio:
        filtros.append("h.anio_lectivo = :anio")
        params["anio"] = anio

    if jurisdiccion_id is not None:
        filtros.append("h.jurisdiccion_id = :jurisdiccion_id")
        params["jurisdiccion_id"] = jurisdiccion_id

    if anio_estudio:
        filtros.append("h.anio_estudio = :anio_estudio")
        params["anio_estudio"] = anio_estudio

    where = "WHERE " + " AND ".join(filtros) if filtros else ""

    sql = text(f"""
        SELECT j.nombre_oficial AS jurisdiccion,
               j.region,
               i.nombre AS indicador,
               n.nombre_nivel AS nivel,
               h.anio_lectivo,
               h.anio_estudio,
               h.valor
        FROM hechos_indicadores_trayectoria h
        JOIN dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
        JOIN dim_indicadores i ON h.indicador_id = i.indicador_id
        JOIN dim_niveles_educativos n ON h.nivel_id = n.nivel_id
        {where}
        ORDER BY h.anio_lectivo DESC, j.nombre_oficial, i.codigo, n.orden_display
        LIMIT :limit OFFSET :offset
    """)

    sql_count = text(f"""
        SELECT COUNT(*)
        FROM hechos_indicadores_trayectoria h
        JOIN dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
        JOIN dim_indicadores i ON h.indicador_id = i.indicador_id
        JOIN dim_niveles_educativos n ON h.nivel_id = n.nivel_id
        {where}
    """)

    result = await db.execute(sql, params)
    count_result = await db.execute(sql_count, {k: v for k, v in params.items() if k not in ("limit", "offset")})
    filas = result.mappings().all()
    total = count_result.scalar()

    return IndicadorResponse(
        total_registros=total,
        filtros_aplicados={k: v for k, v in {"indicador": indicador, "nivel": nivel, "anio": anio, "jurisdiccion_id": jurisdiccion_id, "anio_estudio": anio_estudio}.items() if v is not None},
        advertencia="Los indicadores se expresan como porcentaje. Fuente: Relevamientos Anuales - RedFIE/DIE.",
        datos=[dict(f) for f in filas],
    )


@router.get("/serie-temporal", summary="Serie temporal de indicadores")
async def get_serie_temporal_indicadores(
    indicador: str = Query(..., description="REP, ABN o SOB"),
    nivel: str = Query(..., description="PRI o SEC"),
    jurisdiccion_id: Optional[int] = Query(None),
    anio_estudio: str = Query("Total", description="Total o año de estudio específico"),
    db: AsyncSession = Depends(get_db),
):
    indicador = indicador.upper()
    nivel = nivel.upper()

    if indicador not in INDICADORES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Indicador inválido. Usá: {', '.join(INDICADORES_VALIDOS)}")
    if nivel not in NIVELES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Nivel inválido.")

    filtros = ["i.codigo = :indicador", "n.codigo_redfie = :nivel", "h.anio_estudio = :anio_estudio"]
    params = {"indicador": indicador, "nivel": nivel, "anio_estudio": anio_estudio}

    if jurisdiccion_id is not None:
        filtros.append("h.jurisdiccion_id = :jurisdiccion_id")
        params["jurisdiccion_id"] = jurisdiccion_id

    where = "WHERE " + " AND ".join(filtros)

    sql = text(f"""
        SELECT j.nombre_oficial AS jurisdiccion,
               h.anio_lectivo,
               h.valor
        FROM hechos_indicadores_trayectoria h
        JOIN dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
        JOIN dim_indicadores i ON h.indicador_id = i.indicador_id
        JOIN dim_niveles_educativos n ON h.nivel_id = n.nivel_id
        {where}
        ORDER BY j.nombre_oficial, h.anio_lectivo
    """)

    result = await db.execute(sql, params)
    filas = result.mappings().all()

    return {
        "indicador": indicador,
        "nivel": nivel,
        "anio_estudio": anio_estudio,
        "total_registros": len(filas),
        "datos": [dict(f) for f in filas],
    }
