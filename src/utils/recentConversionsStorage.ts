import { ConversionResult, PdfDocument } from '../types/index.ts';

// ===== START NEW CODE: LOCAL STORAGE PERSISTENCE LAYER FOR LAST 5 CONVERSIONS =====
export const SAVED_CONVERSIONS_KEY = 'cyber_pdf_recent_conversions_v5';
export const LAST_ACTIVE_DOC_KEY = 'cyber_pdf_last_active_doc_id_v5';
export const MAX_SAVED_CONVERSIONS = 5;

export interface SavedConversionRecord {
  id: string;
  title: string;
  originalFileName: string;
  timestamp: number;
  result: ConversionResult;
  editedHtml: string;
  fileSize?: number;
  pageCount?: number;
  pdfMetadata?: {
    id: string;
    name: string;
    size: number;
    pageCount: number;
    uploadedAt: number;
    base64Data?: string;
  };
}

/**
 * Loads the last 5 saved conversion results from LocalStorage.
 * Guarantees a sanitized array with a maximum length of 5.
 */
export function loadSavedConversions(): SavedConversionRecord[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const raw = localStorage.getItem(SAVED_CONVERSIONS_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter valid objects and cap to the last 5
    return parsed
      .filter((item): item is SavedConversionRecord => Boolean(item && item.id && item.result))
      .slice(0, MAX_SAVED_CONVERSIONS);
  } catch (err) {
    console.warn('[LocalStorage Persistence] Failed to load saved conversions:', err);
    return [];
  }
}

/**
 * Safely persists a list of up to 5 conversion records to LocalStorage.
 * Implements fallback stripping of large PDF base64 payloads if browser quota is exceeded.
 */
function persistSafely(records: SavedConversionRecord[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  const capped = records.slice(0, MAX_SAVED_CONVERSIONS);

  try {
    localStorage.setItem(SAVED_CONVERSIONS_KEY, JSON.stringify(capped));
    return true;
  } catch (quotaErr) {
    console.warn('[LocalStorage Persistence] Quota exceeded. Pruning base64 data to preserve HTML & structure...');
    try {
      // Strip heavy base64Data while preserving full HTML, tables, and document metadata
      const pruned = capped.map((r) => ({
        ...r,
        pdfMetadata: r.pdfMetadata
          ? { ...r.pdfMetadata, base64Data: undefined }
          : undefined,
      }));
      localStorage.setItem(SAVED_CONVERSIONS_KEY, JSON.stringify(pruned));
      return true;
    } catch (criticalErr) {
      console.error('[LocalStorage Persistence] Critical failure writing to localStorage:', criticalErr);
      return false;
    }
  }
}

/**
 * Automatically persists a conversion result into the top of the last 5 list.
 * If an item with the same ID or title exists, it moves it to the front and updates content.
 */
export function saveRecentConversion(newRecord: SavedConversionRecord): SavedConversionRecord[] {
  const current = loadSavedConversions();

  // Deduplicate by ID or identical original filename + title
  const filtered = current.filter(
    (item) => item.id !== newRecord.id && item.title !== newRecord.title
  );

  const updated: SavedConversionRecord[] = [
    {
      ...newRecord,
      timestamp: newRecord.timestamp || Date.now(),
    },
    ...filtered,
  ].slice(0, MAX_SAVED_CONVERSIONS);

  persistSafely(updated);
  setLastActiveConversionId(newRecord.id);

  return updated;
}

/**
 * Updates the edited HTML for an existing saved conversion so edits survive page refresh.
 */
export function updateRecentConversionHtml(id: string, editedHtml: string): SavedConversionRecord[] {
  const current = loadSavedConversions();
  let changed = false;

  const updated = current.map((item) => {
    if (item.id === id) {
      changed = true;
      return {
        ...item,
        editedHtml,
        result: {
          ...item.result,
          htmlContent: editedHtml,
        },
      };
    }
    return item;
  });

  if (changed) {
    persistSafely(updated);
  }
  return updated;
}

/**
 * Removes a specific conversion record from the persistent layer.
 */
export function removeSavedConversion(id: string): SavedConversionRecord[] {
  const current = loadSavedConversions();
  const updated = current.filter((item) => item.id !== id);
  persistSafely(updated);

  if (getLastActiveConversionId() === id) {
    const nextActive = updated[0]?.id || null;
    setLastActiveConversionId(nextActive);
  }

  return updated;
}

/**
 * Clears all saved conversion results.
 */
export function clearAllSavedConversions(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(SAVED_CONVERSIONS_KEY);
      localStorage.removeItem(LAST_ACTIVE_DOC_KEY);
    }
  } catch (e) {
    console.error('[LocalStorage Persistence] Failed to clear saved conversions:', e);
  }
}

/**
 * Tracks the most recently viewed conversion ID across browser sessions.
 */
export function getLastActiveConversionId(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(LAST_ACTIVE_DOC_KEY);
    }
  } catch {
    // Ignore
  }
  return null;
}

export function setLastActiveConversionId(id: string | null): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (id) {
        localStorage.setItem(LAST_ACTIVE_DOC_KEY, id);
      } else {
        localStorage.removeItem(LAST_ACTIVE_DOC_KEY);
      }
    }
  } catch {
    // Ignore
  }
}
// ===== END NEW CODE: LOCAL STORAGE PERSISTENCE LAYER FOR LAST 5 CONVERSIONS =====
