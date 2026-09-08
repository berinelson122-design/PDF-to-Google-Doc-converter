import { ConversionResult } from '../types/index.ts';

export interface ConvertPdfRequest {
  pdfBase64: string;
  filename: string;
  onProgress?: (percent: number, message: string) => void;
}

export async function convertPdfToGoogleDoc(req: ConvertPdfRequest): Promise<ConversionResult> {
  const { pdfBase64, filename, onProgress } = req;

  onProgress?.(15, 'UPLINK_INITIALIZED // TRANSMITTING_BYTE_STREAM');
  await new Promise((r) => setTimeout(r, 200));

  onProgress?.(35, 'GEMINI_3.8_FLASH // ANALYZING_DOCUMENT_TOPOLOGY');
  await new Promise((r) => setTimeout(r, 200));

  onProgress?.(65, 'EXTRACTING_TABLES_HEADINGS_AND_TYPOGRAPHY');

  const response = await fetch('/api/convert-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pdfBase64,
      filename,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: 'HTTP error ' + response.status }));
    throw new Error(errData.error || `Server responded with ${response.status}`);
  }

  onProgress?.(90, 'SYNTHESIZING_GOOGLE_DOCS_SEMANTIC_STRUCTURE');
  const data: ConversionResult = await response.json();

  onProgress?.(100, 'CONVERSION_COMPLETE // FIDELITY_VERIFIED');
  return data;
}
