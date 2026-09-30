import React from 'react';
import { AdPlaceholder } from '../components/ui/AdPlaceholder';
import { SEO } from '../components/SEO';

export const Privacy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl text-zinc-300">
      <SEO 
        title="Privacy Policy" 
        description="Privacy policy and data processing details for Paperly PDF Tools."
        path="/privacy"
      />
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none space-y-6">
        <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">1. Introduction</h2>
          <p>
            At Paperly, we take your privacy seriously. This Privacy Policy explains how we handle your data when you use our website and PDF tools.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">2. Local Processing (Client-Side)</h2>
          <p>
            The core feature of Paperly is that <strong>we do not upload your files to our servers</strong>. All PDF processing (merging, splitting, rotating, etc.) happens locally in your web browser. 
          </p>
          <p>
            This means your documents remain entirely on your device, ensuring maximum privacy and security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">3. Data Collection</h2>
          <p>
            Because we do not process your files on our servers, we do not collect, store, or have access to any of the content within your PDF documents.
          </p>
          <p>
            We may collect standard, anonymized analytics data (such as page views, browser type, and usage patterns) to help us improve the platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">4. Third-Party Services</h2>
          <p>
            We may use third-party services such as Google Analytics for tracking website usage, and advertising partners (like Google AdSense) to display advertisements. These third parties may use cookies to serve personalized ads based on your prior visits to our website or other websites on the internet.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">5. Cookies</h2>
          <p>
            We use cookies to enhance your experience, analyze site traffic, and serve targeted advertisements. You can choose to disable cookies through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 mt-8">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@paperly.example.com.
          </p>
        </section>
      </div>
      
      <AdPlaceholder type="banner" className="my-12 border-zinc-800 bg-zinc-900/50 text-zinc-600" />
    </div>
  );
};
