import BlogCard from './BlogCard'

interface BlogPost {
  title: string
  href: string
  author: string
  date: string
  imageSrc: string
  imageAlt: string
}

interface BlogGridProps {
  posts: BlogPost[]
}

export default function BlogGrid({ posts }: BlogGridProps) {
  return (
    <section className="blog-preview" aria-labelledby="blog-preview-heading">
      <div className="container">
        <div className="blog-grid">
          {posts.map((post, index) => (
            <BlogCard key={index} {...post} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .blog-preview {
          padding: 80px 0;
          background-color: var(--color-bg-page);
        }

        .blog-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
        }

        @media (min-width: 768px) {
          .blog-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .blog-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </section>
  )
}

