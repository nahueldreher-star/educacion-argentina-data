"use client";
import { useState, useEffect } from "react";
import { getMatricula, MatriculaItem } from "../lib/api";
import dynamic from "next/dynamic";
import PanelProvincia from "./PanelProvincia";

const MapaMapLibre = dynamic(() => import("./MapaMapLibre"), { ssr: false });

const METRICAS = [
  { value: "total", label: "Total alumnos" },
  { value: "pct_privado", label: "% sector privado" },
  { value: "estatal", label: "Solo estatal" },
  { value: "privado", label: "Solo privado" },
];

const NIVELES = [
  { value: "", label: "Todos los niveles" },
  { value: "INI", label: "Inicial" },
  { value: "PRI", label: "Primaria" },
  { value: "SEC", label: "Secundaria" },
  { value: "SUP", label: "Superior No Univ." },
];

export default function MapaExplorador() {
  const [datos, setDatos] = useState<MatriculaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrica, setMetrica] = useState("total");
  const [nivel, setNivel] = useState("");
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getMatricula({ anio: 2025, nivel: nivel || undefined });
        setDatos(res.datos);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nivel]);

  const datosMapa: Record<string, number> = {};
  const provincias = [...new Set(datos.map(d => d.jurisdiccion))];

  provincias.forEach(prov => {
    const datosProv = datos.filter(d => d.jurisdiccion === prov);
    const total = datosProv.reduce((acc, d) => acc + d.total_alumnos, 0);
    const estatal = datosProv.filter(d => d.sector === "Estatal").reduce((acc, d) => acc + d.total_alumnos, 0);
    const privado = datosProv.filter(d => d.sector === "Privado").reduce((acc, d) => acc + d.total_alumnos, 0);

    if (metrica === "total") datosMapa[prov] = total;
    else if (metrica === "pct_privado") datosMapa[prov] = total > 0 ? (privado / total) * 100 : 0;
    else if (metrica === "estatal") datosMapa[prov] = estatal;
    else if (metrica === "privado") datosMapa[prov] = privado;
  });

  return (
    <div>
      {/* Controles */}
      <div className="flex flex-wrap gap-6 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Mostrar en el mapa</label>
          <div className="flex flex-wrap gap-2">
            {METRICAS.map(m => (
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
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Nivel educativo</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={nivel}
            onChange={e => setNivel(e.target.value)}
          >
            {NIVELES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-400">Menor</span>
        <div className="flex gap-0.5">
          {["#eff6ff","#dbeafe","#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#1d4ed8","#1e3a8a"].map(c => (
            <div key={c} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span className="text-xs text-gray-400">Mayor</span>
      </div>

      {/* Mapa + Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
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
            datos={datos}
            onCerrar={() => setProvinciaSeleccionada(null)}
          />
        </div>
      </div>
    </div>
  );
}
