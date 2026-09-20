import { jsPDF } from 'jspdf';

// ===== START NEW CODE: CLEAN SECURE PDF EXPORT ENGINE =====

export interface CleanPdfExportOptions {
  title?: string;
  author?: string;
  subject?: string;
  isPrintFriendly?: boolean;
  watermarkText?: string;
}

/**
 * Strips HTML tags and decodes common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Exports modified HTML document back into a secure, clean vector PDF format.
 * Features:
 * - Proper US Letter page geometry (8.5 x 11 inches)
 * - Safe margins (40pt / ~0.55in)
 * - Multi-page pagination with clean headers and page counters
 * - Preserved Heading hierarchy (H1, H2, H3), paragraphs, bullet lists, and tables
 * - Embeds document metadata (Title, Author, Creator)
 */
export async function exportToCleanPdf(
  htmlContent: string,
  options: CleanPdfExportOptions = {}
): Promise<void> {
  const documentTitle = options.title || 'Reconstructed_Document';
  const authorName = options.author || 'ARCHITECT // VOID_WEAVER';

  // Initialize jsPDF with standard letter format (points)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter', // 612 x 792 pt
  });

  // Set PDF technical metadata
  doc.setProperties({
    title: documentTitle,
    author: authorName,
    subject: options.subject || 'Clean Reconstructed Document from Google Docs Converter',
    keywords: 'clean-pdf, reconstructed-document, google-docs, export',
    creator: 'ARCHITECT // VOID_WEAVER Export Suite',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginTop = 56;
  const marginBottom = 50;
  const printableWidth = pageWidth - marginX * 2;
  const printableHeight = pageHeight - marginTop - marginBottom;

  let currentY = marginTop;

  // Helper to add page break if needed
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = marginTop;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(documentTitle.toUpperCase(), marginX, 36);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(marginX, 42, pageWidth - marginX, 42);
  };

  // Draw initial page header
  drawRunningHeader();

  // Create temporary parser DOM
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Document Title Header on first page
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(documentTitle, printableWidth);
  doc.text(titleLines, marginX, currentY);
  currentY += titleLines.length * 24 + 10;

  // Accent rule below title
  doc.setDrawColor(255, 0, 60); // Cyber-Red accent
  doc.setLineWidth(1.5);
  doc.line(marginX, currentY - 4, marginX + 80, currentY - 4);
  currentY += 14;

  // Process top-level elements or child nodes
  const nodes = Array.from(tempDiv.children);

  // If no block elements found, split text into paragraphs
  if (nodes.length === 0) {
    const rawText = decodeHtmlEntities(tempDiv.textContent || '');
    const paragraphs = rawText.split(/\n\s*\n/);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);

    for (const p of paragraphs) {
      const trimmed = p.trim();
      if (!trimmed) continue;
      const lines = doc.splitTextToSize(trimmed, printableWidth);
      ensureSpace(lines.length * 15 + 10);
      doc.text(lines, marginX, currentY);
      currentY += lines.length * 15 + 10;
    }
  } else {
    for (const el of nodes) {
      const tagName = el.tagName.toLowerCase();
      const text = decodeHtmlEntities(el.textContent?.trim() || '');
      if (!text && tagName !== 'table' && tagName !== 'hr') continue;

      if (tagName === 'h1') {
        ensureSpace(34);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(17, 24, 39);
        const lines = doc.splitTextToSize(text, printableWidth);
        doc.text(lines, marginX, currentY);
        currentY += lines.length * 20 + 8;
      } else if (tagName === 'h2') {
        ensureSpace(28);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(31, 41, 55);
        const lines = doc.splitTextToSize(text, printableWidth);
        doc.text(lines, marginX, currentY);
        currentY += lines.length * 17 + 6;
      } else if (tagName === 'h3' || tagName === 'h4') {
        ensureSpace(24);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
        const lines = doc.splitTextToSize(text, printableWidth);
        doc.text(lines, marginX, currentY);
        currentY += lines.length * 15 + 5;
      } else if (tagName === 'p') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(40, 40, 40);
        const lines = doc.splitTextToSize(text, printableWidth);
        ensureSpace(lines.length * 14 + 8);
        doc.text(lines, marginX, currentY);
        currentY += lines.length * 14 + 8;
      } else if (tagName === 'ul' || tagName === 'ol') {
        const listItems = Array.from(el.querySelectorAll('li'));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(40, 40, 40);

        listItems.forEach((li, idx) => {
          const bullet = tagName === 'ol' ? `${idx + 1}. ` : '\u2022 ';
          const liText = decodeHtmlEntities(li.textContent?.trim() || '');
          const lines = doc.splitTextToSize(liText, printableWidth - 20);
          ensureSpace(lines.length * 14 + 4);
          doc.text(bullet, marginX + 4, currentY);
          doc.text(lines, marginX + 20, currentY);
          currentY += lines.length * 14 + 4;
        });
        currentY += 4;
      } else if (tagName === 'table') {
        // Table layout renderer
        const rows = Array.from(el.querySelectorAll('tr'));
        if (rows.length > 0) {
          const firstRowCells = Array.from(rows[0].querySelectorAll('th, td'));
          const colCount = Math.max(1, firstRowCells.length);
          const colWidth = printableWidth / colCount;

          for (let rIdx = 0; rIdx < rows.length; rIdx++) {
            const row = rows[rIdx];
            const cells = Array.from(row.querySelectorAll('th, td'));
            const isHeader = rIdx === 0 && row.querySelector('th') !== null;

            ensureSpace(24);

            // Row background
            if (isHeader) {
              doc.setFillColor(243, 244, 246);
              doc.rect(marginX, currentY - 12, printableWidth, 20, 'F');
            } else if (rIdx % 2 === 1) {
              doc.setFillColor(250, 250, 250);
              doc.rect(marginX, currentY - 12, printableWidth, 20, 'F');
            }

            // Cell border line
            doc.setDrawColor(225, 229, 235);
            doc.setLineWidth(0.5);
            doc.line(marginX, currentY + 8, marginX + printableWidth, currentY + 8);

            cells.forEach((cell, cIdx) => {
              const cellText = decodeHtmlEntities(cell.textContent?.trim() || '');
              const cellX = marginX + cIdx * colWidth + 6;

              doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
              doc.setFontSize(isHeader ? 9.5 : 9);
              doc.setTextColor(isHeader ? 17 : 55, isHeader ? 24 : 65, isHeader ? 39 : 81);

              const truncated = doc.splitTextToSize(cellText, colWidth - 12)[0] || '';
              doc.text(truncated, cellX, currentY + 2);
            });

            currentY += 22;
          }
          currentY += 10;
        }
      } else if (tagName === 'hr') {
        ensureSpace(16);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.75);
        doc.line(marginX, currentY, marginX + printableWidth, currentY);
        currentY += 14;
      } else {
        // Fallback for divs, blockquotes, etc.
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(40, 40, 40);
        const lines = doc.splitTextToSize(text, printableWidth);
        ensureSpace(lines.length * 14 + 6);
        doc.text(lines, marginX, currentY);
        currentY += lines.length * 14 + 6;
      }
    }
  }

  // Add clean page numbers and footer on all pages
  const totalPages = typeof doc.getNumberOfPages === 'function' 
    ? doc.getNumberOfPages() 
    : (doc.internal.pages ? doc.internal.pages.length - 1 : 1);
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Render Print Watermark & Corner Bleed Crop Marks if Print-Friendly is enabled
    if (options.isPrintFriendly || options.watermarkText) {
      const wText = options.watermarkText || 'OFFICIAL PRINT COPY // DRAFT';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(220, 225, 230);
      try {
        doc.text(wText, pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: 325,
        });
      } catch (e) {
        doc.text(wText, pageWidth / 4, pageHeight / 2);
      }

      // Draw 4 physical print corner bleed crop marks
      doc.setDrawColor(20, 20, 20);
      doc.setLineWidth(1);
      // Top-Left crop mark
      doc.line(12, 22, 32, 22);
      doc.line(22, 12, 22, 32);
      // Top-Right crop mark
      doc.line(pageWidth - 32, 22, pageWidth - 12, 22);
      doc.line(pageWidth - 22, 12, pageWidth - 22, 32);
      // Bottom-Left crop mark
      doc.line(12, pageHeight - 22, 32, pageHeight - 22);
      doc.line(22, pageHeight - 32, 22, pageHeight - 12);
      // Bottom-Right crop mark
      doc.line(pageWidth - 32, pageHeight - 22, pageWidth - 12, pageHeight - 22);
      doc.line(pageWidth - 22, pageHeight - 32, pageWidth - 22, pageHeight - 12);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(marginX, pageHeight - 34, pageWidth - marginX, pageHeight - 34);

    doc.text('GENERATED VIA ARCHITECT // VOID_WEAVER', marginX, pageHeight - 22);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX - 50, pageHeight - 22);
  }

  // Clean filename sanitized
  const sanitizedFilename = (documentTitle || 'reconstructed_document')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_');

  doc.save(`${sanitizedFilename}_clean.pdf`);
}

// ===== END NEW CODE: CLEAN SECURE PDF EXPORT ENGINE =====
