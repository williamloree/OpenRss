import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "Missing 'url' in request body" },
        { status: 400 }
      );
    }

    const baseUrl = new URL(url).origin;

    // Fetch the article page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch article: ${response.status}` },
        { status: 500 }
      );
    }

    const html = await response.text();

    // Extract article content and styled HTML
    const article = await extractArticle(html, baseUrl);

    return NextResponse.json({
      success: true,
      ...article,
      baseUrl,
    });
  } catch (error) {
    console.error("Error extracting article:", error);
    return NextResponse.json(
      {
        error: "Failed to extract article content",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

interface ExtractedArticle {
  title: string;
  content: string;
  excerpt: string;
  siteName: string;
  heroImage: string | null;
  styledHtml: string; // Complete HTML with inlined CSS for iframe display
}

async function extractArticle(html: string, baseUrl: string): Promise<ExtractedArticle> {
  // Extract metadata
  const title = extractTitle(html);
  const siteName = extractSiteName(html, baseUrl);
  const heroImage = extractHeroImage(html, baseUrl);
  const excerpt = extractExcerpt(html);

  // Create styled HTML for iframe display
  const styledHtml = await createStyledHtml(html, baseUrl);

  // Clean HTML for reader mode fallback
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to find article content
  let content = "";

  // Method 1: Look for article tag
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    content = articleMatch[0];
  }

  // Method 2: Look for common content containers
  if (!content || content.length < 500) {
    const contentSelectors = [
      /<div[^>]*class="[^"]*(?:article-body|article-content|post-content|entry-content|content-body|story-body|post-body|article__body|article__content|main-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*id="[^"]*(?:article-body|article-content|post-content|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
    ];

    for (const selector of contentSelectors) {
      const match = cleaned.match(selector);
      if (match && match[0].length > (content?.length || 0)) {
        content = match[0];
      }
    }
  }

  // Method 3: Fallback - get body and clean it
  if (!content || content.length < 500) {
    const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      content = bodyMatch[1];
    }
  }

  // Clean up the content
  content = cleanArticleContent(content, baseUrl);

  return {
    title,
    content,
    excerpt,
    siteName,
    heroImage,
    styledHtml,
  };
}

async function createStyledHtml(html: string, baseUrl: string): Promise<string> {
  // Extract all CSS - both inline styles and external stylesheets
  const inlineStyles: string[] = [];
  const externalCssUrls: string[] = [];

  // Extract inline <style> tags
  const styleMatches = html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  for (const match of styleMatches) {
    inlineStyles.push(match[1]);
  }

  // Extract external stylesheet URLs
  const linkMatches = html.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi);
  for (const match of linkMatches) {
    externalCssUrls.push(makeAbsoluteUrl(match[1], baseUrl));
  }

  // Also match href before rel
  const linkMatches2 = html.matchAll(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi);
  for (const match of linkMatches2) {
    externalCssUrls.push(makeAbsoluteUrl(match[1], baseUrl));
  }

  // Fetch external CSS files (limit to first 10 to avoid too much data)
  const fetchedCss: string[] = [];
  const cssUrls = [...new Set(externalCssUrls)].slice(0, 10);

  await Promise.all(
    cssUrls.map(async (cssUrl) => {
      try {
        const cssResponse = await fetch(cssUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (cssResponse.ok) {
          let css = await cssResponse.text();
          // Fix relative URLs in CSS (for fonts, images, etc.)
          css = fixCssUrls(css, cssUrl);
          fetchedCss.push(css);
        }
      } catch (e) {
        console.error(`Failed to fetch CSS: ${cssUrl}`, e);
      }
    })
  );

  // Combine all CSS
  const allCss = [...inlineStyles, ...fetchedCss].join("\n");

  // Clean and prepare the HTML body
  let bodyContent = html;

  // Remove scripts
  bodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove noscript
  bodyContent = bodyContent.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");

  // Remove comments
  bodyContent = bodyContent.replace(/<!--[\s\S]*?-->/g, "");

  // Remove unwanted elements (ads, popups, etc.)
  const removePatterns = [
    /<nav\b[^>]*>[\s\S]*?<\/nav>/gi,
    /<footer\b[^>]*>[\s\S]*?<\/footer>/gi,
    /<aside\b[^>]*>[\s\S]*?<\/aside>/gi,
    /<form\b[^>]*>[\s\S]*?<\/form>/gi,
    /<button\b[^>]*>[\s\S]*?<\/button>/gi,
    /<input\b[^>]*>/gi,
    /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
    // Ads and social
    /<div[^>]*class="[^"]*(?:ad-|ads-|advert|social|share|comment|related|newsletter|subscribe|popup|modal|cookie|sidebar)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<ins\b[^>]*>[\s\S]*?<\/ins>/gi,
    /<amp-ad\b[^>]*>[\s\S]*?<\/amp-ad>/gi,
  ];

  for (const pattern of removePatterns) {
    bodyContent = bodyContent.replace(pattern, "");
  }

  // Remove event handlers
  bodyContent = bodyContent.replace(/\s+on\w+="[^"]*"/gi, "");

  // Fix relative URLs in HTML
  bodyContent = fixUrls(bodyContent, baseUrl);

  // Extract body content
  const bodyMatch = bodyContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : bodyContent;

  // Create complete HTML document for iframe
  const styledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="${baseUrl}/">
  <style>
    /* Reset some styles for better display */
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    a {
      color: inherit;
    }
    /* Inlined CSS from original site */
    ${allCss}
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  return styledHtml;
}

function fixCssUrls(css: string, cssUrl: string): string {
  const cssBaseUrl = cssUrl.substring(0, cssUrl.lastIndexOf('/') + 1);

  // Fix url() references
  return css.replace(/url\(['"]?(?!data:|https?:\/\/|\/\/)([^'")]+)['"]?\)/gi, (match, url) => {
    const absoluteUrl = makeAbsoluteUrl(url, cssBaseUrl);
    return `url('${absoluteUrl}')`;
  });
}

function extractTitle(html: string): string {
  // Try og:title first
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitle) return decodeHtmlEntities(ogTitle[1]);

  // Try twitter:title
  const twitterTitle = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
  if (twitterTitle) return decodeHtmlEntities(twitterTitle[1]);

  // Try <title> tag
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleTag) {
    // Clean up title (remove site name suffix)
    let title = decodeHtmlEntities(titleTag[1]);
    title = title.split(/\s*[\|\-–—]\s*/)[0].trim();
    return title;
  }

  // Try h1
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return decodeHtmlEntities(h1[1]);

  return "";
}

function extractSiteName(html: string, baseUrl: string): string {
  const ogSite = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  if (ogSite) return decodeHtmlEntities(ogSite[1]);

  try {
    return new URL(baseUrl).hostname.replace('www.', '');
  } catch {
    return "";
  }
}

function extractHeroImage(html: string, baseUrl: string): string | null {
  // Try og:image
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImage) {
    return makeAbsoluteUrl(ogImage[1], baseUrl);
  }

  // Try twitter:image
  const twitterImage = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
  if (twitterImage) {
    return makeAbsoluteUrl(twitterImage[1], baseUrl);
  }

  return null;
}

function extractExcerpt(html: string): string {
  // Try og:description
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDesc) return decodeHtmlEntities(ogDesc[1]);

  // Try meta description
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (metaDesc) return decodeHtmlEntities(metaDesc[1]);

  return "";
}

function cleanArticleContent(html: string, baseUrl: string): string {
  let content = html;

  // Remove unwanted elements
  const removePatterns = [
    /<nav\b[^>]*>[\s\S]*?<\/nav>/gi,
    /<header\b[^>]*>[\s\S]*?<\/header>/gi,
    /<footer\b[^>]*>[\s\S]*?<\/footer>/gi,
    /<aside\b[^>]*>[\s\S]*?<\/aside>/gi,
    /<form\b[^>]*>[\s\S]*?<\/form>/gi,
    /<button\b[^>]*>[\s\S]*?<\/button>/gi,
    /<input\b[^>]*>/gi,
    /<select\b[^>]*>[\s\S]*?<\/select>/gi,
    /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
    /<svg\b[^>]*>[\s\S]*?<\/svg>/gi,
    // Ads and social
    /<div[^>]*class="[^"]*(?:ad-|ads-|advert|social|share|comment|related|newsletter|subscribe|popup|modal|cookie|sidebar)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<section[^>]*class="[^"]*(?:comment|related|newsletter)[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
    // Common ad elements
    /<ins\b[^>]*>[\s\S]*?<\/ins>/gi,
    /<amp-ad\b[^>]*>[\s\S]*?<\/amp-ad>/gi,
  ];

  for (const pattern of removePatterns) {
    content = content.replace(pattern, "");
  }

  // Remove event handlers and data attributes
  content = content.replace(/\s+on\w+="[^"]*"/gi, "");
  content = content.replace(/\s+data-[a-z-]+="[^"]*"/gi, "");

  // Fix relative URLs
  content = fixUrls(content, baseUrl);

  // Clean up excessive whitespace
  content = content.replace(/\n\s*\n\s*\n/g, "\n\n");

  return content.trim();
}

function fixUrls(html: string, baseUrl: string): string {
  // Fix img src
  let fixed = html.replace(
    /(<img[^>]*\s)src=["'](?!(?:https?:)?\/\/|data:)([^"']+)["']/gi,
    (match, prefix, url) => `${prefix}src="${makeAbsoluteUrl(url, baseUrl)}"`
  );

  // Fix a href
  fixed = fixed.replace(
    /(<a[^>]*\s)href=["'](?!(?:https?:)?\/\/|#|mailto:|tel:|javascript:)([^"']+)["']/gi,
    (match, prefix, url) => `${prefix}href="${makeAbsoluteUrl(url, baseUrl)}" target="_blank" rel="noopener"`
  );

  // Fix srcset
  fixed = fixed.replace(/srcset=["']([^"']+)["']/gi, (match, srcset) => {
    const fixedSrcset = srcset.split(',').map((src: string) => {
      const parts = src.trim().split(/\s+/);
      if (parts[0] && !parts[0].startsWith('http') && !parts[0].startsWith('data:')) {
        parts[0] = makeAbsoluteUrl(parts[0], baseUrl);
      }
      return parts.join(' ');
    }).join(', ');
    return `srcset="${fixedSrcset}"`;
  });

  return fixed;
}

function makeAbsoluteUrl(url: string, baseUrl: string): string {
  try {
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (url.startsWith('/')) {
      return new URL(url, baseUrl).href;
    }
    if (!url.startsWith('http')) {
      return new URL(url, baseUrl).href;
    }
    return url;
  } catch {
    return url;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}
