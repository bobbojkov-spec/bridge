"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./related-products.css";

interface RelatedProductsProps {
  currentProductSlug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  image: string;
  tags: string[];
  categoryIds: number[];
}

export default function RelatedProducts({ currentProductSlug }: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentProductSlug]);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      // First, get the current product to find related products
      const currentResponse = await fetch(`/api/products/slug/${currentProductSlug}`);
      const currentResult = await currentResponse.json();
      
      if (!currentResult.data) {
        setRelatedProducts([]);
        return;
      }

      const currentProduct = currentResult.data;
      
      // Get all active products
      const allResponse = await fetch('/api/products?pageSize=100&active=true');
      const allResult = await allResponse.json();
      
      if (!allResult.data || !Array.isArray(allResult.data)) {
        setRelatedProducts([]);
        return;
      }

      // Score products based on similarity
      const scoredProducts = allResult.data
        .filter((p: any) => p.slug !== currentProductSlug && p.active)
        .map((p: any) => {
          let score = 0;
          
          // Same categories = high score
          if (currentProduct.categoryIds && p.categoryIds) {
            const commonCategories = currentProduct.categoryIds.filter((id: number) => 
              p.categoryIds.includes(id)
            );
            score += commonCategories.length * 10;
          }
          
          // Same tags = medium score
          if (currentProduct.tags && p.tags) {
            const commonTags = currentProduct.tags.filter((tag: string) => 
              p.tags.includes(tag)
            );
            score += commonTags.length * 5;
          }
          
          // Similar name words = low score
          const currentWords = currentProduct.name.toLowerCase().split(/\s+/);
          const productWords = p.name.toLowerCase().split(/\s+/);
          const commonWords = currentWords.filter((word: string) => 
            productWords.includes(word) && word.length > 3
          );
          score += commonWords.length * 2;
          
          return { ...p, score };
        })
        .filter((p: any) => p.score > 0) // Only products with some similarity
        .sort((a: any, b: any) => b.score - a.score) // Sort by score descending
        .slice(0, 4) // Take top 4
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          currency: p.currency || 'EUR',
          image: p.images && p.images.length > 0 ? p.images[0] : '/images/placeholder.jpg',
        }));

      // If we don't have enough related products, fill with random active products
      if (scoredProducts.length < 4) {
        const remaining = allResult.data
          .filter((p: any) => 
            p.slug !== currentProductSlug && 
            p.active &&
            !scoredProducts.find((sp: Product) => sp.id === p.id)
          )
          .slice(0, 4 - scoredProducts.length)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            currency: p.currency || 'EUR',
            image: p.images && p.images.length > 0 ? p.images[0] : '/images/placeholder.jpg',
          }));
        
        setRelatedProducts([...scoredProducts, ...remaining].slice(0, 4));
      } else {
        setRelatedProducts(scoredProducts);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="related-products-section">
        <div className="related-products-container">
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Loading related products...
          </div>
        </div>
      </section>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="related-products-section">
      <div className="related-products-container">
        <h2 className="related-products-title">RELATED PRODUCTS</h2>
        <div className="related-products-grid">
          {relatedProducts.map((product) => (
            <article key={product.id} className="related-product-card">
              <Link href={`/shop/product/${product.slug}`} className="related-product-link">
                <div className="related-product-image-wrapper">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="related-product-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/images/placeholder.jpg') {
                        target.src = '/images/placeholder.jpg';
                      }
                    }}
                  />
                  <div className="related-product-overlay">
                    <button className="related-product-add-to-cart">
                      ADD TO CART
                    </button>
                  </div>
                </div>
                <div className="related-product-info">
                  <h3 className="related-product-name">{product.name}</h3>
                  <p className="related-product-price">
                    {product.currency === 'EUR' ? '€' : product.currency === 'USD' ? '$' : ''}
                    {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
