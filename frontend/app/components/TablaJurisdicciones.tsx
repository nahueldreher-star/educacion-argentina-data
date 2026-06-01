"use client";
import { useState } from "react";
import { MatriculaItem } from "../lib/api";

interface Props { datos: MatriculaItem[]; }

export default function TablaJurisdicciones({ datos }: Props) {
  const [sortBy, setSortBy] = useState<"jurisdiccion" | "total_alumnos">("total_alumnos");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (col: "jurisdiccion" | "total_alumnos") => {
    if (sortBy === col) setOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setOrder("desc"); }
  };

  const sorted = [...datos].sort((a, b) => {
    const va = a[sortBy]; const vb = b[sortBy];
    if (typeof va === "number" && typeof vb === "number") return order === "asc" ? va - vb : vb - va;
    return order === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort("jurisdiccion")}>
              Jurisdiccion {sortBy === "jurisdiccion" ? (order === "asc" ? "↑" : "↓") : ""}
            </th>
            <th className="px-4 py-3 text-left">Region</th>
            <th className="px-4 py-3 text-left">Sector</th>
            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort("total_alumnos")}>
              Alumnos {sortBy === "total_alumnos" ? (order === "asc" ? "↑" : "↓") : ""}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{row.jurisdiccion}</td>
              <td className="px-4 py-3 text-gray-500">{row.region}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${row.sector === "Estatal" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                  {row.sector}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-gray-900">{row.total_alumnos.toLocaleString("es-AR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
