"use client";

import Image from "next/image";
import Link from "next/link";
import "./blog-section.css";

interface BlogPost {
  id: number;
  title: string;
  author: string;
  date: string;
  image: string;
  href: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Japan Design 2023: Handmade Ceramic Ideas",
    author: "Nina Marling",
    date: "14 December, 2023",
    image: "/images/blog-1s-413x647.jpg",
    href: "/blog/japan-design-2023",
  },
  {
    id: 2,
    title: "London Design 2023: Make Unique Handmade Mugs",
    author: "Nina Marling",
    date: "15 December, 2023",
    image: "/images/blog-2s-413x647.jpg",
    href: "/blog/london-design-2023",
  },
  {
    id: 3,
    title: "Japan Design 2023: Color Inspo For All Visual Arts",
    author: "Nina Marling",
    date: "16 December, 2023",
    image: "/images/blog-3s-413x647.jpg",
    href: "/blog/japan-design-color-inspo",
  },
];

export default function BlogSection() {
  return (
    <section className="blog-section">
      <div className="blog-container">
        <header className="blog-header">
          <p className="section-kicker">From our journal</p>
          <h2 className="section-title">Stories from the studio</h2>
        </header>

        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article key={post.id} className="blog-card">
              <Link href={post.href} className="blog-link">
                <figure className="blog-media">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={413}
                    height={647}
                    className="blog-image"
                  />
                  <div className="blog-content-overlay">
                    <h3 className="blog-title">{post.title}</h3>
                    <div className="blog-divider"></div>
                    <p className="blog-meta">
                      <span className="blog-author">{post.author}</span>
                      <span className="blog-separator">|</span>
                      <time dateTime={post.date}>{post.date}</time>
                    </p>
                  </div>
                </figure>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

