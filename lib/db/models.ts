// Database model types matching the MySQL schema

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent_id: number | null;
  order: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  order: number;
  alt_text: string | null;
  created_at: Date;
}

export interface ProductCategory {
  product_id: number;
  category_id: number;
}

export interface ProductTag {
  id: number;
  product_id: number;
  tag: string;
}

export interface ProductAdditionalInfo {
  id: number;
  product_id: number;
  weight: string | null;
  dimensions: string | null;
  material: string | null;
  care_instructions: string | null;
}

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  background_image: string;
  cta_text: string | null;
  cta_link: string | null;
  order: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null; // Added for subtitle
  featured_image: string | null;
  excerpt: string | null;
  content: string | null;
  cta_text: string | null; // Added for CTA
  cta_link: string | null; // Added for CTA
  order: number; // Added for ordering
  active: boolean; // Added for active/inactive
  publish_status: 'draft' | 'published' | 'archived';
  publish_date: Date | null;
  author: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: Date;
  updated_at: Date;
}

// Legacy Page interface (kept for backward compatibility if needed)
export interface LegacyPage {
  id: number;
  page_type: 'home' | 'about' | 'contact' | 'custom';
  slug: string;
  title: string;
  hero_image: string | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PageSection {
  id: number;
  page_id: number;
  section_type: 'text' | 'image' | 'text-image' | 'featured';
  title: string | null;
  content: string | null;
  image: string | null;
  link: string | null;
  order: number;
  created_at: Date;
}

// New dynamic pages interface
export interface Page {
  id: number;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  seo_title: string | null;
  seo_description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PageBlock {
  id: number;
  page_id: number;
  type: string;
  position: number;
  data: Record<string, any>; // JSON data
  enabled: boolean;
  created_at: Date;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string | null;
  bio: string | null;
  image: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  email: string | null;
  order: number;
  created_at: Date;
  updated_at: Date;
}

export interface MediaFile {
  id: number;
  filename: string;
  url: string; // Original image URL
  url_large: string | null; // Large size URL
  url_medium: string | null; // Medium size URL
  url_thumb: string | null; // Thumbnail URL
  mime_type: string | null;
  size: number | null; // Original file size
  width: number | null; // Original width
  height: number | null; // Original height
  alt_text: string | null;
  caption: string | null;
  created_at: Date;
}

export interface SiteSettings {
  id: number;
  site_name: string;
  logo: string | null;
  favicon: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  footer_content: string | null;
  seo_default_title: string | null;
  seo_default_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  updated_at: Date;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  billing_address: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

