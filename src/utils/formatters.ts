export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(sizes.length - 1, Math.max(0, Math.floor(Math.log(bytes) / Math.log(k))));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
    ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function sanitizeDocTitle(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim() || 'Untitled Google Doc';
}

/**
 * Creates formatted HTML tailored specifically for Google Docs paste engine.
 * Google Docs recognizes standard inline styles:
 * font-family, font-size, font-weight, color, background-color,
 * border-collapse, border, padding, text-align, line-height.
 */
export function wrapForGoogleDocsClipboard(rawHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
  }
  h1 { font-size: 20pt; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; color: #111111; }
  h2 { font-size: 16pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; color: #222222; }
  h3 { font-size: 13pt; font-weight: bold; margin-top: 10pt; margin-bottom: 3pt; color: #333333; }
  p { margin-top: 0; margin-bottom: 8pt; }
  table { border-collapse: collapse; width: 100%; margin-top: 8pt; margin-bottom: 12pt; }
  th, td { border: 1px solid #c0c0c0; padding: 6pt 8pt; text-align: left; vertical-align: top; }
  th { background-color: #f2f3f5; font-weight: bold; }
  ul, ol { margin-top: 0; margin-bottom: 8pt; padding-left: 24pt; }
  li { margin-bottom: 3pt; }
  blockquote { border-left: 3pt solid #c0c0c0; padding-left: 10pt; margin-left: 0; color: #555555; }
  code { font-family: monospace; background-color: #f4f4f4; padding: 1pt 3pt; border-radius: 2pt; font-size: 9.5pt; }
</style>
</head>
<body>
${rawHtml}
</body>
</html>`;
}

/**
 * Copies rich formatted HTML to clipboard with fallback.
 */
export async function copyFormattedDocToClipboard(htmlContent: string, title: string): Promise<boolean> {
  const fullHtml = wrapForGoogleDocsClipboard(htmlContent, title);
  
  // Extract plain text for plaintext fallback
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const plainText = tempDiv.innerText || tempDiv.textContent || '';

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const htmlBlob = new Blob([fullHtml], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);
      return true;
    }
  } catch (err) {
    console.warn('ClipboardItem write failed, trying fallback:', err);
  }

  // Fallback: select content inside a hidden container and execCommand('copy')
  try {
    const container = document.createElement('div');
    container.setAttribute('contenteditable', 'true');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.innerHTML = fullHtml;
    document.body.appendChild(container);
    
    const range = document.createRange();
    range.selectNodeContents(container);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    const success = document.execCommand('copy');
    document.body.removeChild(container);
    return success;
  } catch (e) {
    console.error('Copy fallback failed:', e);
    return false;
  }
}

/**
 * Generates an HTML doc download that opens in Word / Google Docs with 100% fidelity.
 */
export function downloadAsGoogleDocFormat(htmlContent: string, title: string): void {
  const fullHtml = wrapForGoogleDocsClipboard(htmlContent, title);
  const blob = new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads raw standalone HTML format.
 */
export function downloadHtmlFile(htmlContent: string, title: string): void {
  const fullHtml = wrapForGoogleDocsClipboard(htmlContent, title);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== START NEW CODE: CSV EXPORT UTILITY FOR CONVERTED DOCUMENT FILENAMES & METADATA =====
export interface CsvExportableHistoryItem {
  id: string;
  title: string;
  originalFileName?: string;
  fileSize?: number;
  timestamp: number;
  pageCount: number;
  tablesCount: number;
  headingsCount: number;
  fidelityScore?: number;
  status: string;
}

/**
 * Exports a list of converted document records to a CSV file.
 * Formats columns: Filename, Document Title, File Size, Page Count, Tables Count, Headings, Fidelity, Date, Status.
 * Includes UTF-8 BOM so Microsoft Excel, Apple Numbers, and Google Sheets open it with perfect encoding.
 */
export function exportHistoryToCsv(
  items: CsvExportableHistoryItem[],
  customFilename?: string
): void {
  if (!items || items.length === 0) return;

  const escapeCsvCell = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'Index',
    'Document Filename',
    'Document Title',
    'File Size (Bytes)',
    'File Size (Formatted)',
    'Page Count',
    'Tables Detected',
    'Headings Count',
    'Fidelity Score (%)',
    'Conversion Timestamp (ISO)',
    'Formatted Date & Time',
    'Status',
  ];

  const rows = items.map((item, idx) => {
    const fileName = item.originalFileName || `${item.title}.pdf`;
    const formattedSize = item.fileSize ? formatBytes(item.fileSize) : 'N/A';
    const isoDate = new Date(item.timestamp).toISOString();
    const formattedDate = formatTimestamp(item.timestamp);
    const fidelity = item.fidelityScore !== undefined ? `${item.fidelityScore}%` : 'N/A';

    return [
      escapeCsvCell(idx + 1),
      escapeCsvCell(fileName),
      escapeCsvCell(item.title),
      escapeCsvCell(item.fileSize ?? 0),
      escapeCsvCell(formattedSize),
      escapeCsvCell(item.pageCount),
      escapeCsvCell(item.tablesCount),
      escapeCsvCell(item.headingsCount),
      escapeCsvCell(fidelity),
      escapeCsvCell(isoDate),
      escapeCsvCell(formattedDate),
      escapeCsvCell(item.status),
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures proper character encoding
  const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStamp = new Date().toISOString().slice(0, 10);
  a.download = customFilename || `converted_documents_history_${dateStamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// ===== END NEW CODE: CSV EXPORT UTILITY FOR CONVERTED DOCUMENT FILENAMES & METADATA =====
