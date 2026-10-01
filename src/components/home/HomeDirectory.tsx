import React, { useState } from 'react';
import { FileText, Image as ImageIcon, FileArchive, ArrowRight, FileType, FileOutput } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

type TabType = 'from_pdf' | 'to_pdf';

const TABS = [
  { id: 'from_pdf', label: 'Convert from PDF', icon: FileOutput },
  { id: 'to_pdf', label: 'Convert to PDF', icon: FileType },
];

const DIRECTORY_DATA = {
  from_pdf: [
    { title: 'PDF to Word', path: '' },
    { title: 'PDF to Excel', path: '' },
    { title: 'PDF to PowerPoint', path: '' },
    { title: 'PDF to TXT', path: '' },
    { title: 'PDF to JPG', path: '' },
    { title: 'PDF to JPEG', path: '' },
    { title: 'PDF to PNG', path: '' },
    { title: 'PDF to Picture', path: '' },
    { title: 'PDF to Image', path: '' },
    { title: 'PDF to DOCX', path: '' },
    { title: 'PDF to Pages', path: '' },
    { title: 'PDF to EPUB', path: '' },
    { title: 'PDF to MOBI', path: '' },
    { title: 'PDF to WEBP', path: '' },
    { title: 'PDF to AVIF', path: '' },
    { title: 'PDF to SVG', path: '' },
    { title: 'PDF to AZW3', path: '' },
    { title: 'PDF to TIFF', path: '' },
    { title: 'PDF to DXF', path: '' },
    { title: 'PDF to HTML', path: '' },
    { title: 'PDF to EPS', path: '' },
    { title: 'PDF to PPTX', path: '' },
    { title: 'PDF to XLS', path: '' },
    { title: 'PDF to PS', path: '' },
  ],
  to_pdf: [
    { title: 'JPG to PDF', path: '/jpg-to-pdf' },
    { title: 'Word to PDF', path: '/coming-soon' },
    { title: 'Excel to PDF', path: '/coming-soon' },
    { title: 'PPT to PDF', path: '/coming-soon' },
    { title: 'PNG to PDF', path: '/coming-soon' },
    { title: 'TXT to PDF', path: '/coming-soon' },
  ]
};

export const HomeDirectory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('from_pdf');

  return (
    <section className="py-24 px-4 border-t border-zinc-900/50 bg-zinc-950/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Explore All PDF Tools
          </h2>
          <p className="text-lg text-zinc-400">
            Everything you need to work with PDFs, in one place.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800/50 max-w-fit mx-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {DIRECTORY_DATA[activeTab].map((item, i) => {
            const isLink = item.path !== '';
            const CardWrapper = isLink ? Link : 'div';
            const props = isLink ? { to: item.path } : {};

            return (
              <CardWrapper
                key={i}
                {...props as any}
                className={cn(
                  "group flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl transition-all duration-200",
                  isLink && "hover:border-blue-500/50 hover:bg-zinc-800/80 cursor-pointer"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700/50 transition-colors",
                    isLink && "group-hover:bg-blue-500/10 group-hover:border-blue-500/30"
                  )}>
                    <FileText className={cn(
                      "w-5 h-5 text-zinc-400 transition-colors",
                      isLink && "group-hover:text-blue-400"
                    )} />
                  </div>
                  <span className={cn(
                    "text-zinc-200 font-medium transition-colors",
                    isLink && "group-hover:text-white"
                  )}>
                    {item.title}
                  </span>
                </div>
                {isLink && (
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                )}
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};
