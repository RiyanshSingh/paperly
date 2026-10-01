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
    answer: 'No. Paperly processes all your PDF files completely locally within your web browser. Your files never leave your device, ensuring maximum privacy and security.'
  },
  {
    question: 'Is there a file size limit?',
    answer: 'Since processing happens locally, the only limit is your browser\'s memory. For most modern devices, you can process PDFs up to several hundred megabytes without any issues.'
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No sign-up or registration is required. You can start using all of our tools immediately as soon as you open the website.'
  },
  {
    question: 'Will Paperly work on my phone?',
    answer: 'Yes! Paperly is designed to be fully responsive and works beautifully on mobile browsers, tablets, and desktop computers.'
  }
];

export const HomeFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 px-4 border-t border-zinc-900/50 bg-black">
      <div className="container mx-auto max-w-4xl">
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
