"use client";

interface Filtros { nivel: string; sector: string; region: string; }
interface Props { filtros: Filtros; onChange: (f: Filtros) => void; }

const NIVELES = [
  { value: "", label: "Todos los niveles" },
  { value: "INI", label: "Inicial" },
  { value: "PRI", label: "Primaria" },
  { value: "SEC", label: "Secundaria" },
  { value: "SUP", label: "Superior No Univ." },
];
const SECTORES = [
  { value: "", label: "Estatal y Privado" },
  { value: "E", label: "Estatal" },
  { value: "P", label: "Privado" },
];
const REGIONES = [
  { value: "", label: "Todo el pais" },
  { value: "GBA", label: "GBA" },
  { value: "PAMPEANA", label: "Pampeana" },
  { value: "NOA", label: "NOA" },
  { value: "NEA", label: "NEA" },
  { value: "CUYO", label: "Cuyo" },
  { value: "PATAGONIA", label: "Patagonia" },
];

export default function FiltrosExplorador({ filtros, onChange }: Props) {
  const select = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nivel educativo</label>
        <select className={select} value={filtros.nivel} onChange={e => onChange({ ...filtros, nivel: e.target.value })}>
          {NIVELES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Sector de gestion</label>
        <select className={select} value={filtros.sector} onChange={e => onChange({ ...filtros, sector: e.target.value })}>
          {SECTORES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
        <select className={select} value={filtros.region} onChange={e => onChange({ ...filtros, region: e.target.value })}>
          {REGIONES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
    </div>
  );
}
