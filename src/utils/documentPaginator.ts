// ===== START NEW CODE: DOCUMENT PAGINATOR UTILITY =====
/**
 * DOCUMENT PAGINATOR UTILITY
 * Splits continuous HTML documents into discrete, numbered Google Docs / US Letter pages.
 * Supports explicit page breaks, semantic DOM element distribution, and round-trip reassembly.
 * ARCHITECT // VOID_WEAVER
 */

export const PAGE_BREAK_MARKER_HTML = 
  '<div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>';

export interface PaginationOptions {
  targetPageCount?: number;
  wordsPerPage?: number;
}

export interface DocumentMetrics {
  pages: number;
  wordCount: number;
  characterCount: number;
  characterNoSpaces: number;
  headingsCount: number;
  tablesCount: number;
}

/**
 * Calculates real-time document metrics from HTML
 */
export function calculateDocumentMetrics(html: string): DocumentMetrics {
  if (!html || typeof html !== 'string') {
    return {
      pages: 1,
      wordCount: 0,
      characterCount: 0,
      characterNoSpaces: 0,
      headingsCount: 0,
      tablesCount: 0,
    };
  }

  // Count explicit page breaks if present
  const pageBreakMatches = html.match(
    /<div[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>|<div[^>]*style=["'][^"']*page-break-(?:after|before):\s*always[^"']*["'][^>]*>|<hr[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>|<!--\s*page\s*break\s*-->/gi
  );

  const textOnly = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textOnly ? textOnly.split(/\s+/).length : 0;
  const characterCount = html.length;
  const characterNoSpaces = textOnly.replace(/\s+/g, '').length;

  const headingsMatch = html.match(/<h[1-6][^>]*>/gi);
  const headingsCount = headingsMatch ? headingsMatch.length : 0;

  const tablesMatch = html.match(/<table[^>]*>/gi);
  const tablesCount = tablesMatch ? tablesMatch.length : 0;

  let pages = pageBreakMatches ? pageBreakMatches.length + 1 : 0;
  if (pages === 0) {
    // Estimate by words: standard Google Doc page is ~350 words
    pages = Math.max(1, Math.ceil(wordCount / 350));
  }

  return {
    pages,
    wordCount,
    characterCount,
    characterNoSpaces,
    headingsCount,
    tablesCount,
  };
}

/**
 * Splits HTML content into discrete pages.
 * 1. Checks for explicit page break markers.
 * 2. If no explicit markers, distributes semantic elements across target page count.
 */
export function splitDocumentIntoPages(
  html: string,
  options: PaginationOptions = {}
): string[] {
  if (!html || !html.trim()) {
    return [''];
  }

  // 1. Check for explicit page breaks
  const pageBreakRegex = /<div[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>[\s\S]*?<\/div>|<div[^>]*style=["'][^"']*page-break-(?:after|before):\s*always[^"']*["'][^>]*>[\s\S]*?<\/div>|<hr[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>|<!--\s*page\s*break\s*-->/i;

  if (pageBreakRegex.test(html)) {
    const rawPages = html
      .split(new RegExp(pageBreakRegex.source, 'gi'))
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (rawPages.length > 0) {
      return rawPages;
    }
  }

  // 2. Semantic element pagination
  if (typeof window === 'undefined') {
    return [html];
  }

  const textOnly = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textOnly ? textOnly.split(/\s+/).length : 0;
  const wordsPerPage = options.wordsPerPage || 350;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / wordsPerPage));
  const targetPages = options.targetPageCount && options.targetPageCount > 1 
    ? options.targetPageCount 
    : estimatedPages;

  if (targetPages <= 1) {
    return [html];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    let wrapperStyle = '';
    let wrapperClasses = '';
    let blocks: Element[] = [];

    // Detect wrapper container div with inline styling
    if (
      body.children.length === 1 &&
      body.firstElementChild?.tagName === 'DIV' &&
      body.firstElementChild.children.length > 0
    ) {
      const wrapper = body.firstElementChild;
      wrapperStyle = wrapper.getAttribute('style') || '';
      wrapperClasses = wrapper.getAttribute('class') || '';
      blocks = Array.from(wrapper.children);
    } else {
      blocks = Array.from(body.children);
    }

    if (blocks.length === 0) {
      // Fallback: simple text chunking if no HTML tags
      const chunks = chunkTextBySentences(body.innerHTML || html, targetPages);
      return chunks.map((chunk) =>
        wrapperStyle
          ? `<div style="${wrapperStyle}" class="${wrapperClasses}">${chunk}</div>`
          : chunk
      );
    }

    // Expand huge blocks into smaller paragraphs if needed
    const expandedBlocks: Element[] = [];
    for (const block of blocks) {
      const text = block.textContent || '';
      if (text.length > 1500 && block.tagName === 'P') {
        const sentenceChunks = chunkTextBySentences(block.innerHTML, 2);
        for (const sc of sentenceChunks) {
          const p = doc.createElement('p');
          const style = block.getAttribute('style');
          if (style) p.setAttribute('style', style);
          p.innerHTML = sc;
          expandedBlocks.push(p);
        }
      } else {
        expandedBlocks.push(block);
      }
    }

    // Calculate weight for each element
    function getWeight(el: Element): number {
      const txt = el.textContent?.trim() || '';
      let w = txt.split(/\s+/).filter(Boolean).length;
      const tag = el.tagName.toUpperCase();
      if (tag.startsWith('H')) w += 35;
      if (tag === 'TABLE') {
        const rows = el.querySelectorAll('tr').length;
        w += Math.max(90, rows * 30);
      }
      if (tag === 'UL' || tag === 'OL') {
        w += el.querySelectorAll('li').length * 15;
      }
      if (tag === 'BLOCKQUOTE') w += 25;
      return Math.max(12, w);
    }

    const totalWeight = expandedBlocks.reduce((acc, el) => acc + getWeight(el), 0);
    const targetPageWeight = totalWeight / targetPages;

    const pageBuckets: Element[][] = Array.from({ length: targetPages }, () => []);
    let currentBucket = 0;
    let currentBucketWeight = 0;

    for (let i = 0; i < expandedBlocks.length; i++) {
      const el = expandedBlocks[i];
      const weight = getWeight(el);

      const remainingBlocks = expandedBlocks.length - i;
      const remainingBuckets = targetPages - 1 - currentBucket;

      if (
        currentBucket < targetPages - 1 &&
        pageBuckets[currentBucket].length > 0 &&
        (currentBucketWeight + weight * 0.5 > targetPageWeight || remainingBlocks <= remainingBuckets)
      ) {
        currentBucket++;
        currentBucketWeight = 0;
      }

      pageBuckets[currentBucket].push(el);
      currentBucketWeight += weight;
    }

    return pageBuckets.map((bucket) => {
      const pageHtml = bucket.map((el) => el.outerHTML).join('\n');
      return wrapperStyle
        ? `<div style="${wrapperStyle}" class="${wrapperClasses}">${pageHtml}</div>`
        : pageHtml;
    });
  } catch (err) {
    console.warn('[Paginator] Semantic split fallback triggered:', err);
    return [html];
  }
}

/**
 * Splits plain text/HTML string into sentence chunks
 */
function chunkTextBySentences(text: string, count: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  const perChunk = Math.max(1, Math.ceil(sentences.length / count));
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    const chunk = sentences.slice(i * perChunk, (i + 1) * perChunk).join('').trim();
    if (chunk) {
      result.push(chunk);
    }
  }

  return result.length > 0 ? result : [text];
}

/**
 * Reassembles individual pages back into a single document with explicit page breaks
 */
export function joinPagesIntoDocument(pages: string[]): string {
  if (!pages || pages.length === 0) return '';
  if (pages.length === 1) return pages[0];
  return pages
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join(`\n${PAGE_BREAK_MARKER_HTML}\n`);
}
// ===== END NEW CODE: DOCUMENT PAGINATOR UTILITY =====
