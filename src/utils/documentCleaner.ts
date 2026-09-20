// ===== START NEW CODE: DOCUMENT QUICK CLEAN UTILITY =====

export interface QuickCleanResult {
  cleanedHtml: string;
  removedHeadersCount: number;
  removedFootersCount: number;
  removedPageNumbersCount: number;
  totalRemovedCount: number;
}

/**
 * Automatically identifies and strips headers, footers, and page numbers from HTML document content.
 * Designed to clean raw PDF-converted HTML before finalizing exports or sending to Google Docs.
 */
export function quickCleanHeadersFooters(html: string): QuickCleanResult {
  if (typeof window === 'undefined' || !html) {
    return {
      cleanedHtml: html || '',
      removedHeadersCount: 0,
      removedFootersCount: 0,
      removedPageNumbersCount: 0,
      totalRemovedCount: 0,
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let removedHeadersCount = 0;
  let removedFootersCount = 0;
  let removedPageNumbersCount = 0;

  // 1. Target standard semantic header elements & classes
  const headerSelectors = [
    'header',
    '.header',
    '.doc-header',
    '.page-header',
    '[data-type="header"]',
    '[role="banner"]'
  ];
  headerSelectors.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => {
      el.remove();
      removedHeadersCount++;
    });
  });

  // 2. Target standard semantic footer elements & classes
  const footerSelectors = [
    'footer',
    '.footer',
    '.doc-footer',
    '.page-footer',
    '[data-type="footer"]',
    '[role="contentinfo"]'
  ];
  footerSelectors.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => {
      el.remove();
      removedFootersCount++;
    });
  });

  // 3. Target explicit page-number classes / attributes
  const pageNumberSelectors = [
    '.page-number',
    '.page-num',
    '.page-count',
    '[data-type="page-number"]',
    '[data-page-number]'
  ];
  pageNumberSelectors.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => {
      el.remove();
      removedPageNumbersCount++;
    });
  });

  // 4. Scan leaf/text elements for page numbers and running header/footer regex signatures
  const elements = doc.querySelectorAll('p, div, span, small');
  elements.forEach((el) => {
    // Skip containers with complex nested children
    if (el.children.length > 2) return;

    const text = (el.textContent || '').trim();
    if (!text) return;

    // Regex for typical page number patterns:
    // "Page 1", "Page 1 of 12", "1 / 12", "- 1 -", "P. 1", "Page #1", "Page 12"
    const isPageNum = 
      /^(page\s*#?\s*\d+(\s*of\s*\d+)?|-?\s*\d+\s*-?|p\.\s*\d+|\d+\s*\/\s*\d+)$/i.test(text);

    // Regex for common running document headers/footers in converted PDFs
    const isRunningHeaderFooter = 
      /^(confidential|draft\s*-\s*do\s*not\s*distribute|all\s*rights\s*reserved|internal\s*use\s*only)$/i.test(text);

    if (isPageNum) {
      el.remove();
      removedPageNumbersCount++;
    } else if (isRunningHeaderFooter) {
      el.remove();
      removedHeadersCount++;
    }
  });

  const totalRemovedCount = removedHeadersCount + removedFootersCount + removedPageNumbersCount;
  const cleanedHtml = doc.body.innerHTML || html;

  return {
    cleanedHtml,
    removedHeadersCount,
    removedFootersCount,
    removedPageNumbersCount,
    totalRemovedCount,
  };
}
// ===== END NEW CODE: DOCUMENT QUICK CLEAN UTILITY =====
