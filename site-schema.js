/**
 * ZUNITRA — Global Site Schema
 * Add to ALL pages before </body>:
 *   <script src="site-schema.js"></script>
 */
(function() {
  const SITE = "https://zunitra-luxury-tawny.vercel.app";

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ZUNITRA",
    "url": SITE,
    "logo": SITE + "/favicon.ico",
    "description": "ZUNITRA — India's premier luxury watch e-commerce store. Fine timepieces from established Swiss and international brands.",
    "email": "contact.zunitrawatches@gmail.com",
    "foundingDate": "1847",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    },
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "contact.zunitrawatches@gmail.com",
      "availableLanguage": ["English", "Hindi"],
      "hoursAvailable": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
        "opens": "10:00",
        "closes": "18:00"
      }
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "ZUNITRA Luxury Watch Collection",
      "url": SITE + "/shop.html"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ZUNITRA",
    "url": SITE,
    "potentialAction": {
      "@type": "SearchAction",
      "target": SITE + "/shop.html?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  function inject(data) {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(data, null, 2);
    document.head.appendChild(el);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { inject(orgSchema); inject(websiteSchema); });
  } else {
    inject(orgSchema);
    inject(websiteSchema);
  }
})();
