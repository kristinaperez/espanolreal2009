"""Regenerate the Arabic sharing card with Pillow + RAQM (optional design tool)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, features
assert features.check('raqm'), 'RAQM is required for correct Arabic shaping'
font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
image = Image.new('RGB', (1200, 630), '#FAF8F5')
draw = ImageDraw.Draw(image)
def text(position, value, size, color, arabic=False):
    font = ImageFont.truetype(font_path, size)
    draw.text(position, value, font=font, fill=color, anchor='ra' if arabic else 'la', direction='rtl' if arabic else 'ltr')
draw.rounded_rectangle((50, 42, 1150, 588), radius=32, fill='#FFFFFF', outline='#E5DAD5', width=2)
text((100, 80), 'EspañolReal', 38, '#9E2A2B')
text((1100, 160), 'تعلم الإسبانية', 68, '#26211F', True)
text((1100, 252), 'للحياة في إسبانيا', 60, '#9E2A2B', True)
text((1100, 350), 'السكن · الطبيب · العمل والأوراق', 35, '#625550', True)
text((1100, 412), 'ثلاثة دروس تفاعلية مجانية بالعربية', 32, '#625550', True)
text((100, 502), 'espanolreal.es/ar', 28, '#9E2A2B')
output = Path(__file__).resolve().parents[2] / 'public/ar-og.png'
image.save(output, optimize=True)
