import { copyFormattedDocToClipboard, downloadAsGoogleDocFormat, downloadHtmlFile } from '../utils/formatters.ts';

export interface GoogleDocUploadResult {
  success: boolean;
  documentId?: string;
  documentUrl?: string;
  error?: string;
}

export class GoogleDocsService {
  /**
   * One-click copy directly tailored for Google Docs clipboard engine.
   */
  public static async copyForDocs(htmlContent: string, title: string): Promise<boolean> {
    return await copyFormattedDocToClipboard(htmlContent, title);
  }

  /**
   * Export as native .doc file that opens with 100% layout and table fidelity in Google Docs.
   */
  public static exportAsDoc(htmlContent: string, title: string): void {
    downloadAsGoogleDocFormat(htmlContent, title);
  }

  /**
   * Export raw standalone HTML document.
   */
  public static exportAsHtml(htmlContent: string, title: string): void {
    downloadHtmlFile(htmlContent, title);
  }

  /**
   * Directly creates a Google Doc in user's Google Drive if an OAuth Access Token is provided.
   */
  public static async uploadToGoogleDrive(
    token: string,
    htmlContent: string,
    title: string
  ): Promise<GoogleDocUploadResult> {
    try {
      // 1. Create file in Google Drive converting HTML to Google Doc native format
      const metadata = {
        name: title,
        mimeType: 'application/vnd.google-apps.document',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
        htmlContent +
        closeDelim;

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Google Drive API error: ${response.status}`);
      }

      const fileData = await response.json();
      return {
        success: true,
        documentId: fileData.id,
        documentUrl: `https://docs.google.com/document/d/${fileData.id}/edit`,
      };
    } catch (err: any) {
      console.error('Failed to create Google Doc via API:', err);
      return {
        success: false,
        error: err.message || 'Upload to Google Drive failed',
      };
    }
  }

  /**
   * Launches https://docs.new in a new window for immediate paste.
   */
  public static launchDocsNew(): void {
    window.open('https://docs.new', '_blank', 'noopener,noreferrer');
  }
}
