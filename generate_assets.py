import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs("/Users/naoryanko/kiss/store_assets", exist_ok=True)
os.makedirs("/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets", exist_ok=True)

font_path = "/System/Library/Fonts/Helvetica.ttc"

def get_font(size):
    try:
        return ImageFont.truetype(font_path, size)
    except:
        return ImageFont.load_default()

# ----------------- SENDKISS ASSETS -----------------
# 1. Feature Graphic 1024x500
im = Image.new("RGB", (1024, 500), "#13091B")
draw = ImageDraw.Draw(im)
# Gradient background effect
for y in range(500):
    r = int(25 + (220 - 25) * (y / 500) * 0.45)
    g = int(10 + (30 - 10) * (y / 500))
    b = int(35 + (80 - 35) * (y / 500))
    draw.line([(0, y), (1024, y)], fill=(r, g, b))

# Glowing circles
draw.ellipse([650, -50, 1050, 350], fill=(230, 40, 100, 60))
draw.ellipse([50, 200, 450, 600], fill=(180, 20, 140, 60))

# Paste app icon if exists
icon_path = "/Users/naoryanko/kiss/public/icon-512.png"
if os.path.exists(icon_path):
    icon = Image.open(icon_path).convert("RGBA")
    icon = icon.resize((180, 180), Image.Resampling.LANCZOS)
    im.paste(icon, (80, 160), icon)

# Text
f_title = get_font(56)
f_sub = get_font(24)
f_badge = get_font(18)

draw.text((300, 170), "SendKiss", fill="#FFFFFF", font=f_title)
draw.text((300, 245), "Send Virtual Kisses with Sound & Haptics", fill="#FF77A9", font=f_sub)
draw.text((300, 285), "Stay Close to Your Loved Ones Anywhere, Anytime", fill="#E0D5E5", font=f_sub)

# Badge
draw.rounded_rectangle([300, 335, 520, 375], radius=20, fill="#FF2E74")
draw.text((330, 345), "💋 HAPTIC LOVE", fill="#FFFFFF", font=f_badge)

im.save("/Users/naoryanko/kiss/store_assets/sendkiss_feature_1024x500.png")
print("Saved SendKiss feature graphic")

# 2. Screenshots for SendKiss (1080x1920)
def make_screenshot(bg1, bg2, title, subtitle, badge_text, out_path, icon_file=None):
    sc = Image.new("RGB", (1080, 1920), bg1)
    d = ImageDraw.Draw(sc)
    # Gradient
    for y in range(1920):
        ratio = y / 1920.0
        r = int(bg1[0] + (bg2[0] - bg1[0]) * ratio)
        g = int(bg1[1] + (bg2[1] - bg1[1]) * ratio)
        b = int(bg1[2] + (bg2[2] - bg1[2]) * ratio)
        d.line([(0, y), (1080, y)], fill=(r, g, b))
    
    # Header text
    ft = get_font(68)
    fs = get_font(36)
    fb = get_font(28)
    
    # Badge
    d.rounded_rectangle([390, 160, 690, 220], radius=30, fill="#FF2E74")
    d.text((430, 175), badge_text, fill="#FFFFFF", font=fb)
    
    d.text((540, 280), title, fill="#FFFFFF", font=ft, anchor="mm")
    d.text((540, 360), subtitle, fill="#FFC0D8", font=fs, anchor="mm")
    
    # Phone Card Frame
    d.rounded_rectangle([140, 480, 940, 1760], radius=60, fill="#180C24", outline="#FF4F8E", width=8)
    
    # Phone screen content simulation
    # Top notch
    d.rounded_rectangle([420, 520, 660, 560], radius=20, fill="#0B0512")
    
    # Big central icon or graphic
    if icon_file and os.path.exists(icon_file):
        ic = Image.open(icon_file).convert("RGBA")
        ic = ic.resize((360, 360), Image.Resampling.LANCZOS)
        sc.paste(ic, (360, 850), ic)
    else:
        d.ellipse([360, 850, 720, 1210], fill="#FF2E74")
    
    # Romantic cards
    d.rounded_rectangle([220, 1340, 860, 1460], radius=30, fill="#2A163E", outline="#FF66A1", width=3)
    d.text((540, 1400), "Tap Screen to Send Instant Kiss", fill="#FFFFFF", font=get_font(32), anchor="mm")
    
    d.rounded_rectangle([220, 1500, 860, 1620], radius=30, fill="#FF2E74")
    d.text((540, 1560), "Send With Love 💋", fill="#FFFFFF", font=get_font(36), anchor="mm")
    
    sc.save(out_path)
    print("Saved screenshot:", out_path)

make_screenshot((20, 10, 35), (140, 20, 80), "Send Instant Kisses", "Touch the screen to share real affection", "CONNECT COUPLES", "/Users/naoryanko/kiss/store_assets/sendkiss_shot1_1080x1920.png", icon_path)
make_screenshot((35, 12, 45), (180, 30, 110), "Real Haptic Feedback", "Feel the vibration as if they are right beside you", "AUTHENTIC FEEL", "/Users/naoryanko/kiss/store_assets/sendkiss_shot2_1080x1920.png", icon_path)
make_screenshot((15, 8, 30), (120, 25, 70), "Custom Sounds & Styles", "Choose lipstick colors, sounds and cute effects", "CREATIVE & FUN", "/Users/naoryanko/kiss/store_assets/sendkiss_shot3_1080x1920.png", icon_path)


# ----------------- STREAMSNAP AI ASSETS -----------------
ss_icon_path = "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/assets/playstore-icon-512.png"
ss_feature_path = "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/assets/playstore-feature-graphic-1024x500.png"

# Copy/Ensure feature graphic & icon exist in standard target
if os.path.exists(ss_icon_path):
    Image.open(ss_icon_path).save("/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_icon_512.png")
if os.path.exists(ss_feature_path):
    Image.open(ss_feature_path).save("/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_feature_1024x500.png")

# Screenshots for StreamSnap AI (1080x1920)
def make_streamsnap_shot(bg1, bg2, title, subtitle, badge_text, out_path, preview_img=None):
    sc = Image.new("RGB", (1080, 1920), bg1)
    d = ImageDraw.Draw(sc)
    for y in range(1920):
        ratio = y / 1920.0
        r = int(bg1[0] + (bg2[0] - bg1[0]) * ratio)
        g = int(bg1[1] + (bg2[1] - bg1[1]) * ratio)
        b = int(bg1[2] + (bg2[2] - bg1[2]) * ratio)
        d.line([(0, y), (1080, y)], fill=(r, g, b))
    
    ft = get_font(64)
    fs = get_font(34)
    fb = get_font(28)
    
    # Badge
    d.rounded_rectangle([360, 160, 720, 220], radius=30, fill="#7928CA")
    d.text((540, 190), badge_text, fill="#FFFFFF", font=fb, anchor="mm")
    
    d.text((540, 280), title, fill="#FFFFFF", font=ft, anchor="mm")
    d.text((540, 360), subtitle, fill="#8CE0FF", font=fs, anchor="mm")
    
    # Phone Frame
    d.rounded_rectangle([140, 480, 940, 1760], radius=60, fill="#0F172A", outline="#0070F3", width=8)
    # Notch
    d.rounded_rectangle([420, 520, 660, 560], radius=20, fill="#020617")
    
    # Live preview card inside phone
    d.rounded_rectangle([200, 620, 880, 1100], radius=30, fill="#1E293B", outline="#38BDF8", width=3)
    d.text((540, 860), "LIVE STREAM DETECTED ⚡", fill="#38BDF8", font=get_font(36), anchor="mm")
    
    # Action highlight cards
    d.rounded_rectangle([200, 1160, 880, 1320], radius=24, fill="#1E293B")
    d.text((240, 1220), "🔥 Epic Clutch Play", fill="#FFFFFF", font=get_font(32))
    d.text((240, 1265), "AI Confidence: 99.4% • Bookmarked", fill="#94A3B8", font=get_font(24))
    
    d.rounded_rectangle([200, 1360, 880, 1520], radius=24, fill="#1E293B")
    d.text((240, 1420), "😂 Chat Explosion Moment", fill="#FFFFFF", font=get_font(32))
    d.text((240, 1465), "12.5k messages/min detected", fill="#94A3B8", font=get_font(24))
    
    # Primary Button
    d.rounded_rectangle([200, 1580, 880, 1690], radius=30, fill="#0070F3")
    d.text((540, 1635), "Export Clip to TikTok & Reels 🚀", fill="#FFFFFF", font=get_font(32), anchor="mm")
    
    sc.save(out_path)
    print("Saved StreamSnap screenshot:", out_path)

make_streamsnap_shot((11, 15, 25), (15, 30, 65), "AI Stream Highlights", "Auto-detect epic hype moments in real time", "AI LIVE COMPANION", "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot1_1080x1920.png")
make_streamsnap_shot((15, 12, 35), (35, 15, 80), "One-Tap Instant Clip", "Save 1080p clips without leaving the stream", "INSTANT RECORDING", "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot2_1080x1920.png")
make_streamsnap_shot((8, 20, 40), (10, 45, 95), "Viral Social Export", "Format and export instantly for TikTok & Shorts", "FAST SOCIAL SHARING", "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot3_1080x1920.png")

print("\nALL ASSETS GENERATED SUCCESSFULLY!")
