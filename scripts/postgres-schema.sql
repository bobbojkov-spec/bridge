-- PostgreSQL Schema Migration for Bridge Project
-- This script creates all tables needed for the Bridge e-commerce project
-- Compatible with Supabase and other PostgreSQL databases

-- Enable UUID extension (if needed)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(500),
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    stock_quantity INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords VARCHAR(500),
    og_title VARCHAR(255),
    og_description TEXT,
    og_image VARCHAR(500),
    canonical_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    "order" INTEGER DEFAULT 0,
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product categories (many-to-many)
CREATE TABLE IF NOT EXISTS product_categories (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Product tags
CREATE TABLE IF NOT EXISTS product_tags (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL
);

-- Product additional info
CREATE TABLE IF NOT EXISTS product_additional_info (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    weight VARCHAR(50),
    dimensions VARCHAR(100),
    material VARCHAR(255),
    care_instructions TEXT
);

-- Hero slides table
CREATE TABLE IF NOT EXISTS hero_slides (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    background_image VARCHAR(500) NOT NULL,
    cta_text VARCHAR(100),
    cta_link VARCHAR(500),
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News articles table
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    subtitle VARCHAR(500),
    featured_image VARCHAR(500),
    excerpt TEXT,
    content TEXT,
    cta_text VARCHAR(200),
    cta_link VARCHAR(500),
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    publish_status VARCHAR(20) DEFAULT 'draft' CHECK (publish_status IN ('draft', 'published', 'archived')),
    publish_date TIMESTAMP,
    author VARCHAR(255),
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Page blocks table
CREATE TABLE IF NOT EXISTS page_blocks (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    position INTEGER DEFAULT 0,
    data JSONB,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    bio TEXT,
    image VARCHAR(500),
    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    email VARCHAR(255),
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media files table
CREATE TABLE IF NOT EXISTS media_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    url_large VARCHAR(500),
    url_medium VARCHAR(500),
    url_thumb VARCHAR(500),
    mime_type VARCHAR(100),
    size INTEGER,
    width INTEGER,
    height INTEGER,
    alt_text VARCHAR(255),
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    logo VARCHAR(500),
    favicon VARCHAR(500),
    facebook_url VARCHAR(500),
    instagram_url VARCHAR(500),
    twitter_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    footer_content TEXT,
    seo_default_title VARCHAR(255),
    seo_default_description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    shipping_address TEXT NOT NULL,
    billing_address TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_status ON news_articles(publish_status);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_media_filename ON media_files(filename);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_page_blocks_page ON page_blocks(page_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON hero_slides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON news_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

