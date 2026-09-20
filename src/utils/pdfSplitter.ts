import { PDFDocument } from 'pdf-lib';

// ===== START NEW CODE: PDF SPLITTER & PAGE RANGE SELECTION UTILITY =====

/**
 * Parses page range string (e.g. "1-3, 5, 8-10", "even", "odd", "1-5") into 0-indexed page number array.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || !rangeStr.trim() || rangeStr.toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const normalized = rangeStr.trim().toLowerCase();

  if (normalized === 'even') {
    return Array.from({ length: totalPages }, (_, i) => i).filter((i) => (i + 1) % 2 === 0);
  }

  if (normalized === 'odd') {
    return Array.from({ length: totalPages }, (_, i) => i).filter((i) => (i + 1) % 2 !== 0);
  }

  const indices = new Set<number>();
  const parts = normalized.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part) continue;

    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      let start = parseInt(startStr, 10);
      let end = parseInt(endStr, 10);

      if (isNaN(start)) start = 1;
      if (isNaN(end)) end = totalPages;

      start = Math.max(1, Math.min(start, totalPages));
      end = Math.max(1, Math.min(end, totalPages));

      if (start <= end) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        indices.add(num - 1);
      }
    }
  }

  const sorted = Array.from(indices).sort((a, b) => a - b);
  return sorted.length > 0 ? sorted : Array.from({ length: totalPages }, (_, i) => i);
}

/**
 * Splits a PDF document by page range and returns a new base64 PDF with only the selected pages.
 */
export async function splitPdfByPageRange(
  base64Data: string,
  pageRangeStr: string
): Promise<{
  splitBase64: string;
  splitPageCount: number;
  originalTotalPages: number;
  activePageIndices: number[];
}> {
  const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '').trim();
  const binaryBuffer = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));

  const srcPdf = await PDFDocument.load(binaryBuffer, { ignoreEncryption: true });
  const originalTotalPages = srcPdf.getPageCount();

  const activePageIndices = parsePageRange(pageRangeStr, originalTotalPages);

  // If all pages selected, return original base64
  if (activePageIndices.length === originalTotalPages) {
    return {
      splitBase64: cleanBase64,
      splitPageCount: originalTotalPages,
      originalTotalPages,
      activePageIndices,
    };
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, activePageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const splitBytes = await newPdf.save();
  let binary = '';
  const bytes = new Uint8Array(splitBytes);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const splitBase64 = btoa(binary);

  return {
    splitBase64,
    splitPageCount: activePageIndices.length,
    originalTotalPages,
    activePageIndices,
  };
}
// ===== END NEW CODE: PDF SPLITTER & PAGE RANGE SELECTION UTILITY =====
