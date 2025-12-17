"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./blog-section.css";

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  featuredImage: string;
  excerpt: string | null;
  content: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  order: number;
  active: boolean;
  publishStatus: string;
  publishDate: string | null;
  author: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BlogSection() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/news?pageSize=100&activeOnly=true&publishStatus=published');
      const result = await response.json();
      
      if (result.data) {
        // Sort by order and take first 3
        const sortedArticles = result.data
          .sort((a: NewsArticle, b: NewsArticle) => a.order - b.order)
          .slice(0, 3); // Show only first 3
        setArticles(sortedArticles);
      }
    } catch (error) {
      console.error('Error fetching news articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getArticleLink = (article: NewsArticle) => {
    if (article.ctaLink) {
      return article.ctaLink;
    }
    return `/blog/${article.slug}`;
  };

  if (loading) {
    return (
      <section className="blog-section">
        <div className="blog-container">
          <header className="blog-header">
            <p className="section-kicker">From our journal</p>
            <h2 className="section-title">Stories from the studio</h2>
          </header>
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Loading...
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="blog-section">
      <div className="blog-container">
        <header className="blog-header">
          <p className="section-kicker">From our journal</p>
          <h2 className="section-title">Stories from the studio</h2>
        </header>

        <div className="blog-grid">
          {articles.map((article) => (
            <article key={article.id} className="blog-card">
              <Link href={getArticleLink(article)} className="blog-link">
                <figure className="blog-media">
                  <Image
                    src={article.featuredImage || '/images/placeholder.jpg'}
                    alt={article.title}
                    width={413}
                    height={647}
                    className="blog-image"
                  />
                  <div className="blog-content-overlay">
                    <h3 className="blog-title">{article.title}</h3>
                    {article.subtitle && (
                      <>
                        <div className="blog-divider"></div>
                        <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>
                          {article.subtitle}
                        </p>
                      </>
                    )}
                    <div className="blog-divider"></div>
                    <p className="blog-meta">
                      {article.author && (
                        <>
                          <span className="blog-author">{article.author}</span>
                          <span className="blog-separator">|</span>
                        </>
                      )}
                      {article.publishDate && (
                        <time dateTime={article.publishDate}>
                          {formatDate(article.publishDate)}
                        </time>
                      )}
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

