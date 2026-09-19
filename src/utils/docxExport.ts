import JSZip from 'jszip';
import { ConversionHistoryItem } from '../types/index.ts';

// ===== START NEW MODULE: ROBUST DOCX & ZIPPED ARCHIVE ENGINE =====

/**
 * Escapes special XML characters for safe inclusion in WordprocessingML.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitizes a filename to prevent invalid characters in filesystem or zip archive.
 */
export function sanitizeDocxFilename(rawName: string): string {
  const clean = rawName
    .replace(/\.pdf$/i, '')
    .replace(/\.docx?$/i, '')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .trim();
  return (clean || 'Converted_Document') + '.docx';
}

/**
 * Parses CSS color strings (#rgb, #rrggbb, rgb()) into 6-character hex for OpenXML.
 */
function parseHexColor(colorStr: string): string | null {
  if (!colorStr) return null;
  const hexMatch = colorStr.match(/#([0-9a-fA-F]{3,6})/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    return hex.toUpperCase();
  }
  const rgbMatch = colorStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return (r + g + b).toUpperCase();
  }
  return null;
}

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color?: string;
  code: boolean;
}

/**
 * Recursively parses inline DOM nodes into WordprocessingML runs (<w:r>).
 */
function parseInlineRuns(node: Node, state: FormatState = { bold: false, italic: false, underline: false, strike: false, code: false }): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (!text) return '';

    let rPr = '';
    if (state.bold) rPr += '<w:b/><w:bCs/>';
    if (state.italic) rPr += '<w:i/><w:iCs/>';
    if (state.underline) rPr += '<w:u w:val="single"/>';
    if (state.strike) rPr += '<w:strike/>';
    if (state.color) rPr += `<w:color w:val="${state.color}"/>`;
    if (state.code) {
      rPr += '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="20"/><w:szCs w:val="20"/>';
    }

    const rPrBlock = rPr ? `<w:rPr>${rPr}</w:rPr>` : '';
    return `<w:r>${rPrBlock}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toUpperCase();

    if (tagName === 'BR') {
      return '<w:r><w:br/></w:r>';
    }

    const nextState: FormatState = { ...state };
    if (tagName === 'STRONG' || tagName === 'B') nextState.bold = true;
    if (tagName === 'EM' || tagName === 'I') nextState.italic = true;
    if (tagName === 'U') nextState.underline = true;
    if (tagName === 'S' || tagName === 'DEL' || tagName === 'STRIKE') nextState.strike = true;
    if (tagName === 'CODE' || tagName === 'KBD') nextState.code = true;
    if (tagName === 'A') {
      nextState.underline = true;
      nextState.color = '1A73E8'; // Google blue link
    }

    // Check style attribute for font-weight, color, etc.
    const styleAttr = el.getAttribute('style') || '';
    if (styleAttr) {
      if (/font-weight:\s*(bold|[7-9]00)/i.test(styleAttr)) nextState.bold = true;
      if (/font-style:\s*italic/i.test(styleAttr)) nextState.italic = true;
      if (/text-decoration:\s*underline/i.test(styleAttr)) nextState.underline = true;
      if (/text-decoration:\s*line-through/i.test(styleAttr)) nextState.strike = true;
      
      const colorMatch = styleAttr.match(/(?:^|;)\s*color:\s*([^;]+)/i);
      if (colorMatch) {
        const hex = parseHexColor(colorMatch[1].trim());
        if (hex) nextState.color = hex;
      }
    }

    let result = '';
    for (let i = 0; i < el.childNodes.length; i++) {
      result += parseInlineRuns(el.childNodes[i], nextState);
    }
    return result;
  }

  return '';
}

/**
 * Parses block HTML elements into WordprocessingML paragraphs (<w:p>) and tables (<w:tbl>).
 */
function parseBlocksToOpenXml(root: HTMLElement): string {
  let xml = '';

  function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim();
      if (text) {
        xml += `<w:p><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    // Headings
    if (tag === 'H1') {
      const runs = parseInlineRuns(el, { bold: true, italic: false, underline: false, strike: false, code: false });
      xml += `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="240" w:after="120"/><w:keepNext/></w:pPr>${runs || '<w:r><w:t/></w:r>'}</w:p>`;
      return;
    }
    if (tag === 'H2') {
      const runs = parseInlineRuns(el, { bold: true, italic: false, underline: false, strike: false, code: false });
      xml += `<w:p><w:pPr><w:pStyle w:val="Heading2"/><w:spacing w:before="200" w:after="100"/><w:keepNext/></w:pPr>${runs || '<w:r><w:t/></w:r>'}</w:p>`;
      return;
    }
    if (tag === 'H3') {
      const runs = parseInlineRuns(el, { bold: true, italic: false, underline: false, strike: false, code: false });
      xml += `<w:p><w:pPr><w:pStyle w:val="Heading3"/><w:spacing w:before="160" w:after="80"/><w:keepNext/></w:pPr>${runs || '<w:r><w:t/></w:r>'}</w:p>`;
      return;
    }
    if (tag === 'H4' || tag === 'H5' || tag === 'H6') {
      const runs = parseInlineRuns(el, { bold: true, italic: false, underline: false, strike: false, code: false });
      xml += `<w:p><w:pPr><w:pStyle w:val="Heading3"/><w:spacing w:before="120" w:after="60"/><w:keepNext/></w:pPr>${runs || '<w:r><w:t/></w:r>'}</w:p>`;
      return;
    }

    // Paragraph
    if (tag === 'P') {
      const runs = parseInlineRuns(el);
      xml += `<w:p><w:pPr><w:spacing w:before="0" w:after="140" w:line="276" w:lineRule="auto"/></w:pPr>${runs || '<w:r><w:t/></w:r>'}</w:p>`;
      return;
    }

    // Blockquote / Callout Note
    if (tag === 'BLOCKQUOTE') {
      const runs = parseInlineRuns(el);
      xml += `<w:p><w:pPr><w:pBdr><w:left w:val="single" w:sz="24" w:space="12" w:color="1A73E8"/></w:pBdr><w:ind w:left="400"/><w:shd w:val="clear" w:color="auto" w:fill="F8F9FA"/><w:spacing w:before="120" w:after="120"/></w:pPr>${runs || '<w:r><w:t/></w:r>'}</w:p>`;
      return;
    }

    // Horizontal Rule Divider
    if (tag === 'HR') {
      xml += `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="E8EAED"/></w:pBdr><w:spacing w:before="140" w:after="140"/></w:pPr></w:p>`;
      return;
    }

    // Lists (UL / OL)
    if (tag === 'UL' || tag === 'OL') {
      const isOrdered = tag === 'OL';
      const liElements = el.querySelectorAll(':scope > li');
      liElements.forEach((li, idx) => {
        const prefix = isOrdered ? `${idx + 1}. ` : '• ';
        const runs = parseInlineRuns(li);
        xml += `<w:p><w:pPr><w:pStyle w:val="ListBullet"/><w:ind w:left="480" w:hanging="240"/><w:spacing w:before="40" w:after="60"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${prefix}</w:t></w:r>${runs || '<w:r><w:t/></w:r>'}</w:p>`;
      });
      return;
    }

    // Table with High-Fidelity Formatting
    if (tag === 'TABLE') {
      xml += `<w:tbl>
        <w:tblPr>
          <w:tblW w:w="5000" w:type="pct"/>
          <w:tblLayout w:type="autofit"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
          </w:tblBorders>
          <w:tblCellMar>
            <w:top w:w="120" w:type="dxa"/>
            <w:bottom w:w="120" w:type="dxa"/>
            <w:left w:w="160" w:type="dxa"/>
            <w:right w:w="160" w:type="dxa"/>
          </w:tblCellMar>
        </w:tblPr>`;

      const rows = el.querySelectorAll('tr');
      rows.forEach((tr, rowIdx) => {
        const isHeaderRow = tr.parentElement?.tagName.toUpperCase() === 'THEAD' || rowIdx === 0 && tr.querySelector('th') !== null;
        xml += `<w:tr>`;
        if (isHeaderRow) {
          xml += `<w:trPr><w:tblHeader/></w:trPr>`;
        }

        const cells = tr.querySelectorAll(':scope > th, :scope > td');
        cells.forEach((cell) => {
          const isTh = cell.tagName.toUpperCase() === 'TH' || isHeaderRow;
          const alignAttr = cell.getAttribute('align') || '';
          const cellStyle = cell.getAttribute('style') || '';
          
          let jc = 'left';
          if (alignAttr === 'center' || /text-align:\s*center/i.test(cellStyle)) jc = 'center';
          if (alignAttr === 'right' || /text-align:\s*right/i.test(cellStyle)) jc = 'right';

          // Cell shading
          let shdXml = '';
          if (isTh) {
            shdXml = '<w:shd w:val="clear" w:color="auto" w:fill="F1F3F4"/>';
          } else if (rowIdx % 2 === 1) {
            shdXml = '<w:shd w:val="clear" w:color="auto" w:fill="FAFAFA"/>';
          }

          const runs = parseInlineRuns(cell, { bold: isTh, italic: false, underline: false, strike: false, code: false });

          xml += `<w:tc>
            <w:tcPr>
              ${shdXml}
              <w:vAlign w:val="center"/>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:spacing w:before="40" w:after="40"/>
                <w:jc w:val="${jc}"/>
              </w:pPr>
              ${runs || '<w:r><w:t/></w:r>'}
            </w:p>
          </w:tc>`;
        });

        xml += `</w:tr>`;
      });

      xml += `</w:tbl>`;
      return;
    }

    // Generic Containers (div, section, article, etc.)
    for (let i = 0; i < el.childNodes.length; i++) {
      processNode(el.childNodes[i]);
    }
  }

  for (let i = 0; i < root.childNodes.length; i++) {
    processNode(root.childNodes[i]);
  }

  return xml;
}

/**
 * Converts formatted HTML content into a standard OpenXML (.docx) Blob.
 */
export async function convertHtmlToDocxBlob(htmlContent: string, title?: string): Promise<Blob> {
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(htmlContent, 'text/html');
  const bodyXml = parseBlocksToOpenXml(parsedDoc.body);

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${bodyXml || '<w:p><w:r><w:t>Empty Document</w:t></w:r></w:p>'}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="202124"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="140" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>

  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:bCs/>
      <w:color w:val="1A73E8"/>
      <w:sz w:val="36"/>
      <w:szCs w:val="36"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="200" w:after="100"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:bCs/>
      <w:color w:val="202124"/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="160" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:bCs/>
      <w:color w:val="3C4043"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="ListBullet">
    <w:name w:val="List Bullet"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="40" w:after="60"/>
      <w:ind w:left="480" w:hanging="240"/>
    </w:pPr>
  </w:style>

  <w:style w:type="table" w:default="1" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:qFormat/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/document.xml', documentXml);
  zip.file('word/styles.xml', stylesXml);
  zip.file('word/_rels/document.xml.rels', docRelsXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * Downloads a single formatted .docx document directly in browser.
 */
export async function downloadSingleDocx(htmlContent: string, title: string): Promise<void> {
  const blob = await convertHtmlToDocxBlob(htmlContent, title);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeDocxFilename(title);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface BatchZipProgress {
  currentItem: number;
  totalItems: number;
  currentTitle: string;
  status: 'processing' | 'zipping' | 'complete';
}

/**
 * Packages multiple ConversionHistoryItem records into a single zipped archive of formatted .docx files.
 */
export async function createBatchDocxZip(
  items: ConversionHistoryItem[],
  onProgress?: (progress: BatchZipProgress) => void
): Promise<Blob> {
  const masterZip = new JSZip();
  const folder = masterZip.folder('converted_google_docs') || masterZip;

  const manifestLines: string[] = [
    '================================================================================',
    '        PDF TO GOOGLE DOCS CONVERTER // BATCH EXPORT ARCHIVE (.DOCX)',
    '================================================================================',
    `Generated At:   ${new Date().toISOString()}`,
    `Total Records:  ${items.length}`,
    '',
    'SUMMARY OF INCLUDED FORMATTED WORD (.DOCX) DOCUMENTS:',
    '--------------------------------------------------------------------------------',
  ];

  const usedNames = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.({
      currentItem: i + 1,
      totalItems: items.length,
      currentTitle: item.title,
      status: 'processing',
    });

    // Determine unique sanitized filename
    let baseName = sanitizeDocxFilename(item.originalFileName || item.title);
    let finalFileName = baseName;
    let duplicateCounter = 1;

    while (usedNames.has(finalFileName)) {
      const nameWithoutExt = baseName.replace(/\.docx$/i, '');
      finalFileName = `${nameWithoutExt}_(${duplicateCounter}).docx`;
      duplicateCounter++;
    }
    usedNames.add(finalFileName);

    // Generate individual .docx blob
    const docxBlob = await convertHtmlToDocxBlob(item.htmlContent, item.title);
    folder.file(finalFileName, docxBlob);

    // Record in manifest
    manifestLines.push(
      `#${(i + 1).toString().padStart(2, '0')}: ${finalFileName}` +
      `\n     Original File: ${item.originalFileName || 'N/A'}` +
      `\n     Title:         ${item.title}` +
      `\n     Tables:        ${item.tablesCount}` +
      `\n     Headings:      ${item.headingsCount}` +
      `\n     Fidelity:      ${item.fidelityScore ? `${item.fidelityScore}%` : 'N/A'}` +
      `\n     Timestamp:     ${new Date(item.timestamp).toLocaleString()}` +
      `\n`
    );
  }

  manifestLines.push(
    '--------------------------------------------------------------------------------',
    'HOW TO USE IN GOOGLE DOCS:',
    '1. Extract these .docx files to your computer.',
    '2. Drag & drop any .docx directly into Google Drive (drive.google.com).',
    '3. Double-click to open in native Google Docs format with complete preserved tables.',
    '================================================================================'
  );

  // Add Manifest & README to zip root
  masterZip.file('BATCH_EXPORT_MANIFEST.txt', manifestLines.join('\n'));

  onProgress?.({
    currentItem: items.length,
    totalItems: items.length,
    currentTitle: 'Compressing archive...',
    status: 'zipping',
  });

  const zipBlob = await masterZip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  onProgress?.({
    currentItem: items.length,
    totalItems: items.length,
    currentTitle: 'Complete',
    status: 'complete',
  });

  return zipBlob;
}

/**
 * Converts HTML content to clean, human-readable Markdown format.
 */
export function htmlToMarkdown(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function nodeToMd(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();
    const childrenMd = Array.from(el.childNodes).map(nodeToMd).join('');

    switch (tag) {
      case 'H1':
        return `\n\n# ${childrenMd.trim()}\n\n`;
      case 'H2':
        return `\n\n## ${childrenMd.trim()}\n\n`;
      case 'H3':
        return `\n\n### ${childrenMd.trim()}\n\n`;
      case 'H4':
        return `\n\n#### ${childrenMd.trim()}\n\n`;
      case 'H5':
      case 'H6':
        return `\n\n##### ${childrenMd.trim()}\n\n`;
      case 'P':
        return `\n\n${childrenMd.trim()}\n\n`;
      case 'STRONG':
      case 'B':
        return `**${childrenMd}**`;
      case 'EM':
      case 'I':
        return `*${childrenMd}*`;
      case 'CODE':
        return `\`${childrenMd}\``;
      case 'PRE':
        return `\n\n\`\`\`\n${childrenMd.trim()}\n\`\`\`\n\n`;
      case 'BR':
        return '\n';
      case 'HR':
        return '\n\n---\n\n';
      case 'UL':
        return `\n\n${childrenMd.trim()}\n\n`;
      case 'OL':
        return `\n\n${childrenMd.trim()}\n\n`;
      case 'LI':
        return `- ${childrenMd.trim()}\n`;
      case 'BLOCKQUOTE':
        return `\n\n> ${childrenMd.trim()}\n\n`;
      case 'A':
        const href = el.getAttribute('href') || '#';
        return `[${childrenMd}](${href})`;
      case 'TABLE': {
        const rows = Array.from(el.querySelectorAll('tr'));
        if (rows.length === 0) return '';
        let mdTable = '\n\n';
        rows.forEach((row, rIdx) => {
          const cells = Array.from(row.querySelectorAll('th, td'));
          const rowText = '| ' + cells.map(c => (c.textContent || '').trim().replace(/\|/g, '\\|')).join(' | ') + ' |';
          mdTable += rowText + '\n';
          if (rIdx === 0) {
            const separator = '| ' + cells.map(() => '---').join(' | ') + ' |';
            mdTable += separator + '\n';
          }
        });
        return mdTable + '\n\n';
      }
      default:
        return childrenMd;
    }
  }

  const rawMd = nodeToMd(doc.body);
  return rawMd
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Converts HTML content to clean, plain unformatted text.
 */
export function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Insert spacing for block elements
  const blockElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, tr, li, div, br, hr');
  blockElements.forEach((el) => {
    el.insertAdjacentText('afterend', '\n');
  });

  return (doc.body.textContent || '')
    .split('\n')
    .map(line => line.trim())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0))
    .join('\n')
    .trim();
}

/**
 * Exports and downloads Markdown (.md) formatted document.
 */
export function downloadSingleMarkdown(
  htmlOrMarkdown: string, 
  rawTitle: string, 
  fallbackMarkdown?: string
): void {
  const content = fallbackMarkdown && fallbackMarkdown.length > 50 
    ? fallbackMarkdown 
    : htmlToMarkdown(htmlOrMarkdown);

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = (rawTitle || 'document').replace(/\.[^/.]+$/, '').replace(/[/\\?%*:|"<>]/g, '_');
  a.download = `${cleanTitle}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports and downloads Plain Text (.txt) unformatted document.
 */
export function downloadSinglePlainText(htmlOrText: string, rawTitle: string): void {
  const content = htmlToPlainText(htmlOrText);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = (rawTitle || 'document').replace(/\.[^/.]+$/, '').replace(/[/\\?%*:|"<>]/g, '_');
  a.download = `${cleanTitle}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers batch zip download directly in browser.
 */
export async function downloadBatchDocxZip(
  items: ConversionHistoryItem[],
  zipFilename?: string,
  onProgress?: (progress: BatchZipProgress) => void
): Promise<void> {
  const blob = await createBatchDocxZip(items, onProgress);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const dateSlug = new Date().toISOString().slice(0, 10);
  const defaultName = `converted_docs_batch_${items.length}_files_${dateSlug}.zip`;
  a.download = zipFilename || defaultName;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// ===== END NEW MODULE: ROBUST DOCX & ZIPPED ARCHIVE ENGINE =====
