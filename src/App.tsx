import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';

// Feature Components
import { MergePDF } from './features/merge/MergePDF';
import { SplitPDF } from './features/split/SplitPDF';
import { RotatePDF } from './features/rotate/RotatePDF';
import { DeletePages } from './features/page-management/DeletePages';
import { PDFToJPG } from './features/pdf-to-jpg/PDFToJPG';
import { JPGToPDF } from './features/jpg-to-pdf/JPGToPDF';
import { CompressPDF } from './features/compress/CompressPDF';
import { UnlockPDF } from './features/unlock/UnlockPDF';
import { PDFEditor } from './features/editor/PDFEditor';
import { UniversalConverter } from './features/UniversalConverter';
import { UniversalConverterToPDF } from './features/UniversalConverterToPDF';
import { ConversionDirectoryPage } from './pages/ConversionDirectoryPage';

import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';

// Placeholder components for static pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="container mx-auto px-4 py-20 text-center">
    <h1 className="text-4xl font-bold mb-4">{title}</h1>
    <p className="text-slate-600">Information coming soon.</p>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="merge-pdf" element={<MergePDF />} />
            <Route path="split-pdf" element={<SplitPDF />} />
            <Route path="compress-pdf" element={<CompressPDF />} />
            <Route path="pdf-to-jpg" element={<PDFToJPG />} />
            <Route path="jpg-to-pdf" element={<JPGToPDF />} />
            <Route path="rotate-pdf" element={<RotatePDF />} />
            <Route path="delete-pdf-pages" element={<DeletePages />} />
            <Route path="unlock-pdf" element={<UnlockPDF />} />
            <Route path="edit-pdf" element={<PDFEditor />} />
            <Route path="convert/:format" element={<UniversalConverter />} />
            <Route path="convert-to-pdf/:format" element={<UniversalConverterToPDF />} />
            
            <Route path="convert-from-pdf" element={<ConversionDirectoryPage />} />
            <Route path="convert-to-pdf" element={<ConversionDirectoryPage />} />
            
            <Route path="tools" element={<Home />} />
            
            <Route path="about" element={<Placeholder title="About Us" />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="*" element={<Placeholder title="404 - Not Found" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
