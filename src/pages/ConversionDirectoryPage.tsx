import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, ArrowRight, ArrowLeft, FileSpreadsheet, Presentation, 
  Image as ImageIcon, FileCode, Book
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';

const COLOR_MAP: Record<string, { border: string; bgIcon: string; borderIcon: string; textIcon: string; textArrow: string }> = {
  blue: { border: 'hover:border-blue-500/50', bgIcon: 'bg-blue-500/10', borderIcon: 'border-blue-500/30', textIcon: 'text-blue-400', textArrow: 'group-hover:text-blue-400' },
  emerald: { border: 'hover:border-emerald-500/50', bgIcon: 'bg-emerald-500/10', borderIcon: 'border-emerald-500/30', textIcon: 'text-emerald-400', textArrow: 'group-hover:text-emerald-400' },
  orange: { border: 'hover:border-orange-500/50', bgIcon: 'bg-orange-500/10', borderIcon: 'border-orange-500/30', textIcon: 'text-orange-400', textArrow: 'group-hover:text-orange-400' },
  purple: { border: 'hover:border-purple-500/50', bgIcon: 'bg-purple-500/10', borderIcon: 'border-purple-500/30', textIcon: 'text-purple-400', textArrow: 'group-hover:text-purple-400' },
  rose: { border: 'hover:border-rose-500/50', bgIcon: 'bg-rose-500/10', borderIcon: 'border-rose-500/30', textIcon: 'text-rose-400', textArrow: 'group-hover:text-rose-400' },
  amber: { border: 'hover:border-amber-500/50', bgIcon: 'bg-amber-500/10', borderIcon: 'border-amber-500/30', textIcon: 'text-amber-400', textArrow: 'group-hover:text-amber-400' },
  zinc: { border: 'hover:border-zinc-500/50', bgIcon: 'bg-zinc-500/10', borderIcon: 'border-zinc-500/30', textIcon: 'text-zinc-400', textArrow: 'group-hover:text-zinc-300' },
};

const DIRECTORY_DATA = {
  from_pdf: [
    { title: 'PDF to Word', path: '/convert/docx', icon: FileText, color: 'blue' },
    { title: 'PDF to Excel', path: '/convert/xlsx', icon: FileSpreadsheet, color: 'emerald' },
    { title: 'PDF to PowerPoint', path: '/convert/pptx', icon: Presentation, color: 'orange' },
    { title: 'PDF to JPG', path: '/convert/jpg', icon: ImageIcon, color: 'purple' },
    { title: 'PDF to PNG', path: '/convert/png', icon: ImageIcon, color: 'rose' },
    { title: 'PDF to WEBP', path: '/convert/webp', icon: ImageIcon, color: 'amber' },
    { title: 'PDF to TXT', path: '/convert/txt', icon: FileText, color: 'zinc' },
    { title: 'PDF to HTML', path: '/convert/html', icon: FileCode, color: 'blue' },
    { title: 'PDF to EPUB', path: '/convert/epub', icon: Book, color: 'emerald' },
  ],
  to_pdf: [
    { title: 'Word to PDF', path: '/convert-to-pdf/docx', icon: FileText, color: 'blue' },
    { title: 'DOCX to PDF', path: '/convert-to-pdf/docx', icon: FileText, color: 'blue' },
    { title: 'Excel to PDF', path: '/convert-to-pdf/xlsx', icon: FileSpreadsheet, color: 'emerald' },
    { title: 'XLSX to PDF', path: '/convert-to-pdf/xlsx', icon: FileSpreadsheet, color: 'emerald' },
    { title: 'PowerPoint to PDF', path: '/convert-to-pdf/pptx', icon: Presentation, color: 'orange' },
    { title: 'PPTX to PDF', path: '/convert-to-pdf/pptx', icon: Presentation, color: 'orange' },
    { title: 'JPG to PDF', path: '/convert-to-pdf/jpg', icon: ImageIcon, color: 'purple' },
    { title: 'JPEG to PDF', path: '/convert-to-pdf/jpeg', icon: ImageIcon, color: 'purple' },
    { title: 'PNG to PDF', path: '/convert-to-pdf/png', icon: ImageIcon, color: 'rose' },
    { title: 'Image to PDF', path: '/convert-to-pdf/image', icon: ImageIcon, color: 'zinc' },
    { title: 'Picture to PDF', path: '/convert-to-pdf/picture', icon: ImageIcon, color: 'amber' },
    { title: 'HEIC to PDF', path: '/convert-to-pdf/heic', icon: ImageIcon, color: 'rose' },
    { title: 'WEBP to PDF', path: '/convert-to-pdf/webp', icon: ImageIcon, color: 'amber' },
    { title: 'HTML to PDF', path: '/convert-to-pdf/html', icon: FileCode, color: 'blue' },
    { title: 'TXT to PDF', path: '/convert-to-pdf/txt', icon: FileText, color: 'zinc' },
    { title: 'EPUB to PDF', path: '/convert-to-pdf/epub', icon: Book, color: 'emerald' },
  ]
};

export const ConversionDirectoryPage: React.FC = () => {
  const location = useLocation();
  const isFromPDF = location.pathname.includes('convert-from-pdf');
  const activeTab = isFromPDF ? 'from_pdf' : 'to_pdf';
  const title = isFromPDF ? 'Convert from PDF' : 'Convert to PDF';
  const description = isFromPDF 
    ? 'Extract and convert your PDF files into other formats like Word, Excel, and Images.' 
    : 'Turn your documents, images, and other files into high-quality PDFs.';

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-black">
      <SEO title={`${title} - Paperly`} description={description} />
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">{title}</h1>
          <p className="text-xl text-zinc-400 max-w-2xl">{description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {DIRECTORY_DATA[activeTab].map((item, i) => {
            const colors = COLOR_MAP[item.color] || COLOR_MAP.zinc;
            const Icon = item.icon;

            return (
              <Link
                key={i}
                to={item.path}
                className={cn(
                  "group flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl transition-all duration-200 cursor-pointer hover:bg-zinc-800/80",
                  colors.border
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                    colors.bgIcon,
                    colors.borderIcon
                  )}>
                    <Icon className={cn("w-5 h-5 transition-colors", colors.textIcon)} />
                  </div>
                  <span className="text-zinc-200 font-medium group-hover:text-white transition-colors">
                    {item.title}
                  </span>
                </div>
                <ArrowRight className={cn("w-4 h-4 text-zinc-600 transition-colors", colors.textArrow)} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
