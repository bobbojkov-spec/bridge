import ProductCard from './ProductCard'
import Link from 'next/link'

interface Product {
  title: string
  price: string
  href: string
  imageSrc: string
  imageAlt: string
}

interface ProductGridProps {
  products: Product[]
  showViewAll?: boolean
}

export default function ProductGrid({ products, showViewAll = true }: ProductGridProps) {
  return (
    <section className="product-section" aria-labelledby="product-section-heading">
      <div className="container">
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </div>
        {showViewAll && (
          <footer className="section-footer">
            <Link href="/shop" className="button button-outline">
              VIEW ALL
            </Link>
          </footer>
        )}
      </div>

      <style jsx>{`
        .product-section {
          padding: 80px 0;
          background-color: var(--color-bg-page);
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-8);
          margin-bottom: var(--space-16);
        }

        @media (min-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: var(--space-10);
          }
        }

        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: var(--space-12);
          }
        }

        .section-footer {
          text-align: center;
        }

        .button {
          display: inline-block;
          padding: var(--space-4) var(--space-8);
          font-size: var(--font-size-sm);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.2s;
        }

        .button-outline {
          border: 2px solid var(--color-text-primary);
          color: var(--color-text-primary);
          background-color: transparent;
        }

        .button-outline:hover {
          background-color: var(--color-text-primary);
          color: var(--color-text-inverse);
        }
      `}</style>
    </section>
  )
}

