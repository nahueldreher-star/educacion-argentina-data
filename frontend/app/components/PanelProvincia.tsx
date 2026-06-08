"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { MatriculaItem } from "../lib/api";

interface Props {
  provincia: string | null;
  datos: MatriculaItem[];
  anio: number;
  nivel: string;
  onCerrar: () => void;
}

interface IndicadorData {
  jurisdiccion: string;
  anio_estudio: string;
  valor: number;
}

interface IndicadoresProvincia {
  SOB: number | null;
  REP: number | null;
  ABN: number | null;
}

interface PromediosNacionales {
  SOB: number | null;
  REP: number | null;
  ABN: number | null;
}

const SUBPROVINCIALES = ["GBA - Conurbano", "GBA - Resto Provincia"];
const API_BASE = "https://educacion-argentina-api.onrender.com/api/v1";

function unoDeCada(pct: number): string {
  if (pct <= 0) return "—";
  const n = Math.round(100 / pct);
  return `1 de cada ${n}`;
}

function NarrativaIndicador({
  label,
  valor,
  promedio,
  descripcion,
  esNacional = false,
}: {
  label: string;
  valor: number | null;
  promedio: number | null;
  descripcion: string;
  esNacional?: boolean;
}) {
  if (valor === null) return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-xs text-slate-400 italic mt-1">Sin datos para esta selección</p>
    </div>
  );

  const esNegativo = valor < 0;
  const colorValor = esNegativo ? "text-blue-700"
    : promedio && valor > promedio * 1.2 ? "text-red-600"
    : promedio && valor > promedio ? "text-orange-500"
    : "text-emerald-600";

  const diff = promedio !== null ? valor - promedio : null;
  const diffAbs = diff !== null ? Math.abs(diff).toFixed(1) : null;

  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
      {esNegativo ? (
        <>
          <p className="text-xl font-bold text-blue-700">{valor.toFixed(1)}%</p>
          <p className="text-xs text-blue-600 mt-1 leading-snug">
            Entrada neta de alumnos — posiblemente por migración interna
          </p>
        </>
      ) : (
        <>
          <p className={`text-xl font-bold ${colorValor}`}>{unoDeCada(valor)} alumnos</p>
          <p className="text-xs text-slate-400 mt-0.5">{valor.toFixed(1)}% del total</p>
          {!esNacional && diff !== null && diffAbs && (
            <p className={`text-xs mt-1 ${diff > 0.5 ? "text-red-500" : diff < -0.5 ? "text-emerald-600" : "text-slate-400"}`}>
              {Math.abs(diff) < 0.5
                ? "Similar al promedio nacional"
                : diff > 0
                ? `${diffAbs}pp por encima del promedio nacional (${promedio?.toFixed(1)}%)`
                : `${diffAbs}pp por debajo del promedio nacional (${promedio?.toFixed(1)}%)`}
            </p>
          )}
        </>
      )}
      <p className="text-xs text-slate-400 mt-2 leading-snug border-t border-slate-100 pt-2">{descripcion}</p>
    </div>
  );
}

const NIVEL_COLOR: Record<string, string> = {
  "Educacion Inicial": "bg-amber-100 text-amber-800",
  "Educacion Primaria": "bg-blue-100 text-blue-800",
  "Educacion Secundaria": "bg-emerald-100 text-emerald-800",
  "Educacion Superior No Universitaria": "bg-purple-100 text-purple-800",
};

const NIVEL_API: Record<string, string> = {
  "": "",
  "INI": "INI",
  "PRI": "PRI",
  "SEC": "SEC",
  "SUP": "SUP",
};

export default function PanelProvincia({ provincia, datos, anio, nivel, onCerrar }: Props) {
  const esNacional = !provincia;
  const [indicadoresProv, setIndicadoresProv] = useState<IndicadoresProvincia | null>(null);
  const [promediosNac, setPromediosNac] = useState<PromediosNacionales | null>(null);
  const [loadingInd, setLoadingInd] = useState(false);

  const anioIndicadores = anio > 2024 ? 2024 : anio;
  const nivelParam = NIVEL_API[nivel] || "SEC";

  useEffect(() => {
    setLoadingInd(true);
    setIndicadoresProv(null);
    setPromediosNac(null);

    const fetchIndicadores = async () => {
      try {
        const fetchInd = (ind: string) =>
          fetch(`${API_BASE}/indicadores?indicador=${ind}&nivel=${nivelParam}&anio=${anioIndicadores}&anio_estudio=Total&limit=500`)
            .then(r => r.json());

        const [sob, rep, abn] = await Promise.all([
          fetchInd("SOB"),
          fetchInd("REP"),
          fetchInd("ABN"),
        ]);

        const get = (res: { datos: IndicadorData[] }, jur: string) =>
          res.datos.find(d => d.jurisdiccion === jur && d.anio_estudio === "Total")?.valor ?? null;

        const promedio = (res: { datos: IndicadorData[] }) => {
          const filtrados = res.datos.filter(d =>
            !SUBPROVINCIALES.includes(d.jurisdiccion) && d.anio_estudio === "Total"
          );
          if (!filtrados.length) return null;
          return filtrados.reduce((acc, d) => acc + d.valor, 0) / filtrados.length;
        };

        setPromediosNac({
          SOB: promedio(sob),
          REP: promedio(rep),
          ABN: promedio(abn),
        });

        if (!esNacional && provincia && !SUBPROVINCIALES.includes(provincia)) {
          setIndicadoresProv({
            SOB: get(sob, provincia),
            REP: get(rep, provincia),
            ABN: get(abn, provincia),
          });
        } else if (esNacional) {
          setIndicadoresProv({
            SOB: promedio(sob),
            REP: promedio(rep),
            ABN: promedio(abn),
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingInd(false);
      }
    };

    fetchIndicadores();
  }, [provincia, anioIndicadores, nivelParam, esNacional]);

  const datosFiltrados = esNacional
    ? datos.filter(d => d.granularidad === "PROVINCIAL")
    : datos.filter(d => d.jurisdiccion === provincia);

  const total = datosFiltrados.reduce((acc, d) => acc + d.total_alumnos, 0);
  const totalEstatal = datosFiltrados.filter(d => d.sector === "Estatal").reduce((acc, d) => acc + d.total_alumnos, 0);
  const totalPrivado = datosFiltrados.filter(d => d.sector === "Privado").reduce((acc, d) => acc + d.total_alumnos, 0);
  const pctPrivado = total > 0 ? ((totalPrivado / total) * 100).toFixed(1) : "0";
  const niveles = [...new Set(datosFiltrados.map(d => d.nivel))];

  const nivelLabel: Record<string, string> = {
    "": "todos los niveles",
    "INI": "inicial", "PRI": "primaria", "SEC": "secundaria", "SUP": "superior no universitario"
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-full overflow-y-auto max-h-[680px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">
            {esNacional ? "Promedio nacional" : provincia}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {esNacional
              ? "Hacé clic en una provincia para ver el detalle"
              : `${nivelLabel[nivel] || "todos los niveles"} · ${anio}`}
          </p>
        </div>
        {!esNacional && (
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* BLOQUE A — Indicadores */}
      {!SUBPROVINCIALES.includes(provincia ?? "") && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Trayectoria escolar · {anioIndicadores}{anio > 2024 ? " (último dato disponible)" : ""}
          </p>
          {loadingInd ? (
            <div className="h-20 flex items-center justify-center text-slate-400 text-sm">
              Cargando indicadores...
            </div>
          ) : (
            <div className="space-y-2">
              <NarrativaIndicador
                label="Sobreedad"
                valor={indicadoresProv?.SOB ?? null}
                promedio={esNacional ? null : promediosNac?.SOB ?? null}
                descripcion="Alumnos que van atrasados respecto a la edad teórica para su año de estudio."
                esNacional={esNacional}
              />
              <NarrativaIndicador
                label="Repitencia"
                valor={indicadoresProv?.REP ?? null}
                promedio={esNacional ? null : promediosNac?.REP ?? null}
                descripcion="Alumnos que repiten el año por no haber alcanzado los aprendizajes mínimos."
                esNacional={esNacional}
              />
              <NarrativaIndicador
                label="Abandono interanual"
                valor={indicadoresProv?.ABN ?? null}
                promedio={esNacional ? null : promediosNac?.ABN ?? null}
                descripcion="Alumnos que no vuelven a matricularse al año siguiente. Fuente: Ministerio de Educación."
                esNacional={esNacional}
              />
            </div>
          )}
        </div>
      )}

      {/* BLOQUE B — Matrícula */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Matrícula · {anio}
        </p>
        {total === 0 ? (
          <p className="text-xs text-slate-400 italic">Sin datos de matrícula para esta selección</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-900">{total.toLocaleString("es-AR")}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-blue-700">{totalEstatal.toLocaleString("es-AR")}</p>
                <p className="text-xs text-blue-500 mt-0.5">Estatal</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-purple-700">{pctPrivado}%</p>
                <p className="text-xs text-purple-500 mt-0.5">Privado</p>
              </div>
            </div>
            <div className="space-y-3">
              {niveles.map(niv => {
                const estatal = datosFiltrados.filter(d => d.nivel === niv && d.sector === "Estatal").reduce((acc, d) => acc + d.total_alumnos, 0);
                const privado = datosFiltrados.filter(d => d.nivel === niv && d.sector === "Privado").reduce((acc, d) => acc + d.total_alumnos, 0);
                const totalNivel = estatal + privado;
                const pctSector = totalNivel > 0 ? (privado / totalNivel) * 100 : 0;
                const pctNivel = total > 0 ? ((totalNivel / total) * 100).toFixed(1) : "0";
                const short = niv.replace("Educacion ", "").replace(" No Universitaria", " No Univ.");
                const colorClass = NIVEL_COLOR[niv] || "bg-slate-100 text-slate-800";
                return (
                  <div key={niv} className="border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>{short}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{pctNivel}%</span>
                        <span className="text-sm font-bold text-slate-900">{totalNivel.toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                      <div className="h-1.5 rounded-full" style={{ width: `${100 - pctSector}%`, background: "#1a3a6b" }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                      <span>Estatal: {estatal.toLocaleString("es-AR")}</span>
                      <span>Privado: {privado.toLocaleString("es-AR")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
        Fuente: Ministerio de Educación de la Nación · RedFIE/DIE
      </p>
    </div>
  );
}
