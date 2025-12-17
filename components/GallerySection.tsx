"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./gallery-section.css";

interface GalleryImage {
  id: number;
  url: string;
  alt_text: string | null;
}

export default function GallerySection() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const response = await fetch('/api/media?pageSize=4');
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        // Filter for images only and take first 4
        const images = result.data
          .filter((file: any) => file.mime_type?.startsWith('image/'))
          .slice(0, 4)
          .map((file: any) => ({
            id: file.id,
            url: file.url || file.url_large || file.url_medium || file.url_thumb || '/images/placeholder.jpg',
            alt_text: file.alt_text || file.caption || `Gallery image ${file.id}`,
          }));
        setGalleryImages(images);
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="gallery-section">
        <div className="gallery-container">
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Loading gallery...
          </div>
        </div>
      </section>
    );
  }

  if (galleryImages.length === 0) {
    return null;
  }

  return (
    <section className="gallery-section">
      <div className="gallery-container">
        <div className="gallery-grid">
          {galleryImages.map((image) => (
            <Link key={image.id} href="#" className="gallery-item">
              <figure className="gallery-figure">
                <Image
                  src={image.url}
                  alt={image.alt_text || `Gallery image ${image.id}`}
                  width={400}
                  height={400}
                  className="gallery-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/images/placeholder.jpg') {
                      target.src = '/images/placeholder.jpg';
                    }
                  }}
                />
                <div className="gallery-overlay">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="gallery-icon"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                  </svg>
                </div>
              </figure>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


