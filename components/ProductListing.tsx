"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import "./product-listing.css";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  images?: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const productsPerPage = 12;

type SortOption = 'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

export default function ProductListing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, selectedCategory, searchQuery, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?activeOnly=true');
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: productsPerPage.toString(),
        active: 'true',
      });

      if (selectedCategory) {
        params.append('categoryId', selectedCategory);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        let fetchedProducts = result.data;

        // Apply client-side sorting
        if (sortBy !== 'default') {
          fetchedProducts = [...fetchedProducts].sort((a, b) => {
            switch (sortBy) {
              case 'name-asc':
                return a.name.localeCompare(b.name);
              case 'name-desc':
                return b.name.localeCompare(a.name);
              case 'price-asc':
                return (a.price || 0) - (b.price || 0);
              case 'price-desc':
                return (b.price || 0) - (a.price || 0);
              default:
                return 0;
            }
          });
        }

        setProducts(fetchedProducts);
        setTotal(typeof result.total === 'number' ? result.total : parseInt(result.total || '0', 10));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
  };

  const totalPages = Math.ceil(total / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = Math.min(startIndex + productsPerPage, total);

  return (
    <section className="product-listing-section">
      <div className="product-listing-container">
        {/* Filters */}
        <div className="listing-filters">
          <div className="filter-group">
            <label htmlFor="category-filter" className="filter-label">Category:</label>
            <select
              id="category-filter"
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search-filter" className="filter-label">Search:</label>
            <input
              id="search-filter"
              type="text"
              className="filter-input"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Results and Sorting */}
        <div className="listing-header">
          <p className="results-count">
            {loading ? 'Loading...' : `Showing ${startIndex + 1}–${endIndex} of ${total} results`}
          </p>
          <div className="sorting">
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              aria-label="Sort products"
            >
              <option value="default">Default sorting</option>
              <option value="name-asc">Sort by name: A to Z</option>
              <option value="name-desc">Sort by name: Z to A</option>
              <option value="price-asc">Sort by price: low to high</option>
              <option value="price-desc">Sort by price: high to low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p>No products found</p>
            {(selectedCategory || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchQuery('');
                }}
                style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid #211f1f',
                  cursor: 'pointer',
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="product-listing-grid">
            {products.map((product) => (
              <article key={product.id} className="product-listing-card">
                <div className="product-listing-image-wrapper">
                  <Link href={`/shop/product/${product.slug}`}>
                    <Image
                      src={(product.images && product.images.length > 0 ? product.images[0] : null) || '/images/placeholder.jpg'}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="product-listing-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/images/placeholder.jpg') {
                          target.src = '/images/placeholder.jpg';
                        }
                      }}
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
                      {product.currency === 'EUR' ? '€' : product.currency === 'USD' ? '$' : ''}
                      {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
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
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let page;
              if (totalPages <= 10) {
                page = i + 1;
              } else if (currentPage <= 5) {
                page = i + 1;
              } else if (currentPage >= totalPages - 4) {
                page = totalPages - 9 + i;
              } else {
                page = currentPage - 5 + i;
              }
              return (
                <button
                  key={page}
                  className={`pagination-button ${page === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
