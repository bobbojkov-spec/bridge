import Image from 'next/image'
import Link from 'next/link'

interface BlogCardProps {
  title: string
  href: string
  author: string
  date: string
  imageSrc: string
  imageAlt: string
}

export default function BlogCard({ title, href, author, date, imageSrc, imageAlt }: BlogCardProps) {
  return (
    <article className="blog-card">
      <Link href={href} className="blog-link">
        <figure className="blog-media">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={413}
            height={647}
            className="blog-image"
          />
        </figure>
      </Link>
      <div className="blog-content">
        <Link href={href}>
          <h3 className="blog-title">{title}</h3>
        </Link>
        <p className="blog-meta">
          <span className="blog-author">{author}</span>
          <time dateTime={date}>{date}</time>
        </p>
      </div>

      <style jsx>{`
        .blog-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .blog-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }

        .blog-link {
          display: block;
          margin-bottom: var(--space-4);
        }

        .blog-media {
          position: relative;
          width: 100%;
          padding-top: 150%;
          overflow: hidden;
          background-color: var(--color-bg-section-alt);
        }

        .blog-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .blog-card:hover .blog-image {
          transform: scale(1.05);
        }

        .blog-content {
          padding: 0 var(--space-2);
        }

        .blog-title {
          font-family: var(--font-serif);
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: var(--space-3);
          line-height: 1.4;
          transition: color 0.2s;
        }

        .blog-title:hover {
          color: var(--color-brand-primary);
        }

        .blog-meta {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }

        .blog-author {
          font-weight: 500;
        }

        .blog-meta time::before {
          content: '•';
          margin: 0 var(--space-2);
        }
      `}</style>
    </article>
  )
}

