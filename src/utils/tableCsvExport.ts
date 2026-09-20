// ===== START NEW CODE: TABLE-ONLY CSV & GOOGLE SHEETS EXPORT UTILITY =====

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
}

/**
 * Extracts all structured HTML <table> elements from the document payload,
 * stripping out surrounding narrative text.
 */
export function extractTablesFromHtml(html: string): ExtractedTable[] {
  if (typeof window === 'undefined' || !html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tableElements = doc.querySelectorAll('table');

  const parsedTables: ExtractedTable[] = [];

  tableElements.forEach((table) => {
    const headers: string[] = [];
    const rows: string[][] = [];

    // Extract headers from <th>
    const thCells = table.querySelectorAll('th');
    if (thCells.length > 0) {
      thCells.forEach((th) => {
        headers.push((th.textContent || '').trim().replace(/\s+/g, ' '));
      });
    }

    // Process table rows <tr>
    const trElements = table.querySelectorAll('tr');
    trElements.forEach((tr) => {
      const tdCells = tr.querySelectorAll('td');
      if (tdCells.length > 0) {
        const rowValues: string[] = [];
        tdCells.forEach((td) => {
          rowValues.push((td.textContent || '').trim().replace(/\s+/g, ' '));
        });
        rows.push(rowValues);
      } else if (headers.length === 0) {
        // Fallback for header rows using <th>
        const thRowCells = tr.querySelectorAll('th');
        if (thRowCells.length > 0) {
          thRowCells.forEach((th) => {
            headers.push((th.textContent || '').trim().replace(/\s+/g, ' '));
          });
        }
      }
    });

    const maxCols = Math.max(
      headers.length,
      ...rows.map((r) => r.length)
    );

    if (rows.length > 0 || headers.length > 0) {
      parsedTables.push({
        headers,
        rows,
        rowCount: rows.length,
        columnCount: maxCols,
      });
    }
  });

  return parsedTables;
}

/**
 * Converts extracted structured tables into clean CSV payload and initiates download.
 * Compatible with Microsoft Excel, Google Sheets, and database imports.
 */
export function exportTablesToCsv(html: string, docTitle: string = 'Converted_Document'): { success: boolean; tableCount: number; rowCount: number } {
  const tables = extractTablesFromHtml(html);
  if (tables.length === 0) {
    return { success: false, tableCount: 0, rowCount: 0 };
  }

  const csvLines: string[] = [];
  let totalRows = 0;

  tables.forEach((table, idx) => {
    if (tables.length > 1) {
      csvLines.push(`"--- TABLE ${idx + 1} (${table.rowCount} Rows x ${table.columnCount} Cols) ---"`);
    }

    if (table.headers.length > 0) {
      const formattedHeader = table.headers
        .map((cell) => `"${cell.replace(/"/g, '""')}"`)
        .join(',');
      csvLines.push(formattedHeader);
    }

    table.rows.forEach((row) => {
      totalRows++;
      const formattedRow = row
        .map((cell) => `"${cell.replace(/"/g, '""')}"`)
        .join(',');
      csvLines.push(formattedRow);
    });

    csvLines.push(''); // Blank line separator between tables
  });

  const csvPayload = csvLines.join('\n');
  const blob = new Blob(['\uFEFF' + csvPayload], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Excel/Sheets compatibility
  const url = URL.createObjectURL(blob);
  const cleanTitle = (docTitle || 'Document_Tables').replace(/[^a-zA-Z0-9_-]/g, '_');

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanTitle}_Tables_Only.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, tableCount: tables.length, rowCount: totalRows };
}
// ===== END NEW CODE: TABLE-ONLY CSV & GOOGLE SHEETS EXPORT UTILITY =====
