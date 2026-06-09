import MapaExplorador from "./components/MapaExplorador";
import GraficoEvolucion from "./components/GraficoEvolucion";
import { ArrowRight, Code, Database, Download } from "lucide-react";

const SUBPROVINCIALES = ["GBA - Conurbano", "GBA - Resto Provincia"];

async function getIndicadoresNacionales() {
  const BASE = "https://educacion-argentina-api.onrender.com/api/v1";
  try {
    const abn = await fetch(
      `${BASE}/indicadores?indicador=ABN&nivel=SEC&anio=2024&anio_estudio=Total&limit=500`,
      { next: { revalidate: 3600 } }
    ).then(r => r.json());

    const filtrados = abn.datos.filter((d: { jurisdiccion: string; valor: number }) =>
      !SUBPROVINCIALES.includes(d.jurisdiccion)
    );

    const promedio = filtrados.reduce((acc: number, d: { valor: number }) => acc + d.valor, 0) / filtrados.length;
    const max = Math.max(...filtrados.map((d: { valor: number }) => d.valor));
    const maxProv = filtrados.find((d: { valor: number; jurisdiccion: string }) => d.valor === max)?.jurisdiccion;
    const min = Math.min(...filtrados.map((d: { valor: number }) => d.valor));
    const minProv = filtrados.find((d: { valor: number; jurisdiccion: string }) => d.valor === min)?.jurisdiccion;

    return { promedio, max, min, maxProv, minProv };
  } catch {
    return null;
  }
}

export default async function Home() {
  const ind = await getIndicadoresNacionales();

  const unoDeCada = ind ? Math.round(100 / ind.promedio) : 12;
  const maxProv = ind?.maxProv ?? "Misiones";
  const minProv = ind?.minProv ?? "Neuquén";

  return (
    <div className="min-h-screen bg-white">

      {/* HERO */}
      <section className="border-b border-slate-100 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">

            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Trayectorias escolares{" "}
              <span style={{ color: "#1a3a6b" }}>en datos.</span>
            </h1>

            <p className="text-xl text-slate-600 leading-relaxed mb-4">
              En Argentina, la trayectoria teórica dice que un alumno entra a los 6 años
              y termina la secundaria a los 17. Los datos muestran otra cosa.
            </p>

            <p className="text-xl font-semibold text-slate-900 leading-relaxed mb-2">
              1 de cada {unoDeCada} alumnos de secundaria no vuelve al año siguiente.
            </p>

            <p className="text-base text-slate-500 leading-relaxed mb-10">
              En {maxProv}, ese número es 1 de cada {ind ? Math.round(100 / ind.max) : 8}.
              En {minProv}, es 1 de cada {ind ? Math.round(100 / ind.min) : 19}.
              ¿Qué pasa en tu provincia?
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

      {/* MAPA */}
      <section id="mapa" className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              El mapa del abandono, la repitencia y la sobreedad
            </h2>
            <p className="text-slate-500 mt-2 text-sm max-w-2xl">
              Seleccioná un indicador y hacé clic en una provincia para ver el detalle.
            </p>
          </div>
          <MapaExplorador />
        </div>
      </section>

      {/* EVOLUCIÓN TEMPORAL */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <GraficoEvolucion />
        </div>
      </section>

      {/* ACCESO A DATOS */}
      <section id="api" className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Accedé a los datos</h2>
            <p className="text-slate-500 mt-1 text-sm max-w-xl">
              Todos los datos están disponibles via API REST pública y código abierto.
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
                ETL, DDL y API disponibles en GitHub. Reproducible, auditable y contribuible.
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
                Datos desde 2007 hasta 2025. Matrícula, repitencia, abandono, sobreedad y establecimientos.
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
          <p className="text-xs text-slate-400 mt-8">
            Fuente: Ministerio de Educación de la Nación · Relevamientos Anuales RedFIE/DIE.
            Los indicadores de trayectoria se expresan como porcentaje sobre el total de matriculados.
          </p>
        </div>
      </section>

    </div>
  );
}
