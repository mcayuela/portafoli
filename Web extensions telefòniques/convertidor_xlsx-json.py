import pandas as pd
import json
import os

fitxer_excel = 'C:/Users/itpractice/OneDrive - TECNICAS MECANICAS ILERDENSES SL/Documentos/GitHub/portafoli/Web extensions telefòniques/arxiu_telefonia.xlsx'

df = pd.read_excel(fitxer_excel, engine='openpyxl')
df.columns = df.columns.str.strip()

traduccio_columnes = {
    'NOMBRE': 'nom',
    'APELLIDO': 'cognom',
    'DEPARTAMENTO': 'departament',
    'EXTENSIÓN': 'extensio',
    'Nº MÓVIL': 'numero'
}

columnes_presentes = [col for col in traduccio_columnes if col in df.columns]
df_filtrat = df[columnes_presentes]
df_filtrat = df_filtrat.rename(columns=traduccio_columnes)
df_filtrat = df_filtrat.dropna(how='all', subset=list(df_filtrat.columns))
df_filtrat = df_filtrat.astype(str).apply(lambda x: x.str.strip())

df_filtrat = df_filtrat[
    ~df_filtrat['nom'].str.startswith(('TIPO_PUESTO', 'DDI')) &
    ~df_filtrat['cognom'].str.startswith(('TIPO_PUESTO', 'DDI'))
]

df_filtrat['nom'] = df_filtrat['nom'] + ' ' + df_filtrat['cognom']
df_filtrat = df_filtrat.drop(columns=['cognom'])

df_filtrat['extensio'] = (
    df_filtrat['extensio']
    .astype(str)
    .str.replace('.0', '', regex=False)
    .apply(lambda x: '-' if x.startswith('3') else x)
)

df_filtrat['numero'] = df_filtrat['numero'].astype(str).str.replace('.0', '', regex=False)

ordre_columnes = ['nom', 'extensio', 'numero', 'departament']
df_filtrat = df_filtrat[[col for col in ordre_columnes if col in df_filtrat.columns]]

dades_json = df_filtrat.to_dict(orient='records')

output_path = 'C:/Users/itpractice/OneDrive - TECNICAS MECANICAS ILERDENSES SL/Documentos/GitHub/portafoli/Web extensions telefòniques/numeros_moms_extensions.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(dades_json, f, ensure_ascii=False, indent=4)

print(f"Fitxer JSON generat: {output_path}")
