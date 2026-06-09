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
      <section className="min-h-[90vh] flex items-center border-b border-slate-100 px-4">
        <div className="max-w-7xl mx-auto w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Texto */}
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-8">
                Sistema educativo argentino · Datos abiertos
              </p>

              <h1 className="text-6xl md:text-7xl font-bold text-slate-900 leading-[1.05] mb-8">
                Trayectorias<br />
                <span style={{ color: "#1a3a6b" }}>escolares</span><br />
                en datos.
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed mb-6 max-w-md">
                En Argentina, la trayectoria teórica dice que un alumno entra
                a los 6 años y termina la secundaria a los 17.
                Los datos muestran otra cosa.
              </p>

              <div className="border-l-4 border-slate-200 pl-6 mb-10">
                <p className="text-2xl font-bold text-slate-900 mb-1">
                  1 de cada {unoDeCada} alumnos de secundaria
                </p>
                <p className="text-lg text-slate-500">
                  no vuelve al año siguiente.
                </p>
                <p className="text-sm text-slate-400 mt-3">
                  En {maxProv}, ese número es 1 de cada {ind ? Math.round(100 / ind.max) : 8}.{" "}
                  En {minProv}, es 1 de cada {ind ? Math.round(100 / ind.min) : 19}.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <a
                  href="#mapa"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
                  style={{ background: "#1a3a6b" }}
                >
                  Explorar el mapa
                  <ArrowRight size={16} />
                </a>
                <a
                  href="https://educacion-argentina-api.onrender.com/docs"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Ver API
                </a>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                Fuente: Ministerio de Educación de la Nación · Abandono interanual secundaria 2024
              </p>
            </div>

            {/* Ilustración SVG */}
            <div className="hidden lg:block">
              <svg viewBox="0 0 580 340" xmlns="http://www.w3.org/2000/svg" className="w-full">

                {/* TRAYECTORIA TEÓRICA */}
                <text x="20" y="30" fontSize="10" fontWeight="500" fill="#0F6E56" fontFamily="sans-serif" letterSpacing="0.08em">TRAYECTORIA TEÓRICA</text>

                <line x1="20" y1="80" x2="540" y2="80" stroke="#9FE1CB" strokeWidth="2" strokeDasharray="8 5"/>

                {/* Alumno inicio */}
                <circle cx="40" cy="58" r="10" fill="#1D9E75"/>
                <rect x="33" y="68" width="14" height="15" rx="3" fill="#1D9E75"/>
                <line x1="37" y1="83" x2="35" y2="96" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="44" y1="83" x2="46" y2="96" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="33" y1="72" x2="25" y2="80" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="47" y1="72" x2="55" y2="80" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"/>
                <text x="40" y="110" textAnchor="middle" fontSize="10" fill="#0F6E56" fontFamily="sans-serif" fontWeight="500">6 años</text>

                {/* Diploma */}
                <rect x="520" y="64" width="28" height="22" rx="3" fill="#1D9E75"/>
                <rect x="523" y="67" width="22" height="16" rx="2" fill="#E1F5EE"/>
                <line x1="527" y1="72" x2="541" y2="72" stroke="#1D9E75" strokeWidth="1.5"/>
                <line x1="527" y1="76" x2="541" y2="76" stroke="#1D9E75" strokeWidth="1.5"/>
                <line x1="527" y1="80" x2="537" y2="80" stroke="#1D9E75" strokeWidth="1.5"/>
                <line x1="534" y1="86" x2="534" y2="94" stroke="#1D9E75" strokeWidth="2"/>
                <ellipse cx="534" cy="96" rx="5" ry="3" fill="#1D9E75"/>
                <text x="534" y="110" textAnchor="middle" fontSize="10" fill="#0F6E56" fontFamily="sans-serif" fontWeight="500">17 años</text>

                <text x="200" y="68" textAnchor="middle" fontSize="9" fill="#5DCAA5" fontFamily="sans-serif">primaria</text>
                <text x="390" y="68" textAnchor="middle" fontSize="9" fill="#5DCAA5" fontFamily="sans-serif">secundaria</text>
                <line x1="295" y1="65" x2="295" y2="95" stroke="#9FE1CB" strokeWidth="1"/>

                {/* TRAYECTORIA REAL */}
                <text x="20" y="158" fontSize="10" fontWeight="500" fill="#A32D2D" fontFamily="sans-serif" letterSpacing="0.08em">TRAYECTORIA REAL</text>

                {/* Alumno real */}
                <circle cx="40" cy="200" r="10" fill="#378ADD"/>
                <rect x="33" y="210" width="14" height="15" rx="3" fill="#378ADD"/>
                <line x1="37" y1="225" x2="35" y2="238" stroke="#378ADD" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="44" y1="225" x2="46" y2="238" stroke="#378ADD" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="33" y1="215" x2="25" y2="223" stroke="#378ADD" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="47" y1="215" x2="55" y2="223" stroke="#378ADD" strokeWidth="2.5" strokeLinecap="round"/>
                <text x="40" y="252" textAnchor="middle" fontSize="10" fill="#185FA5" fontFamily="sans-serif" fontWeight="500">6 años</text>

                {/* Camino real */}
                <path d="M 60 220 Q 110 215 150 220" stroke="#378ADD" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

                {/* Obstáculo 1: sobreedad — reloj */}
                <circle cx="175" cy="216" r="14" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="2"/>
                <line x1="175" y1="210" x2="175" y2="216" stroke="#BA7517" strokeWidth="2" strokeLinecap="round"/>
                <line x1="175" y1="216" x2="180" y2="219" stroke="#BA7517" strokeWidth="2" strokeLinecap="round"/>
                <text x="175" y="242" textAnchor="middle" fontSize="9" fill="#633806" fontFamily="sans-serif" fontWeight="500">sobreedad</text>

                <path d="M 190 220 Q 240 215 270 220" stroke="#378ADD" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

                {/* Obstáculo 2: repitencia — flecha vuelta */}
                <circle cx="295" cy="216" r="14" fill="#FCEBEB" stroke="#E24B4A" strokeWidth="2"/>
                <path d="M 288 211 A 9 9 0 1 1 302 211" stroke="#E24B4A" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <polygon points="302,211 307,207 307,215" fill="#E24B4A"/>
                <text x="295" y="242" textAnchor="middle" fontSize="9" fill="#791F1F" fontFamily="sans-serif" fontWeight="500">repitencia</text>

                <path d="M 310 220 Q 350 215 380 220" stroke="#378ADD" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

                {/* Obstáculo 3: abandono — puerta */}
                <circle cx="405" cy="216" r="14" fill="#F1EFE8" stroke="#888780" strokeWidth="2"/>
                <rect x="399" y="209" width="8" height="12" rx="1" fill="#D3D1C7"/>
                <circle cx="406" cy="215" r="1.5" fill="#888780"/>
                <line x1="407" y1="215" x2="413" y2="215" stroke="#5F5E5A" strokeWidth="2" strokeLinecap="round"/>
                <polygon points="413,211 418,215 413,219" fill="#5F5E5A"/>
                <text x="405" y="242" textAnchor="middle" fontSize="9" fill="#444441" fontFamily="sans-serif" fontWeight="500">abandono</text>

                {/* Camino cortado */}
                <path d="M 420 220 Q 455 218 475 220" stroke="#D3D1C7" strokeWidth="2" fill="none" strokeDasharray="4 4" strokeLinecap="round"/>

                {/* Diploma tachado */}
                <rect x="490" y="202" width="28" height="22" rx="3" fill="#F1EFE8"/>
                <rect x="493" y="205" width="22" height="16" rx="2" fill="#D3D1C7"/>
                <line x1="497" y1="210" x2="511" y2="210" stroke="#B4B2A9" strokeWidth="1.5"/>
                <line x1="497" y1="214" x2="511" y2="214" stroke="#B4B2A9" strokeWidth="1.5"/>
                <line x1="497" y1="218" x2="507" y2="218" stroke="#B4B2A9" strokeWidth="1.5"/>
                <line x1="488" y1="200" x2="520" y2="226" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="520" y1="200" x2="488" y2="226" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round"/>
                <text x="504" y="242" textAnchor="middle" fontSize="10" fill="#888780" fontFamily="sans-serif">sin diploma</text>

                {/* Nota al pie */}
                <text x="20" y="310" fontSize="9" fill="#B4B2A9" fontFamily="sans-serif">Fuente: Ministerio de Educación de la Nación · RedFIE/DIE</text>

              </svg>
            </div>

          </div>
        </div>
      </section>

      {/* MAPA */}
      <section id="mapa" className="py-20 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900">
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
      <section className="py-20 px-4 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <GraficoEvolucion />
        </div>
      </section>

      {/* ACCESO A DATOS */}
      <section id="api" className="py-20 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Accedé a los datos</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-xl">
              Todos los datos están disponibles via API REST pública y código abierto
              para investigadores, periodistas y desarrolladores.
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
              <a href="https://educacion-argentina-api.onrender.com/docs" target="_blank"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
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
              <a href="https://github.com/nahueldreher-star/educacion-argentina-data" target="_blank"
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
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
              <a href="https://educacion-argentina-api.onrender.com/api/v1/indicadores?indicador=SOB&nivel=SEC&anio_estudio=Total&limit=500" target="_blank"
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
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
