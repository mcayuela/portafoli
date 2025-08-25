import os
import json
import qrcode
from PIL import Image, ImageDraw, ImageFont
from collections import defaultdict

fitxer_json = os.path.join(os.path.dirname(__file__), 'inventari.json')
carpeta_qr = os.path.join(os.path.dirname(__file__), 'codis_qr')
os.makedirs(carpeta_qr, exist_ok=True)
domini_base = 'https://mcayuela.com/Web%20per%20gestionar%20inventari%20amb%20QR/?id='

with open(fitxer_json, 'r', encoding='utf-8') as f:
    dispositius = json.load(f)

try:
    font_path = "arial.ttf"
    font = ImageFont.truetype(font_path, 40)
except:
    font = ImageFont.load_default()

logo_path = os.path.join(os.path.dirname(__file__), 'logotmi-horitzontal.png')
try:
    logo_img = Image.open(logo_path).convert("RGBA")
except Exception:
    logo_img = None

dispositius_per_id = defaultdict(list)
for dispositiu in dispositius:
    id_principal = dispositiu.get('id', '')
    dispositius_per_id[id_principal].append(dispositiu)

for id_principal, grup in dispositius_per_id.items():
    for idx, dispositiu in enumerate(grup, start=1):
        text_qr = f"{id_principal}/{idx:02d}"

        url = f'{domini_base}{text_qr}'
        qr_size = 240  # Fes el QR més petit (pots ajustar la mida)

        qr_padding = 20  # Padding als costats del QR i del logo

        # Genera el QR
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=0,
        )
        qr.add_data(url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
        qr_img = qr_img.resize((qr_size, qr_size), Image.LANCZOS)

        # QR amb padding
        qr_padded = Image.new("RGB", (qr_size + 2 * qr_padding, qr_size + 2 * qr_padding), "white")
        qr_padded.paste(qr_img, (qr_padding, qr_padding))

        # --- LOGO (blau) ---
        if logo_img:
            logo_w_original, logo_h_original = logo_img.size
            logo_h = int(qr_size * logo_h_original / logo_w_original)
            logo_resized = logo_img.resize((qr_size, logo_h), Image.LANCZOS)
            logo_bg = Image.new("RGB", (qr_size + 2 * qr_padding, logo_h + 2 * qr_padding), "white")
            logo_bg.paste(logo_resized, (qr_padding, qr_padding), logo_resized)
        else:
            logo_bg = Image.new("RGB", (qr_size + 2 * qr_padding, 40 + 2 * qr_padding), "white")

        # Separacions
        separacio_qr_text = -5
        separacio_text_logo = -2

        # Renderitza el text sota el QR (vermell)
        text = text_qr
        text_color = (0, 0, 0)  # Negre

        # Calcula la mida de font màxima perquè el text no superi l'amplada del QR menys un marge
        max_text_width = qr_size - 20  # 20 píxels de marge (pots ajustar)
        font_size = 10
        for size in range(10, 200):
            test_font = ImageFont.truetype(font_path, size)
            temp_img = Image.new("RGB", (1, 1))
            temp_draw = ImageDraw.Draw(temp_img)
            bbox = temp_draw.textbbox((0, 0), text, font=test_font)
            test_width = bbox[2] - bbox[0]
            if test_width > max_text_width:
                break
            font_size = size
        font = ImageFont.truetype(font_path, font_size)
        temp_img = Image.new("RGB", (1, 1))
        temp_draw = ImageDraw.Draw(temp_img)
        bbox = temp_draw.textbbox((0, 0), text, font=font)
        text_width, text_height = bbox[2] - bbox[0], bbox[3] - bbox[1]
        # Afegeix marge per evitar que es talli
        # Defineix padding separat per cada costat
        padding_text_left = 14
        padding_text_right = 14
        padding_text_top = 0
        padding_text_bottom = 14
        text_img = Image.new("RGB", (text_width + padding_text_left + padding_text_right, text_height + padding_text_top + padding_text_bottom), "white")
        draw_text = ImageDraw.Draw(text_img)
        draw_text.text((padding_text_left, padding_text_top), text, font=font, fill=text_color)

        # Composició final
        total_width = qr_size + 2 * qr_padding
        total_height = qr_padded.height + separacio_qr_text + text_img.height + separacio_text_logo + logo_bg.height
        final_img = Image.new("RGB", (total_width, total_height), "white")
        y = 0
        final_img.paste(qr_padded, (0, y))
        y += qr_padded.height + separacio_qr_text
        # Centra el text sota el QR (vermell)
        x_text_centre = (total_width - text_img.width) // 2
        final_img.paste(text_img, (x_text_centre, y))
        y += text_img.height + separacio_text_logo
        final_img.paste(logo_bg, (0, y))

        nom_fitxer = f'qr_{text_qr.replace("/", "_")}.png'
        ruta_fitxer = os.path.join(carpeta_qr, nom_fitxer)
        final_img.save(ruta_fitxer)

print(f"S'han generat {sum(len(grup) for grup in dispositius_per_id.values())} codis QR a la carpeta '{carpeta_qr}'.")