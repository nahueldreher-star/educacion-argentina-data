"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface Props {
  datos: Record<string, number>;
  metrica: string;
  onProvinciaClick: (nombre: string) => void;
  provinciaSeleccionada: string | null;
}

export default function MapaArgentina({ datos, metrica, onProvinciaClick, provinciaSeleccionada }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; nombre: string; valor: string } | null>(null);
  const [geojson, setGeojson] = useState<any>(null);

  useEffect(() => {
    fetch("/provincias.geojson")
      .then(r => r.json())
      .then(data => setGeojson(data))
      .catch(e => console.error("Error GeoJSON:", e));
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !geojson) return;

    const draw = () => {
      const width = containerRef.current!.getBoundingClientRect().width;
      const height = Math.max(400, width * 1.2);
      if (width === 0) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", width).attr("height", height);

      const projection = d3.geoMercator().fitSize([width, height], geojson);
      const path = d3.geoPath().projection(projection);

      const valores = Object.values(datos).filter(v => v > 0);
      const maxVal = d3.max(valores) || 1;
      const minVal = Math.max(1, d3.min(valores) || 1);

      // Escala logaritmica para visualizar mejor las diferencias
      const colorScale = metrica === "pct_privado"
        ? d3.scaleSequential().domain([0, 100]).interpolator(d3.interpolateRdYlGn)
        : d3.scaleSequential().domain([Math.log(minVal), Math.log(maxVal)]).interpolator(d3.interpolateBlues);

      const getColor = (nombre: string) => {
        const val = datos[nombre];
        if (!val || val === 0) return "#e2e8f0";
        if (metrica === "pct_privado") return colorScale(val);
        return colorScale(Math.log(val));
      };

      svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", (d: any) => path(d) || "")
        .attr("fill", (d: any) => getColor(d.properties.nombre))
        .attr("stroke", (d: any) =>
          d.properties.nombre === provinciaSeleccionada ? "#1e40af" : "#ffffff"
        )
        .attr("stroke-width", (d: any) =>
          d.properties.nombre === provinciaSeleccionada ? 3 : 1
        )
        .style("cursor", "pointer")
        .on("mouseover", function(event: any, d: any) {
          const nombre = d.properties.nombre;
          const val = datos[nombre];
          d3.select(this).attr("fill", "#fbbf24");
          const rect = containerRef.current!.getBoundingClientRect();
          setTooltip({
            x: event.clientX - rect.left + 12,
            y: event.clientY - rect.top - 12,
            nombre,
            valor: val
              ? metrica === "pct_privado"
                ? val.toFixed(1) + "% privado"
                : val.toLocaleString("es-AR") + " alumnos"
              : "Sin datos",
          });
        })
        .on("mouseout", function(_: any, d: any) {
          d3.select(this).attr("fill", getColor(d.properties.nombre));
          setTooltip(null);
        })
        .on("click", (_: any, d: any) => {
          onProvinciaClick(d.properties.nombre);
        });
    };

    draw();
    const observer = new ResizeObserver(() => draw());
    observer.observe(containerRef.current!);
    return () => observer.disconnect();
  }, [geojson, datos, provinciaSeleccionada, metrica]);

  return (
    <div ref={containerRef} className="relative w-full bg-slate-50 rounded-2xl overflow-hidden border border-gray-100" style={{ minHeight: 400 }}>
      <svg ref={svgRef} />
      {tooltip && (
        <div
          className="absolute bg-gray-900 text-white text-xs px-3 py-2 rounded-lg pointer-events-none shadow-lg z-10"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-semibold">{tooltip.nombre}</p>
          <p className="text-blue-300">{tooltip.valor}</p>
        </div>
      )}
    </div>
  );
}
