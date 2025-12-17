/**
 * Calculate SEO score based on filled fields
 */

export interface SEOFields {
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  canonicalUrl?: string | null;
}

export interface SEOScoreResult {
  score: number; // 0-100
  maxScore: number;
  checks: {
    metaTitle: { passed: boolean; message: string; score: number };
    metaDescription: { passed: boolean; message: string; score: number };
    seoKeywords: { passed: boolean; message: string; score: number };
    ogTitle: { passed: boolean; message: string; score: number };
    ogDescription: { passed: boolean; message: string; score: number };
    canonicalUrl: { passed: boolean; message: string; score: number };
  };
}

/**
 * Calculate SEO score based on field values
 */
export function calculateSEOScore(fields: SEOFields): SEOScoreResult {
  const checks = {
    metaTitle: checkMetaTitle(fields.metaTitle),
    metaDescription: checkMetaDescription(fields.metaDescription),
    seoKeywords: checkKeywords(fields.seoKeywords),
    ogTitle: checkOGTitle(fields.ogTitle),
    ogDescription: checkOGDescription(fields.ogDescription),
    canonicalUrl: checkCanonicalUrl(fields.canonicalUrl),
  };

  const totalScore = Object.values(checks).reduce((sum, check) => sum + check.score, 0);
  const maxScore = Object.values(checks).length * 20; // Each check is worth 20 points (except meta title/description which are worth more)

  return {
    score: Math.round((totalScore / maxScore) * 100),
    maxScore: 100,
    checks,
  };
}

function checkMetaTitle(title?: string | null): { passed: boolean; message: string; score: number } {
  if (!title || title.trim().length === 0) {
    return { passed: false, message: 'Meta title is missing', score: 0 };
  }
  
  const length = title.length;
  if (length < 30) {
    return { passed: false, message: `Meta title is too short (${length} chars, recommended: 30-60)`, score: 10 };
  }
  if (length > 60) {
    return { passed: false, message: `Meta title is too long (${length} chars, recommended: 30-60)`, score: 10 };
  }
  
  return { passed: true, message: `Meta title is optimal (${length} chars)`, score: 20 };
}

function checkMetaDescription(description?: string | null): { passed: boolean; message: string; score: number } {
  if (!description || description.trim().length === 0) {
    return { passed: false, message: 'Meta description is missing', score: 0 };
  }
  
  const length = description.length;
  if (length < 120) {
    return { passed: false, message: `Meta description is too short (${length} chars, recommended: 120-160)`, score: 10 };
  }
  if (length > 160) {
    return { passed: false, message: `Meta description is too long (${length} chars, recommended: 120-160)`, score: 10 };
  }
  
  return { passed: true, message: `Meta description is optimal (${length} chars)`, score: 20 };
}

function checkKeywords(keywords?: string | null): { passed: boolean; message: string; score: number } {
  if (!keywords || keywords.trim().length === 0) {
    return { passed: false, message: 'SEO keywords are missing', score: 0 };
  }
  
  const keywordCount = keywords.split(',').filter(k => k.trim().length > 0).length;
  if (keywordCount < 3) {
    return { passed: false, message: `Too few keywords (${keywordCount}, recommended: 3-10)`, score: 10 };
  }
  if (keywordCount > 10) {
    return { passed: false, message: `Too many keywords (${keywordCount}, recommended: 3-10)`, score: 10 };
  }
  
  return { passed: true, message: `Keywords are optimal (${keywordCount} keywords)`, score: 20 };
}

function checkOGTitle(title?: string | null): { passed: boolean; message: string; score: number } {
  if (!title || title.trim().length === 0) {
    return { passed: false, message: 'OG title is missing', score: 0 };
  }
  return { passed: true, message: 'OG title is set', score: 10 };
}

function checkOGDescription(description?: string | null): { passed: boolean; message: string; score: number } {
  if (!description || description.trim().length === 0) {
    return { passed: false, message: 'OG description is missing', score: 0 };
  }
  return { passed: true, message: 'OG description is set', score: 10 };
}

function checkCanonicalUrl(url?: string | null): { passed: boolean; message: string; score: number } {
  if (!url || url.trim().length === 0) {
    return { passed: false, message: 'Canonical URL is missing', score: 0 };
  }
  return { passed: true, message: 'Canonical URL is set', score: 10 };
}

