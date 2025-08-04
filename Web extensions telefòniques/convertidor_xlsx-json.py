import pandas as pd
import json
import os

# Ruta de l'arxiu
fitxer_excel = 'C:/Users/itpractice/OneDrive - TECNICAS MECANICAS ILERDENSES SL/Documentos/GitHub/portafoli/Web extensions telefòniques/arxiu_telefonia.xlsx'

# Llegir l'arxiu
df = pd.read_excel(fitxer_excel, engine='openpyxl')

# Netejar espais dels noms de columna
df.columns = df.columns.str.strip()

# Diccionari de traducció d'espanyol a català
traduccio_columnes = {
    'NOMBRE': 'nom',
    'APELLIDO': 'cognom',
    'DEPARTAMENTO': 'departament',
    'EXTENSIÓN': 'extensio',
    'Nº MÓVIL': 'numero'
}

# Filtrar només les columnes que existeixen i estan al diccionari
columnes_presentes = [col for col in traduccio_columnes if col in df.columns]

# Filtrar el DataFrame original
df_filtrat = df[columnes_presentes]

# Renombrar columnes al català
df_filtrat = df_filtrat.rename(columns=traduccio_columnes)

# Eliminar files buides (només si totes les columnes traduïdes estan buides)
df_filtrat = df_filtrat.dropna(how='all', subset=list(df_filtrat.columns))

# Eliminar espais i convertir a text
df_filtrat = df_filtrat.astype(str).apply(lambda x: x.str.strip())

# Combinar 'nom' i 'cognom' en una sola columna 'nom'
df_filtrat['nom'] = df_filtrat['nom'] + ' ' + df_filtrat['cognom']
df_filtrat = df_filtrat.drop(columns=['cognom'])

# Convertir extensio i numero a string i eliminar '.0'
df_filtrat['extensio'] = df_filtrat['extensio'].astype(str).str.replace('.0', '', regex=False)
df_filtrat['numero'] = df_filtrat['numero'].astype(str).str.replace('.0', '', regex=False)

# Reordenar columnes
ordre_columnes = ['nom', 'extensio', 'numero', 'departament']
df_filtrat = df_filtrat[[col for col in ordre_columnes if col in df_filtrat.columns]]

# Convertir a JSON
dades_json = df_filtrat.to_dict(orient='records')

# Guardar el resultat
with open('C:/Users/itpractice/OneDrive - TECNICAS MECANICAS ILERDENSES SL/Documentos/GitHub/portafoli/Web extensions telefòniques/numeros_moms_extensions.json', 'w', encoding='utf-8') as f:
    json.dump(dades_json, f, ensure_ascii=False, indent=4)

print("Fitxer JSON generat: C:/Users/itpractice/OneDrive - TECNICAS MECANICAS ILERDENSES SL/Documentos/GitHub/portafoli/Web extensions telefòniques/numeros_moms_extensions.json")
