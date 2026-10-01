import React from "react";
import { Link } from "react-router-dom";

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-black py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-[1400px] mx-auto bg-[#0d0d0d] rounded-[2.5rem] p-8 md:p-16 flex flex-col relative overflow-hidden border border-zinc-900/50">
        
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row justify-between mb-24 gap-16 relative z-10">
          
          {/* Logo & Description */}
          <div className="max-w-xs">
            <Link to="/" className="text-3xl font-extrabold text-white mb-6 inline-block tracking-tight">
              PAPERLY
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Paperly is a full-service document conversion suite specializing in fast, secure, and local browser-based PDF processing.
            </p>
          </div>

          {/* Links Columns */}
          <div className="flex flex-wrap md:flex-nowrap gap-12 lg:gap-24">
            <div>
              <h4 className="text-white font-medium mb-6 text-sm">Quick link</h4>
              <ul className="space-y-4">
                <li><Link to="/" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Home</Link></li>
                <li><Link to="/merge-pdf" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Merge PDF</Link></li>
                <li><Link to="/compress-pdf" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Compress PDF</Link></li>
                <li><Link to="/edit-pdf" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Edit PDF</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-6 text-sm">Company</h4>
              <ul className="space-y-4">
                <li><Link to="/about" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">About us</Link></li>
                <li><Link to="/privacy" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Privacy policy</Link></li>
                <li><Link to="/terms" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Terms of service</Link></li>
                <li><Link to="/contact" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-6 text-sm">Others</h4>
              <ul className="space-y-4">
                <li><Link to="/pdf-to-jpg" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">PDF to JPG</Link></li>
                <li><Link to="/split-pdf" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Split PDF</Link></li>
                <li><Link to="/rotate-pdf" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Rotate PDF</Link></li>
                <li><Link to="/unlock-pdf" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Unlock PDF</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-6 text-sm">Social</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Twitter</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">LinkedIn</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">GitHub</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-light">Discord</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="flex flex-col md:flex-row justify-between items-center text-[13px] text-zinc-500 mb-20 md:mb-24 lg:mb-[10vw] relative z-20 gap-4">
          <p>©{CURRENT_YEAR} Paperly. All rights reserved.</p>
          <p>Design inspired by Grabui • Powered by React</p>
        </div>

        {/* Huge Bottom Text with Left/Right Fading */}
        <div className="absolute -bottom-[8%] left-0 right-0 w-full flex justify-center pointer-events-none select-none overflow-hidden">
          <span 
            className="text-[19vw] font-black leading-none tracking-tighter bg-clip-text text-transparent relative z-0"
            style={{ backgroundImage: 'linear-gradient(to bottom, #34d399 0%, #064e3b 70%, #0d0d0d 100%)' }}
          >
            PAPERLY
          </span>
          {/* Left Fading Gradient */}
          <div className="absolute inset-y-0 left-0 w-[30%] lg:w-[35%] bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent z-10 pointer-events-none"></div>
          {/* Right Fading Gradient */}
          <div className="absolute inset-y-0 right-0 w-[30%] lg:w-[35%] bg-gradient-to-l from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent z-10 pointer-events-none"></div>
        </div>

      </div>
    </footer>
  );
};
