"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  datos: { nivel: string; sector: string; total_alumnos: number }[];
}

export default function GraficoBarras({ datos }: Props) {
  const niveles = [...new Set(datos.map(d => d.nivel))];
  const chartData = niveles.map(nivel => {
    const estatal = datos.find(d => d.nivel === nivel && d.sector === "Estatal")?.total_alumnos || 0;
    const privado = datos.find(d => d.nivel === nivel && d.sector === "Privado")?.total_alumnos || 0;
    const short = nivel.replace("Educacion ", "").replace(" No Universitaria", " No Univ.");
    return { nivel: short, Estatal: estatal, Privado: privado };
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="nivel" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number) => v.toLocaleString("es-AR")} />
        <Legend />
        <Bar dataKey="Estatal" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Privado" fill="#7c3aed" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
