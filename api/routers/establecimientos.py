from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from api.database import get_db
from api.models.schemas import EstablecimientoResponse

router = APIRouter(prefix="/establecimientos", tags=["Establecimientos"])

NIVELES_VALIDOS = ("INI", "PRI", "SEC", "SUP")
SECTORES_VALIDOS = ("Estatal", "Privado", "Social/cooperativa")
AMBITOS_VALIDOS = ("Urbano", "Rural")


@router.get("", response_model=EstablecimientoResponse, summary="Consultar establecimientos educativos")
async def get_establecimientos(
    anio: Optional[int] = Query(None, ge=2011, le=2026),
    nivel: Optional[str] = Query(None, description="INI, PRI, SEC, SUP"),
    sector: Optional[str] = Query(None, description="Estatal, Privado"),
    ambito: Optional[str] = Query(None, description="Urbano, Rural"),
    jurisdiccion_id: Optional[int] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    filtros = []
    params = {"limit": limit, "offset": offset}

    if anio:
        filtros.append("h.anio = :anio")
        params["anio"] = anio

    if nivel:
        nivel = nivel.upper()
        if nivel not in NIVELES_VALIDOS:
            raise HTTPException(status_code=400, detail=f"Nivel inválido. Usá: {', '.join(NIVELES_VALIDOS)}")
        filtros.append("n.codigo_redfie = :nivel")
        params["nivel"] = nivel

    if sector:
        if sector not in SECTORES_VALIDOS:
            raise HTTPException(status_code=400, detail=f"Sector inválido. Usá: {', '.join(SECTORES_VALIDOS)}")
        filtros.append("h.sector = :sector")
        params["sector"] = sector

    if ambito:
        if ambito not in AMBITOS_VALIDOS:
            raise HTTPException(status_code=400, detail=f"Ámbito inválido. Usá: {', '.join(AMBITOS_VALIDOS)}")
        filtros.append("h.ambito = :ambito")
        params["ambito"] = ambito

    if jurisdiccion_id is not None:
        filtros.append("h.jurisdiccion_id = :jurisdiccion_id")
        params["jurisdiccion_id"] = jurisdiccion_id

    where = "WHERE " + " AND ".join(filtros) if filtros else ""

    sql = text(f"""
        SELECT j.nombre_oficial AS jurisdiccion,
               j.region,
               h.anio,
               h.sector,
               n.nombre_nivel AS nivel,
               h.ambito,
               h.total_escuelas
        FROM hechos_establecimientos h
        JOIN dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
        JOIN dim_niveles_educativos n ON h.nivel_id = n.nivel_id
        {where}
        ORDER BY h.anio DESC, j.nombre_oficial, n.orden_display, h.sector
        LIMIT :limit OFFSET :offset
    """)

    sql_count = text(f"""
        SELECT COUNT(*)
        FROM hechos_establecimientos h
        JOIN dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
        JOIN dim_niveles_educativos n ON h.nivel_id = n.nivel_id
        {where}
    """)

    result = await db.execute(sql, params)
    count_result = await db.execute(sql_count, {k: v for k, v in params.items() if k not in ("limit", "offset")})
    filas = result.mappings().all()
    total = count_result.scalar()

    return EstablecimientoResponse(
        total_registros=total,
        filtros_aplicados={k: v for k, v in {"anio": anio, "nivel": nivel, "sector": sector, "ambito": ambito, "jurisdiccion_id": jurisdiccion_id}.items() if v is not None},
        datos=[dict(f) for f in filas],
    )


@router.get("/serie-temporal", summary="Serie temporal de establecimientos")
async def get_serie_temporal_establecimientos(
    nivel: str = Query(..., description="INI, PRI, SEC o SUP"),
    sector: Optional[str] = Query(None, description="Estatal o Privado"),
    jurisdiccion_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    nivel = nivel.upper()
    if nivel not in NIVELES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Nivel inválido.")

    filtros = ["n.codigo_redfie = :nivel"]
    params = {"nivel": nivel}

    if sector:
        if sector not in SECTORES_VALIDOS:
            raise HTTPException(status_code=400, detail=f"Sector inválido.")
        filtros.append("h.sector = :sector")
        params["sector"] = sector

    if jurisdiccion_id is not None:
        filtros.append("h.jurisdiccion_id = :jurisdiccion_id")
        params["jurisdiccion_id"] = jurisdiccion_id

    where = "WHERE " + " AND ".join(filtros)

    sql = text(f"""
        SELECT j.nombre_oficial AS jurisdiccion,
               h.anio,
               h.sector,
               SUM(h.total_escuelas) AS total_escuelas
        FROM hechos_establecimientos h
        JOIN dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
        JOIN dim_niveles_educativos n ON h.nivel_id = n.nivel_id
        {where}
        GROUP BY j.nombre_oficial, h.anio, h.sector
        ORDER BY j.nombre_oficial, h.anio, h.sector
    """)

    result = await db.execute(sql, params)
    filas = result.mappings().all()

    return {
        "nivel": nivel,
        "sector": sector,
        "total_registros": len(filas),
        "datos": [dict(f) for f in filas],
    }
