import { TocEntry, TocMetadata } from '../types/index.ts';
import { splitDocumentIntoPages } from './documentPaginator.ts';

// ===== START NEW CODE: DOCUMENT STRUCTURE & TABLE OF CONTENTS ANALYZER =====
/**
 * TABLE OF CONTENTS & DOCUMENT STRUCTURE ANALYZER
 * Automatically analyzes converted HTML text structure, extracts hierarchical headings,
 * maps them to physical document pages, and provides interactive navigation.
 * ARCHITECT // VOID_WEAVER
 */

export interface AnalyzeTocOptions {
  minPagesForAutoToc?: number; // default: 5
  targetPageCount?: number;
}

/**
 * Strips HTML tags and collapses whitespace to extract clean heading text
 */
function extractCleanText(node: Node): string {
  if (!node) return '';
  const rawText = node.textContent || '';
  return rawText
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Creates a URL-safe and CSS-safe slug for heading anchors
 */
function createHeadingSlug(text: string, index: number, page: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `toc-sec-${page}-${index}-${base || 'heading'}`;
}

/**
 * Analyzes HTML text structure and builds a complete Table of Contents outline
 */
export function analyzeDocumentStructure(
  html: string,
  options: AnalyzeTocOptions = {}
): TocMetadata {
  const minPages = options.minPagesForAutoToc ?? 5;

  if (!html || typeof html !== 'string' || !html.trim()) {
    return {
      headings: [],
      totalPages: 1,
      isEligibleForAutoToc: false,
      totalHeadings: 0,
      maxDepth: 1,
      estimatedReadMinutes: 1,
    };
  }

  // 1. Split document into discrete pages
  const pages = splitDocumentIntoPages(html, {
    targetPageCount: options.targetPageCount,
  });
  const totalPages = Math.max(1, pages.length);

  // 2. Parse pages and discover hierarchical headings
  const headings: TocEntry[] = [];
  const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
  let globalHeadingIndex = 0;
  let maxDepth = 1;

  if (parser) {
    pages.forEach((pageHtml, pageIdx) => {
      const pageNumber = pageIdx + 1;
      const doc = parser.parseFromString(`<div>${pageHtml}</div>`, 'text/html');

      // Primary search: native semantic heading tags (h1-h6)
      const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

      if (headingElements.length > 0) {
        headingElements.forEach((el) => {
          const text = extractCleanText(el);
          if (!text || text.length < 2) return;

          const tag = el.tagName.toLowerCase();
          const levelNum = parseInt(tag.replace('h', ''), 10) || 2;
          maxDepth = Math.max(maxDepth, levelNum);

          const anchorId = el.getAttribute('id') || createHeadingSlug(text, ++globalHeadingIndex, pageNumber);

          // Get preview snippet from next sibling or parent text
          let snippet = '';
          let nextElem = el.nextElementSibling;
          while (nextElem && !snippet) {
            if (nextElem.tagName.toLowerCase() === 'p' || nextElem.tagName.toLowerCase() === 'div') {
              snippet = extractCleanText(nextElem).slice(0, 80);
            }
            nextElem = nextElem.nextElementSibling;
          }

          // Estimate word count in this section
          const rawSectionText = el.parentElement?.textContent || '';
          const wordCount = Math.max(15, Math.ceil(rawSectionText.split(/\s+/).length / (headingElements.length || 1)));

          headings.push({
            id: anchorId,
            title: text,
            level: levelNum,
            tag,
            pageNumber,
            wordCount,
            previewSnippet: snippet,
          });
        });
      } else {
        // Fallback search: styled bold elements, strong headers, or numbered clauses
        const candidateParagraphs = doc.querySelectorAll('p, div');
        candidateParagraphs.forEach((p) => {
          const text = extractCleanText(p);
          if (!text || text.length < 3 || text.length > 120) return;

          const hasStrongFirstChild = p.querySelector('strong:first-child, b:first-child') !== null;
          const style = p.getAttribute('style') || '';
          const hasBigFont = /font-size:\s*(?:1[4-9]|2[0-9])pt/i.test(style);
          const hasBold = /font-weight:\s*(?:bold|700|800|900)/i.test(style);
          const isNumberedSection = /^\s*(?:Section|Chapter|Part|\d+\.|\d+\.\d+)\s+[A-Z0-9]/i.test(text);

          if ((hasStrongFirstChild && text.length < 80) || hasBigFont || (hasBold && text.length < 70) || isNumberedSection) {
            const level = hasBigFont ? 1 : isNumberedSection ? 2 : 3;
            maxDepth = Math.max(maxDepth, level);
            const anchorId = p.getAttribute('id') || createHeadingSlug(text, ++globalHeadingIndex, pageNumber);

            headings.push({
              id: anchorId,
              title: text,
              level,
              tag: `h${level}`,
              pageNumber,
              wordCount: 80,
              previewSnippet: text.slice(0, 70),
            });
          }
        });
      }
    });
  }

  // Calculate full document word count for reading metrics
  const cleanBodyText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const totalWords = cleanBodyText ? cleanBodyText.split(/\s+/).length : 0;
  const estimatedReadMinutes = Math.max(1, Math.ceil(totalWords / 200));

  return {
    headings,
    totalPages,
    isEligibleForAutoToc: totalPages > minPages,
    totalHeadings: headings.length,
    maxDepth,
    estimatedReadMinutes,
  };
}

/**
 * Injects deterministic id anchors into HTML heading elements to enable smooth intra-document jumping
 */
export function injectAnchorIdsIntoHtml(html: string): string {
  if (!html || typeof html !== 'string') return html;
  if (typeof DOMParser === 'undefined') return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const root = doc.body.firstElementChild || doc.body;

    const headingElements = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let idx = 0;

    headingElements.forEach((el) => {
      if (!el.getAttribute('id')) {
        const text = extractCleanText(el);
        const slug = createHeadingSlug(text, ++idx, 1);
        el.setAttribute('id', slug);
      }
      el.setAttribute('data-toc-target', 'true');
    });

    return root.innerHTML;
  } catch (err) {
    console.error('Failed to inject TOC anchor ids into HTML:', err);
    return html;
  }
}

/**
 * Generates an elegant, semantic Table of Contents HTML block
 * ready for Google Docs paste or Word document embedding
 */
export function generateSemanticTocHtml(
  headings: TocEntry[],
  documentTitle: string = 'DOCUMENT OUTLINE'
): string {
  if (headings.length === 0) return '';

  const entriesHtml = headings
    .map((h) => {
      const indentPx = Math.max(0, (h.level - 1) * 20);
      const isH1 = h.level === 1;
      const fontSize = isH1 ? '11pt' : '10pt';
      const fontWeight = isH1 ? 'bold' : 'normal';
      const color = isH1 ? '#0f172a' : '#334155';

      return `
      <li style="margin-bottom: 6px; padding-left: ${indentPx}px; display: flex; align-items: baseline; justify-content: space-between; font-size: ${fontSize}; line-height: 1.4;">
        <a href="#${h.id}" style="color: ${color}; text-decoration: none; font-weight: ${fontWeight}; flex: 1; margin-right: 12px; border-bottom: 1px dotted #cbd5e1;">
          ${h.title}
        </a>
        <span style="font-family: monospace; font-size: 9pt; color: #64748b; font-weight: bold; min-width: 32px; text-align: right;">
          p. ${h.pageNumber}
        </span>
      </li>`;
    })
    .join('\n');

  return `
<!-- ===== TABLE OF CONTENTS BLOCK ===== -->
<div class="table-of-contents-block" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #FF003C; border-radius: 4px; padding: 18px 24px; margin: 20px 0 28px 0; font-family: Arial, Helvetica, sans-serif;">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px;">
    <h3 style="margin: 0; font-size: 12pt; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.8px;">
      TABLE OF CONTENTS // ${documentTitle}
    </h3>
    <span style="font-size: 8.5pt; font-family: monospace; color: #64748b; font-weight: bold; background: #e2e8f0; padding: 2px 8px; border-radius: 3px;">
      ${headings.length} SECTIONS
    </span>
  </div>
  <ul style="list-style: none; padding: 0; margin: 0;">
    ${entriesHtml}
  </ul>
</div>
<!-- ===== END TABLE OF CONTENTS BLOCK ===== -->
`;
}

/**
 * Inserts or updates the Table of Contents block directly into the document HTML
 */
export function insertTocIntoDocumentHtml(
  html: string,
  headings: TocEntry[],
  documentTitle: string = 'DOCUMENT'
): { updatedHtml: string; inserted: boolean } {
  if (!html || headings.length === 0) {
    return { updatedHtml: html, inserted: false };
  }

  const tocHtmlBlock = generateSemanticTocHtml(headings, documentTitle);

  // 1. If an existing TOC block exists, replace it
  const existingTocRegex = /<!-- ===== TABLE OF CONTENTS BLOCK ===== -->[\s\S]*?<!-- ===== END TABLE OF CONTENTS BLOCK ===== -->|<div class="table-of-contents-block"[\s\S]*?<\/div>/i;
  if (existingTocRegex.test(html)) {
    const updated = html.replace(existingTocRegex, tocHtmlBlock.trim());
    return { updatedHtml: updated, inserted: true };
  }

  // 2. Insert after first H1 or document header
  const firstH1Match = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
  if (firstH1Match && firstH1Match.index !== undefined) {
    const insertPosition = firstH1Match.index + firstH1Match[0].length;
    const updated = html.slice(0, insertPosition) + '\n' + tocHtmlBlock + '\n' + html.slice(insertPosition);
    return { updatedHtml: updated, inserted: true };
  }

  // 3. Otherwise, insert at the beginning of the container
  const firstDivMatch = html.match(/<div[^>]*>/i);
  if (firstDivMatch && firstDivMatch.index !== undefined) {
    const insertPosition = firstDivMatch.index + firstDivMatch[0].length;
    const updated = html.slice(0, insertPosition) + '\n' + tocHtmlBlock + '\n' + html.slice(insertPosition);
    return { updatedHtml: updated, inserted: true };
  }

  return { updatedHtml: tocHtmlBlock + '\n' + html, inserted: true };
}

/**
 * Exports outline as clean Markdown structure
 */
export function exportOutlineAsMarkdown(
  headings: TocEntry[],
  title: string = 'Document Outline'
): string {
  const header = `# Table of Contents: ${title}\n\n`;
  const items = headings
    .map((h) => {
      const indent = '  '.repeat(Math.max(0, h.level - 1));
      return `${indent}- **[Page ${h.pageNumber}]** ${h.title}`;
    })
    .join('\n');
  return header + items;
}

/**
 * Exports outline as structured Plain Text
 */
export function exportOutlineAsPlainText(
  headings: TocEntry[],
  title: string = 'DOCUMENT OUTLINE'
): string {
  const line = '='.repeat(50);
  const header = `${line}\n${title.toUpperCase()} - TABLE OF CONTENTS\n${line}\n\n`;
  const items = headings
    .map((h) => {
      const indent = '   '.repeat(Math.max(0, h.level - 1));
      const dots = '.'.repeat(Math.max(2, 45 - (indent.length + h.title.length)));
      return `${indent}${h.title} ${dots} Page ${h.pageNumber}`;
    })
    .join('\n');
  return header + items;
}
// ===== END NEW CODE: DOCUMENT STRUCTURE & TABLE OF CONTENTS ANALYZER =====
