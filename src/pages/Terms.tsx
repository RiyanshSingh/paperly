import React from 'react';
import { AdPlaceholder } from '../components/ui/AdPlaceholder';
import { SEO } from '../components/SEO';
const CURRENT_DATE = new Date().toLocaleDateString();

export const Terms: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl text-zinc-300">
      <SEO 
        title="Terms of Service" 
        description="Terms of service and usage conditions for Paperly PDF Tools."
        path="/terms"
      />
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Terms of Service</h1>
      
      <div className="prose prose-invert max-w-none space-y-6">
        <p className="text-lg">Last updated: {CURRENT_DATE}</p>
        
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Paperly, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">2. Use of Service</h2>
          <p>
            Paperly provides a collection of online tools for manipulating PDF files. You agree to use these tools only for lawful purposes. You are solely responsible for the documents you process using our tools.
          </p>
          <p>
            Since the processing happens entirely within your browser, the performance of the tools depends on your device's capabilities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">3. Disclaimer of Warranties</h2>
          <p>
            The service is provided on an "AS IS" and "AS AVAILABLE" basis. Paperly makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">4. Limitations of Liability</h2>
          <p>
            In no event shall Paperly be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Paperly's website.
          </p>
          <p>
            Because we do not store your files on our servers, we are not responsible for any data loss that occurs during the use of our tools in your browser.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">5. Intellectual Property Rights</h2>
          <p>
            You retain all rights and ownership of your files. Paperly does not claim any ownership rights to the documents you process using our service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">6. Modifications to Terms</h2>
          <p>
            Paperly may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>
      </div>

      <AdPlaceholder type="banner" className="my-12 border-zinc-800 bg-zinc-900/50 text-zinc-600" />
    </div>
  );
};
