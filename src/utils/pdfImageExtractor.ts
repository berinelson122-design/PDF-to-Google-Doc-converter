import { PDFDocument } from 'pdf-lib';

// ===== START NEW CODE: EMBEDDED PDF IMAGE EXTRACTOR & GOOGLE DOC CARRIER =====

export interface ExtractedEmbeddedImage {
  id: string;
  mimeType: 'image/jpeg' | 'image/png';
  base64Data: string;
  dataUrl: string;
  width?: number;
  height?: number;
  pageIndex?: number;
}

/**
 * Scans PDF binary buffer for embedded JPEG/PNG image streams (XObject images) or extracts data chunks.
 */
export async function extractEmbeddedPdfImages(
  base64OrBuffer: string | ArrayBuffer
): Promise<ExtractedEmbeddedImage[]> {
  const images: ExtractedEmbeddedImage[] = [];

  try {
    let cleanBase64 = '';
    if (typeof base64OrBuffer === 'string') {
      cleanBase64 = base64OrBuffer.replace(/^data:application\/pdf;base64,/, '').trim();
    } else {
      let binary = '';
      const bytes = new Uint8Array(base64OrBuffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      cleanBase64 = btoa(binary);
    }

    const binaryBuffer = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
    const uint8 = new Uint8Array(binaryBuffer);
    const jpegStarts: number[] = [];

    // Scan for JPEG start-of-image markers (0xFF 0xD8 0xFF)
    for (let i = 0; i < uint8.length - 3; i++) {
      if (uint8[i] === 0xff && uint8[i + 1] === 0xd8 && uint8[i + 2] === 0xff) {
        jpegStarts.push(i);
      }
    }

    let imgCounter = 0;
    for (const startIdx of jpegStarts) {
      if (images.length >= 8) break; // Limit to top 8 inline images to preserve document responsiveness
      // Look for JPEG End-Of-Image marker (0xFF 0xD9)
      let endIdx = -1;
      for (let j = startIdx + 10; j < Math.min(startIdx + 2000000, uint8.length - 1); j++) {
        if (uint8[j] === 0xff && uint8[j + 1] === 0xd9) {
          endIdx = j + 2;
          break;
        }
      }

      if (endIdx > startIdx) {
        const imgBytes = uint8.subarray(startIdx, endIdx);
        if (imgBytes.length > 1000) { // Exclude tiny icons/thumbnails (< 1KB)
          let binaryStr = '';
          for (let k = 0; k < imgBytes.length; k++) {
            binaryStr += String.fromCharCode(imgBytes[k]);
          }
          const imgBase64 = btoa(binaryStr);
          imgCounter++;
          images.push({
            id: `embedded_img_${imgCounter}`,
            mimeType: 'image/jpeg',
            base64Data: imgBase64,
            dataUrl: `data:image/jpeg;base64,${imgBase64}`,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Embedded PDF image extraction fallback:', err);
  }

  return images;
}

/**
 * Enriches reconstructed HTML by replacing image placeholders or appending embedded images into figures/cards.
 */
export function injectEmbeddedImagesIntoHtml(
  htmlContent: string,
  images: ExtractedEmbeddedImage[]
): string {
  if (!images || images.length === 0) return htmlContent;

  let enrichedHtml = htmlContent;

  // 1. Replace placeholder image tags or empty img tags if present
  images.forEach((img, idx) => {
    const placeholderRegex = new RegExp(`\\[IMAGE_PLACEHOLDER_${idx + 1}\\]|\\[EMBEDDED_IMAGE_${idx + 1}\\]`, 'g');
    if (placeholderRegex.test(enrichedHtml)) {
      enrichedHtml = enrichedHtml.replace(
        placeholderRegex,
        `<img src="${img.dataUrl}" alt="Embedded Figure ${idx + 1}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 12px auto; display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />`
      );
    }
  });

  // 2. If HTML does not already contain inline <img> tags, append embedded images in an Embedded Figures section
  if (!enrichedHtml.includes('<img ') && images.length > 0) {
    const imageGalleryHtml = `
      <div class="embedded-pdf-images-container" style="margin-top: 28px; padding-top: 18px; border-top: 2px solid #e5e7eb;">
        <h3 style="font-size: 11pt; font-weight: bold; color: #1f2937; margin-bottom: 12px; font-family: Arial, sans-serif; text-transform: uppercase;">
          EMBEDDED PDF FIGURES & IMAGES (${images.length})
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
          ${images
            .map(
              (img, idx) => `
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #f8fafc; text-align: center;">
              <img src="${img.dataUrl}" alt="Embedded PDF Image ${idx + 1}" style="max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 4px; margin: 0 auto; display: block;" />
              <p style="font-size: 9pt; color: #64748b; margin-top: 8px; margin-bottom: 0; font-family: monospace;">Figure ${idx + 1} (${img.mimeType.toUpperCase()})</p>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
    enrichedHtml += imageGalleryHtml;
  }

  return enrichedHtml;
}
// ===== END NEW CODE: EMBEDDED PDF IMAGE EXTRACTOR & GOOGLE DOC CARRIER =====
