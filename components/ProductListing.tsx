"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import "./product-listing.css";

const productsPerPage = 12;

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  images: string[];
  active: boolean;
}

export default function ProductListing() {
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        const result = await response.json();
        
        if (result.data && Array.isArray(result.data)) {
          setProducts(result.data);
          setTotal(result.total || result.data.length);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const totalPages = Math.ceil(total / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  return (
    <section className="product-listing-section">
      <div className="product-listing-container">
        {/* Results and Sorting */}
        <div className="listing-header">
          <p className="results-count">
            Showing {startIndex + 1}–{Math.min(endIndex, total)} of {total} results
          </p>
          <div className="sorting">
            <select className="sort-select" aria-label="Sort products">
              <option>Default sorting</option>
              <option>Sort by popularity</option>
              <option>Sort by average rating</option>
              <option>Sort by latest</option>
              <option>Sort by price: low to high</option>
              <option>Sort by price: high to low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading products...</p>
          </div>
        ) : currentProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No products found</p>
          </div>
        ) : (
          <div className="product-listing-grid">
            {currentProducts.map((product) => (
              <article key={product.id} className="product-listing-card">
                <div className="product-listing-image-wrapper">
                  <Link href={`/shop/product/${product.slug || product.id}`}>
                    <Image
                      src={product.images?.[0] || '/images/placeholder.jpg'}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="product-listing-image"
                    />
                  </Link>
                  <div className="product-listing-hover-actions">
                    <button
                      className="add-to-cart-button"
                      onClick={(e) => {
                        e.preventDefault();
                        // TODO: Add to cart functionality
                      }}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      ADD TO CART
                    </button>
                  </div>
                  <div className="product-listing-overlay"></div>
                </div>
                <div className="product-listing-info">
                  <Link href={`/shop/product/${product.slug || product.id}`} className="product-listing-name">
                    {product.name}
                  </Link>
                  <div className="product-listing-price">
                    <span className="current-price">
                      €{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-button ${page === currentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
                aria-label={`Go to page ${page}`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

