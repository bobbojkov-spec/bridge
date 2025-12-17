"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { allProducts, Product } from "@/lib/products";
import "./product-listing.css";

const productsPerPage = 12;

export default function ProductListing() {
  const [currentPage, setCurrentPage] = useState(1);
  
  const total = allProducts.length;
  const totalPages = Math.ceil(total / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = allProducts.slice(startIndex, endIndex);

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
        {currentProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No products found</p>
          </div>
        ) : (
          <div className="product-listing-grid">
            {currentProducts.map((product) => (
              <article key={product.id} className="product-listing-card">
                <div className="product-listing-image-wrapper">
                  <Link href={`/shop/product/${product.slug}`}>
                    <Image
                      src={product.image || '/images/placeholder.jpg'}
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
                  <Link href={`/shop/product/${product.slug}`} className="product-listing-name">
                    {product.name}
                  </Link>
                  <div className="product-listing-price">
                    <span className="current-price">
                      {product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="original-price">{product.originalPrice}</span>
                    )}
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

