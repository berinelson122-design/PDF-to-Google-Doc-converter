import JSZip from 'jszip';

// ===== START NEW MODULE: EPUB 3 / EPUB 2 E-BOOK EXPORT ENGINE =====

export interface EpubExportOptions {
  title?: string;
  author?: string;
  language?: string;
  publisher?: string;
  description?: string;
  identifier?: string;
  tocTitle?: string;
}

/**
 * Escapes characters for strict XML/XHTML compliance.
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitizes an EPUB filename.
 */
export function sanitizeEpubFilename(rawName: string): string {
  const clean = rawName
    .replace(/\.pdf$/i, '')
    .replace(/\.docx?$/i, '')
    .replace(/\.epub$/i, '')
    .replace(/\.html?$/i, '')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .trim();
  return (clean || 'Converted_Document') + '.epub';
}

/**
 * Generates a clean UUID v4 for the EPUB package identifier.
 */
function generateUuid(): string {
  return 'urn:uuid:' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Transforms raw HTML into clean, well-formed XHTML for EPUB e-readers.
 */
function convertHtmlToXhtml(rawHtml: string): string {
  if (typeof document === 'undefined') {
    // Server-side / fallback regex cleanup
    return rawHtml
      .replace(/<br\s*\/?>/gi, '<br />')
      .replace(/<hr\s*\/?>/gi, '<hr />')
      .replace(/<img([^>]*?)\/?>/gi, '<img$1 />')
      .replace(/&nbsp;/g, '&#160;');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');

  // Ensure all void tags are self-closing in XML serializer
  const xmlSerializer = new XMLSerializer();
  let xhtml = xmlSerializer.serializeToString(doc.body);

  // Strip wrapping <body>...</body> to get pure inner XML
  xhtml = xhtml.replace(/^<body[^>]*>/i, '').replace(/<\/body>$/i, '');

  // Replace non-breaking space entities with standard numeric entity
  xhtml = xhtml.replace(/&nbsp;/g, '&#160;');

  return xhtml;
}

/**
 * Splits document HTML into logical chapters or pages for standard e-reader pagination.
 */
function splitIntoChapters(html: string): Array<{ title: string; content: string }> {
  // Check for explicit page-break delimiters
  const pageBreakRegex = /<div class="page-break"[^>]*><\/div>/gi;
  const rawParts = html.split(pageBreakRegex);

  if (rawParts.length > 1) {
    return rawParts
      .map((part, idx) => {
        const trimmed = part.trim();
        if (!trimmed) return null;

        // Try to find a header within this page for a descriptive chapter title
        const headerMatch = trimmed.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
        const title = headerMatch 
          ? headerMatch[1].replace(/<[^>]+>/g, '').trim() || `Page ${idx + 1}`
          : `Page ${idx + 1}`;

        return {
          title,
          content: convertHtmlToXhtml(trimmed)
        };
      })
      .filter((c): c is { title: string; content: string } => c !== null);
  }

  // Check if document has multiple H1 or H2 sections to split logically
  const hasH1 = /<h1[^>]*>/i.test(html);
  if (hasH1) {
    const sections = html.split(/(?=<h1[^>]*>)/i).filter((s) => s.trim().length > 0);
    if (sections.length > 1) {
      return sections.map((sec, idx) => {
        const headerMatch = sec.match(/<h1[^>]*>(.*?)<\/h1>/i);
        const title = headerMatch 
          ? headerMatch[1].replace(/<[^>]+>/g, '').trim() || `Section ${idx + 1}`
          : `Section ${idx + 1}`;
        return {
          title,
          content: convertHtmlToXhtml(sec)
        };
      });
    }
  }

  // Single monolithic chapter
  return [
    {
      title: 'Document Content',
      content: convertHtmlToXhtml(html)
    }
  ];
}

/**
 * Creates the standard EPUB 3 / EPUB 2 CSS stylesheet with typography optimized for e-readers.
 */
function createEpubCss(): string {
  return `/* EPUB Standard E-Reader Stylesheet */
@namespace "http://www.w3.org/1999/xhtml";

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 1em;
  line-height: 1.6;
  color: #111111;
  background-color: #ffffff;
  margin: 1.5em 1.2em;
  padding: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-weight: 700;
  line-height: 1.25;
  color: #000000;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  page-break-after: avoid;
  break-after: avoid;
}

h1 { font-size: 1.8em; border-bottom: 1.5px solid #eaeaea; padding-bottom: 0.3em; }
h2 { font-size: 1.4em; }
h3 { font-size: 1.2em; }
h4 { font-size: 1.05em; }

p {
  margin: 0 0 1em 0;
  text-align: justify;
  text-justify: inter-word;
  hyphens: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.2em 0;
  font-size: 0.9em;
  page-break-inside: avoid;
  break-inside: avoid;
}

table, th, td {
  border: 1px solid #cccccc;
}

th {
  background-color: #f4f4f5;
  color: #000000;
  font-weight: bold;
  padding: 8px 10px;
  text-align: left;
}

td {
  padding: 8px 10px;
  vertical-align: top;
}

tr:nth-child(even) td {
  background-color: #fafafa;
}

blockquote {
  margin: 1em 0;
  padding: 0.6em 1.2em;
  border-left: 3px solid #FF003C;
  background-color: #fdfdfd;
  color: #444444;
  font-style: italic;
}

code, pre {
  font-family: "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.88em;
  background-color: #f3f3f3;
  border-radius: 3px;
}

code {
  padding: 2px 4px;
}

pre {
  padding: 10px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  border: 1px solid #e0e0e0;
}

ul, ol {
  margin: 0 0 1em 1.5em;
  padding: 0;
}

li {
  margin-bottom: 0.4em;
}

hr {
  border: 0;
  border-top: 1px solid #e0e0e0;
  margin: 2em 0;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

.page-break {
  page-break-before: always;
  break-before: page;
}

/* Dark theme support for e-readers supporting dark mode */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #121212;
    color: #e0e0e0;
  }
  h1, h2, h3, h4, h5, h6 {
    color: #ffffff;
    border-color: #2c2c2c;
  }
  th {
    background-color: #1f1f1f;
    color: #ffffff;
    border-color: #333333;
  }
  td {
    border-color: #333333;
  }
  tr:nth-child(even) td {
    background-color: #181818;
  }
  blockquote {
    background-color: #181818;
    color: #cccccc;
    border-left-color: #FF003C;
  }
  code, pre {
    background-color: #1a1a1a;
    border-color: #333333;
    color: #f0f0f0;
  }
}
`;
}

/**
 * Builds the complete binary EPUB 3 / EPUB 2 archive blob.
 */
export async function generateEpubBlob(
  htmlContent: string,
  options: EpubExportOptions = {}
): Promise<Blob> {
  const zip = new JSZip();
  const bookId = options.identifier || generateUuid();
  const title = options.title || 'Converted Document';
  const author = options.author || 'AI Studio PDF Engine';
  const language = options.language || 'en';
  const dateIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const nowYear = new Date().getFullYear();

  // 1. mimetype (MUST be first file, uncompressed STORE)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // 3. OEBPS/style.css
  const cssContent = createEpubCss();
  zip.file('OEBPS/style.css', cssContent);

  // 4. Split and write chapters
  const chapters = splitIntoChapters(htmlContent || '<p>Empty Document</p>');

  chapters.forEach((chap, idx) => {
    const chapNum = idx + 1;
    const chapterFilename = `OEBPS/chapter_${chapNum}.xhtml`;
    const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeXml(language)}" xml:lang="${escapeXml(language)}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(chap.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  <section epub:type="bodymatter chapter" id="chapter-${chapNum}">
    ${chap.content}
  </section>
</body>
</html>`;
    zip.file(chapterFilename, chapterXhtml);
  });

  // 5. OEBPS/nav.xhtml (EPUB 3 navigation document)
  const navItems = chapters
    .map((chap, idx) => `      <li><a href="chapter_${idx + 1}.xhtml">${escapeXml(chap.title)}</a></li>`)
    .join('\n');

  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeXml(language)}" xml:lang="${escapeXml(language)}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(options.tocTitle || 'Table of Contents')}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>${escapeXml(options.tocTitle || 'Table of Contents')}</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navXhtml);

  // 6. OEBPS/toc.ncx (EPUB 2 compatibility for Kindle and legacy e-readers)
  const ncxNavPoints = chapters
    .map(
      (chap, idx) => `    <navPoint id="navpoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel>
        <text>${escapeXml(chap.title)}</text>
      </navLabel>
      <content src="chapter_${idx + 1}.xhtml" />
    </navPoint>`
    )
    .join('\n');

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(bookId)}" />
    <meta name="dtb:depth" content="1" />
    <meta name="dtb:totalPageCount" content="0" />
    <meta name="dtb:maxPageNumber" content="0" />
  </head>
  <docTitle>
    <text>${escapeXml(title)}</text>
  </docTitle>
  <docAuthor>
    <text>${escapeXml(author)}</text>
  </docAuthor>
  <navMap>
${ncxNavPoints}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', tocNcx);

  // 7. OEBPS/content.opf (The Package Document)
  const manifestChapterItems = chapters
    .map((_, idx) => `    <item id="chapter_${idx + 1}" href="chapter_${idx + 1}.xhtml" media-type="application/xhtml+xml" />`)
    .join('\n');

  const spineChapterRefs = chapters
    .map((_, idx) => `    <itemref idref="chapter_${idx + 1}" />`)
    .join('\n');

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">${escapeXml(bookId)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>${escapeXml(language)}</dc:language>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:date>${escapeXml(dateIso)}</dc:date>
    <meta property="dcterms:modified">${escapeXml(dateIso)}</meta>
    <dc:rights>Copyright © ${nowYear}</dc:rights>
  </metadata>
  <manifest>
    <item id="css" href="style.css" media-type="text/css" />
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />
${manifestChapterItems}
  </manifest>
  <spine toc="ncx">
${spineChapterRefs}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', contentOpf);

  // Generate binary zip as EPUB mime blob
  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

/**
 * Generates and triggers instant browser download of the EPUB file.
 */
export async function downloadSingleEpub(
  htmlContent: string,
  rawTitle: string,
  options: EpubExportOptions = {}
): Promise<void> {
  const finalTitle = rawTitle || options.title || 'Document';
  const blob = await generateEpubBlob(htmlContent, {
    ...options,
    title: finalTitle,
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeEpubFilename(finalTitle);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== END NEW MODULE: EPUB 3 / EPUB 2 E-BOOK EXPORT ENGINE =====
