import { getResumenNacional } from "./lib/api";
import MapaExplorador from "./components/MapaExplorador";
import { ArrowRight, Code, Database, Download } from "lucide-react";

const SUBPROVINCIALES = ["GBA - Conurbano", "GBA - Resto Provincia"];

async function getIndicadoresNacionales() {
  const BASE = "https://educacion-argentina-api.onrender.com/api/v1";
  try {
    const [sobSec, repSec, abnSec] = await Promise.all([
      fetch(`${BASE}/indicadores?indicador=SOB&nivel=SEC&anio=2024&anio_estudio=Total&limit=500`, { next: { revalidate: 3600 } }).then(r => r.json()),
      fetch(`${BASE}/indicadores?indicador=REP&nivel=SEC&anio=2024&anio_estudio=Total&limit=500`, { next: { revalidate: 3600 } }).then(r => r.json()),
      fetch(`${BASE}/indicadores?indicador=ABN&nivel=SEC&anio=2024&anio_estudio=Total&limit=500`, { next: { revalidate: 3600 } }).then(r => r.json()),
    ]);

    const promedio = (datos: { jurisdiccion: string; valor: number }[]) => {
      const filtrados = datos.filter(d => !SUBPROVINCIALES.includes(d.jurisdiccion));
      return filtrados.reduce((acc, d) => acc + d.valor, 0) / filtrados.length;
    };

    return {
      sobSecPromedio: promedio(sobSec.datos),
      repSecPromedio: promedio(repSec.datos),
      abnSecPromedio: promedio(abnSec.datos),
      repSecMax: Math.max(...repSec.datos.filter((d: { jurisdiccion: string }) => !SUBPROVINCIALES.includes(d.jurisdiccion)).map((d: { valor: number }) => d.valor)),
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const [resumen, indicadores] = await Promise.all([
    getResumenNacional(2025).catch(() => null),
    getIndicadoresNacionales(),
  ]);

  const sobPct = indicadores ? Math.round(indicadores.sobSecPromedio) : 22;
  const abnPct = indicadores ? indicadores.abnSecPromedio.toFixed(1) : "8.1";
  const repMax = indicadores ? indicadores.repSecMax.toFixed(1) : "15.8";

  return (
    <div className="min-h-screen bg-white">

      {/* HERO */}
      <section className="border-b border-slate-100 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Datos del Ministerio de Educación · Anuario 2024
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
              El sistema educativo<br />
              <span style={{ color: "#1a3a6b" }}>argentino</span>, en datos.
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl">
              Una plataforma abierta para entender qué pasa dentro de las escuelas argentinas.
              Matrícula, repitencia, abandono y sobreedad por provincia, nivel y año.
            </p>
            <div className="flex flex-wrap gap-3 mb-12">
              <a
                href="#mapa"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
                style={{ background: "#1a3a6b" }}
              >
                Explorar el mapa
                <ArrowRight size={16} />
              </a>
              <a
                href="https://educacion-argentina-api.onrender.com/docs"
                target="_blank"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
              >
                Ver API
              </a>
            </div>

            {/* Tres datos impactantes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-l-4 border-red-500 pl-4 py-1">
                <p className="text-3xl font-bold text-slate-900">1 de cada {Math.round(100 / sobPct)}</p>
                <p className="text-sm text-slate-500 mt-1 leading-snug">alumnos de secundaria tiene sobreedad — va atrasado respecto a su edad teórica</p>
                <p className="text-xs text-slate-400 mt-2">Promedio nacional · 2024</p>
              </div>
              <div className="border-l-4 border-orange-400 pl-4 py-1">
                <p className="text-3xl font-bold text-slate-900">{abnPct}%</p>
                <p className="text-sm text-slate-500 mt-1 leading-snug">de los alumnos de secundaria no vuelve al año siguiente</p>
                <p className="text-xs text-slate-400 mt-2">Promedio nacional · 2024</p>
              </div>
              <div className="border-l-4 border-amber-400 pl-4 py-1">
                <p className="text-3xl font-bold text-slate-900">{repMax}%</p>
                <p className="text-sm text-slate-500 mt-1 leading-snug">de repitencia en secundaria en la provincia con peor indicador del país</p>
                <p className="text-xs text-slate-400 mt-2">Dato provincial máximo · 2024</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTEXTO — matrícula total */}
      {resumen && (
        <section className="bg-slate-50 border-b border-slate-100 py-10 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">El sistema en números · 2025</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {resumen.datos
                .filter((d: { nivel: string; sector: string }) => d.sector === "Estatal" || d.sector === "Privado")
                .reduce((acc: { nivel: string; total: number }[], d: { nivel: string; total_alumnos: number }) => {
                  const existing = acc.find(a => a.nivel === d.nivel);
                  if (existing) existing.total += d.total_alumnos;
                  else acc.push({ nivel: d.nivel, total: d.total_alumnos });
                  return acc;
                }, [])
                .map((d: { nivel: string; total: number }) => (
                  <div key={d.nivel}>
                    <p className="text-2xl font-bold text-slate-900">{d.total.toLocaleString("es-AR")}</p>
                    <p className="text-sm text-slate-500 mt-1">{d.nivel.replace("Educacion ", "")}</p>
                  </div>
                ))
              }
            </div>
            <p className="text-xs text-slate-400 mt-4">Fuente: Ministerio de Educación de la Nación. Excluye doble conteo de subregiones.</p>
          </div>
        </section>
      )}

      {/* MAPA INTERACTIVO */}
      <section id="mapa" className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">¿Dónde se pierde la escuela argentina?</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-2xl">
              Explorá repitencia, abandono y sobreedad por provincia y nivel educativo.
              Hacé clic en una provincia para ver el detalle.
            </p>
          </div>
          <MapaExplorador />
        </div>
      </section>

      {/* ACCESO A DATOS */}
      <section id="api" className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Accedé a los datos</h2>
            <p className="text-slate-500 mt-1 text-sm max-w-xl">
              Todos los datos están disponibles via API REST pública y código abierto para que investigadores,
              periodistas y desarrolladores puedan construir sobre esta base.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-sm transition-all bg-white">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Database size={20} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">API Pública</h3>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                Endpoints REST documentados. Filtrá por nivel, sector, región y jurisdicción. Sin autenticación requerida.
              </p>
              <a
                href="https://educacion-argentina-api.onrender.com/docs"
                target="_blank"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Ver documentación <ArrowRight size={14} />
              </a>
            </div>
            <div className="border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-sm transition-all bg-white">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4">
                <Code size={20} className="text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Código abierto</h3>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                ETL, DDL y API disponibles en GitHub. Reproducible, auditable y contribuible por cualquier persona.
              </p>
              <a
                href="https://github.com/nahueldreher-star/educacion-argentina-data"
                target="_blank"
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Ver repositorio <ArrowRight size={14} />
              </a>
            </div>
            <div className="border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-sm transition-all bg-white">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <Download size={20} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Serie histórica</h3>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                Datos desde 2007 hasta 2025. Matrícula, repitencia, abandono, sobreedad y establecimientos por jurisdicción.
              </p>
              <a
                href="https://educacion-argentina-api.onrender.com/api/v1/indicadores?indicador=SOB&nivel=SEC&anio_estudio=Total&limit=500"
                target="_blank"
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                Ver datos <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
