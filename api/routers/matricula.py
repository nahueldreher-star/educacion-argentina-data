from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from api.database import get_db
from api.models.schemas import MatriculaResponse, ResumenNacionalResponse

router = APIRouter(prefix="/matricula", tags=["Matricula"])

@router.get("", response_model=MatriculaResponse, summary="Consultar matricula")
async def get_matricula(
    anio: Optional[int] = Query(None, ge=1990, le=2099),
    nivel: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    jurisdiccion_id: Optional[int] = Query(None),
    region: Optional[str] = Query(None),
    incluir_subprovincial: bool = Query(False),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    filtros = ["j.es_nacional = false"]
    params = {"limit": limit, "offset": offset}
    if not incluir_subprovincial:
        filtros.append("j.granularidad = 'PROVINCIAL'")
    if anio:
        filtros.append("h.anio_lectivo = :anio")
        params["anio"] = anio
    if nivel:
        nivel = nivel.upper()
        if nivel not in ("INI","PRI","SEC","SUP","ESP","PER"):
            raise HTTPException(status_code=400, detail=f"Nivel invalido: {nivel}")
        filtros.append("n.codigo_redfie = :nivel")
        params["nivel"] = nivel
    if sector:
        sector = sector.upper()
        if sector not in ("E","P"):
            raise HTTPException(status_code=400, detail="Sector invalido. Usa E o P.")
        filtros.append("s.codigo_sector = :sector")
        params["sector"] = sector
    if jurisdiccion_id is not None:
        filtros.append("j.jurisdiccion_id = :jurisdiccion_id")
        params["jurisdiccion_id"] = jurisdiccion_id
    if region:
        filtros.append("j.region = :region")
        params["region"] = region.upper()
    where = "WHERE " + " AND ".join(filtros)
    sql = text(f"""
        SELECT j.nombre_oficial AS jurisdiccion, j.region, j.granularidad,
               n.nombre_nivel AS nivel, s.nombre_sector AS sector,
               h.anio_lectivo, h.total_alumnos
        FROM hechos_matricula_historica h
        JOIN dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
        JOIN dim_niveles_educativos n ON h.nivel_id = n.nivel_id
        JOIN dim_sectores s ON h.sector_id = s.sector_id
        {where}
        ORDER BY h.anio_lectivo DESC, j.nombre_oficial, n.orden_display
        LIMIT :limit OFFSET :offset
    """)
    sql_count = text(f"""
        SELECT COUNT(*) FROM hechos_matricula_historica h
        JOIN dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
        JOIN dim_niveles_educativos n ON h.nivel_id = n.nivel_id
        JOIN dim_sectores s ON h.sector_id = s.sector_id
        {where}
    """)
    result = await db.execute(sql, params)
    count_result = await db.execute(sql_count, {k:v for k,v in params.items() if k not in ("limit","offset")})
    filas = result.mappings().all()
    total = count_result.scalar()
    return MatriculaResponse(
        total_registros=total,
        filtros_aplicados={k:v for k,v in {"anio":anio,"nivel":nivel,"sector":sector,"region":region}.items() if v is not None},
        advertencia=None if incluir_subprovincial else "Totales excluyen subprovinciales. Usa ?incluir_subprovincial=true para el detalle.",
        datos=[dict(f) for f in filas],
    )

@router.get("/resumen-nacional/{anio}", response_model=ResumenNacionalResponse, summary="Resumen nacional por anio")
async def get_resumen_nacional(anio: int, db: AsyncSession = Depends(get_db)):
    if anio < 1990 or anio > 2099:
        raise HTTPException(status_code=400, detail="Anio fuera de rango.")
    sql = text("""
        SELECT n.nombre_nivel AS nivel, s.nombre_sector AS sector,
               SUM(h.total_alumnos) AS total_alumnos, h.anio_lectivo
        FROM hechos_matricula_historica h
        JOIN dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
        JOIN dim_niveles_educativos n ON h.nivel_id = n.nivel_id
        JOIN dim_sectores s ON h.sector_id = s.sector_id
        WHERE h.anio_lectivo = :anio AND j.granularidad = 'PROVINCIAL' AND j.es_nacional = false
        GROUP BY n.nombre_nivel, s.nombre_sector, h.anio_lectivo, n.orden_display
        ORDER BY n.orden_display, s.nombre_sector
    """)
    result = await db.execute(sql, {"anio": anio})
    filas = result.mappings().all()
    if not filas:
        raise HTTPException(status_code=404, detail=f"No hay datos para {anio}.")
    return ResumenNacionalResponse(
        anio_lectivo=anio,
        total_sistema=sum(f["total_alumnos"] for f in filas),
        datos=[dict(f) for f in filas],
    )

@router.get("/serie-temporal", summary="Serie temporal")
async def get_serie_temporal(
    nivel: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    jurisdiccion_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    filtros = ["j.granularidad = 'PROVINCIAL'", "j.es_nacional = false"]
    params = {}
    if nivel:
        filtros.append("n.codigo_redfie = :nivel")
        params["nivel"] = nivel.upper()
    if sector:
        filtros.append("s.codigo_sector = :sector")
        params["sector"] = sector.upper()
    if jurisdiccion_id is not None:
        filtros.append("j.jurisdiccion_id = :jurisdiccion_id")
        params["jurisdiccion_id"] = jurisdiccion_id
    where = "WHERE " + " AND ".join(filtros)
    sql = text(f"""
        SELECT h.anio_lectivo, n.nombre_nivel AS nivel, s.nombre_sector AS sector,
               SUM(h.total_alumnos) AS total_alumnos
        FROM hechos_matricula_historica h
        JOIN dim_jurisdicciones j ON h.jurisdiccion_id = j.jurisdiccion_id
        JOIN dim_niveles_educativos n ON h.nivel_id = n.nivel_id
        JOIN dim_sectores s ON h.sector_id = s.sector_id
        {where}
        GROUP BY h.anio_lectivo, n.nombre_nivel, s.nombre_sector, n.orden_display
        ORDER BY h.anio_lectivo, n.orden_display, s.nombre_sector
    """)
    result = await db.execute(sql, params)
    filas = result.mappings().all()
    return {"total_registros": len(filas), "advertencia": "Totales excluyen subprovinciales.", "datos": [dict(f) for f in filas]}
