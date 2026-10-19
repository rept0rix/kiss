#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES_DIR = os.path.join(ROOT_DIR, "kiss", "android", "app", "src", "main", "res")
SRC_ICON = os.path.join(ROOT_DIR, "public", "icon-512.png")

# 1. Extract lips foreground on transparent background
src_img = Image.open(SRC_ICON).convert("RGBA")
w, h = src_img.size
pixels = src_img.load()

is_red = [[False]*w for _ in range(h)]
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r > 60 and r > g * 1.5 and r > b * 1.5:
            is_red[y][x] = True

fg_lips = Image.new("RGBA", (w, h), (0, 0, 0, 0))
fg_pixels = fg_lips.load()

min_x, max_x = w, 0
min_y, max_y = h, 0

for x in range(w):
    red_ys = [y for y in range(h) if is_red[y][x]]
    if red_ys:
        y1, y2 = min(red_ys), max(red_ys)
        min_x = min(min_x, x)
        max_x = max(max_x, x)
        min_y = min(min_y, y1)
        max_y = max(max_y, y2)
        for y in range(y1, y2 + 1):
            fg_pixels[x, y] = pixels[x, y]

# Crop tightly to the lips with smooth edges
cropped_lips = fg_lips.crop((min_x, min_y, max_x + 1, max_y + 1))
cw, ch = cropped_lips.size

print(f"Extracted lips bounding box: {cw}x{ch}")

# 2. Generate Adaptive Icon Foregrounds (ic_launcher_foreground.png)
# Total size: 108dp. Safe zone is middle 66-72dp.
# We size the lips to ~60% of the canvas so they are safely inside any mask.
adaptive_sizes = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

for folder, size in adaptive_sizes.items():
    target_dir = os.path.join(RES_DIR, folder)
    os.makedirs(target_dir, exist_ok=True)
    
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Target lips width = 60% of size
    target_w = int(size * 0.60)
    target_h = int(ch * (target_w / cw))
    
    resized_lips = cropped_lips.resize((target_w, target_h), Image.Resampling.LANCZOS)
    pos_x = (size - target_w) // 2
    pos_y = (size - target_h) // 2
    canvas.paste(resized_lips, (pos_x, pos_y), resized_lips)
    
    out_path = os.path.join(target_dir, "ic_launcher_foreground.png")
    canvas.save(out_path, "PNG")
    print(f"Saved {out_path} ({size}x{size})")

# 3. Generate Legacy Icons (ic_launcher.png & ic_launcher_round.png)
legacy_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, size in legacy_sizes.items():
    target_dir = os.path.join(RES_DIR, folder)
    
    # Square / squircle icon on #070707
    bg_sq = Image.new("RGBA", (size, size), (7, 7, 7, 255))
    target_w = int(size * 0.72)
    target_h = int(ch * (target_w / cw))
    resized_lips = cropped_lips.resize((target_w, target_h), Image.Resampling.LANCZOS)
    pos_x = (size - target_w) // 2
    pos_y = (size - target_h) // 2
    bg_sq.paste(resized_lips, (pos_x, pos_y), resized_lips)
    
    out_sq = os.path.join(target_dir, "ic_launcher.png")
    bg_sq.save(out_sq, "PNG")
    
    # Round icon (circle mask)
    bg_rd = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    
    rd_content = Image.new("RGBA", (size, size), (7, 7, 7, 255))
    rd_content.paste(resized_lips, (pos_x, pos_y), resized_lips)
    bg_rd.paste(rd_content, (0, 0), mask)
    
    out_rd = os.path.join(target_dir, "ic_launcher_round.png")
    bg_rd.save(out_rd, "PNG")
    print(f"Saved {out_sq} and {out_rd} ({size}x{size})")

# 4. Save Play Store 512x512 icon
playstore_icon = Image.new("RGBA", (512, 512), (7, 7, 7, 255))
pw = int(512 * 0.72)
ph = int(ch * (pw / cw))
rl = cropped_lips.resize((pw, ph), Image.Resampling.LANCZOS)
playstore_icon.paste(rl, ((512 - pw) // 2, (512 - ph) // 2), rl)
play_out = os.path.join(ROOT_DIR, "kiss", "android", "app", "src", "main", "ic_launcher-playstore.png")
playstore_icon.save(play_out, "PNG")
# Also save to root for easy drag-and-drop
playstore_icon.save(os.path.join(ROOT_DIR, "ic_launcher-playstore.png"), "PNG")
print(f"Saved Play Store icon: {play_out}")

# 5. Generate Splash Screens
splash_sizes = {
    "drawable": (480, 800),
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
}

for folder, (sw, sh) in splash_sizes.items():
    s_dir = os.path.join(RES_DIR, folder)
    os.makedirs(s_dir, exist_ok=True)
    
    splash = Image.new("RGBA", (sw, sh), (7, 7, 7, 255))
    # Lips size in splash: ~25% of the shortest dimension
    min_dim = min(sw, sh)
    tw = int(min_dim * 0.35)
    th = int(ch * (tw / cw))
    
    rl = cropped_lips.resize((tw, th), Image.Resampling.LANCZOS)
    px = (sw - tw) // 2
    py = (sh - th) // 2
    splash.paste(rl, (px, py), rl)
    
    s_out = os.path.join(s_dir, "splash.png")
    splash.save(s_out, "PNG")
    print(f"Saved splash: {s_out} ({sw}x{sh})")

print("All Android icons & splash screens successfully generated!")
