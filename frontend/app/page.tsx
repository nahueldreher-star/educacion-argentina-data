import { getResumenNacional } from "./lib/api";
import ResumenCards from "./components/ResumenCards";
import MapaExplorador from "./components/MapaExplorador";
import { Database, Code, Download, ArrowRight } from "lucide-react";

export default async function Home() {
  let resumen = null;
  try {
    resumen = await getResumenNacional(2025);
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section className="bg-white border-b border-slate-100 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Version 1.0 · Anuario Estadístico 2025
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
              El sistema educativo<br />
              <span style={{ color: "#1a3a6b" }}>argentino</span>, en datos.
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-8 max-w-2xl">
              Una plataforma abierta para explorar matrícula por provincia, nivel y sector.
              Datos del Ministerio de Educación de la Nación — con API pública para investigadores y desarrolladores.
            </p>
            <div className="flex flex-wrap gap-3">
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
          </div>
        </div>
      </section>

      {/* STATS */}
      {resumen && (
        <section className="bg-slate-50 border-b border-slate-100 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-3xl font-bold text-slate-900">{resumen.total_sistema.toLocaleString("es-AR")}</p>
                <p className="text-sm text-slate-500 mt-1">alumnos en el sistema</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">24</p>
                <p className="text-sm text-slate-500 mt-1">jurisdicciones</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">4</p>
                <p className="text-sm text-slate-500 mt-1">niveles educativos</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: "#10b981" }}>Abierto</p>
                <p className="text-sm text-slate-500 mt-1">acceso libre y gratuito</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MATRICULA POR NIVEL */}
      {resumen && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Matrícula 2025 por nivel</h2>
              <p className="text-slate-500 mt-1 text-sm">Total del sistema educativo. Excluye doble conteo de subregiones.</p>
            </div>
            <ResumenCards datos={resumen.datos} total={resumen.total_sistema} />
          </div>
        </section>
      )}

      {/* MAPA INTERACTIVO */}
      <section id="mapa" className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Mapa interactivo</h2>
            <p className="text-slate-500 mt-1 text-sm">
              Seleccioná una dimensión de análisis y hacé clic en una provincia para ver el detalle.
            </p>
          </div>
          <MapaExplorador />
        </div>
      </section>

      {/* ACCESO A DATOS */}
      <section id="api" className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Accedé a los datos</h2>
            <p className="text-slate-500 mt-1 text-sm max-w-xl">
              Todos los datos están disponibles via API REST pública y código abierto para que investigadores, periodistas y desarrolladores puedan construir sobre esta base.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-sm transition-all group">
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
            <div className="border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-sm transition-all group">
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
            <div className="border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <Download size={20} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Granularidad única</h3>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                GBA Conurbano y Resto de Buenos Aires como registros separados. Detalle subprovincial disponible en la API.
              </p>
              <a
                href="https://educacion-argentina-api.onrender.com/api/v1/matricula?incluir_subprovincial=true&anio=2025"
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
