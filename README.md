# Paperly - Free PDF Tools

Paperly is a modern, privacy-focused, and completely free online PDF utility platform. It allows users to merge, split, compress, and convert PDF documents entirely within their web browser. 

## Features Implemented (MVP)

The following features have been fully implemented using client-side processing:
- **Merge PDF**: Combine multiple PDFs into a single document with drag-and-drop reordering.
- **Split PDF**: Extract specific pages from a PDF.
- **Compress PDF**: Basic optimization and size reduction of PDFs.
- **PDF to JPG**: Convert PDF pages into high-quality JPG images (download as individual files or ZIP).
- **JPG to PDF**: Convert images to a PDF document with adjustable page size, orientation, and margins.
- **Rotate PDF**: Rotate individual pages or entire documents.
- **Delete/Organize Pages**: Delete, extract, rotate, and reorder pages in a dedicated page management interface.
- **SEO & Privacy**: Fully configured SEO meta tags, `sitemap.xml`, `robots.txt`, Privacy Policy, and Terms of Service.
- **Ad Placeholders**: Responsive ad slots prepared for future monetization (e.g., Google AdSense).

## Intentionally Unimplemented Features

The following features were intentionally left out of the MVP as they require complex backend infrastructure or were designated as "Secondary Tools" for future phases:
- Deep image-based PDF compression (requires a backend like Ghostscript).
- Edit PDF text/images natively.
- Sign PDF, Add Watermark, Protect/Unlock PDF.
- Convert PDF to Word / Word to PDF.
- OCR PDF.

These features can be added in future updates by building a backend service (e.g., Python/FastAPI) and expanding the frontend routing.

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v6
- **PDF Manipulation**: `pdf-lib`
- **PDF Rendering**: `pdfjs-dist`
- **ZIP Generation**: `jszip`
- **File Saving**: `file-saver`
- **Icons**: Lucide React

## Installation Instructions

1. Ensure you have Node.js (v18 or higher) installed.
2. Clone the repository and navigate to the project directory:
   ```bash
   cd Paperly
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

## Development Commands

To start the local development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## Production Build Instructions

To create a production-ready build:
```bash
npm run build
```
This will generate optimized static assets in the `dist` directory.

## Environment Variables Required

Currently, the MVP relies entirely on client-side browser APIs and does not require any environment variables to run.

For future backend integrations, you may want to add variables such as:
- `VITE_API_URL` (for backend services)
- `VITE_ANALYTICS_ID` (for Google Analytics)

## Deployment Instructions

Since Paperly is a fully static client-side application (SPA), it can be hosted on any static hosting provider.

### Vercel / Netlify / Cloudflare Pages
1. Connect your GitHub repository to the hosting platform.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. The platform will automatically deploy your application.

### Nginx / Apache
1. Run `npm run build`.
2. Copy the contents of the `dist` directory to your web server's public html folder.
3. Ensure you configure your server to rewrite all requests to `index.html` to support React Router's client-side routing.
