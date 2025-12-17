/**
 * Generate SEO data for a product based on product information
 */

export interface ProductDataForSEO {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number | null;
  currency: string;
  categoryNames: string[];
  tags: string[];
  firstImageUrl: string | null;
}

export interface GeneratedSEOData {
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string | null;
  canonicalUrl: string;
}

/**
 * Truncate text to a maximum length, adding ellipsis if needed
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Generate SEO-friendly meta title
 */
function generateMetaTitle(product: ProductDataForSEO): string {
  const parts: string[] = [];
  
  // Add product name
  parts.push(product.name);
  
  // Add category if available
  if (product.categoryNames.length > 0) {
    parts.push(product.categoryNames[0]);
  }
  
  // Add price if available
  if (product.price !== null && product.price !== undefined) {
    const priceNum = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
    if (!isNaN(priceNum)) {
      parts.push(`${priceNum.toFixed(2)} ${product.currency}`);
    }
  }
  
  // Join and truncate to 60 characters (optimal for SEO)
  const title = parts.join(' | ');
  return truncate(title, 60);
}

/**
 * Generate SEO-friendly meta description
 */
function generateMetaDescription(product: ProductDataForSEO): string {
  const parts: string[] = [];
  
  // Start with product name
  parts.push(product.name);
  
  // Add description if available
  if (product.description) {
    const cleanDescription = product.description
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 120);
    if (cleanDescription) {
      parts.push(cleanDescription);
    }
  }
  
  // Add category if available
  if (product.categoryNames.length > 0) {
    parts.push(`Category: ${product.categoryNames.join(', ')}`);
  }
  
  // Add price if available
  if (product.price !== null && product.price !== undefined) {
    const priceNum = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
    if (!isNaN(priceNum)) {
      parts.push(`Price: ${priceNum.toFixed(2)} ${product.currency}`);
    }
  }
  
  // Join and truncate to 160 characters (optimal for SEO)
  const description = parts.join('. ');
  return truncate(description, 160);
}

/**
 * Generate SEO keywords
 */
function generateKeywords(product: ProductDataForSEO): string {
  const keywords: string[] = [];
  
  // Add product name words
  const nameWords = product.name
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 3);
  keywords.push(...nameWords);
  
  // Add categories
  keywords.push(...product.categoryNames.map(cat => cat.toLowerCase()));
  
  // Add tags
  keywords.push(...product.tags.map(tag => tag.toLowerCase()));
  
  // Remove duplicates and join
  const uniqueKeywords = [...new Set(keywords)];
  return uniqueKeywords.join(', ');
}

/**
 * Generate Open Graph title
 */
function generateOGTitle(product: ProductDataForSEO): string {
  const parts: string[] = [];
  parts.push(product.name);
  
  if (product.price !== null && product.price !== undefined) {
    const priceNum = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
    if (!isNaN(priceNum)) {
      parts.push(`${priceNum.toFixed(2)} ${product.currency}`);
    }
  }
  
  const title = parts.join(' - ');
  return truncate(title, 60);
}

/**
 * Generate Open Graph description
 */
function generateOGDescription(product: ProductDataForSEO): string {
  if (product.description) {
    const cleanDescription = product.description
      .replace(/\s+/g, ' ')
      .trim();
    return truncate(cleanDescription, 200);
  }
  
  // Fallback to meta description
  return generateMetaDescription(product);
}

/**
 * Generate canonical URL
 */
function generateCanonicalUrl(product: ProductDataForSEO, baseUrl: string): string {
  return `${baseUrl}/shop/product/${product.slug}`;
}

/**
 * Main function to generate all SEO data for a product
 */
export function generateProductSEO(
  product: ProductDataForSEO,
  baseUrl: string = 'http://localhost:3000'
): GeneratedSEOData {
  return {
    metaTitle: generateMetaTitle(product),
    metaDescription: generateMetaDescription(product),
    seoKeywords: generateKeywords(product),
    ogTitle: generateOGTitle(product),
    ogDescription: generateOGDescription(product),
    ogImageUrl: product.firstImageUrl,
    canonicalUrl: generateCanonicalUrl(product, baseUrl),
  };
}

