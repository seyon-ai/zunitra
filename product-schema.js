/**
 * ZUNITRA — Google Structured Data for product.html
 * Add this before </body> in product.html:
 *   <script src="product-schema.js"></script>
 *
 * Injects JSON-LD schema so Google indexes products for Shopping
 */
(function() {
  const SITE       = "https://zunitra-luxury-tawny.vercel.app";
  const USD_TO_INR = 83.5;

  // Wait for product data to be loaded on the page
  function tryInject() {
    // Look for product data exposed by product.html
    const p = window.__currentProduct;
    if (!p || !p.id) {
      // Retry after 1s if product not loaded yet
      setTimeout(tryInject, 1000);
      return;
    }

    const price     = Number(p.price) || 0;
    const inrPrice  = Math.round(price * USD_TO_INR);
    const imgUrl    = p.imageUrl || p.images?.[0] || "";
    const brand     = p.brand  || "Zunitra";
    const name      = p.name   || "Luxury Watch";
    const desc      = p.longDesc || p.desc || name;
    const avail     = (p.stock || 0) > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";
    const specs     = p.specs || {};

    // Build review aggregate if has ratings
    const ratingBlock = p.rating && p.reviews ? `
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "${p.rating}",
      "reviewCount": "${p.reviews}",
      "bestRating": "5",
      "worstRating": "1"
    },` : "";

    // Build spec additional properties
    const specProps = Object.entries(specs).map(([k,v]) =>
      `{"@type":"PropertyValue","name":"${k.replace(/"/g,"")}","value":"${String(v).replace(/"/g,"")}"}`
    ).join(",\n      ");

    const schema = {
      "@context": "https://schema.org",
      "@type":    "Product",
      "name":     name,
      "description": desc,
      "brand": {
        "@type": "Brand",
        "name":  brand
      },
      "image": imgUrl ? [imgUrl] : [],
      "sku":   p.ref || p.id,
      "mpn":   p.ref || p.id,
      "category": "Watches",
      "url": SITE + "/product.html?id=" + p.id,
      "additionalProperty": specs && Object.keys(specs).length ? JSON.parse("[" + specProps + "]") : [],
      "offers": {
        "@type":           "Offer",
        "url":             SITE + "/product.html?id=" + p.id,
        "priceCurrency":   "USD",
        "price":           price.toFixed(2),
        "priceValidUntil": new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0],
        "availability":    avail,
        "condition":       "https://schema.org/NewCondition",
        "seller": {
          "@type": "Organization",
          "name":  "ZUNITRA",
          "url":   SITE
        },
        "hasMerchantReturnPolicy": {
          "@type":                  "MerchantReturnPolicy",
          "returnPolicyCategory":   "https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays":     3,
          "returnMethod":           "https://schema.org/ReturnByMail",
          "returnFees":             "https://schema.org/FreeReturn"
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type":    "MonetaryAmount",
            "value":    "0",
            "currency": "USD"
          },
          "shippingDestination": {
            "@type":          "DefinedRegion",
            "addressCountry": "IN"
          },
          "deliveryTime": {
            "@type":           "ShippingDeliveryTime",
            "businessDays": {
              "@type":   "OpeningHoursSpecification",
              "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
            },
            "cutoffTime":     "17:00:00+05:30",
            "handlingTime": {
              "@type":    "QuantitativeValue",
              "minValue": 1,
              "maxValue": 2,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type":    "QuantitativeValue",
              "minValue": 3,
              "maxValue": 7,
              "unitCode": "DAY"
            }
          }
        }
      }
    };

    // Also add breadcrumb schema
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type":    "BreadcrumbList",
      "itemListElement": [
        { "@type":"ListItem","position":1,"name":"Home","item": SITE + "/index.html" },
        { "@type":"ListItem","position":2,"name":"Collection","item": SITE + "/shop.html" },
        { "@type":"ListItem","position":3,"name": name,"item": SITE + "/product.html?id=" + p.id }
      ]
    };

    // Inject both into <head>
    function injectSchema(data) {
      const el = document.createElement("script");
      el.type  = "application/ld+json";
      el.textContent = JSON.stringify(data, null, 2);
      document.head.appendChild(el);
    }
    injectSchema(schema);
    injectSchema(breadcrumb);

    // Also update page title and meta for SEO
    document.title = brand + " " + name + " | ZUNITRA Fine Timepieces";
    const metaDesc = document.querySelector("meta[name='description']");
    if (metaDesc) {
      metaDesc.content = (desc || "").substring(0, 160);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = (desc || "").substring(0, 160);
      document.head.appendChild(m);
    }

    // Open Graph tags for social sharing
    function setMeta(prop, content, isProp) {
      const attr = isProp ? "property" : "name";
      let el = document.querySelector(`meta[${attr}='${prop}']`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.content = content;
    }
    setMeta("og:title",       brand + " " + name + " | ZUNITRA", true);
    setMeta("og:description", (desc||"").substring(0,200), true);
    setMeta("og:image",       imgUrl, true);
    setMeta("og:url",         SITE + "/product.html?id=" + p.id, true);
    setMeta("og:type",        "product", true);
    setMeta("product:price:amount",   String(price), false);
    setMeta("product:price:currency", "USD", false);

    console.log("✓ ZUNITRA: Product schema injected for", name);
  }

  // Start trying to inject
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(tryInject, 800));
  } else {
    setTimeout(tryInject, 800);
  }

})();
