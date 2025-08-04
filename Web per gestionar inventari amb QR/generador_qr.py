import json
import qrcode
import os

# Ruta del fitxer JSON
fitxer_json = os.path.join(os.path.dirname(__file__), 'inventari.json')


# Carpeta on es guardaran els codis QR
carpeta_qr = os.path.join(os.path.dirname(__file__), 'codis_qr')
os.makedirs(carpeta_qr, exist_ok=True)

# Domini base per generar les URL
domini_base = 'https://mcayuela.com/Web%20per%20gestionar%20inventari%20amb%20QR/?id='

# Carrega les dades del fitxer JSON
with open(fitxer_json, 'r', encoding='utf-8') as f:
    dispositius = json.load(f)

# Genera un codi QR per a cada dispositiu
for dispositiu in dispositius:
    id_pc = dispositiu.get('id')
    if id_pc is not None:
        url = f'{domini_base}{id_pc}'
        qr = qrcode.make(url)
        nom_fitxer = f'qr_{id_pc}.png'
        ruta_fitxer = os.path.join(carpeta_qr, nom_fitxer)
        qr.save(ruta_fitxer)

print(f"S'han generat {len(dispositius)} codis QR a la carpeta '{carpeta_qr}'.")