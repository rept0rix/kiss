const KEY = "kiss-sound-v1";
const SAMPLES = ["/sounds/kiss-1.mp3", "/sounds/kiss-2.mp3", "/sounds/kiss-3.mp3", "/sounds/kiss-4.mp3"];
const SUPER_SAMPLE = "/sounds/kiss-super.mp3";

type SoundPrefs = {
  kisses: boolean;
  hearts: boolean;
  music: boolean;
};

const DEFAULT: SoundPrefs = { kisses: true, hearts: true, music: true };

let prefs: SoundPrefs = loadPrefs();
let ctx: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();
let sampleI = 0;
let bed: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

function loadPrefs(): SoundPrefs {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<SoundPrefs>;
    return {
      kisses: parsed.kisses !== false,
      hearts: parsed.hearts !== false,
      music: parsed.music !== false,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function getSoundPrefs(): SoundPrefs {
  return { ...prefs };
}

export function setSoundPrefs(next: Partial<SoundPrefs>): SoundPrefs {
  prefs = { ...prefs, ...next };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  if (prefs.music) startMusic();
  else stopMusic();
  return getSoundPrefs();
}

export function soundsOn(): boolean {
  return prefs.kisses || prefs.hearts || prefs.music;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

async function loadBuffer(src: string): Promise<AudioBuffer | null> {
  const ac = audio();
  if (!ac) return null;
  const hit = buffers.get(src);
  if (hit) return hit;
  try {
    const res = await fetch(src);
    const raw = await res.arrayBuffer();
    const buf = await ac.decodeAudioData(raw.slice(0));
    buffers.set(src, buf);
    return buf;
  } catch {
    return null;
  }
}

function playBuffer(buf: AudioBuffer, gain = 0.85): void {
  const ac = audio();
  if (!ac) return;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(g);
  g.connect(ac.destination);
  src.start();
}

export function unlockSound(): void {
  audio();
  for (const src of [...SAMPLES, SUPER_SAMPLE, "/sounds/bed.mp3"]) void loadBuffer(src);
}

export function startMusic(): void {
  if (!prefs.music) return;
  const ac = audio();
  if (!ac || bed) return;
  void loadBuffer("/sounds/bed.mp3").then((buf) => {
    if (!buf || bed || !prefs.music) return;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ac.createGain();
    g.gain.value = 0.045;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
    bed = { src, gain: g };
  });
}

export function stopMusic(): void {
  if (!bed) return;
  try {
    bed.src.stop();
  } catch {
    /* ignore */
  }
  bed = null;
}

let lastKissAt = 0;

export function playKiss(): void {
  if (!prefs.kisses) return;
  const now = Date.now();
  if (now - lastKissAt < 1400) return;
  lastKissAt = now;
  const src = SAMPLES[sampleI % SAMPLES.length] ?? SAMPLES[0];
  sampleI += 1;
  const buf = buffers.get(src);
  if (buf) {
    playBuffer(buf, 0.7);
    return;
  }
  void loadBuffer(src).then((b) => {
    if (b) playBuffer(b, 0.7);
  });
}

export function playSuper(): void {
  if (!prefs.kisses) return;
  const buf = buffers.get(SUPER_SAMPLE);
  if (buf) {
    playBuffer(buf, 1);
    return;
  }
  void loadBuffer(SUPER_SAMPLE).then((b) => {
    if (b) playBuffer(b, 1);
  });
}

export function playHeart(): void {
  if (!prefs.hearts) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.24);
}

export function playCelebrate(_count = 1): void {
  playKiss();
}
