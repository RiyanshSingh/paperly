import React from 'react';
import { Scissors, FileArchive, FileImage, CheckCircle2, Zap, Shield, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FeatureMerge: React.FC = () => {
  return (
    <section className="py-24 px-4 overflow-hidden relative border-t border-zinc-900/50">
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">

            <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
              Combine multiple PDFs into a single document.
            </h2>
            <p className="text-xl text-zinc-400">
              Drag and drop your files, rearrange them in the exact order you want, and merge them with a single click. Everything happens instantly in your browser.
            </p>
            <ul className="space-y-4">
              {['Maintain original quality and formatting', 'Reorder pages effortlessly', 'No file size limits or hidden caps'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" /> {item}
                </li>
              ))}
            </ul>
            <Link to="/merge-pdf" className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-full font-medium transition-all hover:scale-105 mt-6">
              Try Merge PDF <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
             <img src="/mergepdf.png" alt="Merge PDF Interface" className="w-full max-w-md h-auto object-contain drop-shadow-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export const FeatureSplit: React.FC = () => {
  return (
    <section className="py-24 px-4 border-t border-zinc-900/50 bg-zinc-950">
      <div className="container mx-auto max-w-7xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-sm font-medium mb-8">
          <Scissors className="w-4 h-4" /> Precision Splitting
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight max-w-3xl mx-auto mb-6">
          Extract what matters. Leave the rest behind.
        </h2>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
          Isolate specific pages, split your document in half, or extract a range of pages to create a brand new PDF instantly.
        </p>
        <Link to="/split-pdf" className="inline-flex items-center gap-2 text-white font-medium hover:text-orange-400 transition-colors mb-16">
          Try Split PDF <ArrowRight className="w-4 h-4" />
        </Link>
        
        <div className="relative max-w-4xl mx-auto">

          <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-8 justify-center">
             <div className="w-32 h-40 bg-zinc-800 rounded-lg border border-zinc-700 relative flex items-center justify-center">
               <span className="text-zinc-500 font-bold text-2xl">1-5</span>
               <div className="absolute -right-4 -bottom-4 w-8 h-8 bg-zinc-900 rounded-full border border-zinc-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
               </div>
             </div>
             <Scissors className="w-8 h-8 text-orange-400 mx-4" />
             <div className="w-32 h-40 bg-zinc-800/50 rounded-lg border border-zinc-800 border-dashed relative flex items-center justify-center opacity-50">
               <span className="text-zinc-600 font-bold text-2xl">6-10</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const FeatureCompress: React.FC = () => {
  return (
    <section className="py-24 px-4 border-t border-zinc-900/50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-8">
            <FileArchive className="w-4 h-4" /> Smart Compression
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            Shrink file size. Keep the quality.
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            Our advanced compression algorithms reduce your PDF size drastically so it's easy to share via email or web without losing visual fidelity.
          </p>
          <Link to="/compress-pdf" className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-full font-medium transition-all hover:scale-105 mt-8">
            Try Compress PDF <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 hover:bg-zinc-900 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
            <p className="text-zinc-400">Process heavy documents in milliseconds entirely within your local browser memory.</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 hover:bg-zinc-900 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
              <Layers className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Lossless Text</h3>
            <p className="text-zinc-400">Vector text and fonts remain perfectly sharp while only heavy images are optimized.</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 hover:bg-zinc-900 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">100% Private</h3>
            <p className="text-zinc-400">Your sensitive documents never leave your device. Compression runs securely offline.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const FeatureEdit: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-black to-zinc-950">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Draw, highlight, and annotate naturally.
            </h2>
            <p className="text-xl text-zinc-400">
              Transform any PDF into an interactive canvas. Use our fluid drawing tools to sign documents, highlight key passages, or redact sensitive information.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-white" /> Multi-color highlighter & pen tools
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-white" /> Insert text and shapes anywhere
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-white" /> Securely redact private text
              </li>
            </ul>
            <Link to="/edit-pdf" className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-full font-medium transition-all hover:scale-105 mt-8">
              Try Edit PDF <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 w-full flex items-center justify-center mt-8 lg:mt-0">
            <img 
              src="/editpdfsection.png" 
              alt="PDF Editor Interface" 
              className="w-full max-w-md lg:max-w-lg h-auto object-contain drop-shadow-[0_0_50px_rgba(217,70,239,0.15)] scale-95 lg:scale-100 transition-transform duration-500" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export const FeatureConvert: React.FC = () => {
  return (
    <section className="py-24 px-4 border-t border-zinc-900/50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8">
            <FileImage className="w-4 h-4" /> Universal Converter
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            Convert seamlessly between formats.
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Extract high-resolution images from your PDF pages, or compile a beautiful PDF document from a batch of JPGs in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* PDF to JPG */}
          <div className="relative group bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent border border-zinc-800/60 rounded-[2rem] p-8 overflow-hidden hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute -top-10 -right-10 w-40 h-40 blur-3xl rounded-full bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center justify-between mb-8">
              <FileImage className="w-12 h-12 text-emerald-400 stroke-[1.5]" />
              <div className="w-12 h-12 rounded-full border border-zinc-800/80 bg-zinc-900/50 flex items-center justify-center group-hover:border-emerald-500/30 transition-colors">
                 <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
            
            <h3 className="text-2xl font-semibold text-white mb-4 tracking-tight relative z-10">PDF to JPG</h3>
            <p className="text-zinc-400 leading-relaxed font-light mb-8 relative z-10">Turn every page of your PDF into crisp, high-quality JPG images wrapped in a neat ZIP archive.</p>
            
            <Link to="/pdf-to-jpg" className="absolute inset-0 z-20">
              <span className="sr-only">Convert to JPG</span>
            </Link>
          </div>

          {/* JPG to PDF */}
          <div className="relative group bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent border border-zinc-800/60 rounded-[2rem] p-8 overflow-hidden hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute -top-10 -right-10 w-40 h-40 blur-3xl rounded-full bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center justify-between mb-8">
              <Layers className="w-12 h-12 text-rose-400 stroke-[1.5]" />
              <div className="w-12 h-12 rounded-full border border-zinc-800/80 bg-zinc-900/50 flex items-center justify-center group-hover:border-rose-500/30 transition-colors">
                 <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-rose-400 transition-colors" />
              </div>
            </div>
            
            <h3 className="text-2xl font-semibold text-white mb-4 tracking-tight relative z-10">JPG to PDF</h3>
            <p className="text-zinc-400 leading-relaxed font-light mb-8 relative z-10">Upload multiple photos and instantly stitch them together into a single, cohesive PDF document.</p>
            
            <Link to="/jpg-to-pdf" className="absolute inset-0 z-20">
              <span className="sr-only">Convert to PDF</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
