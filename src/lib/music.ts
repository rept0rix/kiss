// Background music library: the built-in bed plus songs the user adds.
// Added songs live in IndexedDB (on this device only); the pick is in localStorage.
const DB = "kiss-music";
const STORE = "tracks";
const ACTIVE_KEY = "kiss-music-active";

export const BUILTIN = { id: "bed", name: "KISS theme", url: "/sounds/bed.mp3" } as const;

export type Track = { id: string; name: string; builtin?: boolean };

let audioEl: HTMLAudioElement | null = null;
let objectUrl: string | null = null;
let playing = false;
let backgroundPaused = false;
let listenersAttached = false;

if (typeof window !== "undefined") {
  setupBackgroundListeners();
}

function setupBackgroundListeners(): void {
  if (typeof window === "undefined" || listenersAttached) return;
  listenersAttached = true;

  // 1. Web visibility change (browser tabs, minimized window, mobile browser)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseForBackground();
    } else {
      resumeFromBackground();
    }
  });

  // 2. Page lifecycle events
  window.addEventListener("pagehide", () => pauseForBackground());
  window.addEventListener("pageshow", () => resumeFromBackground());

  // 3. Capacitor Native App State change (iOS/Android when app goes to background / screen lock)
  void import("@capacitor/app")
    .then(({ App }) => {
      App.addListener("appStateChange", ({ isActive }) => {
        if (!isActive) {
          pauseForBackground();
        } else {
          resumeFromBackground();
        }
      }).catch(() => undefined);
    })
    .catch(() => undefined);
}

export function pauseForBackground(): void {
  if (audioEl && !audioEl.paused) {
    audioEl.pause();
    backgroundPaused = true;
  }
}

export function resumeFromBackground(): void {
  if (backgroundPaused) {
    backgroundPaused = false;
    if (playing && audioEl) {
      void audioEl.play().catch(() => {
        // Autoplay may need a user gesture if context expired
        playing = false;
      });
    }
  }
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

type Stored = { id: string; name: string; blob: Blob };

export async function listTracks(): Promise<Track[]> {
  let mine: Stored[] = [];
  try {
    mine = await tx<Stored[]>("readonly", (s) => s.getAll());
  } catch {
    /* IndexedDB unavailable */
  }
  return [{ id: BUILTIN.id, name: BUILTIN.name, builtin: true }, ...mine.map((t) => ({ id: t.id, name: t.name }))];
}

export async function addTrack(file: File): Promise<Track> {
  const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const name = file.name.replace(/\.[^.]+$/, "") || "My song";
  await tx("readwrite", (s) => s.put({ id, name, blob: file } satisfies Stored));
  return { id, name };
}

export async function removeTrack(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
  if (getActiveId() === id) setActiveId(BUILTIN.id);
}

export function getActiveId(): string {
  if (typeof window === "undefined") return BUILTIN.id;
  return window.localStorage.getItem(ACTIVE_KEY) || BUILTIN.id;
}

export function setActiveId(id: string): void {
  try {
    window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* ignore */
  }
}

function release(): void {
  if (audioEl) {
    audioEl.pause();
    audioEl.src = "";
    audioEl = null;
  }
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
}

export function stopTrack(): void {
  playing = false;
  backgroundPaused = false;
  release();
}

/** Plays the active track on loop. Safe to call repeatedly. */
export async function playActiveTrack(): Promise<void> {
  if (typeof window === "undefined" || playing) return;
  setupBackgroundListeners();
  playing = true;
  const id = getActiveId();
  let url: string = BUILTIN.url;
  let volume = 0.15;
  if (id !== BUILTIN.id) {
    try {
      const rec = await tx<Stored | undefined>("readonly", (s) => s.get(id));
      if (rec) {
        objectUrl = URL.createObjectURL(rec.blob);
        url = objectUrl;
        volume = 0.5;
      }
    } catch {
      /* fall back to built-in */
    }
  }
  if (!playing) return;
  audioEl = new Audio(url);
  audioEl.loop = true;
  audioEl.volume = volume;
  void audioEl.play().catch(() => {
    playing = false; // blocked until a user gesture; startMusic runs again on the next tap
    release();
  });
}

export async function restartTrack(): Promise<void> {
  stopTrack();
  await playActiveTrack();
}
