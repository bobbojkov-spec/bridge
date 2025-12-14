"use client";

import Image from "next/image";
import Link from "next/link";
import "./gallery-section.css";

const galleryImages = [
  {
    id: 1,
    src: "/images/insta-1.jpg",
    alt: "Ceramic gallery image 1",
    href: "#",
  },
  {
    id: 2,
    src: "/images/insta-2.jpg",
    alt: "Ceramic gallery image 2",
    href: "#",
  },
  {
    id: 3,
    src: "/images/insta-3.jpg",
    alt: "Ceramic gallery image 3",
    href: "#",
  },
  {
    id: 4,
    src: "/images/insta-4.jpg",
    alt: "Ceramic gallery image 4",
    href: "#",
  },
];

export default function GallerySection() {
  return (
    <section className="gallery-section">
      <div className="gallery-container">
        <div className="gallery-grid">
          {galleryImages.map((image) => (
            <Link key={image.id} href={image.href} className="gallery-item">
              <figure className="gallery-figure">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={400}
                  height={400}
                  className="gallery-image"
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


