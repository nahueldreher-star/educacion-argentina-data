"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Props {
  datos: Record<string, number>;
  metrica: string;
  onProvinciaClick: (nombre: string) => void;
  provinciaSeleccionada: string | null;
}

const NOMBRE_MAP: Record<string, string> = {
  "Buenos Aires":           "Buenos Aires",
  "Ciudad de Buenos Aires": "Ciudad Autónoma de Buenos Aires",
  "Catamarca":              "Catamarca",
  "Chaco":                  "Chaco",
  "Chubut":                 "Chubut",
  "Córdoba":                "Córdoba",
  "Corrientes":             "Corrientes",
  "Entre Ríos":             "Entre Ríos",
  "Formosa":                "Formosa",
  "Jujuy":                  "Jujuy",
  "La Pampa":               "La Pampa",
  "La Rioja":               "La Rioja",
  "Mendoza":                "Mendoza",
  "Misiones":               "Misiones",
  "Neuquén":                "Neuquén",
  "Río Negro":              "Río Negro",
  "Salta":                  "Salta",
  "San Juan":               "San Juan",
  "San Luis":               "San Luis",
  "Santa Cruz":             "Santa Cruz",
  "Santa Fe":               "Santa Fe",
  "Santiago del Estero":    "Santiago del Estero",
  "Tierra del Fuego":       "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  "Tucumán":                "Tucumán",
};

const NOMBRE_INVERSO: Record<string, string> = Object.fromEntries(
  Object.entries(NOMBRE_MAP).map(([k, v]) => [v, k])
);

const INDICADORES = ["REP", "ABN", "SOB"];

function esIndicador(metrica: string): boolean {
  return INDICADORES.includes(metrica);
}

function etiquetaMetrica(metrica: string): string {
  if (metrica === "SOB") return "sobreedad";
  if (metrica === "REP") return "repitencia";
  if (metrica === "ABN") return "abandono interanual";
  if (metrica === "total") return "alumnos";
  if (metrica === "estatal") return "alumnos sector estatal";
  if (metrica === "privado") return "alumnos sector privado";
  return metrica;
}

function narrativaTooltip(valor: number, metrica: string): string {
  if (!esIndicador(metrica)) return valor.toLocaleString("es-AR") + " alumnos";
  if (valor < 0) return "Entrada neta de alumnos (posible migración interna)";
  const n = Math.round(100 / valor);
  const label = metrica === "SOB" ? "va atrasado" : metrica === "REP" ? "repite" : "no vuelve al año siguiente";
  return `1 de cada ${n} alumnos ${label}`;
}

const getColor = (valor: number | undefined, metrica: string, minVal: number, maxVal: number): string => {
  if (valor === undefined || valor === null) return "#e2e8f0";

  if (esIndicador(metrica)) {
    if (valor < 0) {
      const norm = Math.min(Math.abs(valor) / Math.max(Math.abs(minVal), 0.01), 1);
      if (norm < 0.25) return "#94a3b8";
      if (norm < 0.50) return "#6096ba";
      if (norm < 0.75) return "#2d6a9f";
      return "#1a3a6b";
    }
    if (valor === 0) return "#f5f3ff";
    const norm = Math.min(valor / Math.max(maxVal, 0.01), 1);
    if (norm < 0.15) return "#ede9fe";
    if (norm < 0.30) return "#c4b5fd";
    if (norm < 0.45) return "#a78bfa";
    if (norm < 0.60) return "#7c3aed";
    if (norm < 0.75) return "#6d28d9";
    if (norm < 0.88) return "#5b21b6";
    return "#4c1d95";
  }

  if (!valor) return "#e2e8f0";
  const norm = (valor - minVal) / (maxVal - minVal);
  if (norm < 0.05) return "#dbeafe";
  if (norm < 0.15) return "#93c5fd";
  if (norm < 0.30) return "#60a5fa";
  if (norm < 0.45) return "#3b82f6";
  if (norm < 0.60) return "#2563eb";
  if (norm < 0.75) return "#1d4ed8";
  if (norm < 0.88) return "#1e40af";
  return "#1e3a8a";
};

export default function MapaMapLibre({ datos, metrica, onProvinciaClick, provinciaSeleccionada }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const tooltip = useRef<HTMLDivElement | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const tooltipEl = document.createElement("div");
    tooltipEl.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 13px;
      font-family: sans-serif;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 10;
      max-width: 210px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    `;
    mapContainer.current.appendChild(tooltipEl);
    tooltip.current = tooltipEl;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [{
          id: "background",
          type: "background",
          paint: { "background-color": "#e8f4f8" }
        }]
      },
      center: [-65, -42],
      zoom: 3.1,
      minZoom: 3.1,
      maxZoom: 3.1,
      scrollZoom: false,
      boxZoom: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      dragRotate: false,
      dragPan: false,
    });

    map.current.on("load", async () => {
      // Países limítrofes desde Natural Earth
      const sudamericaRes = await fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson");
      const sudamerica = await sudamericaRes.json();

      map.current!.addSource("paises", {
        type: "geojson",
        data: {
          ...sudamerica,
          features: sudamerica.features.filter((f: any) =>
            ["Chile", "Bolivia", "Paraguay", "Uruguay", "Brazil", "Peru"].includes(f.properties.NAME)
          )
        }
      });

      map.current!.addLayer({
        id: "paises-fill",
        type: "fill",
        source: "paises",
        paint: {
          "fill-color": "#f8fafc",
          "fill-opacity": 1,
        }
      });

      map.current!.addLayer({
        id: "paises-border",
        type: "line",
        source: "paises",
        paint: {
          "line-color": "#cbd5e1",
          "line-width": 0.8,
        }
      });

      // Provincias argentinas
      const res = await fetch("/provincias_ign.geojson");
      const geojson = await res.json();

      map.current!.addSource("provincias", {
        type: "geojson",
        data: geojson,
      });

      map.current!.addLayer({
        id: "provincias-fill",
        type: "fill",
        source: "provincias",
        paint: {
          "fill-color": "#ede9fe",
          "fill-opacity": 0.95,
        }
      });

      map.current!.addLayer({
        id: "provincias-border",
        type: "line",
        source: "provincias",
        paint: {
          "line-color": "#ffffff",
          "line-width": 1.2,
        }
      });

      map.current!.addLayer({
        id: "provincias-selected",
        type: "line",
        source: "provincias",
        paint: {
          "line-color": "#5b21b6",
          "line-width": 3,
        },
        filter: ["==", ["get", "nam"], ""]
      });

      // CABA
      map.current!.addSource("caba-point", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: { nam: "Ciudad Autónoma de Buenos Aires", label: "CABA" },
            geometry: { type: "Point", coordinates: [-58.4370, -34.6037] }
          }]
        }
      });

      map.current!.addLayer({
        id: "caba-circle",
        type: "circle",
        source: "caba-point",
        paint: {
          "circle-radius": 6,
          "circle-color": "#6d28d9",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        }
      });

      map.current!.addLayer({
        id: "caba-label",
        type: "symbol",
        source: "caba-point",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 10,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#5b21b6",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        }
      });

      // Click
      map.current!.on("click", "provincias-fill", (e) => {
        const nombre_ign = e.features?.[0]?.properties?.nam;
        if (nombre_ign) {
          const nombre_api = NOMBRE_INVERSO[nombre_ign] || nombre_ign;
          onProvinciaClick(nombre_api);
        }
      });

      map.current!.on("click", "caba-circle", () => {
        onProvinciaClick("Ciudad de Buenos Aires");
      });

      // Hover tooltip
      map.current!.on("mousemove", "provincias-fill", (e) => {
        if (!tooltip.current || !mapContainer.current) return;
        const nombre_ign = e.features?.[0]?.properties?.nam;
        if (!nombre_ign) return;
        const nombre_api = NOMBRE_INVERSO[nombre_ign] || nombre_ign;
        const valor = (window as any).__mapaData?.[nombre_api];
        const metricaActual = (window as any).__mapaMetrica;

        const rect = mapContainer.current.getBoundingClientRect();
        const x = e.originalEvent.clientX - rect.left;
        const y = e.originalEvent.clientY - rect.top;

        let html = `<div style="font-weight:600;color:#1e293b;margin-bottom:4px">${nombre_api}</div>`;
        if (valor !== undefined && valor !== null) {
          if (esIndicador(metricaActual)) {
            html += `<div style="font-size:16px;font-weight:700;color:#6d28d9;margin-bottom:2px">${valor.toFixed(1)}%</div>`;
            html += `<div style="color:#64748b;font-size:12px">${narrativaTooltip(valor, metricaActual)}</div>`;
          } else {
            html += `<div style="font-size:15px;font-weight:600;color:#1a3a6b">${valor.toLocaleString("es-AR")}</div>`;
            html += `<div style="color:#64748b;font-size:12px">${etiquetaMetrica(metricaActual)}</div>`;
          }
        } else {
          html += `<div style="color:#94a3b8;font-size:12px">Sin datos</div>`;
        }

        tooltip.current.innerHTML = html;
        tooltip.current.style.opacity = "1";
        tooltip.current.style.left = `${x + 14}px`;
        tooltip.current.style.top = `${y - 10}px`;
        map.current!.getCanvas().style.cursor = "pointer";
      });

      map.current!.on("mouseleave", "provincias-fill", () => {
        if (tooltip.current) tooltip.current.style.opacity = "0";
        map.current!.getCanvas().style.cursor = "";
      });

      map.current!.on("mousemove", "caba-circle", (e) => {
        if (!tooltip.current || !mapContainer.current) return;
        const valor = (window as any).__mapaData?.["Ciudad de Buenos Aires"];
        const metricaActual = (window as any).__mapaMetrica;
        const rect = mapContainer.current.getBoundingClientRect();
        const x = e.originalEvent.clientX - rect.left;
        const y = e.originalEvent.clientY - rect.top;

        let html = `<div style="font-weight:600;color:#1e293b;margin-bottom:4px">Ciudad de Buenos Aires</div>`;
        if (valor !== undefined) {
          if (esIndicador(metricaActual)) {
            html += `<div style="font-size:16px;font-weight:700;color:#6d28d9;margin-bottom:2px">${valor.toFixed(1)}%</div>`;
            html += `<div style="color:#64748b;font-size:12px">${narrativaTooltip(valor, metricaActual)}</div>`;
          } else {
            html += `<div style="font-size:15px;font-weight:600;color:#1a3a6b">${valor.toLocaleString("es-AR")}</div>`;
          }
        }
        tooltip.current.innerHTML = html;
        tooltip.current.style.opacity = "1";
        tooltip.current.style.left = `${x + 14}px`;
        tooltip.current.style.top = `${y - 10}px`;
        map.current!.getCanvas().style.cursor = "pointer";
      });

      map.current!.on("mouseleave", "caba-circle", () => {
        if (tooltip.current) tooltip.current.style.opacity = "0";
        map.current!.getCanvas().style.cursor = "";
      });

      setListo(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      tooltip.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !listo) return;

    (window as any).__mapaData = datos;
    (window as any).__mapaMetrica = metrica;

    const valores = Object.values(datos).filter(v => v !== undefined && v !== null) as number[];
    const maxVal = valores.length ? Math.max(...valores) : 1;
    const minVal = valores.length ? Math.min(...valores) : 0;

    const colorExpression: any[] = ["match", ["get", "nam"]];
    Object.entries(datos).forEach(([nombre_api, valor]) => {
      const nombre_ign = NOMBRE_MAP[nombre_api] || nombre_api;
      colorExpression.push(nombre_ign, getColor(valor, metrica, minVal, maxVal));
    });
    colorExpression.push("#e2e8f0");

    map.current.setPaintProperty("provincias-fill", "fill-color", colorExpression);

    const colorCaba = getColor(datos["Ciudad de Buenos Aires"], metrica, minVal, maxVal);
    map.current.setPaintProperty("caba-circle", "circle-color", colorCaba);

    // Borde seleccionado: azul para matrícula, borgoña para indicadores
    const colorBorde = esIndicador(metrica) ? "#5b21b6" : "#1e40af";
    map.current.setPaintProperty("provincias-selected", "line-color", colorBorde);

    if (provinciaSeleccionada) {
      const nombre_ign = NOMBRE_MAP[provinciaSeleccionada] || provinciaSeleccionada;
      map.current.setFilter("provincias-selected", ["==", ["get", "nam"], nombre_ign]);
    } else {
      map.current.setFilter("provincias-selected", ["==", ["get", "nam"], ""]);
    }
  }, [datos, metrica, provinciaSeleccionada, listo]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white" style={{ height: 620 }}>
      <div ref={mapContainer} className="w-full h-full" />
      {!listo && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <p className="text-gray-400 text-sm">Cargando mapa...</p>
        </div>
      )}
    </div>
  );
}
