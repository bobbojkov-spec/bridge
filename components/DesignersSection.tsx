"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./designers-section.css";

export default function DesignersSection() {
  const [imageUrl, setImageUrl] = useState("/images/about-us-img-1-1.jpg");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to find a suitable image from media library or use static image
    fetch('/api/media?pageSize=50')
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          // Look for images with "about" or "designer" in filename
          const aboutImage = data.data.find((file: any) => 
            file.mime_type?.startsWith('image/') && 
            (file.filename?.toLowerCase().includes('about') || 
             file.filename?.toLowerCase().includes('designer') ||
             file.filename?.toLowerCase().includes('team') ||
             file.filename?.toLowerCase().includes('eva') ||
             file.filename?.toLowerCase().includes('nina'))
          );
          
          if (aboutImage) {
            const url = aboutImage.url || aboutImage.url_large || aboutImage.url_medium || aboutImage.url_thumb;
            if (url) {
              setImageUrl(url);
            }
          }
        }
      })
      .catch(err => {
        console.log('Using static image');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section className="designers-section">
      <div className="designers-container">
        <div className="designers-layout">
          <div className="designers-text">
            <header className="designers-header">
              <p className="section-kicker">Behind the craft</p>
              <h2 className="section-title">MEET DESIGNERS EVA & NINA</h2>
            </header>

            <p className="section-body-text">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis.
            </p>

            <Link href="/about-us" className="read-more-button">
              READ MORE
            </Link>
          </div>

          <figure className="designers-media">
            <Image
              src={imageUrl}
              alt="Designers Eva and Nina in the ceramic studio"
              width={600}
              height={800}
              className="designers-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Try alternative image paths
                if (!target.src.includes('placeholder')) {
                  target.src = '/images/placeholder.jpg';
                }
              }}
            />
          </figure>
        </div>
      </div>
    </section>
  );
}

