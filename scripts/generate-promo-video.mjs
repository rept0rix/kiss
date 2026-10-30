import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const DIR = process.cwd();
const VIDEO_DIR = path.join(DIR, "store_assets/raw_video");
const FINAL_MP4 = path.join(DIR, "store_assets/sendkiss_promo_video.mp4");
const BED_AUDIO = path.join(DIR, "public/sounds/bed.mp3");
const KISS_AUDIO_1 = path.join(DIR, "public/sounds/kiss-1.mp3");
const KISS_AUDIO_2 = path.join(DIR, "public/sounds/kiss-super.mp3");

if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
// Clean previous raw webms
fs.readdirSync(VIDEO_DIR).forEach(f => fs.unlinkSync(path.join(VIDEO_DIR, f)));

// Read some sample lip images to base64
const lipImages = [1, 4, 7, 10, 12, 16, 21].map(n => {
  const p = path.join(DIR, `public/lips/lip-${String(n).padStart(2, "0")}.png`);
  return fs.existsSync(p) ? `data:image/png;base64,${fs.readFileSync(p).toString("base64")}` : "";
}).filter(Boolean);

const homeScreenB64 = fs.existsSync(path.join(DIR, "store_assets/screen_home.png"))
  ? `data:image/png;base64,${fs.readFileSync(path.join(DIR, "store_assets/screen_home.png")).toString("base64")}`
  : "";

const friendsScreenB64 = fs.existsSync(path.join(DIR, "store_assets/screen_friends.png"))
  ? `data:image/png;base64,${fs.readFileSync(path.join(DIR, "store_assets/screen_friends.png")).toString("base64")}`
  : "";

console.log("🚀 Launching browser for recording high-energy video...");

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&display=swap");

    body {
      width: 1080px;
      height: 1920px;
      background: #070707;
      font-family: "Plus Jakarta Sans", sans-serif;
      color: #FFF;
      overflow: hidden;
      position: relative;
    }

    /* Ambient Pulsing Aura */
    .aura {
      position: absolute;
      width: 1400px;
      height: 1400px;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(225, 29, 46, 0.4) 0%, rgba(255, 42, 77, 0.1) 45%, transparent 70%);
      filter: blur(120px);
      animation: pulseAura 3s ease-in-out infinite alternate;
    }
    @keyframes pulseAura {
      0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.6; }
      100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.95; }
    }

    /* Scene Container */
    .scene {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .scene.active {
      opacity: 1;
      pointer-events: auto;
    }

    /* Typography */
    .tag {
      display: inline-block;
      padding: 14px 34px;
      border-radius: 999px;
      background: rgba(255, 42, 77, 0.15);
      border: 1.5px solid rgba(255, 42, 77, 0.4);
      color: #FF2A4D;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 5px;
      text-transform: uppercase;
      margin-bottom: 24px;
      box-shadow: 0 0 40px rgba(255, 42, 77, 0.3);
    }
    .headline {
      font-size: 76px;
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -2px;
      text-align: center;
      max-width: 960px;
      margin-bottom: 24px;
      background: linear-gradient(180deg, #FFFFFF 20%, #C4C6D8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .headline span {
      background: linear-gradient(135deg, #FF2A4D 0%, #FF758C 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtext {
      font-size: 32px;
      font-weight: 600;
      color: #9292A4;
      text-align: center;
      max-width: 800px;
    }

    /* Phone Mockup */
    .mockup-container {
      margin-top: 50px;
      width: 680px;
      height: 1200px;
      background: #141418;
      border-radius: 90px;
      padding: 14px;
      box-shadow: 0 0 0 2px #282832, 0 40px 100px rgba(0,0,0,0.95), 0 0 60px rgba(225,29,46,0.25);
      position: relative;
    }
    .mockup-screen {
      width: 100%;
      height: 100%;
      border-radius: 78px;
      overflow: hidden;
      background: #000;
      position: relative;
    }
    .mockup-screen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .island {
      position: absolute;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      width: 180px;
      height: 48px;
      background: #000;
      border-radius: 30px;
      z-index: 10;
    }

    /* Floating Animated Lips */
    .floating-kiss {
      position: absolute;
      width: 160px;
      height: 160px;
      object-fit: contain;
      filter: drop-shadow(0 15px 30px rgba(225, 29, 46, 0.6));
    }

    /* Big Glowing Logo */
    .big-logo {
      width: 440px;
      height: 440px;
      filter: drop-shadow(0 30px 80px rgba(0,0,0,0.9)) drop-shadow(0 0 80px rgba(225, 29, 46, 0.7));
      margin-bottom: 40px;
      animation: floatLogo 2.5s ease-in-out infinite alternate;
    }
    @keyframes floatLogo {
      0% { transform: translateY(0) scale(1); }
      100% { transform: translateY(-20px) scale(1.05); }
    }

    .cta-btn {
      margin-top: 40px;
      padding: 24px 64px;
      border-radius: 999px;
      background: linear-gradient(135deg, #FF2A4D 0%, #D80027 100%);
      color: #FFF;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 2px;
      box-shadow: 0 15px 45px rgba(225, 29, 46, 0.5);
    }
  </style>
</head>
<body>
  <div class="aura"></div>

  <!-- SCENE 1: Hook -->
  <div class="scene" id="scene1">
    <div class="tag">Bored of Texting?</div>
    <div class="headline">Words can't say it. <br><span>Send a Kiss.</span></div>
    <div class="subtext">The intimate, playful way to connect with people in real time.</div>
    <div style="margin-top: 60px;">
      <svg class="big-logo" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="pLipGrad" x1="16" y1="28" x2="84" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FF3355"/>
            <stop offset="50%" stop-color="#E11D2E"/>
            <stop offset="100%" stop-color="#8B0012"/>
          </linearGradient>
        </defs>
        <path d="M16 54c11-20 24-26 34-26s23 6 34 26c-11 20-24 26-34 26S27 74 16 54Z" fill="url(#pLipGrad)"/>
        <path d="M22 54c8-2 16 3 28 3s20-5 28-3" stroke="#070707" stroke-width="4.5" stroke-linecap="round"/>
      </svg>
    </div>
  </div>

  <!-- SCENE 2: Throw a Kiss -->
  <div class="scene" id="scene2">
    <div class="tag">Instant Delivery</div>
    <div class="headline"><span>THROW A KISS</span><br>With One Tap</div>
    <div class="subtext">Pick someone you love. Send them a warm, animated kiss card.</div>
    <div class="mockup-container">
      <div class="island"></div>
      <div class="mockup-screen">
        <img src="${homeScreenB64}">
      </div>
    </div>
  </div>

  <!-- SCENE 3: Catch & Send Back -->
  <div class="scene" id="scene3">
    <div class="tag">Real-Time Feel</div>
    <div class="headline">Catch It Back.<br><span>Feel The Vibe.</span></div>
    <div class="subtext">Experience instant haptic catches and send one back in seconds.</div>
    <div style="position: relative; width: 800px; height: 800px; display:flex; align-items:center; justify-content:center; margin-top:50px;">
      <img class="floating-kiss" src="${lipImages[0] || ''}" style="top: 50px; left: 80px; transform: scale(1.3) rotate(-15deg);">
      <img class="floating-kiss" src="${lipImages[1] || ''}" style="bottom: 80px; right: 100px; transform: scale(1.6) rotate(20deg);">
      <img class="floating-kiss" src="${lipImages[2] || ''}" style="top: 80px; right: 80px; transform: scale(1.2) rotate(10deg);">
      <img class="floating-kiss" src="${lipImages[3] || ''}" style="bottom: 60px; left: 120px; transform: scale(1.4) rotate(-25deg);">
      <svg class="big-logo" viewBox="0 0 100 100" style="width: 520px; height: 520px;">
        <path d="M16 54c11-20 24-26 34-26s23 6 34 26c-11 20-24 26-34 26S27 74 16 54Z" fill="url(#pLipGrad)"/>
        <path d="M22 54c8-2 16 3 28 3s20-5 28-3" stroke="#070707" stroke-width="4.5" stroke-linecap="round"/>
      </svg>
    </div>
  </div>

  <!-- SCENE 4: Orbit -->
  <div class="scene" id="scene4">
    <div class="tag">Proximity & Friends</div>
    <div class="headline"><span>YOUR SOCIAL ORBIT</span></div>
    <div class="subtext">Watch your friends gravitate around you on the live radar.</div>
    <div class="mockup-container">
      <div class="island"></div>
      <div class="mockup-screen">
        <img src="${friendsScreenB64}">
      </div>
    </div>
  </div>

  <!-- SCENE 5: Final CTA -->
  <div class="scene" id="scene5">
    <svg class="big-logo" viewBox="0 0 100 100" style="width: 480px; height: 480px;">
      <path d="M16 54c11-20 24-26 34-26s23 6 34 26c-11 20-24 26-34 26S27 74 16 54Z" fill="url(#pLipGrad)"/>
      <path d="M22 54c8-2 16 3 28 3s20-5 28-3" stroke="#070707" stroke-width="4.5" stroke-linecap="round"/>
    </svg>
    <div class="headline">SendKiss</div>
    <div class="subtext">Throw a kiss. Catch one back. That's the whole app.</div>
    <div class="cta-btn">Available on App Store</div>
    <div style="margin-top: 30px; font-size: 26px; color: #888899; letter-spacing: 2px;">app.sendkiss.online</div>
  </div>

  <script>
    const scenes = [
      document.getElementById('scene1'),
      document.getElementById('scene2'),
      document.getElementById('scene3'),
      document.getElementById('scene4'),
      document.getElementById('scene5')
    ];

    function showScene(idx) {
      scenes.forEach((s, i) => {
        if (i === idx) s.classList.add('active');
        else s.classList.remove('active');
      });
    }

    // Sequence schedule: total 16 seconds
    showScene(0);
    setTimeout(() => showScene(1), 3200);
    setTimeout(() => showScene(2), 6500);
    setTimeout(() => showScene(3), 10000);
    setTimeout(() => showScene(4), 13000);
  </script>
</body>
</html>
`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1080, height: 1920 }
    },
    viewport: { width: 1080, height: 1920 }
  });

  const page = await context.newPage();
  await page.setContent(html);

  console.log("🎥 Recording 16-second promotional animation...");
  await page.waitForTimeout(16500);

  await page.close();
  await context.close();
  await browser.close();

  const recordedWebm = fs.readdirSync(VIDEO_DIR).find(f => f.endsWith(".webm"));
  if (!recordedWebm) {
    console.error("❌ No recorded video found");
    return;
  }

  const rawVideoPath = path.join(VIDEO_DIR, recordedWebm);
  console.log("🎬 Raw video recorded:", rawVideoPath);

  // Now mix audio tracks with ffmpeg:
  // 1. bed.mp3 loop/volume
  // 2. kiss-1.mp3 at 3.3s and 6.6s
  // 3. kiss-super.mp3 at 13.2s
  console.log("🎵 Mixing audio and mastering H.264 MP4...");
  
  const ffmpegCmd = [
    "ffmpeg -y",
    `-i "${rawVideoPath}"`,
    `-ss 0 -t 16.5 -i "${BED_AUDIO}"`,
    `-i "${KISS_AUDIO_1}"`,
    `-i "${KISS_AUDIO_2}"`,
    `-filter_complex "`,
    `[1:a]volume=0.35[bg];`,
    `[2:a]adelay=3300|3300,volume=0.9[k1];`,
    `[2:a]adelay=6700|6700,volume=0.9[k2];`,
    `[3:a]adelay=13200|13200,volume=1.0[ksuper];`,
    `[bg][k1][k2][ksuper]amix=inputs=4:duration=first:dropout_transition=2[aout]`,
    `"`,
    `-map 0:v -map "[aout]"`,
    `-c:v libx264 -pix_fmt yuv420p -r 30 -preset fast -b:v 8M`,
    `-c:a aac -b:a 192k`,
    `-t 16.5`,
    `"${FINAL_MP4}"`
  ].join(" ");

  execSync(ffmpegCmd, { stdio: "inherit" });
  console.log("🎉 Final marketing video mastered successfully at:", FINAL_MP4);
})();
