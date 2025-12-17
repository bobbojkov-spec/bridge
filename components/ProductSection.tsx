"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import "./product-section.css";

interface FeaturedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  image: string;
}

export default function ProductSection() {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/settings/featured-products/frontend');
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        setFeaturedProducts(result.data);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <section className="product-section">
        <div className="product-section-container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Loading featured products...
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="product-section">
      <div className="product-section-container">
        <div className="product-grid">
          {featuredProducts.map((product, index) => (
            <article key={product.id} className="product-card">
              <div className="product-image-wrapper">
                <Link href={`/shop/product/${product.slug}`}>
                  <Image
                    src={product.image || '/images/placeholder.jpg'}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="product-image"
                    style={{ background: '#ffffff' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/images/placeholder.jpg') {
                        target.src = '/images/placeholder.jpg';
                      }
                    }}
                  />
                </Link>
                <div className="product-hover-icons">
                  <button
                    className="quick-view-button"
                    onClick={(e) => {
                      e.preventDefault();
                      // TODO: Open lightbox/quick view modal
                    }}
                    aria-label={`Quick view ${product.name}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    className={`wishlist-button ${favorites.has(product.id) ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(product.id);
                    }}
                    aria-label={`Add ${product.name} to favorites`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill={favorites.has(product.id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
              </div>
                  <div className="product-info">
                    <Link href={`/shop/product/${product.slug}`} className="product-name">
                      {product.name}
                    </Link>
                  <p className="product-price">
                    {product.currency === 'EUR' ? '€' : product.currency === 'USD' ? '$' : ''}
                    {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                  </p>
              </div>
            </article>
          ))}
        </div>
        <div className="product-section-footer">
          <Link href="/shop" className="view-all-button">
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}

