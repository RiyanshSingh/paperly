import React from 'react';

import { Link } from 'react-router-dom';

export const HomeDirectory: React.FC = () => {
  return (
    <section className="py-24 px-4 border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-500/5 opacity-50 blur-3xl pointer-events-none" />
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            Universal Document Conversion Suite
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Experience seamless file transformations with pixel-perfect accuracy. Instantly convert between PDFs and your everyday formats, including Word, Excel, and images, all in one secure place.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-32">
          <Link
            to="/convert-from-pdf"
            className="group flex flex-col items-center gap-8 transition-transform hover:scale-105"
          >
            <img src="/Convertfrompdf.png" alt="Convert from PDF" className="w-64 h-64 object-contain drop-shadow-2xl" />
            <h3 className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">Convert from PDF</h3>
          </Link>

          <Link
            to="/convert-to-pdf"
            className="group flex flex-col items-center gap-8 transition-transform hover:scale-105"
          >
            <img src="/Converttopdf.png" alt="Convert to PDF" className="w-64 h-64 object-contain drop-shadow-2xl" />
            <h3 className="text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">Convert to PDF</h3>
          </Link>
        </div>
      </div>
    </section>
  );
};
