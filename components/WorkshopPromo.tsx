import Image from 'next/image'
import Link from 'next/link'

interface WorkshopPromoProps {
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
  galleryImages: Array<{ src: string; alt: string }>
}

export default function WorkshopPromo({
  title,
  body,
  ctaLabel,
  ctaHref,
  galleryImages,
}: WorkshopPromoProps) {
  return (
    <section className="workshop-section" aria-labelledby="workshop-heading">
      <div className="container workshop-layout">
        <div className="workshop-text">
          <header>
            <h2 id="workshop-heading" className="section-title">
              {title}
            </h2>
            <p className="section-body-text">{body}</p>
          </header>
          <Link href={ctaHref} className="button button-primary">
            {ctaLabel}
          </Link>
        </div>
        <div className="workshop-gallery">
          {galleryImages.map((image, index) => (
            <figure key={index} className="workshop-thumb">
              <Image
                src={image.src}
                alt={image.alt}
                width={200}
                height={200}
                className="workshop-image"
              />
            </figure>
          ))}
        </div>
      </div>

      <style jsx>{`
        .workshop-section {
          padding: 80px 0;
          background-color: var(--color-bg-section-alt);
        }

        .workshop-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-12);
          align-items: center;
        }

        @media (min-width: 1024px) {
          .workshop-layout {
            grid-template-columns: 1fr 1fr;
            gap: var(--space-16);
          }
        }

        .workshop-text {
          text-align: center;
        }

        @media (min-width: 1024px) {
          .workshop-text {
            text-align: left;
          }
        }

        .section-title {
          font-family: var(--font-serif);
          font-size: var(--font-size-3xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: var(--space-6);
          line-height: 1.2;
        }

        @media (min-width: 768px) {
          .section-title {
            font-size: var(--font-size-4xl);
          }
        }

        .section-body-text {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-8);
          line-height: 1.6;
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

        .button-primary {
          background-color: var(--color-brand-primary);
          color: var(--color-text-inverse);
        }

        .button-primary:hover {
          background-color: var(--color-brand-accent);
        }

        .workshop-gallery {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
        }

        @media (min-width: 768px) {
          .workshop-gallery {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .workshop-thumb {
          position: relative;
          width: 100%;
          padding-top: 100%;
          overflow: hidden;
          background-color: var(--color-bg-page);
        }

        .workshop-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .workshop-thumb:hover .workshop-image {
          transform: scale(1.1);
        }
      `}</style>
    </section>
  )
}

