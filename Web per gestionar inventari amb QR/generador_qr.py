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

logo_path = os.path.join(os.path.dirname(__file__), 'logotmi-horitzontal.png')  # Nom de la foto que vols afegir

def get_best_font_size(text, target_width, font_path="arial.ttf", max_size=200, min_size=10):
    for size in range(max_size, min_size, -2):
        try:
            font = ImageFont.truetype(font_path, size)
        except:
            font = ImageFont.load_default()
        dummy_img = Image.new("RGB", (target_width, 200))
        draw = ImageDraw.Draw(dummy_img)
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        if w <= target_width:
            return font, size
    return ImageFont.load_default(), min_size

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

        # Troba la millor mida de font
        font, font_size = get_best_font_size(text, qr_img.height)

        # Crea imatge pel text
        text_img = Image.new("RGB", (qr_img.height, font_size + 40), "white")
        draw = ImageDraw.Draw(text_img)
        bbox = draw.textbbox((0, 0), text, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.text(((text_img.width - w) // 2, (text_img.height - h) // 2), text, fill="black", font=font)
        text_img = text_img.rotate(90, expand=True)

        # Carrega i gira la foto
        if os.path.exists(logo_path):
            logo_img = Image.open(logo_path).convert("RGBA")
            logo_img = logo_img.rotate(90, expand=True)
            # Redimensiona la foto per fer-la de la mateixa alçada que el text
            scale = text_img.height / logo_img.height
            new_size = (int(logo_img.width * scale), text_img.height)
            logo_img = logo_img.resize(new_size, Image.LANCZOS)
        else:
            logo_img = None

        # Uneix QR, text i foto
        # Defineix separacions
        separacio_qr_text = 5
        separacio_text_logo = 40

        # Calcula amplada total
        total_width = (
            qr_img.width +
            separacio_qr_text +
            text_img.width +
            (separacio_text_logo if logo_img else 0) +
            (logo_img.width if logo_img else 0)
        )
        total_height = max(qr_img.height, text_img.height)

        final_img = Image.new("RGB", (total_width, total_height), "white")
        x = 0
        final_img.paste(qr_img, (x, 0))
        x += qr_img.width + separacio_qr_text
        final_img.paste(text_img, (x, 0))
        x += text_img.width + (separacio_text_logo if logo_img else 0)
        if logo_img:
            final_img.paste(logo_img, (x, 0), logo_img)

        nom_fitxer = f'qr_{id_pc}.png'
        ruta_fitxer = os.path.join(carpeta_qr, nom_fitxer)
        final_img.save(ruta_fitxer)

print(f"S'han generat {len(dispositius)} codis QR a la carpeta '{carpeta_qr}'.")