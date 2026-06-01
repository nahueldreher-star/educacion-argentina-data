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

const getColor = (valor: number, metrica: string, minVal: number, maxVal: number): string => {
  if (!valor) return "#cbd5e1";
  if (metrica === "pct_privado") {
    if (valor < 15) return "#dbeafe";
    if (valor < 20) return "#93c5fd";
    if (valor < 25) return "#3b82f6";
    if (valor < 35) return "#1d4ed8";
    return "#1e3a8a";
  }
  const norm = (valor - minVal) / (maxVal - minVal);
  if (norm < 0.05) return "#93c5fd";
  if (norm < 0.15) return "#60a5fa";
  if (norm < 0.25) return "#3b82f6";
  if (norm < 0.40) return "#2563eb";
  if (norm < 0.55) return "#1d4ed8";
  if (norm < 0.70) return "#1e40af";
  if (norm < 0.85) return "#1e3a8a";
  return "#172554";
};

export default function MapaMapLibre({ datos, metrica, onProvinciaClick, provinciaSeleccionada }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [{
          id: "background",
          type: "background",
          paint: { "background-color": "#e8f0f7" }
        }]
      },
      center: [-63, -38],
      zoom: 2.8,
      minZoom: 2,
      maxZoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", async () => {
      const res = await fetch("/provincias_ign.geojson");
      const geojson = await res.json();

      map.current!.addSource("provincias", {
        type: "geojson",
        data: geojson,
      });

      // Capa fill
      map.current!.addLayer({
        id: "provincias-fill",
        type: "fill",
        source: "provincias",
        paint: {
          "fill-color": "#93c5fd",
          "fill-opacity": 0.95,
        }
      });

      // Borde blanco entre provincias
      map.current!.addLayer({
        id: "provincias-border",
        type: "line",
        source: "provincias",
        paint: {
          "line-color": "#ffffff",
          "line-width": 1.2,
        }
      });

      // Borde azul para provincia seleccionada
      map.current!.addLayer({
        id: "provincias-selected",
        type: "line",
        source: "provincias",
        paint: {
          "line-color": "#1e40af",
          "line-width": 3,
        },
        filter: ["==", ["get", "nam"], ""]
      });

      // CABA — capa de punto con etiqueta nativa
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
          "circle-color": "#1e3a8a",
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
          "text-color": "#1e3a8a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        }
      });

      // Click en provincias
      map.current!.on("click", "provincias-fill", (e) => {
        const nombre_ign = e.features?.[0]?.properties?.nam;
        if (nombre_ign) {
          const nombre_api = NOMBRE_INVERSO[nombre_ign] || nombre_ign;
          onProvinciaClick(nombre_api);
        }
      });

      // Click en CABA
      map.current!.on("click", "caba-circle", () => {
        onProvinciaClick("Ciudad de Buenos Aires");
      });

      // Cursores
      ["provincias-fill", "caba-circle"].forEach(layer => {
        map.current!.on("mouseenter", layer, () => {
          map.current!.getCanvas().style.cursor = "pointer";
        });
        map.current!.on("mouseleave", layer, () => {
          map.current!.getCanvas().style.cursor = "";
        });
      });

      setListo(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !listo) return;

    const valores = Object.values(datos).filter(v => v > 0);
    const maxVal = Math.max(...valores, 1);
    const minVal = Math.min(...valores, 0);

    const colorExpression: any[] = ["match", ["get", "nam"]];
    Object.entries(datos).forEach(([nombre_api, valor]) => {
      const nombre_ign = NOMBRE_MAP[nombre_api] || nombre_api;
      colorExpression.push(nombre_ign, getColor(valor, metrica, minVal, maxVal));
    });
    colorExpression.push("#cbd5e1");

    map.current.setPaintProperty("provincias-fill", "fill-color", colorExpression);

    // Color del círculo de CABA
    const colorCaba = getColor(
      datos["Ciudad de Buenos Aires"] || 0,
      metrica, minVal, maxVal
    );
    map.current.setPaintProperty("caba-circle", "circle-color", colorCaba);

    if (provinciaSeleccionada) {
      const nombre_ign = NOMBRE_MAP[provinciaSeleccionada] || provinciaSeleccionada;
      map.current.setFilter("provincias-selected", ["==", ["get", "nam"], nombre_ign]);
    } else {
      map.current.setFilter("provincias-selected", ["==", ["get", "nam"], ""]);
    }
  }, [datos, metrica, provinciaSeleccionada, listo]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 560 }}>
      <div ref={mapContainer} className="w-full h-full" />
      {!listo && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <p className="text-gray-400 text-sm">Cargando mapa...</p>
        </div>
      )}
    </div>
  );
}
