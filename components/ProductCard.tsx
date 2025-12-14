'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface ProductCardProps {
  title: string
  price: string
  href: string
  imageSrc: string
  imageAlt: string
  hasWishlist?: boolean
  hasAddToCart?: boolean
}

export default function ProductCard({
  title,
  price,
  href,
  imageSrc,
  imageAlt,
  hasWishlist = true,
  hasAddToCart = true,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)

  return (
    <article className="product-card">
      {hasWishlist && (
        <button
          className="wishlist-button"
          aria-label={`Add ${title} to wishlist`}
          onClick={() => setIsWishlisted(!isWishlisted)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill={isWishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 17.5L3.5 11.5C2.5 10.5 2 9.25 2 7.75C2 4.75 4.25 2.5 7.25 2.5C8.5 2.5 9.75 3 10.75 3.75L10 4.5L9.25 3.75C10.25 3 11.5 2.5 12.75 2.5C15.75 2.5 18 4.75 18 7.75C18 9.25 17.5 10.5 16.5 11.5L10 17.5Z" />
          </svg>
        </button>
      )}

      <Link href={href} className="product-link">
        <figure className="product-media">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={300}
            height={300}
            className="product-image"
          />
        </figure>
      </Link>

      <div className="product-info">
        <Link href={href}>
          <p className="product-title">{title}</p>
        </Link>
        <p className="product-price">{price}</p>
        {hasAddToCart && (
          <button className="product-cta" type="button">
            Add to cart
          </button>
        )}
      </div>

      <style jsx>{`
        .product-card {
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }

        .wishlist-button {
          position: absolute;
          top: var(--space-4);
          right: var(--space-4);
          z-index: 10;
          width: 40px;
          height: 40px;
          background-color: var(--color-bg-page);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-primary);
          opacity: 0;
          transition: opacity 0.2s, color 0.2s;
          box-shadow: var(--shadow-sm);
        }

        .product-card:hover .wishlist-button {
          opacity: 1;
        }

        .wishlist-button:hover {
          color: var(--color-brand-primary);
        }

        .product-link {
          display: block;
          margin-bottom: var(--space-4);
        }

        .product-media {
          position: relative;
          width: 100%;
          padding-top: 100%;
          overflow: hidden;
          background-color: var(--color-bg-section-alt);
        }

        .product-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .product-card:hover .product-image {
          transform: scale(1.05);
        }

        .product-info {
          text-align: left;
          padding-top: var(--space-4);
        }

        .product-title {
          font-size: var(--font-size-md);
          font-weight: 400;
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
          transition: color 0.2s;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .product-title:hover {
          color: var(--color-brand-primary);
        }

        .product-price {
          font-size: var(--font-size-md);
          font-weight: 400;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-4);
        }

        .product-cta {
          font-size: var(--font-size-sm);
          font-weight: 400;
          color: var(--color-text-secondary);
          text-transform: none;
          letter-spacing: 0;
          padding: 0;
          border: none;
          background: none;
          transition: color 0.2s;
        }

        .product-cta:hover {
          color: var(--color-text-primary);
        }
      `}</style>
    </article>
  )
}

