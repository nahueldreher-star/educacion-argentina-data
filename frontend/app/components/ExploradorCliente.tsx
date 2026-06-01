"use client";
import { useState, useEffect } from "react";
import { getMatricula, MatriculaItem } from "../lib/api";
import FiltrosExplorador from "./FiltrosExplorador";
import TablaJurisdicciones from "./TablaJurisdicciones";
import GraficoBarras from "./GraficoBarras";

export default function ExploradorCliente() {
  const [filtros, setFiltros] = useState({ nivel: "", sector: "", region: "" });
  const [datos, setDatos] = useState<MatriculaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<"tabla" | "grafico">("tabla");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getMatricula({ anio: 2025, ...filtros });
        setDatos(res.datos);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filtros]);

  const resumenGrafico = datos.reduce((acc, d) => {
    const key = `${d.nivel}__${d.sector}`;
    if (!acc[key]) acc[key] = { nivel: d.nivel, sector: d.sector, total_alumnos: 0 };
    acc[key].total_alumnos += d.total_alumnos;
    return acc;
  }, {} as Record<string, { nivel: string; sector: string; total_alumnos: number }>);

  return (
    <div className="space-y-4">
      <FiltrosExplorador filtros={filtros} onChange={setFiltros} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? "Cargando..." : `${datos.length} registros encontrados`}
        </p>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button onClick={() => setVista("tabla")} className={`px-3 py-1.5 ${vista === "tabla" ? "bg-blue-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Tabla</button>
          <button onClick={() => setVista("grafico")} className={`px-3 py-1.5 ${vista === "grafico" ? "bg-blue-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Grafico</button>
        </div>
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400">Consultando la API...</div>
      ) : vista === "tabla" ? (
        <TablaJurisdicciones datos={datos} />
      ) : (
        <GraficoBarras datos={Object.values(resumenGrafico)} />
      )}
    </div>
  );
}
