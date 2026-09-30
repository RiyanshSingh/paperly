import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  isArticle?: boolean;
}

export const SEO: React.FC<SEOProps> = ({ title, description, path = '', isArticle = false }) => {
  // Update this to your actual production domain when deploying
  const siteUrl = 'https://paperly.example.com';
  const url = `${siteUrl}${path}`;
  const siteName = 'Paperly';
  const fullTitle = `${title} | ${siteName}`;

  // Structured Data (JSON-LD) for SoftwareApplication
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": fullTitle,
    "description": description,
    "applicationCategory": "BrowserApplication",
    "operatingSystem": "All",
    "url": url,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={isArticle ? 'article' : 'website'} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      {/* Add og:image here when you have a social banner */}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrg)}
      </script>
    </Helmet>
  );
};
