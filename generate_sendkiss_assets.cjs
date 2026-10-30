const fs = require("fs");
const path = require("path");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

const OUTPUT_DIR = "/Users/naoryanko/kiss/store_assets";
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Lips SVG helper
const lipsSvg = (color1 = "#ff2d55", color2 = "#ff3b30", glow = true) => `
<svg viewBox="0 0 100 70" class="lips-icon" style="width: 100%; height: 100%; filter: ${glow ? 'drop-shadow(0 10px 30px rgba(255, 45, 85, 0.7))' : 'none'};">
  <defs>
    <linearGradient id="lipGrad_${color1.replace('#','')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="100%" stop-color="${color2}" />
    </linearGradient>
  </defs>
  <!-- Upper Lip -->
  <path d="M 5 35 C 15 22, 35 15, 50 25 C 65 15, 85 22, 95 35 C 80 40, 65 32, 50 36 C 35 32, 20 40, 5 35 Z" fill="url(#lipGrad_${color1.replace('#','')})" />
  <!-- Lower Lip -->
  <path d="M 5 36 C 20 42, 35 38, 50 38 C 65 38, 80 42, 95 36 C 85 58, 65 65, 50 65 C 35 65, 15 58, 5 36 Z" fill="url(#lipGrad_${color1.replace('#','')})" />
  <!-- Gloss highlight -->
  <ellipse cx="42" cy="48" rx="14" ry="5" fill="white" opacity="0.4" transform="rotate(-5 42 48)" />
  <ellipse cx="60" cy="46" rx="8" ry="3" fill="white" opacity="0.3" />
</svg>
`;

const baseCss = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
  body {
    width: 1080px;
    height: 1920px;
    background: radial-gradient(circle at 50% 15%, #2a0832 0%, #150522 45%, #0a0212 100%);
    color: #fff;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }
  .bg-glow-1 {
    position: absolute;
    width: 950px;
    height: 950px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 45, 110, 0.4) 0%, rgba(140, 20, 255, 0.2) 50%, transparent 70%);
    top: -200px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
  }
  .bg-glow-2 {
    position: absolute;
    width: 800px;
    height: 800px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 107, 107, 0.25) 0%, transparent 65%);
    bottom: -100px;
    right: -150px;
    pointer-events: none;
  }
  .header {
    text-align: center;
    padding: 70px 40px 10px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 45, 110, 0.18);
    border: 1px solid rgba(255, 45, 110, 0.45);
    backdrop-filter: blur(20px);
    padding: 12px 28px;
    border-radius: 100px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #ffd6e0;
    margin-bottom: 20px;
    box-shadow: 0 8px 30px rgba(255, 45, 110, 0.35);
  }
  .title {
    font-size: 64px;
    font-weight: 900;
    line-height: 1.15;
    background: linear-gradient(135deg, #ffffff 30%, #ffccd8 70%, #ff7ea5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 14px;
    text-shadow: 0 10px 40px rgba(255, 45, 110, 0.35);
  }
  .subtitle {
    font-size: 27px;
    font-weight: 600;
    color: #e5cfe7;
    max-width: 900px;
    line-height: 1.4;
  }
  
  /* Mockup Frame anchored to bottom */
  .phone-mockup {
    width: 880px;
    height: 1380px;
    background: #140b24;
    border-radius: 64px 64px 0 0;
    border: 12px solid #2e174b;
    border-bottom: none;
    box-shadow: 0 -25px 90px rgba(0, 0, 0, 0.9), 0 0 80px rgba(255, 45, 110, 0.35);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
  }
  .dynamic-island {
    width: 220px;
    height: 40px;
    background: #000;
    border-radius: 24px;
    margin: 18px auto 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 20px;
  }
  .camera-dot {
    width: 14px;
    height: 14px;
    background: #2a153d;
    border: 3px solid #1a0b28;
    border-radius: 50%;
  }
  .phone-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px 36px 40px;
    position: relative;
    overflow: hidden;
  }
`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1
  });

  // ==========================================
  // 1. SendKiss Shot 1
  // ==========================================
  console.log("Generating SendKiss Shot 1...");
  let page = await context.newPage();
  await page.setContent(`
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      ${baseCss}
      .couple-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 18px 24px;
        border-radius: 28px;
        margin-bottom: 24px;
      }
      .avatar-group {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .avatar {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        border: 2px solid #ff4081;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        background: #2a153d;
      }
      .streak-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 180, 0, 0.18);
        border: 1px solid rgba(255, 180, 0, 0.5);
        padding: 10px 22px;
        border-radius: 40px;
        font-size: 20px;
        font-weight: 800;
        color: #ffca28;
      }
      .kiss-center {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .kiss-outer {
        width: 480px;
        height: 480px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 45, 110, 0.35) 0%, rgba(255, 45, 110, 0.08) 60%, transparent 75%);
        border: 3px dashed rgba(255, 100, 160, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .kiss-inner {
        width: 360px;
        height: 360px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff2d6f, #d81159, #8f1cb3);
        box-shadow: 0 25px 70px rgba(255, 45, 110, 0.7), inset 0 2px 12px rgba(255,255,255,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .floating-emoji {
        position: absolute;
        font-size: 44px;
        filter: drop-shadow(0 6px 16px rgba(0,0,0,0.4));
      }
      .bottom-bar {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .action-btn {
        width: 100%;
        background: linear-gradient(135deg, #ff2d6f, #ff6b8b);
        color: white;
        border-radius: 26px;
        padding: 24px;
        font-size: 26px;
        font-weight: 800;
        text-align: center;
        box-shadow: 0 16px 45px rgba(255, 45, 110, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      .haptic-tag {
        text-align: center;
        font-size: 18px;
        color: #ffccd8;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
    </style>
  </head>
  <body>
    <div class="bg-glow-1"></div>
    <div class="bg-glow-2"></div>
    <div class="header">
      <div class="badge">💋 The #1 Couple Kiss App</div>
      <h1 class="title">Send Real Kisses</h1>
      <p class="subtitle">Touch your screen &amp; deliver real haptic kisses across any distance</p>
    </div>
    
    <div class="phone-mockup">
      <div class="dynamic-island"><div class="camera-dot"></div></div>
      <div class="phone-content">
        <div class="couple-header">
          <div class="avatar-group">
            <div class="avatar">❤️</div>
            <div>
              <div style="font-size: 22px; font-weight: 800;">Naor &amp; Sarah</div>
              <div style="font-size: 16px; color: #4cd964; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; background: #4cd964; border-radius: 50%; box-shadow: 0 0 10px #4cd964;"></span>
                Online &amp; Connected
              </div>
            </div>
          </div>
          <div class="streak-pill">🔥 14 Days Streak</div>
        </div>

        <div class="kiss-center">
          <div class="floating-emoji" style="top: 20px; left: 20px;">💖</div>
          <div class="floating-emoji" style="top: 40px; right: 30px;">✨</div>
          <div class="floating-emoji" style="bottom: 30px; left: 40px;">💕</div>
          <div class="floating-emoji" style="bottom: 20px; right: 30px;">🥰</div>
          <div class="kiss-outer">
            <div class="kiss-inner">
              <div style="width: 230px; height: 160px;">
                ${lipsSvg("#ffffff", "#ffe6ec", false)}
              </div>
            </div>
          </div>
          <p style="margin-top: 24px; font-size: 24px; font-weight: 800; color: #ffd6e0;">Tap &amp; Hold to Charge Kiss</p>
        </div>

        <div class="bottom-bar">
          <div class="action-btn">
            <span>💋</span> Send Instant Kiss
          </div>
          <div class="haptic-tag">
            <span>📳</span> Real physical vibration delivered to recipient
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "sendkiss_shot1_1080x1920.png") });
  await page.close();

  // ==========================================
  // 2. SendKiss Shot 2: Haptics & Audio
  // ==========================================
  console.log("Generating SendKiss Shot 2...");
  page = await context.newPage();
  await page.setContent(`
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      ${baseCss}
      .sound-card {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 32px;
        padding: 26px;
        margin-bottom: 22px;
      }
      .card-title {
        font-size: 24px;
        font-weight: 800;
        color: #ffccd8;
        margin-bottom: 18px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .sound-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255, 45, 110, 0.18);
        border: 1px solid rgba(255, 45, 110, 0.4);
        padding: 18px 24px;
        border-radius: 22px;
        margin-bottom: 14px;
      }
      .waveform {
        display: flex;
        align-items: center;
        gap: 5px;
        height: 40px;
      }
      .wave-bar {
        width: 6px;
        background: #ff4081;
        border-radius: 4px;
      }
      .slider-track {
        width: 100%;
        height: 14px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        position: relative;
        margin: 22px 0 12px;
      }
      .slider-fill {
        width: 90%;
        height: 100%;
        background: linear-gradient(90deg, #ff2d6f, #ff80a6);
        border-radius: 10px;
      }
      .slider-thumb {
        position: absolute;
        right: 10%;
        top: -7px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 16px #ff2d6f;
      }
    </style>
  </head>
  <body>
    <div class="bg-glow-1"></div>
    <div class="bg-glow-2"></div>
    <div class="header">
      <div class="badge">🔊 Real Vibration &amp; Audio</div>
      <h1 class="title">Feel Every Touch</h1>
      <p class="subtitle">Realistic haptic sensations synced with sweet romantic audio effects</p>
    </div>
    
    <div class="phone-mockup">
      <div class="dynamic-island"><div class="camera-dot"></div></div>
      <div class="phone-content" style="padding-top: 30px;">
        <div class="sound-card">
          <div class="card-title"><span>🔊</span> Romantic Audio Library</div>
          <div class="sound-row">
            <div>
              <div style="font-size: 22px; font-weight: 800;">Sweet "Mwah" Sound</div>
              <div style="font-size: 15px; color: #ffccd8;">Active Tone • Playing</div>
            </div>
            <div class="waveform">
              <div class="wave-bar" style="height: 14px;"></div>
              <div class="wave-bar" style="height: 32px;"></div>
              <div class="wave-bar" style="height: 40px;"></div>
              <div class="wave-bar" style="height: 24px;"></div>
              <div class="wave-bar" style="height: 36px;"></div>
              <div class="wave-bar" style="height: 18px;"></div>
            </div>
          </div>
          <div class="sound-row" style="background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.12);">
            <div>
              <div style="font-size: 22px; font-weight: 800;">Heartbeat Pulse</div>
              <div style="font-size: 15px; color: #b4a3c2;">Warm synchronized rhythm</div>
            </div>
            <span style="font-size: 26px;">▶️</span>
          </div>
          <div class="sound-row" style="background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.12);">
            <div>
              <div style="font-size: 22px; font-weight: 800;">Romantic Whisper</div>
              <div style="font-size: 15px; color: #b4a3c2;">Soft audio note</div>
            </div>
            <span style="font-size: 26px;">▶️</span>
          </div>
        </div>

        <div class="sound-card">
          <div class="card-title"><span>📳</span> Haptic Vibration Engine</div>
          <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 800; color: #fff;">
            <span>Intensity Level</span>
            <span style="color: #ff4081;">90% Ultra Haptic</span>
          </div>
          <div class="slider-track">
            <div class="slider-fill"></div>
            <div class="slider-thumb"></div>
          </div>
          <p style="font-size: 16px; color: #b4a3c2; margin-top: 10px;">Feel the physical kiss impact vibrating directly on your phone glass.</p>
        </div>

        <div class="sound-card" style="background: linear-gradient(135deg, rgba(255,45,110,0.25), rgba(120,20,220,0.25)); border-color: rgba(255,45,110,0.5);">
          <div style="font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 6px;">✨ Dual Simultaneous Touch</div>
          <p style="font-size: 16px; color: #ffccd8; line-height: 1.4;">When both of you touch the screen at the exact same moment, feel the special Infinity Pulse!</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "sendkiss_shot2_1080x1920.png") });
  await page.close();

  // ==========================================
  // 3. SendKiss Shot 3: Themes & Catalog
  // ==========================================
  console.log("Generating SendKiss Shot 3...");
  page = await context.newPage();
  await page.setContent(`
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      ${baseCss}
      .grid-catalog {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-top: 14px;
      }
      .skin-card {
        background: rgba(255, 255, 255, 0.08);
        border: 2px solid rgba(255, 255, 255, 0.15);
        border-radius: 30px;
        padding: 26px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .skin-card.active {
        background: rgba(255, 45, 110, 0.22);
        border-color: #ff2d6f;
        box-shadow: 0 12px 35px rgba(255, 45, 110, 0.4);
      }
      .skin-name {
        font-size: 22px;
        font-weight: 800;
        margin-top: 14px;
      }
      .skin-badge {
        font-size: 14px;
        font-weight: 800;
        padding: 6px 16px;
        border-radius: 100px;
        margin-top: 8px;
      }
    </style>
  </head>
  <body>
    <div class="bg-glow-1"></div>
    <div class="bg-glow-2"></div>
    <div class="header">
      <div class="badge">🎨 20+ Unique Kiss Styles</div>
      <h1 class="title">Customize Every Kiss</h1>
      <p class="subtitle">From classic red lips to glowing neon, glitter gold &amp; flame passion</p>
    </div>
    
    <div class="phone-mockup">
      <div class="dynamic-island"><div class="camera-dot"></div></div>
      <div class="phone-content" style="padding-top: 24px;">
        <div style="font-size: 26px; font-weight: 800; color: #ffd6e0;">Kiss Skins Wardrobe</div>
        
        <div class="grid-catalog">
          <div class="skin-card active">
            <div style="width: 110px; height: 75px;">${lipsSvg("#ff2d6f", "#ff0844")}</div>
            <div class="skin-name">Ruby Classic</div>
            <div class="skin-badge" style="background: #ff2d6f; color: white;">SELECTED</div>
          </div>

          <div class="skin-card">
            <div style="width: 110px; height: 75px;">${lipsSvg("#00f2fe", "#4facfe")}</div>
            <div class="skin-name">Neon Cyber</div>
            <div class="skin-badge" style="background: rgba(0,242,254,0.25); color: #00f2fe;">UNLOCKED</div>
          </div>

          <div class="skin-card">
            <div style="width: 110px; height: 75px;">${lipsSvg("#f6d365", "#fda085")}</div>
            <div class="skin-name">Golden Royal</div>
            <div class="skin-badge" style="background: rgba(246,211,101,0.25); color: #f6d365;">VIP EXCLUSIVE</div>
          </div>

          <div class="skin-card">
            <div style="width: 110px; height: 75px;">${lipsSvg("#b176ff", "#f538ff")}</div>
            <div class="skin-name">Glitter Star</div>
            <div class="skin-badge" style="background: rgba(245,56,255,0.25); color: #f538ff;">POPULAR</div>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 28px; padding: 22px 26px; margin-top: 22px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 38px;">🔥</span>
            <div>
              <div style="font-weight: 800; font-size: 20px;">Flame Kiss Unlocked!</div>
              <div style="font-size: 15px; color: #ffccd8;">Unlocked at 10-day streak</div>
            </div>
          </div>
          <span style="font-size: 18px; color: #4cd964; font-weight: 800; background: rgba(76,217,100,0.15); padding: 8px 18px; border-radius: 20px;">✓ Active</span>
        </div>
      </div>
    </div>
  </body>
  </html>
  `);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "sendkiss_shot3_1080x1920.png") });
  await page.close();

  await browser.close();
  console.log("Updated SendKiss screenshots successfully!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
