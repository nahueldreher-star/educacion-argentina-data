"use client";
import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";

const API_BASE = "https://educacion-argentina-api.onrender.com/api/v1";
const SUBPROVINCIALES = ["GBA - Conurbano", "GBA - Resto Provincia"];

const COLORES_PROVINCIA = ["#e63946", "#2a9d8f", "#e9c46a", "#f4a261"];

const INDICADORES = [
  { value: "SOB", label: "Sobreedad" },
  { value: "REP", label: "Repitencia" },
  { value: "ABN", label: "Abandono" },
];

const NIVELES = [
  { value: "SEC", label: "Secundaria" },
  { value: "PRI", label: "Primaria" },
];

interface DatoSerie {
  jurisdiccion: string;
  anio_lectivo: number;
  valor: number;
}

interface Props {
  provinciaActiva?: string | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {label === 2020 && (
        <p className="text-xs text-amber-600 mb-2 italic">
          ⚠ En 2020 se suspendió la repitencia por pandemia en la mayoría de las provincias
        </p>
      )}
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-900">{entry.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

export default function GraficoEvolucion({ provinciaActiva }: Props) {
  const [indicador, setIndicador] = useState("SOB");
  const [nivel, setNivel] = useState("SEC");
  const [datos, setDatos] = useState<DatoSerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");

  // Cargar serie temporal
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/indicadores/serie-temporal?indicador=${indicador}&nivel=${nivel}&anio_estudio=Total`)
      .then(r => r.json())
      .then(res => {
        setDatos(res.datos || []);
        const provs = [...new Set((res.datos || [])
          .map((d: DatoSerie) => d.jurisdiccion)
          .filter((j: string) => !SUBPROVINCIALES.includes(j))
        )].sort() as string[];
        setProvincias(provs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [indicador, nivel]);

  // Cargar provincia activa del mapa automáticamente
  useEffect(() => {
    if (provinciaActiva && !SUBPROVINCIALES.includes(provinciaActiva)) {
      setSeleccionadas(prev => {
        if (prev.includes(provinciaActiva)) return prev;
        return [provinciaActiva, ...prev].slice(0, 3);
      });
    }
  }, [provinciaActiva]);

  const toggleProvincia = (prov: string) => {
    setSeleccionadas(prev => {
      if (prev.includes(prov)) return prev.filter(p => p !== prov);
      if (prev.length >= 3) return prev;
      return [...prev, prov];
    });
  };

  // Construir datos del gráfico
  const anios = [...new Set(datos.map(d => d.anio_lectivo))].sort();

  // Promedio nacional por año
  const promedioNacional: Record<number, number> = {};
  anios.forEach(anio => {
    const filas = datos.filter(d =>
      d.anio_lectivo === anio && !SUBPROVINCIALES.includes(d.jurisdiccion)
    );
    if (filas.length) {
      promedioNacional[anio] = filas.reduce((acc, d) => acc + d.valor, 0) / filas.length;
    }
  });

  const datosGrafico = anios.map(anio => {
    const punto: Record<string, any> = { anio };
    punto["Promedio nacional"] = promedioNacional[anio]
      ? parseFloat(promedioNacional[anio].toFixed(2))
      : null;
    seleccionadas.forEach(prov => {
      const fila = datos.find(d => d.jurisdiccion === prov && d.anio_lectivo === anio);
      punto[prov] = fila ? parseFloat(fila.valor.toFixed(2)) : null;
    });
    return punto;
  });

  const indicadorLabel = INDICADORES.find(i => i.value === indicador)?.label;
  const nivelLabel = NIVELES.find(n => n.value === nivel)?.label;

  const provinciasFiltradas = provincias.filter(p =>
    p.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">
          ¿Mejoró o empeoró?
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Evolución de {indicadorLabel?.toLowerCase()} en {nivelLabel?.toLowerCase()} · 2012–2025
        </p>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Indicador</label>
          <div className="flex gap-2">
            {INDICADORES.map(i => (
              <button
                key={i.value}
                onClick={() => setIndicador(i.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  indicador === i.value
                    ? "bg-red-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Nivel</label>
          <div className="flex gap-2">
            {NIVELES.map(n => (
              <button
                key={n.value}
                onClick={() => setNivel(n.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  nivel === n.value
                    ? "bg-slate-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selector de provincias */}
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            Comparar provincias <span className="text-slate-300">(máx. 3)</span>
          </p>
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {provinciasFiltradas.map((prov, idx) => {
              const selIdx = seleccionadas.indexOf(prov);
              const estaSeleccionada = selIdx !== -1;
              const color = estaSeleccionada ? COLORES_PROVINCIA[selIdx] : undefined;
              return (
                <button
                  key={prov}
                  onClick={() => toggleProvincia(prov)}
                  disabled={!estaSeleccionada && seleccionadas.length >= 3}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    estaSeleccionada
                      ? "text-white font-medium"
                      : seleccionadas.length >= 3
                      ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                  style={estaSeleccionada ? { backgroundColor: color } : {}}
                >
                  <span className="truncate">{prov}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gráfico */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
              Cargando datos...
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={datosGrafico} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="anio"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                  />
                  <ReferenceLine
                    x={2020}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: "Pandemia", position: "top", fontSize: 10, fill: "#f59e0b" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Promedio nacional"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls
                  />
                  {seleccionadas.map((prov, idx) => (
                    <Line
                      key={prov}
                      type="monotone"
                      dataKey={prov}
                      stroke={COLORES_PROVINCIA[idx]}
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400 mt-3">
                La línea punteada de 2020 marca el año de pandemia, donde la repitencia fue suspendida por decreto en la mayoría de las provincias — los valores de ese año no son comparables con el resto de la serie.
                Fuente: Ministerio de Educación de la Nación · RedFIE/DIE.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
