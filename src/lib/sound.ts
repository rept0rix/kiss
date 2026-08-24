const KEY = "kiss-sound-v1";

type SoundPrefs = {
  kisses: boolean;
  hearts: boolean;
};

const DEFAULT: SoundPrefs = { kisses: true, hearts: true };

let prefs: SoundPrefs = loadPrefs();
let ctx: AudioContext | null = null;

function loadPrefs(): SoundPrefs {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<SoundPrefs>;
    return {
      kisses: parsed.kisses !== false,
      hearts: parsed.hearts !== false,
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
  return getSoundPrefs();
}

export function soundsOn(): boolean {
  return prefs.kisses || prefs.hearts;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockSound(): void {
  audio();
}

function noise(ac: AudioContext, duration: number): AudioBufferSourceNode {
  const n = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, n, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  return src;
}

export function playKiss(): void {
  if (!prefs.kisses) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const src = noise(ac, 0.22);
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(900, t);
  filter.frequency.exponentialRampToValueAtTime(420, t + 0.18);
  filter.Q.value = 4;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(t);
  src.stop(t + 0.22);

  const osc = ac.createOscillator();
  const og = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.16);
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  osc.connect(og);
  og.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.2);
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

  const osc2 = ac.createOscillator();
  const g2 = ac.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 1760;
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc2.connect(g2);
  g2.connect(ac.destination);
  osc2.start(t);
  osc2.stop(t + 0.14);
}

export function playCelebrate(count = 1): void {
  const n = Math.min(12, Math.max(1, count));
  playKiss();
  window.setTimeout(() => playHeart(), 90);
  for (let i = 1; i < n; i += 1) {
    window.setTimeout(() => {
      if (i % 2 === 0) playKiss();
      else playHeart();
    }, 70 * i);
  }
}
