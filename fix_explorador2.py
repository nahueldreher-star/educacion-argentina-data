with open("C:/educacion-argentina-data/frontend/app/components/MapaExplorador.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import re

# Reemplazar todo el bloque condicional del panel
pattern = r'\{provinciaSeleccionada \? \(\s*<PanelProvincia.*?/>\s*\) : \(\s*<div.*?</div>\s*\)\}'

replacement = '''<PanelProvincia
            provincia={provinciaSeleccionada}
            datos={datos}
            onCerrar={() => setProvinciaSeleccionada(null)}
          />'''

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

if new_content != content:
    with open("C:/educacion-argentina-data/frontend/app/components/MapaExplorador.tsx", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Fix aplicado OK")
else:
    print("ERROR: patron no encontrado")
    # Mostrar el bloque completo para debug
    idx = content.find("{provinciaSeleccionada ?")
    if idx >= 0:
        print(repr(content[idx:idx+500]))
