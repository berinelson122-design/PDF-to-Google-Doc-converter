// ===== START NEW CODE: PRINT-FRIENDLY DOCUMENT TRANSFORMER UTILITY =====

export interface PrintFriendlyOptions {
  watermarkText?: string;
  removeBackgrounds?: boolean;
  addBleedGuides?: boolean;
}

/**
 * Transforms document HTML into a print-optimized document payload.
 * Options include:
 * - Removing dark/colored background fills and setting clean white background with high-contrast dark text
 * - Adding physical print bleed guides / crop mark borders
 * - Injecting a diagonal watermarked overlay specifically designed for physical print preview & PDF/DOCX exports
 */
export function transformToPrintFriendlyHtml(
  html: string,
  options: PrintFriendlyOptions = {}
): string {
  if (typeof window === 'undefined' || !html) return html || '';

  const watermarkText = options.watermarkText || 'OFFICIAL PRINT COPY // DRAFT';
  const removeBgs = options.removeBackgrounds !== false;
  const addBleeds = options.addBleedGuides !== false;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (removeBgs) {
    // Strip dark/heavy inline background styles from elements
    const elements = doc.querySelectorAll('*');
    elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        const bg = el.style.backgroundColor;
        const color = el.style.color;

        // If element has dark background, reset to white/transparent
        if (bg && (bg.includes('black') || bg.includes('rgb(0,') || bg.includes('rgb(10,') || bg.includes('#000') || bg.includes('#0a0') || bg.includes('#111') || bg.includes('#1f1'))) {
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#111827';
        }

        // Ensure text color is crisp black/dark gray for printing
        if (color && (color.includes('white') || color.includes('#fff') || color.includes('rgb(255,'))) {
          el.style.color = '#111827';
        }
      }
    });

    if (doc.body) {
      doc.body.style.backgroundColor = '#ffffff';
      doc.body.style.color = '#111827';
    }
  }

  // Create wrapper container
  const container = doc.createElement('div');
  container.className = 'print-friendly-wrapper';
  container.style.position = 'relative';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.padding = '0.4in';
  container.style.boxSizing = 'border-box';
  container.style.minHeight = '100%';

  // Physical Print Bleed Marks (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
  if (addBleeds) {
    const bleedGuidesHtml = `
      <div class="print-bleed-guide-tl" style="position: absolute; top: 0; left: 0; width: 18px; height: 18px; border-top: 2px solid #000; border-left: 2px solid #000; pointer-events: none; z-index: 10;"></div>
      <div class="print-bleed-guide-tr" style="position: absolute; top: 0; right: 0; width: 18px; height: 18px; border-top: 2px solid #000; border-right: 2px solid #000; pointer-events: none; z-index: 10;"></div>
      <div class="print-bleed-guide-bl" style="position: absolute; bottom: 0; left: 0; width: 18px; height: 18px; border-bottom: 2px solid #000; border-left: 2px solid #000; pointer-events: none; z-index: 10;"></div>
      <div class="print-bleed-guide-br" style="position: absolute; bottom: 0; right: 0; width: 18px; height: 18px; border-bottom: 2px solid #000; border-right: 2px solid #000; pointer-events: none; z-index: 10;"></div>
    `;
    const bleedWrapper = doc.createElement('div');
    bleedWrapper.innerHTML = bleedGuidesHtml;
    while (bleedWrapper.firstChild) {
      container.appendChild(bleedWrapper.firstChild);
    }
  }

  // Watermark Overlay
  if (watermarkText) {
    const watermarkDiv = doc.createElement('div');
    watermarkDiv.className = 'print-watermark-overlay';
    watermarkDiv.setAttribute('style', `
      position: absolute;
      top: 40%;
      left: 5%;
      right: 5%;
      text-align: center;
      font-size: 28pt;
      font-weight: 800;
      font-family: Arial, Helvetica, sans-serif;
      color: rgba(0, 0, 0, 0.08);
      text-transform: uppercase;
      letter-spacing: 6px;
      transform: rotate(-30deg);
      pointer-events: none;
      user-select: none;
      z-index: 5;
    `);
    watermarkDiv.textContent = watermarkText;
    container.appendChild(watermarkDiv);
  }

  // Inner document content
  const contentWrapper = doc.createElement('div');
  contentWrapper.className = 'print-content-inner';
  contentWrapper.innerHTML = doc.body.innerHTML;
  container.appendChild(contentWrapper);

  return container.outerHTML;
}
// ===== END NEW CODE: PRINT-FRIENDLY DOCUMENT TRANSFORMER UTILITY =====
