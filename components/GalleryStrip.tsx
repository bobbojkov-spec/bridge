import Image from 'next/image'

interface GalleryStripProps {
  images: Array<{ src: string; alt: string; href?: string }>
}

export default function GalleryStrip({ images }: GalleryStripProps) {
  return (
    <section className="gallery-strip" aria-label="Ceramic gallery">
      <div className="container">
        <div className="gallery-grid">
          {images.map((image, index) => {
            const content = (
              <figure className="gallery-item">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="gallery-image"
                />
                <div className="gallery-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </figure>
            )

            return image.href ? (
              <a key={index} href={image.href} className="gallery-link">
                {content}
              </a>
            ) : (
              <div key={index}>{content}</div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .gallery-strip {
          padding: 80px 0;
          background-color: var(--color-bg-page);
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-2);
        }

        @media (min-width: 768px) {
          .gallery-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: var(--space-4);
          }
        }

        .gallery-link {
          display: block;
        }

        .gallery-item {
          position: relative;
          width: 100%;
          padding-top: 100%;
          overflow: hidden;
          background-color: var(--color-bg-section-alt);
          cursor: pointer;
        }

        .gallery-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .gallery-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          color: var(--color-text-inverse);
        }

        .gallery-item:hover .gallery-overlay {
          opacity: 1;
        }

        .gallery-item:hover .gallery-image {
          transform: scale(1.1);
        }
      `}</style>
    </section>
  )
}

