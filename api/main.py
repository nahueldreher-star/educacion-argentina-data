from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import matricula

app = FastAPI(
    title="API — Sistema Educativo Argentino",
    description="Datos abiertos de matrícula histórica por nivel, sector y jurisdicción.",
    version="1.0.0",
    contact={"name": "Nahuel Dreher", "url": "https://github.com/nahueldreher-star/educacion-argentina-data"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(matricula.router, prefix="/api/v1")

@app.get("/", tags=["Estado"])
async def root():
    return {"nombre": "API Sistema Educativo Argentino", "version": "1.0.0", "documentacion": "/docs", "estado": "operativo"}

@app.get("/api/v1/health", tags=["Estado"])
async def health():
    return {"status": "ok"}
