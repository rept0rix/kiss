const fs = require("fs");
const path = require("path");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

const OUTPUT_DIR = "/Users/naoryanko/kiss/store_assets";
const DESKTOP_DIR = "/Users/naoryanko/Desktop/SendKiss_AppStore_Assets";
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(DESKTOP_DIR, { recursive: true });

const lipsSvg = (color1 = "#ff2d55", color2 = "#ff3b30", glow = true) => `
<svg viewBox="0 0 100 70" style="width: 100%; height: 100%; filter: ${glow ? 'drop-shadow(0 12px 35px rgba(255, 45, 85, 0.75))' : 'none'};">
  <defs>
    <linearGradient id="lipGrad_${color1.replace('#','')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="100%" stop-color="${color2}" />
    </linearGradient>
  </defs>
  <path d="M 5 35 C 15 22, 35 15, 50 25 C 65 15, 85 22, 95 35 C 80 40, 65 32, 50 36 C 35 32, 20 40, 5 35 Z" fill="url(#lipGrad_${color1.replace('#','')})" />
  <path d="M 5 36 C 20 42, 35 38, 50 38 C 65 38, 80 42, 95 36 C 85 58, 65 65, 50 65 C 35 65, 15 58, 5 36 Z" fill="url(#lipGrad_${color1.replace('#','')})" />
  <ellipse cx="42" cy="48" rx="14" ry="5" fill="white" opacity="0.45" transform="rotate(-5 42 48)" />
  <ellipse cx="60" cy="46" rx="8" ry="3" fill="white" opacity="0.35" />
</svg>
`;

const baseCss = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
  body {
    width: 1290px;
    height: 2796px;
    background: radial-gradient(circle at 50% 12%, #2c0836 0%, #170524 45%, #07020d 100%);
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
    width: 1100px;
    height: 1100px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 45, 110, 0.42) 0%, rgba(140, 20, 255, 0.22) 50%, transparent 70%);
    top: -200px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
  }
  .bg-glow-2 {
    position: absolute;
    width: 900px;
    height: 900px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 107, 107, 0.28) 0%, transparent 65%);
    bottom: -150px;
    right: -150px;
    pointer-events: none;
  }
  .header {
    text-align: center;
    padding: 100px 50px 20px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 45, 110, 0.2);
    border: 1.5px solid rgba(255, 45, 110, 0.5);
    backdrop-filter: blur(25px);
    padding: 16px 36px;
    border-radius: 100px;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: #ffd6e0;
    margin-bottom: 24px;
    box-shadow: 0 10px 35px rgba(255, 45, 110, 0.4);
  }
  .title {
    font-size: 78px;
    font-weight: 900;
    line-height: 1.15;
    background: linear-gradient(135deg, #ffffff 30%, #ffccd8 70%, #ff7ea5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 18px;
    text-shadow: 0 12px 45px rgba(255, 45, 110, 0.4);
  }
  .subtitle {
    font-size: 34px;
    font-weight: 600;
    color: #e5cfe7;
    max-width: 1080px;
    line-height: 1.45;
  }
  
  .phone-mockup {
    width: 1060px;
    height: 1980px;
    background: #140b24;
    border-radius: 80px 80px 0 0;
    border: 16px solid #2e174b;
    border-bottom: none;
    box-shadow: 0 -30px 100px rgba(0, 0, 0, 0.95), 0 0 90px rgba(255, 45, 110, 0.4);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
  }
  .dynamic-island {
    width: 280px;
    height: 52px;
    background: #000;
    border-radius: 30px;
    margin: 22px auto 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 24px;
  }
  .camera-dot {
    width: 18px;
    height: 18px;
    background: #2a153d;
    border: 4px solid #1a0b28;
    border-radius: 50%;
  }
  .phone-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 30px 48px 50px;
    position: relative;
    overflow: hidden;
  }
`;

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1290, height: 2796 },
    deviceScaleFactor: 1
  });

  const shots = [
    // 1. Send Real Kisses
    {
      name: "appstore_screenshot_1_1290x2796.png",
      badge: "💋 The #1 Couple Kiss App",
      title: "Send Real Kisses",
      subtitle: "Touch your screen & deliver real haptic kisses across any distance",
      body: `
        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.18);padding:24px 32px;border-radius:36px;margin-bottom:32px;">
          <div style="display:flex;align-items:center;gap:18px;">
            <div style="width:76px;height:76px;border-radius:50%;border:3px solid #ff4081;display:flex;align-items:center;justify-content:center;font-size:36px;background:#2a153d;">❤️</div>
            <div>
              <div style="font-size:28px;font-weight:800;">Naor &amp; Sarah</div>
              <div style="font-size:20px;color:#4cd964;font-weight:700;display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="width:10px;height:10px;background:#4cd964;border-radius:50%;box-shadow:0 0 12px #4cd964;"></span> Online &amp; Connected
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;background:rgba(255,180,0,0.2);border:1.5px solid rgba(255,180,0,0.6);padding:14px 28px;border-radius:50px;font-size:24px;font-weight:800;color:#ffca28;">
            🔥 14 Days Streak
          </div>
        </div>

        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;">
          <div style="position:absolute;top:40px;left:40px;font-size:56px;">💖</div>
          <div style="position:absolute;top:60px;right:50px;font-size:56px;">✨</div>
          <div style="position:absolute;bottom:60px;left:60px;font-size:56px;">💕</div>
          <div style="position:absolute;bottom:40px;right:60px;font-size:56px;">🥰</div>
          <div style="width:580px;height:580px;border-radius:50%;background:radial-gradient(circle,rgba(255,45,110,0.38) 0%,rgba(255,45,110,0.1) 60%,transparent 75%);border:4px dashed rgba(255,100,160,0.55);display:flex;align-items:center;justify-content:center;">
            <div style="width:440px;height:440px;border-radius:50%;background:linear-gradient(135deg,#ff2d6f,#d81159,#8f1cb3);box-shadow:0 30px 85px rgba(255,45,110,0.75),inset 0 2px 16px rgba(255,255,255,0.45);display:flex;align-items:center;justify-content:center;">
              <div style="width:280px;height:200px;">
                ${lipsSvg("#ffffff", "#ffe6ec", false)}
              </div>
            </div>
          </div>
          <p style="margin-top:32px;font-size:30px;font-weight:800;color:#ffd6e0;">Tap &amp; Hold to Charge Kiss</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px;">
          <div style="background:linear-gradient(135deg,#ff2d6f,#ff6b8b);color:white;border-radius:32px;padding:30px;font-size:32px;font-weight:800;text-align:center;box-shadow:0 20px 55px rgba(255,45,110,0.65);display:flex;align-items:center;justify-content:center;gap:16px;">
            <span>💋</span> Send Instant Kiss
          </div>
          <div style="text-align:center;font-size:22px;color:#ffccd8;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;">
            <span>📳</span> Real physical vibration delivered to recipient
          </div>
        </div>
      `
    },

    // 2. Feel Every Touch
    {
      name: "appstore_screenshot_2_1290x2796.png",
      badge: "🔊 Real Vibration & Audio",
      title: "Feel Every Touch",
      subtitle: "Realistic haptic sensations synced with sweet romantic audio effects",
      body: `
        <div style="background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.18);border-radius:38px;padding:34px;margin-bottom:28px;">
          <div style="font-size:30px;font-weight:800;color:#ffccd8;margin-bottom:24px;display:flex;align-items:center;gap:16px;">
            <span>🔊</span> Romantic Audio Library
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,45,110,0.22);border:1.5px solid rgba(255,45,110,0.45);padding:24px 32px;border-radius:28px;margin-bottom:18px;">
            <div>
              <div style="font-size:26px;font-weight:800;">Sweet "Mwah" Sound</div>
              <div style="font-size:18px;color:#ffccd8;margin-top:4px;">Active Tone • Playing</div>
            </div>
            <div style="display:flex;align-items:center;gap:7px;height:48px;">
              <div style="width:7px;height:18px;background:#ff4081;border-radius:5px;"></div>
              <div style="width:7px;height:42px;background:#ff4081;border-radius:5px;"></div>
              <div style="width:7px;height:52px;background:#ff4081;border-radius:5px;"></div>
              <div style="width:7px;height:30px;background:#ff4081;border-radius:5px;"></div>
              <div style="width:7px;height:46px;background:#ff4081;border-radius:5px;"></div>
              <div style="width:7px;height:24px;background:#ff4081;border-radius:5px;"></div>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.12);padding:24px 32px;border-radius:28px;margin-bottom:18px;">
            <div>
              <div style="font-size:26px;font-weight:800;">Heartbeat Pulse</div>
              <div style="font-size:18px;color:#b4a3c2;margin-top:4px;">Warm synchronized rhythm</div>
            </div>
            <span style="font-size:32px;">▶️</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.12);padding:24px 32px;border-radius:28px;">
            <div>
              <div style="font-size:26px;font-weight:800;">Romantic Whisper</div>
              <div style="font-size:18px;color:#b4a3c2;margin-top:4px;">Soft audio note</div>
            </div>
            <span style="font-size:32px;">▶️</span>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.18);border-radius:38px;padding:34px;margin-bottom:28px;">
          <div style="font-size:30px;font-weight:800;color:#ffccd8;margin-bottom:24px;display:flex;align-items:center;gap:16px;">
            <span>📳</span> Haptic Vibration Engine
          </div>
          <div style="display:flex;justify-content:space-between;font-size:24px;font-weight:800;color:#fff;">
            <span>Intensity Level</span>
            <span style="color:#ff4081;">90% Ultra Haptic</span>
          </div>
          <div style="width:100%;height:18px;background:rgba(255,255,255,0.15);border-radius:12px;position:relative;margin:28px 0 16px;">
            <div style="width:90%;height:100%;background:linear-gradient(90deg,#ff2d6f,#ff80a6);border-radius:12px;"></div>
            <div style="position:absolute;right:10%;top:-9px;width:36px;height:36px;border-radius:50%;background:#fff;box-shadow:0 0 20px #ff2d6f;"></div>
          </div>
          <p style="font-size:20px;color:#b4a3c2;margin-top:12px;">Feel the physical kiss impact vibrating directly on your phone glass.</p>
        </div>

        <div style="background:linear-gradient(135deg,rgba(255,45,110,0.28),rgba(120,20,220,0.28));border:1.5px solid rgba(255,45,110,0.55);border-radius:38px;padding:34px;">
          <div style="font-size:28px;font-weight:800;color:#fff;margin-bottom:8px;">✨ Dual Simultaneous Touch</div>
          <p style="font-size:20px;color:#ffccd8;line-height:1.45;">When both of you touch the screen at the exact same moment, feel the special Infinity Pulse!</p>
        </div>
      `
    },

    // 3. Customize Every Kiss
    {
      name: "appstore_screenshot_3_1290x2796.png",
      badge: "🎨 20+ Unique Kiss Styles",
      title: "Customize Every Kiss",
      subtitle: "From classic red lips to glowing neon, glitter gold & flame passion",
      body: `
        <div style="font-size:32px;font-weight:800;color:#ffd6e0;margin-bottom:20px;">Kiss Skins Wardrobe</div>
        
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;">
          <div style="background:rgba(255,45,110,0.25);border:2.5px solid #ff2d6f;box-shadow:0 14px 40px rgba(255,45,110,0.45);border-radius:36px;padding:30px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;">
            <div style="width:130px;height:90px;">${lipsSvg("#ff2d6f", "#ff0844")}</div>
            <div style="font-size:26px;font-weight:800;margin-top:16px;">Ruby Classic</div>
            <div style="font-size:16px;font-weight:800;padding:8px 20px;border-radius:100px;margin-top:10px;background:#ff2d6f;color:white;">SELECTED</div>
          </div>

          <div style="background:rgba(255,255,255,0.08);border:2.5px solid rgba(255,255,255,0.18);border-radius:36px;padding:30px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;">
            <div style="width:130px;height:90px;">${lipsSvg("#00f2fe", "#4facfe")}</div>
            <div style="font-size:26px;font-weight:800;margin-top:16px;">Neon Cyber</div>
            <div style="font-size:16px;font-weight:800;padding:8px 20px;border-radius:100px;margin-top:10px;background:rgba(0,242,254,0.25);color:#00f2fe;">UNLOCKED</div>
          </div>

          <div style="background:rgba(255,255,255,0.08);border:2.5px solid rgba(255,255,255,0.18);border-radius:36px;padding:30px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;">
            <div style="width:130px;height:90px;">${lipsSvg("#f6d365", "#fda085")}</div>
            <div style="font-size:26px;font-weight:800;margin-top:16px;">Golden Royal</div>
            <div style="font-size:16px;font-weight:800;padding:8px 20px;border-radius:100px;margin-top:10px;background:rgba(246,211,101,0.25);color:#f6d365;">VIP EXCLUSIVE</div>
          </div>

          <div style="background:rgba(255,255,255,0.08);border:2.5px solid rgba(255,255,255,0.18);border-radius:36px;padding:30px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;">
            <div style="width:130px;height:90px;">${lipsSvg("#b176ff", "#f538ff")}</div>
            <div style="font-size:26px;font-weight:800;margin-top:16px;">Glitter Star</div>
            <div style="font-size:16px;font-weight:800;padding:8px 20px;border-radius:100px;margin-top:10px;background:rgba(245,56,255,0.25);color:#f538ff;">POPULAR</div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.18);border-radius:34px;padding:26px 32px;margin-top:28px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:18px;">
            <span style="font-size:46px;">🔥</span>
            <div>
              <div style="font-weight:800;font-size:24px;">Flame Kiss Unlocked!</div>
              <div style="font-size:18px;color:#ffccd8;">Unlocked at 10-day streak</div>
            </div>
          </div>
          <span style="font-size:20px;color:#4cd964;font-weight:800;background:rgba(76,217,100,0.18);padding:10px 22px;border-radius:24px;">✓ Active</span>
        </div>
      `
    },

    // 4. Social Orbit & Live Radar
    {
      name: "appstore_screenshot_4_1290x2796.png",
      badge: "🛰️ Real-Time Radar & Orbit",
      title: "Your Social Orbit",
      subtitle: "See friends orbiting around you, track streaks & send instant love",
      body: `
        <div style="background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.18);border-radius:38px;padding:32px;margin-bottom:28px;">
          <div style="font-size:28px;font-weight:800;color:#ffccd8;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
            <span>🛰️ Live Celestial Orbit</span>
            <span style="font-size:18px;color:#4cd964;background:rgba(76,217,100,0.15);padding:6px 16px;border-radius:20px;">3 Connected</span>
          </div>

          <div style="position:relative;width:100%;height:420px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:380px;height:380px;border-radius:50%;border:2px dashed rgba(255,45,110,0.35);"></div>
            <div style="position:absolute;width:240px;height:240px;border-radius:50%;border:2px dashed rgba(255,180,0,0.4);"></div>
            <div style="width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,#ff2d6f,#8f1cb3);display:flex;align-items:center;justify-content:center;box-shadow:0 0 35px rgba(255,45,110,0.8);font-size:48px;">
              💋
            </div>
            <!-- Orbiting avatars -->
            <div style="position:absolute;top:20px;left:180px;display:flex;flex-direction:column;align-items:center;">
              <div style="width:68px;height:68px;border-radius:50%;background:#ff4081;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:32px;">👩🏻</div>
              <span style="font-size:16px;font-weight:800;background:#000;padding:4px 10px;border-radius:10px;margin-top:4px;">Sarah (2.4 km)</span>
            </div>
            <div style="position:absolute;bottom:40px;right:150px;display:flex;flex-direction:column;align-items:center;">
              <div style="width:68px;height:68px;border-radius:50%;background:#ffca28;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:32px;">👱🏼</div>
              <span style="font-size:16px;font-weight:800;background:#000;padding:4px 10px;border-radius:10px;margin-top:4px;">Alex (Online)</span>
            </div>
          </div>
        </div>

        <div style="font-size:28px;font-weight:800;color:#ffd6e0;margin-bottom:18px;">Recent Live Kisses</div>
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div style="background:rgba(255,45,110,0.18);border:1.5px solid rgba(255,45,110,0.4);border-radius:28px;padding:20px 26px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:16px;">
              <span style="font-size:36px;">💋</span>
              <div>
                <div style="font-size:22px;font-weight:800;">Sarah sent a Super Kiss!</div>
                <div style="font-size:16px;color:#ffccd8;">2 minutes ago • Real Haptic Touch</div>
              </div>
            </div>
            <div style="background:#ff2d6f;color:#fff;font-weight:800;padding:8px 18px;border-radius:18px;font-size:16px;">+50 XP</div>
          </div>

          <div style="background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.14);border-radius:28px;padding:20px 26px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:16px;">
              <span style="font-size:36px;">🔥</span>
              <div>
                <div style="font-size:22px;font-weight:800;">14-Day Streak Maintained!</div>
                <div style="font-size:16px;color:#b4a3c2;">Relationship Rank: Soulmate 💖</div>
              </div>
            </div>
            <div style="color:#ffca28;font-size:24px;">🏆</div>
          </div>
        </div>
      `
    },

    // 5. Catch & Reveal Photo Cards
    {
      name: "appstore_screenshot_5_1290x2796.png",
      badge: "💌 Secret Photo Cards",
      title: "Catch Kisses & Cards",
      subtitle: "Tap to catch incoming kisses, reveal hidden romantic cards & voice notes",
      body: `
        <div style="background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.18);border-radius:38px;padding:34px;margin-bottom:28px;text-align:center;">
          <div style="font-size:26px;color:#ffca28;font-weight:800;margin-bottom:12px;">✨ INCOMING SURPRISE ✨</div>
          <div style="font-size:32px;font-weight:900;margin-bottom:8px;">Sarah sent you a Secret Card!</div>
          <p style="font-size:20px;color:#ffccd8;margin-bottom:28px;">Catch the kiss before it fades away!</p>

          <div style="width:100%;height:440px;background:linear-gradient(135deg,rgba(255,45,110,0.35),rgba(140,20,255,0.35));border:2px dashed rgba(255,100,160,0.6);border-radius:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;box-shadow:0 18px 50px rgba(0,0,0,0.6);">
            <div style="width:140px;height:140px;border-radius:50%;background:linear-gradient(135deg,#ff2d6f,#ff80a6);display:flex;align-items:center;justify-content:center;box-shadow:0 0 45px #ff2d6f;font-size:64px;margin-bottom:18px;">
              💌
            </div>
            <div style="font-size:26px;font-weight:800;color:#fff;">"Thinking of you every second..."</div>
            <div style="font-size:18px;color:#ffccd8;margin-top:8px;">🔒 Photo Card Locked • Tap to Reveal</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:18px;">
          <div style="background:linear-gradient(135deg,#ffca28,#ff9100);color:#000;border-radius:32px;padding:28px;font-size:30px;font-weight:900;text-align:center;box-shadow:0 18px 50px rgba(255,180,0,0.6);display:flex;align-items:center;justify-content:center;gap:14px;">
            <span>✨</span> Catch &amp; Reveal Photo Card
          </div>
          <div style="display:flex;gap:16px;">
            <div style="flex:1;background:rgba(255,45,110,0.2);border:1.5px solid rgba(255,45,110,0.45);padding:20px;border-radius:24px;text-align:center;font-size:22px;font-weight:800;">
              💋 Reply with Kiss
            </div>
            <div style="flex:1;background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.18);padding:20px;border-radius:24px;text-align:center;font-size:22px;font-weight:800;">
              🎙️ Send Voice Note
            </div>
          </div>
        </div>
      `
    }
  ];

  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    console.log(`Generating iPhone Screenshot ${i + 1}: ${s.name}...`);
    const page = await context.newPage();
    await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${baseCss}</style>
    </head>
    <body>
      <div class="bg-glow-1"></div>
      <div class="bg-glow-2"></div>
      <div class="header">
        <div class="badge">${s.badge}</div>
        <h1 class="title">${s.title}</h1>
        <p class="subtitle">${s.subtitle}</p>
      </div>
      
      <div class="phone-mockup">
        <div class="dynamic-island"><div class="camera-dot"></div></div>
        <div class="phone-content">
          ${s.body}
        </div>
      </div>
    </body>
    </html>
    `);

    await page.waitForTimeout(1000);
    const outPath = path.join(OUTPUT_DIR, s.name);
    const desktopPath = path.join(DESKTOP_DIR, `iPhone_Screenshot_${i + 1}.png`);
    await page.screenshot({ path: outPath });
    await page.screenshot({ path: desktopPath });
    console.log(`✅ Saved ${outPath}`);
    await page.close();
  }

  await browser.close();
  console.log("\n🎉 ALL 5 IPHONE SCREENSHOTS GENERATED SUCCESSFULLY!");
}

run().catch(console.error);
