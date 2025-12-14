import Image from 'next/image'
import Link from 'next/link'

interface HeroFeatureCardProps {
  title: string
  subtitle?: string
  linkLabel: string
  linkHref: string
  imageSrc: string
  imageAlt: string
}

function HeroFeatureCard({ title, subtitle, linkLabel, linkHref, imageSrc, imageAlt }: HeroFeatureCardProps) {
  return (
    <article className="feature-card">
      <figure className="feature-media">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={400}
          height={400}
          className="feature-image"
        />
      </figure>
      <header className="feature-header">
        <h2 className="feature-title">{title}</h2>
      </header>
      {subtitle && (
        <p className="feature-text">{subtitle}</p>
      )}
      <Link href={linkHref} className="feature-link">
        {linkLabel}
      </Link>
    </article>
  )
}

export default function HeroFeatureStrip() {
  const cards = [
    {
      title: 'INSPIRED BY THE SEA',
      subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suscipit ultrices nunc.',
      linkLabel: 'learn more',
      linkHref: '/shop',
      imageSrc: '/images/home-img-1a.png',
      imageAlt: 'Ceramic plates inspired by the sea',
    },
    {
      title: 'CREATED WITH LOVE',
      subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suscipit ultrices nunc.',
      linkLabel: 'learn more',
      linkHref: '/shop',
      imageSrc: '/images/home-img-2a.png',
      imageAlt: 'Handmade ceramics created with love',
    },
    {
      title: 'TOUCHED BY THE NATURE',
      subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suscipit ultrices nunc.',
      linkLabel: 'learn more',
      linkHref: '/shop',
      imageSrc: '/images/home-img-3a.png',
      imageAlt: 'Ceramic objects inspired by nature',
    },
  ]

  return (
    <section className="hero-feature-strip" aria-label="Featured themes">
      <div className="container">
        <div className="feature-grid">
          {cards.map((card, index) => (
            <HeroFeatureCard key={index} {...card} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .hero-feature-strip {
          padding: 80px 0;
          background-color: var(--color-bg-page);
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
        }

        @media (min-width: 768px) {
          .feature-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .feature-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: var(--space-12);
          }
        }

        .feature-card {
          text-align: center;
        }

        .feature-media {
          margin-bottom: var(--space-6);
        }

        .feature-image {
          width: 100%;
          height: auto;
          object-fit: cover;
        }

        .feature-header {
          margin-bottom: var(--space-4);
        }

        .feature-title {
          font-family: var(--font-serif);
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: var(--space-4);
        }

        @media (min-width: 768px) {
          .feature-title {
            font-size: var(--font-size-2xl);
          }
        }

        .feature-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-6);
          line-height: 1.6;
        }

        .feature-link {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-brand-primary);
          text-transform: lowercase;
          transition: opacity 0.2s;
        }

        .feature-link:hover {
          opacity: 0.7;
        }
      `}</style>
    </section>
  )
}

