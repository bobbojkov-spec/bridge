"use client";

import Image from "next/image";
import Link from "next/link";
import { allProducts, getProductBySlug, Product } from "@/lib/products";
import "./related-products.css";

interface RelatedProductsProps {
  currentProductSlug: string;
}

export default function RelatedProducts({ currentProductSlug }: RelatedProductsProps) {
  const currentProduct = getProductBySlug(currentProductSlug);
  
  if (!currentProduct) {
    return null;
  }

  // Get related products - exclude current product and get 4 products from same category or random
  const relatedProducts = allProducts
    .filter((product) => product.slug !== currentProductSlug)
    .slice(0, 4);

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
                  />
                  <div className="related-product-overlay">
                    <button className="related-product-add-to-cart">
                      ADD TO CART
                    </button>
                  </div>
                </div>
                <div className="related-product-info">
                  <h3 className="related-product-name">{product.name}</h3>
                  <p className="related-product-price">{product.price}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


