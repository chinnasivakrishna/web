import React, { useEffect } from 'react';

const SEO = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  ogUrl,
  canonicalUrl,
  preventIndexing = false,
  schema
}) => {
  useEffect(() => {
    // 1. Update Title
    const formattedTitle = title ? `${title} | StuVaradhi` : 'StuVaradhi - Bridging Students to Success';
    document.title = formattedTitle;

    // Helper to find or create tag
    const updateMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attrName, attrValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // 2. Update Basic Meta Tags
    if (description) {
      updateMetaTag('name', 'description', description);
    }
    if (keywords) {
      updateMetaTag('name', 'keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords);
    }

    // Robots meta tag
    if (preventIndexing) {
      updateMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      updateMetaTag('name', 'robots', 'index, follow');
    }

    // 3. Open Graph Tags
    updateMetaTag('property', 'og:title', ogTitle || title || 'StuVaradhi');
    if (description || ogDescription) {
      updateMetaTag('property', 'og:description', ogDescription || description);
    }
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:url', ogUrl || window.location.href);
    if (ogImage) {
      updateMetaTag('property', 'og:image', ogImage);
    }

    // 4. Twitter Card Tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', ogTitle || title || 'StuVaradhi');
    if (description || ogDescription) {
      updateMetaTag('name', 'twitter:description', ogDescription || description);
    }
    if (ogImage) {
      updateMetaTag('name', 'twitter:image', ogImage);
    }

    // 5. Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    const finalCanonicalUrl = canonicalUrl || window.location.href;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', finalCanonicalUrl);

    // 6. JSON-LD Schema
    let schemaScript = document.getElementById('jsonld-schema');
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.setAttribute('type', 'application/ld+json');
        schemaScript.setAttribute('id', 'jsonld-schema');
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    } else {
      if (schemaScript) {
        schemaScript.remove();
      }
    }
  }, [
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    ogUrl,
    canonicalUrl,
    preventIndexing,
    schema
  ]);

  return null;
};

export default SEO;
