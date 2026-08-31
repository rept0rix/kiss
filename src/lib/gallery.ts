const KEY = "kiss-gallery-v1";

export type Gallery = {
  photos: string[];
  main: string | null;
  send: string | null;
};

const EMPTY: Gallery = { photos: [], main: null, send: null };

export function loadGallery(): Gallery {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Gallery;
    return {
      photos: Array.isArray(parsed.photos) ? parsed.photos.slice(0, 6) : [],
      main: parsed.main ?? null,
      send: parsed.send ?? null,
    };
  } catch {
    return EMPTY;
  }
}

export function saveGallery(next: Gallery): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...next, photos: next.photos.slice(0, 6) }));
  } catch {
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ photos: next.photos.slice(0, 3), main: next.main, send: next.send }),
      );
    } catch {
      /* ignore */
    }
  }
}

export function addPhoto(photo: string, gallery = loadGallery()): Gallery {
  const photos = [photo, ...gallery.photos.filter((p) => p !== photo)].slice(0, 6);
  const next = {
    photos,
    main: gallery.main || photo,
    send: gallery.send || photo,
  };
  saveGallery(next);
  return next;
}
