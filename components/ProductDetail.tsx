"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import "./product-detail.css";

interface ProductDetailProps {
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  categoryIds: number[];
  tags: string[];
  additionalInfo: {
    weight: string;
    dimensions: string;
    material: string;
    careInstructions: string;
  } | null;
}

export default function ProductDetail({ slug }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/slug/${slug}`);
      const result = await response.json();
      if (result.data) {
        setProduct(result.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="product-detail-section">
        <div className="product-detail-container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            Loading product...
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="product-detail-section">
        <div className="product-detail-container">
          <p>Product not found</p>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail-section">
      <div className="product-detail-container">
        <div className="product-detail-layout">
          {/* Left: Thumbnail Images */}
          {product.images && product.images.length > 0 && (
            <div className="product-thumbnails">
              {product.images.map((image: string, index: number) => (
                <button
                  key={index}
                  className={`thumbnail-button ${index === selectedImage ? "active" : ""}`}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image
                    src={image || '/images/placeholder.jpg'}
                    alt={`${product.name} view ${index + 1}`}
                    width={100}
                    height={100}
                    className="thumbnail-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/images/placeholder.jpg') {
                        target.src = '/images/placeholder.jpg';
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Center: Main Product Image */}
          <div className="product-main-image">
            <Image
              src={product.images?.[selectedImage] || '/images/placeholder.jpg'}
              alt={product.name}
              width={600}
              height={600}
              className="main-product-image"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== '/images/placeholder.jpg') {
                  target.src = '/images/placeholder.jpg';
                }
              }}
            />
          </div>

          {/* Right: Product Info */}
          <div className="product-info-panel">
            <h1 className="product-detail-title">{product.name}</h1>
            
            <div className="product-detail-price">
              <span className="current-price">
                {product.currency === 'EUR' ? '€' : product.currency === 'USD' ? '$' : ''}
                {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
              </span>
            </div>

            {/* Quantity and Add to Cart in one row */}
            <div className="product-actions-row">
              <div className="quantity-controls">
                <button
                  type="button"
                  className="quantity-button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="quantity-input"
                />
                <button
                  type="button"
                  className="quantity-button"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button className="add-to-cart-detail-button">
                ADD TO CART
              </button>
            </div>

            {/* Wishlist */}
            <button
              className="wishlist-detail-button"
              onClick={() => setIsWishlisted(!isWishlisted)}
              aria-label="Add to wishlist"
            >
              <svg
                viewBox="0 0 24 24"
                fill={isWishlisted ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="wishlist-icon"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>ADD TO WISHLIST</span>
            </button>

            {/* Tabs Section */}
            <div className="product-tabs-section">
              <div className="product-tabs-header">
                <button
                  className={`tab-button ${activeTab === "description" ? "active" : ""}`}
                  onClick={() => setActiveTab("description")}
                >
                  DESCRIPTION
                </button>
                <button
                  className={`tab-button ${activeTab === "additional" ? "active" : ""}`}
                  onClick={() => setActiveTab("additional")}
                >
                  ADDITIONAL INFORMATION
                </button>
                <button
                  className={`tab-button ${activeTab === "reviews" ? "active" : ""}`}
                  onClick={() => setActiveTab("reviews")}
                >
                  REVIEWS (0)
                </button>
              </div>

              <div className="product-tabs-content">
                {activeTab === "description" && (
                  <div className="tab-content">
                    <p>{product.description}</p>
                    <div className="product-meta">
                      {product.sku && (
                        <>
                          <div className="product-meta-item">
                            <strong>SKU:</strong> {product.sku}
                          </div>
                          <div className="product-meta-divider"></div>
                        </>
                      )}
                      {product.tags && product.tags.length > 0 && (
                        <>
                          <div className="product-meta-item">
                            <strong>Tags:</strong> {Array.isArray(product.tags) ? product.tags.join(", ") : product.tags}
                          </div>
                          <div className="product-meta-divider"></div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "additional" && (
                  <div className="tab-content">
                    {product.additionalInfo ? (
                      <table className="additional-info-table">
                        <tbody>
                          {product.additionalInfo.weight && (
                            <tr>
                              <th>Weight</th>
                              <td>{product.additionalInfo.weight}</td>
                            </tr>
                          )}
                          {product.additionalInfo.dimensions && (
                            <tr>
                              <th>Dimensions</th>
                              <td>{product.additionalInfo.dimensions}</td>
                            </tr>
                          )}
                          {product.additionalInfo.material && (
                            <tr>
                              <th>Material</th>
                              <td>{product.additionalInfo.material}</td>
                            </tr>
                          )}
                          {product.additionalInfo.careInstructions && (
                            <tr>
                              <th>Care Instructions</th>
                              <td>{product.additionalInfo.careInstructions}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <p>No additional information available.</p>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="tab-content">
                    <p className="no-reviews">No reviews yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

