"use client";
import { useState, useEffect } from "react";
import { getMatricula, getIndicadores, MatriculaItem } from "../lib/api";
import dynamic from "next/dynamic";
import PanelProvincia from "./PanelProvincia";

const MapaMapLibre = dynamic(() => import("./MapaMapLibre"), { ssr: false });

const METRICAS_INDICADORES = [
  {
    value: "SOB",
    label: "Sobreedad",
    descripcion: "Porcentaje de alumnos con edad mayor a la teórica para su año de estudio. Refleja acumulación de repitencias o ingreso tardío al sistema.",
  },
  {
    value: "REP",
    label: "Repitencia",
    descripcion: "Porcentaje de alumnos que repiten el año. Indica cuántos estudiantes no lograron los aprendizajes mínimos para avanzar.",
  },
  {
    value: "ABN",
    label: "Abandono",
    descripcion: "Porcentaje de alumnos que no se matriculan al año siguiente. Valores negativos indican entrada neta de alumnos, posiblemente por migración interna. Fuente: Ministerio de Educación de la Nación.",
  },
];

const METRICAS_MATRICULA = [
  { value: "total", label: "Total alumnos" },
  { value: "estatal", label: "Estatal" },
  { value: "privado", label: "Privado" },
];

const NIVELES = [
  { value: "", label: "Todos los niveles" },
  { value: "INI", label: "Inicial" },
  { value: "PRI", label: "Primaria" },
  { value: "SEC", label: "Secundaria" },
  { value: "SUP", label: "Superior No Univ." },
];

const ANIOS_MATRICULA = Array.from({ length: 19 }, (_, i) => 2025 - i);
const ANIOS_INDICADORES = ANIOS_MATRICULA.filter(a => a <= 2024);

function esIndicador(metrica: string): boolean {
  return ["REP", "ABN", "SOB"].includes(metrica);
}

export default function MapaExplorador() {
  const [datosMatricula, setDatosMatricula] = useState<MatriculaItem[]>([]);
  const [datosIndicador, setDatosIndicador] = useState<{ jurisdiccion: string; valor: number; anio_estudio: string }[]>([]);
  const [loadingMapa, setLoadingMapa] = useState(true);
  const [metrica, setMetrica] = useState("SOB");
  const [nivel, setNivel] = useState("SEC");
  const [anio, setAnio] = useState(2024);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null);

  const anioEfectivo = esIndicador(metrica) && metrica !== "SOB" && anio === 2025 ? 2024 : anio;
  const mostrarAvisoAnio = esIndicador(metrica) && metrica !== "SOB" && anio === 2025;

  useEffect(() => {
    const fetchMatricula = async () => {
      try {
        const res = await getMatricula({ anio, nivel: nivel || undefined });
        setDatosMatricula(res.datos);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMatricula();
  }, [anio, nivel]);

  useEffect(() => {
    const fetchMapa = async () => {
      setLoadingMapa(true);
      try {
        if (esIndicador(metrica)) {
          const res = await getIndicadores({
            indicador: metrica as "REP" | "ABN" | "SOB",
            nivel: nivel || undefined,
            anio: anioEfectivo,
          });
          setDatosIndicador(res.datos);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMapa(false);
      }
    };
    fetchMapa();
  }, [metrica, nivel, anioEfectivo]);

  useEffect(() => {
    if (!esIndicador(metrica)) setLoadingMapa(false);
  }, [metrica]);

  const datosMapa: Record<string, number> = {};
  if (esIndicador(metrica)) {
    datosIndicador
      .filter(d => d.anio_estudio === "Total")
      .forEach(d => { datosMapa[d.jurisdiccion] = d.valor; });
  } else {
    const provincias = [...new Set(datosMatricula.map(d => d.jurisdiccion))];
    provincias.forEach(prov => {
      const dp = datosMatricula.filter(d => d.jurisdiccion === prov);
      const total = dp.reduce((acc, d) => acc + d.total_alumnos, 0);
      const estatal = dp.filter(d => d.sector === "Estatal").reduce((acc, d) => acc + d.total_alumnos, 0);
      const privado = dp.filter(d => d.sector === "Privado").reduce((acc, d) => acc + d.total_alumnos, 0);
      if (metrica === "total") datosMapa[prov] = total;
      else if (metrica === "estatal") datosMapa[prov] = estatal;
      else if (metrica === "privado") datosMapa[prov] = privado;
    });
  }

  const descripcionMetrica = METRICAS_INDICADORES.find(m => m.value === metrica)?.descripcion;
  const aniosDisponibles = esIndicador(metrica) ? ANIOS_INDICADORES : ANIOS_MATRICULA;

  return (
    <div>
      {/* Controles */}
      <div className="flex flex-wrap gap-6 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Trayectoria escolar</label>
          <div className="flex flex-wrap gap-2">
            {METRICAS_INDICADORES.map(m => (
              <button
                key={m.value}
                onClick={() => {
                  setMetrica(m.value);
                  if (anio === 2025 && m.value !== "SOB") setAnio(2024);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  metrica === m.value
                    ? "text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={metrica === m.value ? { background: "#6d28d9" } : {}}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Matrícula</label>
          <div className="flex flex-wrap gap-2">
            {METRICAS_MATRICULA.map(m => (
              <button
                key={m.value}
                onClick={() => setMetrica(m.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  metrica === m.value
                    ? "bg-blue-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Nivel</label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={nivel}
              onChange={e => setNivel(e.target.value)}
            >
              {NIVELES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Año</label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={anio}
              onChange={e => setAnio(Number(e.target.value))}
            >
              {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {mostrarAvisoAnio && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <strong>Nota:</strong> {metrica === "REP" ? "Repitencia" : "Abandono"} no está disponible para 2025. Se muestra 2024.
        </div>
      )}

      {descripcionMetrica && (
        <div className="mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
          {descripcionMetrica}
        </div>
      )}

      {/* Leyenda dinámica */}
      <div className="flex items-center gap-3 mb-4">
        {esIndicador(metrica) ? (
          <>
            <span className="text-xs text-gray-400">Menor</span>
            <div className="flex gap-0.5">
              {["#ede9fe","#c4b5fd","#a78bfa","#7c3aed","#6d28d9","#5b21b6","#4c1d95"].map(c => (
                <div key={c} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-xs text-gray-400">Mayor</span>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-400">Menor</span>
            <div className="flex gap-0.5">
              {["#dbeafe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8","#1e3a8a"].map(c => (
                <div key={c} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-xs text-gray-400">Mayor</span>
          </>
        )}
      </div>

      {/* Mapa + Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loadingMapa ? (
            <div className="h-96 flex items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-sm">Consultando datos...</p>
            </div>
          ) : (
            <MapaMapLibre
              datos={datosMapa}
              metrica={metrica}
              onProvinciaClick={setProvinciaSeleccionada}
              provinciaSeleccionada={provinciaSeleccionada}
            />
          )}
        </div>
        <div>
          <PanelProvincia
            provincia={provinciaSeleccionada}
            datos={datosMatricula}
            anio={anio}
            nivel={nivel}
            metricaActiva={metrica}
            onCerrar={() => setProvinciaSeleccionada(null)}
          />
        </div>
      </div>
    </div>
  );
}
