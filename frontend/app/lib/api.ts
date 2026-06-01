const API_BASE = "https://educacion-argentina-api.onrender.com/api/v1";

export interface MatriculaItem {
  jurisdiccion: string;
  region: string;
  granularidad: string;
  nivel: string;
  sector: string;
  anio_lectivo: number;
  total_alumnos: number;
}

export interface ResumenNacional {
  anio_lectivo: number;
  total_sistema: number;
  advertencia: string;
  datos: { nivel: string; sector: string; total_alumnos: number; anio_lectivo: number }[];
}

export interface MatriculaResponse {
  total_registros: number;
  filtros_aplicados: Record<string, string>;
  advertencia: string | null;
  datos: MatriculaItem[];
}

export async function getResumenNacional(anio: number): Promise<ResumenNacional> {
  const res = await fetch(`${API_BASE}/matricula/resumen-nacional/${anio}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Error al obtener resumen nacional");
  return res.json();
}

export async function getMatricula(params: {
  anio?: number;
  nivel?: string;
  sector?: string;
  region?: string;
  incluir_subprovincial?: boolean;
}): Promise<MatriculaResponse> {
  const query = new URLSearchParams();
  if (params.anio) query.set("anio", String(params.anio));
  if (params.nivel) query.set("nivel", params.nivel);
  if (params.sector) query.set("sector", params.sector);
  if (params.region) query.set("region", params.region);
  if (params.incluir_subprovincial) query.set("incluir_subprovincial", "true");
  query.set("limit", "500");
  const res = await fetch(`${API_BASE}/matricula?${query}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Error al obtener matricula");
  return res.json();
}
