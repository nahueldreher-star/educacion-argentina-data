from pydantic import BaseModel
from typing import Optional

class MatriculaItem(BaseModel):
    jurisdiccion: str
    region: str
    granularidad: str
    nivel: str
    sector: str
    anio_lectivo: int
    total_alumnos: int
    model_config = {"from_attributes": True}

class MatriculaResponse(BaseModel):
    total_registros: int
    filtros_aplicados: dict
    advertencia: Optional[str] = None
    datos: list[MatriculaItem]

class ResumenNacionalItem(BaseModel):
    nivel: str
    sector: str
    total_alumnos: int
    anio_lectivo: int

class ResumenNacionalResponse(BaseModel):
    anio_lectivo: int
    total_sistema: int
    advertencia: str = "Los totales excluyen registros subprovinciales para evitar doble conteo."
    datos: list[ResumenNacionalItem]
