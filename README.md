# AI PDF-to-Google-Doc Converter

A professional-grade productivity tool that extracts table data, heading hierarchies, and typography from PDFs to generate formatted Google Docs-compatible HTML.

### [Live Demo](https://pdf-to-google-doc-converter.vercel.app/)

![Converter UI](link-to-your-screenshot)

### How It Works
* **Layout Analysis:** Uses Gemini 1.5 Flash to perform multimodal document reasoning, converting visual layout into semantic HTML.
* **Table Reconstruction:** Unlike standard PDF tools that flatten tables into text, this engine builds standard `<table>` elements with inline CSS for border and cell alignment preservation.
* **Clipboard Dispatcher:** Implements a clipboard protocol to write `text/html` directly to the system clipboard, allowing 1-click pasting into `docs.google.com` with styles intact.

### Features
* **Fidelity Scoring:** Displays a confidence metric on how well the document structure was retained.
* **Technical Metadata Extraction:** Uses `pdf-lib` to inspect document creation dates, security settings, and tools used for original PDF generation.

### Setup
```bash
git clone https://github.com/berinelson122-design/pdf-to-google-doc-converter
npm install
# Ensure you have a GEMINI_API_KEY in your .env.local
npm run dev
