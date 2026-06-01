import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mapa Educativo — Datos Abiertos del Sistema Educativo Argentino",
  description: "Explora datos de matricula del sistema educativo argentino por provincia, nivel y sector.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={jakarta.className + " bg-slate-50 text-slate-900 antialiased"}>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl"
                  style={{ background: "linear-gradient(135deg, #1a3a6b 0%, #1d4ed8 100%)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" opacity="0.9"/>
                    <circle cx="12" cy="9" r="2.5" fill="#10b981"/>
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm tracking-tight">Mapa Educativo</span>
                  <span className="text-slate-400 text-xs block leading-none mt-0.5">Datos Abiertos · Argentina</span>
                </div>
              </div>
              <nav className="hidden md:flex items-center gap-1">
                <a href="#mapa" className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">Explorar</a>
                <a href="#api" className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">API</a>
                <a href="https://github.com/nahueldreher-star/educacion-argentina-data" target="_blank" className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">GitHub</a>
                <a
                  href="https://educacion-argentina-api.onrender.com/docs"
                  target="_blank"
                  className="ml-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90"
                  style={{ background: "#1a3a6b" }}
                >
                  Documentacion
                </a>
              </nav>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-slate-200 mt-24 bg-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{ background: "linear-gradient(135deg, #1a3a6b 0%, #1d4ed8 100%)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" opacity="0.9"/>
                      <circle cx="12" cy="9" r="2.5" fill="#10b981"/>
                    </svg>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">Mapa Educativo</span>
                </div>
                <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                  Plataforma de datos abiertos del sistema educativo argentino. Construida con datos del Ministerio de Educacion de la Nacion.
                </p>
              </div>
              <div className="flex gap-12">
                <div>
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Explorar</p>
                  <div className="space-y-2">
                    <a href="#mapa" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Mapa interactivo</a>
                    <a href="#api" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">API publica</a>
                    <a href="https://educacion-argentina-api.onrender.com/docs" target="_blank" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Documentacion</a>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Proyecto</p>
                  <div className="space-y-2">
                    <a href="https://github.com/nahueldreher-star/educacion-argentina-data" target="_blank" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">GitHub</a>
                    <p className="text-sm text-slate-400">Fuente: RedFIE · MEN</p>
                    <p className="text-sm text-slate-400">Anuario 2025</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
              <p className="text-xs text-slate-400">2025 Mapa Educativo. Datos abiertos bajo licencia MIT.</p>
              <p className="text-xs text-slate-400">Next.js · FastAPI · PostgreSQL · MapLibre</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
