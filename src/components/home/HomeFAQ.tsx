import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

const faqs = [
  {
    question: 'Is Paperly completely free?',
    answer: 'Yes! Paperly is 100% free to use. There are no hidden fees, premium tiers, or annoying watermarks on your exported PDFs.'
  },
  {
    question: 'Are my files uploaded to a server?',
    answer: 'For standard tools like merging and editing, Paperly processes your files completely locally in your browser. For format conversions (like Word to PDF), we use secure automated servers that instantly delete your files after processing.'
  },
  {
    question: 'Is there a file size limit?',
    answer: 'Since most processing happens locally, the limit depends on your device\'s memory. For most modern devices, you can comfortably process PDFs up to several hundred megabytes without any issues.'
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No sign-up or registration is required. You can start using all of our tools immediately as soon as you open the website.'
  },
  {
    question: 'Which formats are supported for conversion?',
    answer: 'We support a wide variety of formats including Microsoft Word, Excel, PowerPoint, popular images (JPG, PNG, WEBP), and other document types like HTML and EPUB.'
  },
  {
    question: 'Can I edit text directly inside a PDF?',
    answer: 'Absolutely. Our PDF Editor tool lets you add text, draw annotations, insert shapes, and highlight content directly on your PDF pages.'
  },
  {
    question: 'How do I reduce the size of a large PDF?',
    answer: 'You can use our Compress PDF tool. It intelligently optimizes images and removes unnecessary background data to shrink the file size while keeping it perfectly readable.'
  },
  {
    question: 'Will Paperly work on my phone?',
    answer: 'Yes! Paperly is designed to be fully responsive and works beautifully on mobile browsers, tablets, and desktop computers.'
  }
];

export const HomeFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 border-t border-zinc-900/50 bg-black">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Frequently asked questions
          </h2>
        </div>

        <div className="border-t border-zinc-800">
          {faqs.map((faq, i) => (
            <div 
              key={i}
              className="border-b border-zinc-800 transition-colors"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left group hover:opacity-80 transition-opacity"
              >
                <span className="text-xl font-medium text-white pr-8">{faq.question}</span>
                <Plus className={cn(
                  "w-6 h-6 text-zinc-400 flex-shrink-0 transition-transform duration-300",
                  openIndex === i ? "rotate-45 text-white" : ""
                )} />
              </button>
              <div 
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  openIndex === i ? "max-h-64 opacity-100 mb-6" : "max-h-0 opacity-0"
                )}
              >
                <p className="text-lg text-zinc-400 leading-relaxed pr-12">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
