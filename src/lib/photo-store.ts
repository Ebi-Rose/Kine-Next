// ── Progress Check-in Storage (IndexedDB) ──

const DB_NAME = "kine_photos";
const DB_VERSION = 2;
const CHECKIN_STORE = "checkins";
const LEGACY_STORE = "photos";

/** A single progress check-in — date-anchored with optional photos, weight, note, mood. */
export interface CheckIn {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  photos: string[]; // data URLs
  note: string;
  weight: number | null; // bodyweight in user's preferred unit
  mood: "great" | "good" | "okay" | "low" | null;
}

/** Legacy type — kept for migration */
export interface ProgressPhoto {
  id: string;
  date: string;
  dataUrl: string;
  note: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      // Create checkins store if it doesn't exist
      if (!db.objectStoreNames.contains(CHECKIN_STORE)) {
        db.createObjectStore(CHECKIN_STORE, { keyPath: "id" });
      }

      // Migrate legacy photos → checkins
      if (oldVersion < 2 && db.objectStoreNames.contains(LEGACY_STORE)) {
        const tx = (event.target as IDBOpenDBRequest).transaction!;
        const legacyStore = tx.objectStore(LEGACY_STORE);
        const checkinStore = tx.objectStore(CHECKIN_STORE);
        const getAll = legacyStore.getAll();
        getAll.onsuccess = () => {
          const photos = getAll.result as ProgressPhoto[];
          // Group by date
          const byDate = new Map<string, ProgressPhoto[]>();
          for (const p of photos) {
            const existing = byDate.get(p.date) || [];
            existing.push(p);
            byDate.set(p.date, existing);
          }
          for (const [date, group] of byDate) {
            const checkin: CheckIn = {
              id: `checkin_${date}_${Date.now()}`,
              date,
              photos: group.map((p) => p.dataUrl),
              note: group.map((p) => p.note).filter(Boolean).join("\n"),
              weight: null,
              mood: null,
            };
            checkinStore.put(checkin);
          }
        };
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const MAX_CHECKINS = 200;

export async function saveCheckIn(checkin: CheckIn): Promise<void> {
  const existing = await getAllCheckIns();
  if (existing.length >= MAX_CHECKINS) {
    throw new Error(`Check-in limit reached (${MAX_CHECKINS}). Delete older entries to make room.`);
  }

  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(CHECKIN_STORE, "readwrite");
      tx.objectStore(CHECKIN_STORE).put(checkin);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      throw new Error("Storage full. Delete older check-ins to make room.");
    }
    throw e;
  }
}

export async function getAllCheckIns(): Promise<CheckIn[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_STORE, "readonly");
    const request = tx.objectStore(CHECKIN_STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCheckIn(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_STORE, "readwrite");
    tx.objectStore(CHECKIN_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Legacy exports (kept for backward compat) ──

export async function getAllPhotos(): Promise<ProgressPhoto[]> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(LEGACY_STORE)) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LEGACY_STORE, "readonly");
      const request = tx.objectStore(LEGACY_STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function savePhoto(photo: ProgressPhoto): Promise<void> {
  // Redirect to new check-in format
  const checkin: CheckIn = {
    id: `checkin_${Date.now()}`,
    date: photo.date,
    photos: [photo.dataUrl],
    note: photo.note,
    weight: null,
    mood: null,
  };
  return saveCheckIn(checkin);
}

export async function deletePhoto(id: string): Promise<void> {
  return deleteCheckIn(id);
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Convert a File to a data URL for storage.
 * Validates file type and size before processing.
 */
export function fileToDataUrl(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Promise.reject(new Error("Invalid file type. Use JPEG, PNG, or WebP."));
  }
  if (file.size > MAX_FILE_SIZE) {
    return Promise.reject(new Error("File too large. Maximum size is 10 MB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
