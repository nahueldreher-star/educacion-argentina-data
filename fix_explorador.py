with open("C:/educacion-argentina-data/frontend/app/components/MapaExplorador.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Reemplazar el bloque condicional del panel para mostrar siempre
old = """}
        <div>
          {provinciaSeleccionada ? (
            <PanelProvincia
              provincia={provinciaSeleccionada}
              datos={datos}
              onCerrar={() => setProvinciaSeleccionada(null)}
            />
          ) : (
            <div className="h-full min-h-48 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center">
              <div>
                <p className="text-2xl mb-2">🗺️</p>
                <p>Hace clic en una provincia para ver el detalle</p>
              </div>
            </div>
          )}
        </div>"""

new = """}
        <div>
          <PanelProvincia
            provincia={provinciaSeleccionada}
            datos={datos}
            onCerrar={() => setProvinciaSeleccionada(null)}
          />
        </div>"""

if old in content:
    content = content.replace(old, new)
    print("Reemplazo exacto OK")
else:
    # Buscar una version mas flexible
    import re
    pattern = r'\}\s*<div>\s*\{provinciaSeleccionada \? \(.*?\) : \(.*?\)\}\s*</div>'
    replacement = new
    new_content = re.sub(pattern, new, content, flags=re.DOTALL)
    if new_content != content:
        content = new_content
        print("Reemplazo regex OK")
    else:
        print("ERROR: No se encontro el patron. Mostrando fragmento relevante:")
        idx = content.find("provinciaSeleccionada ?")
        if idx >= 0:
            print(repr(content[idx-100:idx+300]))
        else:
            print("No se encontro 'provinciaSeleccionada ?'")

with open("C:/educacion-argentina-data/frontend/app/components/MapaExplorador.tsx", "w", encoding="utf-8") as f:
    f.write(content)
