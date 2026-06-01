content = """"use client";
import { X } from "lucide-react";
import { MatriculaItem } from "../lib/api";

interface Props {
  provincia: string | null;
  datos: MatriculaItem[];
  onCerrar: () => void;
}

const NIVEL_COLOR: Record<string, string> = {
  "Educacion Inicial":                   "bg-amber-100 text-amber-800",
  "Educacion Primaria":                  "bg-blue-100 text-blue-800",
  "Educacion Secundaria":                "bg-emerald-100 text-emerald-800",
  "Educacion Superior No Universitaria": "bg-purple-100 text-purple-800",
};

export default function PanelProvincia({ provincia, datos, onCerrar }: Props) {
  const esNacional = !provincia;

  const datosFiltrados = esNacional
    ? datos.filter(d => d.granularidad === "PROVINCIAL")
    : datos.filter(d => d.jurisdiccion === provincia);

  const total = datosFiltrados.reduce((acc, d) => acc + d.total_alumnos, 0);
  const totalEstatal = datosFiltrados
    .filter(d => d.sector === "Estatal")
    .reduce((acc, d) => acc + d.total_alumnos, 0);
  const totalPrivado = datosFiltrados
    .filter(d => d.sector === "Privado")
    .reduce((acc, d) => acc + d.total_alumnos, 0);
  const pctPrivado = total > 0 ? ((totalPrivado / total) * 100).toFixed(1) : "0";

  const niveles = [...new Set(datosFiltrados.map(d => d.nivel))];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">
            {esNacional ? "Total Nacional" : provincia}
          </h3>
          {esNacional && (
            <p className="text-xs text-slate-400 mt-0.5">Hace clic en una provincia para ver el detalle</p>
          )}
        </div>
        {!esNacional && (
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
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
        {niveles.map(nivel => {
          const estatal = datosFiltrados
            .filter(d => d.nivel === nivel && d.sector === "Estatal")
            .reduce((acc, d) => acc + d.total_alumnos, 0);
          const privado = datosFiltrados
            .filter(d => d.nivel === nivel && d.sector === "Privado")
            .reduce((acc, d) => acc + d.total_alumnos, 0);
          const totalNivel = estatal + privado;
          const pctSector = totalNivel > 0 ? (privado / totalNivel) * 100 : 0;
          const pctNivel = total > 0 ? ((totalNivel / total) * 100).toFixed(1) : "0";
          const short = nivel.replace("Educacion ", "").replace(" No Universitaria", " No Univ.");
          const colorClass = NIVEL_COLOR[nivel] || "bg-slate-100 text-slate-800";

          return (
            <div key={nivel} className="border border-slate-100 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>{short}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-900">{totalNivel.toLocaleString("es-AR")}</span>
                  <span className="text-xs text-slate-400 ml-1.5">{pctNivel}% del total</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${100 - pctSector}%`, background: "#1a3a6b" }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Estatal: {estatal.toLocaleString("es-AR")}</span>
                <span>Privado: {privado.toLocaleString("es-AR")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
"""

with open("C:/educacion-argentina-data/frontend/app/components/PanelProvincia.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("PanelProvincia.tsx actualizado OK")
