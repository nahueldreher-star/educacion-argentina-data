"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { MatriculaItem } from "../lib/api";

interface Props {
  provincia: string | null;
  datos: MatriculaItem[];
  anio: number;
  nivel: string;
  metricaActiva: string;
  onCerrar: () => void;
}

interface IndicadorData {
  jurisdiccion: string;
  anio_estudio: string;
  valor: number;
}

const SUBPROVINCIALES = ["GBA - Conurbano", "GBA - Resto Provincia"];
const API_BASE = "https://educacion-argentina-api.onrender.com/api/v1";

const NIVEL_COLOR: Record<string, string> = {
  "Educacion Inicial": "bg-amber-100 text-amber-800",
  "Educacion Primaria": "bg-blue-100 text-blue-800",
  "Educacion Secundaria": "bg-emerald-100 text-emerald-800",
  "Educacion Superior No Universitaria": "bg-purple-100 text-purple-800",
};

const NIVEL_API: Record<string, string> = {
  "": "SEC", "INI": "INI", "PRI": "PRI", "SEC": "SEC", "SUP": "SUP",
};

const INDICADOR_INFO: Record<string, { label: string; descripcion: string }> = {
  SOB: { label: "Sobreedad", descripcion: "Alumnos que van atrasados respecto a la edad teórica para su año de estudio." },
  REP: { label: "Repitencia", descripcion: "Alumnos que repiten el año por no haber alcanzado los aprendizajes mínimos." },
  ABN: { label: "Abandono interanual", descripcion: "Alumnos que no vuelven a matricularse al año siguiente. Fuente: Ministerio de Educación." },
};

function unoDeCada(pct: number): string {
  if (pct <= 0) return "—";
  return `1 de cada ${Math.round(100 / pct)}`;
}

function esIndicador(metrica: string): boolean {
  return ["REP", "ABN", "SOB"].includes(metrica);
}

export default function PanelProvincia({ provincia, datos, anio, nivel, metricaActiva, onCerrar }: Props) {
  const esNacional = !provincia;
  const [valorIndicador, setValorIndicador] = useState<number | null>(null);
  const [promedioNacional, setPromedioNacional] = useState<number | null>(null);
  const [loadingInd, setLoadingInd] = useState(false);

  const anioIndicadores = anio > 2024 ? 2024 : anio;
  const nivelParam = NIVEL_API[nivel] || "SEC";
  const nivelLabel: Record<string, string> = {
    "": "todos los niveles", "INI": "inicial", "PRI": "primaria",
    "SEC": "secundaria", "SUP": "superior no universitario"
  };

  useEffect(() => {
    if (!esIndicador(metricaActiva)) return;
    setLoadingInd(true);
    setValorIndicador(null);
    setPromedioNacional(null);

    fetch(`${API_BASE}/indicadores?indicador=${metricaActiva}&nivel=${nivelParam}&anio=${anioIndicadores}&anio_estudio=Total&limit=500`)
      .then(r => r.json())
      .then(res => {
        const filtrados = res.datos.filter((d: IndicadorData) =>
          !SUBPROVINCIALES.includes(d.jurisdiccion) && d.anio_estudio === "Total"
        );
        const promedio = filtrados.length
          ? filtrados.reduce((acc: number, d: IndicadorData) => acc + d.valor, 0) / filtrados.length
          : null;
        setPromedioNacional(promedio);

        if (!esNacional && provincia && !SUBPROVINCIALES.includes(provincia)) {
          const fila = res.datos.find((d: IndicadorData) =>
            d.jurisdiccion === provincia && d.anio_estudio === "Total"
          );
          setValorIndicador(fila?.valor ?? null);
        } else if (esNacional) {
          setValorIndicador(promedio);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingInd(false));
  }, [provincia, metricaActiva, anioIndicadores, nivelParam, esNacional]);

  const datosFiltrados = esNacional
    ? datos.filter(d => d.granularidad === "PROVINCIAL")
    : datos.filter(d => d.jurisdiccion === provincia);

  const total = datosFiltrados.reduce((acc, d) => acc + d.total_alumnos, 0);
  const totalEstatal = datosFiltrados.filter(d => d.sector === "Estatal").reduce((acc, d) => acc + d.total_alumnos, 0);
  const totalPrivado = datosFiltrados.filter(d => d.sector === "Privado").reduce((acc, d) => acc + d.total_alumnos, 0);
  const pctPrivado = total > 0 ? ((totalPrivado / total) * 100).toFixed(1) : "0";
  const niveles = [...new Set(datosFiltrados.map(d => d.nivel))];

  const diff = valorIndicador !== null && promedioNacional !== null ? valorIndicador - promedioNacional : null;

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

      {/* BLOQUE A — Indicador activo (solo si es indicador) */}
      {esIndicador(metricaActiva) && !SUBPROVINCIALES.includes(provincia ?? "") && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            {INDICADOR_INFO[metricaActiva]?.label} · {anioIndicadores}
            {anio > 2024 ? " (último dato disponible)" : ""}
          </p>
          {loadingInd ? (
            <div className="h-16 flex items-center justify-center text-slate-400 text-sm">Cargando...</div>
          ) : valorIndicador === null ? (
            <p className="text-sm text-slate-400 italic">Sin datos para esta selección</p>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              {valorIndicador < 0 ? (
                <>
                  <p className="text-2xl font-bold text-blue-700">{valorIndicador.toFixed(1)}%</p>
                  <p className="text-xs text-blue-600 mt-1">Entrada neta de alumnos — posiblemente por migración interna</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold" style={{ color: "#6d28d9" }}>
                    {unoDeCada(valorIndicador)} alumnos
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{valorIndicador.toFixed(1)}% del total</p>
                  {!esNacional && diff !== null && (
                    <p className={`text-xs mt-2 ${Math.abs(diff) < 0.5 ? "text-slate-400" : diff > 0 ? "text-red-500" : "text-emerald-600"}`}>
                      {Math.abs(diff) < 0.5
                        ? "Similar al promedio nacional"
                        : diff > 0
                        ? `${diff.toFixed(1)}pp por encima del promedio (${promedioNacional?.toFixed(1)}%)`
                        : `${Math.abs(diff).toFixed(1)}pp por debajo del promedio (${promedioNacional?.toFixed(1)}%)`}
                    </p>
                  )}
                </>
              )}
              <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 leading-snug">
                {INDICADOR_INFO[metricaActiva]?.descripcion}
              </p>
            </div>
          )}
        </div>
      )}

      {/* BLOQUE B — Matrícula (solo cuando la métrica activa es matrícula) */}
      {!esIndicador(metricaActiva) && <div className="mb-4">
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

      }
      <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
        Fuente: Ministerio de Educación de la Nación · RedFIE/DIE
      </p>
    </div>
  );
}
