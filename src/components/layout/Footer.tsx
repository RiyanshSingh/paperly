import React from "react";
import { Link } from "react-router-dom";
import { FileDown } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-zinc-900 bg-black mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white mb-4">
              <div className="bg-white text-black p-1.5 rounded-full">
                <FileDown className="h-5 w-5" />
              </div>
              <span>Paperly</span>
            </Link>
            <p className="text-sm text-zinc-500 mb-4 pr-4">
              Free, fast, and secure online PDF tools. Merge, split, compress, and convert your PDFs securely in your browser.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Popular Tools</h3>
            <ul className="space-y-3">
              <li><Link to="/merge-pdf" className="text-sm text-zinc-400 hover:text-white transition-colors">Merge PDF</Link></li>
              <li><Link to="/split-pdf" className="text-sm text-zinc-400 hover:text-white transition-colors">Split PDF</Link></li>
              <li><Link to="/compress-pdf" className="text-sm text-zinc-400 hover:text-white transition-colors">Compress PDF</Link></li>
              <li><Link to="/pdf-to-jpg" className="text-sm text-zinc-400 hover:text-white transition-colors">PDF to JPG</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">More Tools</h3>
            <ul className="space-y-3">
              <li><Link to="/jpg-to-pdf" className="text-sm text-zinc-400 hover:text-white transition-colors">JPG to PDF</Link></li>
              <li><Link to="/rotate-pdf" className="text-sm text-zinc-400 hover:text-white transition-colors">Rotate PDF</Link></li>
              <li><Link to="/delete-pdf-pages" className="text-sm text-zinc-400 hover:text-white transition-colors">Organize PDF</Link></li>
              <li><Link to="/unlock-pdf" className="text-sm text-zinc-400 hover:text-white transition-colors">Unlock PDF</Link></li>
              <li><Link to="/edit-pdf" className="text-sm text-zinc-400 hover:text-white transition-colors">Edit PDF</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm text-zinc-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/privacy" className="text-sm text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-zinc-400 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-zinc-900 text-center">
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} Paperly. All rights reserved. Your files are processed locally in your browser.
          </p>
        </div>
      </div>
    </footer>
  );
};
