"use client";

import Image from "next/image";
import Link from "next/link";
import "./workshop-section.css";

const workshopImages = [
  {
    id: 1,
    src: "/images/contact-img-1.jpg",
    alt: "People working in the ceramic studio",
  },
  {
    id: 2,
    src: "/images/contact-img-2.jpg",
    alt: "Ceramic studio workspace",
  },
  {
    id: 3,
    src: "/images/contact-img-3.jpg",
    alt: "Handmade ceramics in progress",
  },
  {
    id: 4,
    src: "/images/contact-img-4.jpg",
    alt: "Ceramic workshop activity",
  },
];

export default function WorkshopSection() {
  return (
    <section className="workshop-section">
      <div className="workshop-container">
        <div className="workshop-layout">
          <div className="workshop-text">
            <header className="workshop-header">
              <h2 className="section-title">WORKSHOP IN OUR CERAMIC STUDIO</h2>
              <p className="section-body-text">
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget
                dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes,
                nascetur ridiculus mus.
              </p>
            </header>
            <Link href="/contact" className="apply-button">
              APPLY NOW
            </Link>
          </div>

          <div className="workshop-gallery">
            {workshopImages.map((image) => (
              <figure key={image.id} className="workshop-thumb">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={200}
                  height={200}
                  className="workshop-image"
                />
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


