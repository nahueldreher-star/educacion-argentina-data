"use client";

export default function ResumenCards({ datos, total }: { datos: { nivel: string; sector: string; total_alumnos: number }[]; total: number }) {
  const porNivel = datos.reduce((acc, d) => {
    if (!acc[d.nivel]) acc[d.nivel] = 0;
    acc[d.nivel] += d.total_alumnos;
    return acc;
  }, {} as Record<string, number>);

  const NIVEL_CONFIG: Record<string, { color: string; short: string }> = {
    "Educacion Inicial":                   { color: "bg-amber-50 text-amber-700 border-amber-200",       short: "Inicial" },
    "Educacion Primaria":                  { color: "bg-blue-50 text-blue-700 border-blue-200",          short: "Primaria" },
    "Educacion Secundaria":                { color: "bg-emerald-50 text-emerald-700 border-emerald-200", short: "Secundaria" },
    "Educacion Superior No Universitaria": { color: "bg-purple-50 text-purple-700 border-purple-200",    short: "Superior" },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(porNivel).map(([nivel, total_nivel]) => {
        const config = NIVEL_CONFIG[nivel] || { color: "bg-gray-50 text-gray-700 border-gray-200", short: nivel };
        return (
          <div key={nivel} className={`border rounded-xl p-4 ${config.color}`}>
            <p className="font-medium text-sm mb-2">{config.short}</p>
            <p className="text-2xl font-bold">{total_nivel.toLocaleString("es-AR")}</p>
            <p className="text-xs mt-1 opacity-70">{((total_nivel / total) * 100).toFixed(1)}% del sistema</p>
          </div>
        );
      })}
    </div>
  );
}
