import Image from 'next/image'
import Link from 'next/link'

interface DesignersHighlightProps {
  kicker?: string
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
  imageSrc: string
  imageAlt: string
}

export default function DesignersHighlight({
  kicker = 'Behind the craft',
  title,
  body,
  ctaLabel,
  ctaHref,
  imageSrc,
  imageAlt,
}: DesignersHighlightProps) {
  return (
    <section className="designers-section" aria-labelledby="designers-heading">
      <div className="container designers-layout">
        <div className="designers-text">
          <header>
            {kicker && <p className="section-kicker">{kicker}</p>}
            <h2 id="designers-heading" className="section-title">
              {title}
            </h2>
          </header>
          <p className="section-body-text">{body}</p>
          <Link href={ctaHref} className="button button-primary">
            {ctaLabel}
          </Link>
        </div>
        <figure className="designers-media">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={600}
            height={800}
            className="designers-image"
          />
        </figure>
      </div>

      <style jsx>{`
        .designers-section {
          padding: 80px 0;
          background-color: var(--color-bg-page);
        }

        .designers-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-12);
          align-items: center;
        }

        @media (min-width: 1024px) {
          .designers-layout {
            grid-template-columns: 1fr 1fr;
            gap: var(--space-16);
          }
        }

        .designers-text {
          text-align: center;
        }

        @media (min-width: 1024px) {
          .designers-text {
            text-align: left;
          }
        }

        .section-kicker {
          font-size: var(--font-size-sm);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-brand-primary);
          margin-bottom: var(--space-4);
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

        .designers-media {
          order: -1;
        }

        @media (min-width: 1024px) {
          .designers-media {
            order: 0;
          }
        }

        .designers-image {
          width: 100%;
          height: auto;
          object-fit: cover;
        }
      `}</style>
    </section>
  )
}

