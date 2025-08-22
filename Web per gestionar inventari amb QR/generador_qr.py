import json
import qrcode
import os
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

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

# Font per escriure el text (pots canviar la ruta/font si vols)
try:
    font = ImageFont.truetype("arial.ttf", 60)  # Augmenta la mida de la font
except:
    font = ImageFont.load_default()

# Genera un codi QR per a cada dispositiu
for dispositiu in dispositius:
    id_pc = dispositiu.get('id')
    data_pc = dispositiu.get('data', '')  # Assumeix format 'YYYY-MM-DD' o similar
    if id_pc is not None:
        # Extreu mes i any
        try:
            dt = datetime.strptime(data_pc, "%Y-%m-%d")
            mes_any = dt.strftime("%m%y")
        except:
            mes_any = "0000"
        text = f"{id_pc}/{mes_any}"

        url = f'{domini_base}{id_pc}'
        qr_img = qrcode.make(url).convert("RGB")
        qr_img = qr_img.rotate(90, expand=True)

        # Crea imatge pel text
        text_img = Image.new("RGB", (qr_img.height, 120), "white")  # Augmenta l'alçada de la imatge del text
        draw = ImageDraw.Draw(text_img)
        bbox = draw.textbbox((0, 0), text, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.text(((text_img.width - w) // 2, (text_img.height - h) // 2), text, fill="black", font=font)
        text_img = text_img.rotate(90, expand=True)

        # Uneix QR i text
        total_width = qr_img.width + text_img.width
        total_height = max(qr_img.height, text_img.height)
        final_img = Image.new("RGB", (total_width, total_height), "white")
        final_img.paste(qr_img, (0, 0))
        final_img.paste(text_img, (qr_img.width, 0))

        nom_fitxer = f'qr_{id_pc}.png'
        ruta_fitxer = os.path.join(carpeta_qr, nom_fitxer)
        final_img.save(ruta_fitxer)

print(f"S'han generat {len(dispositius)} codis QR a la carpeta '{carpeta_qr}'.")