"use client";

import Image from "next/image";
import "./about-us-hero.css";

interface AboutUsHeroProps {
  title: string;
  headerText: string;
  detailText: string;
  heroImage: string;
  heroImageAlt?: string;
}

export default function AboutUsHero({
  title,
  headerText,
  detailText,
  heroImage,
  heroImageAlt = "About Us",
}: AboutUsHeroProps) {
  return (
    <section className="about-hero-section">
      <div className="about-hero-container">
        <div className="about-hero-content">
          <h1 className="about-hero-title">{title}</h1>
          <div className="about-hero-text-wrapper">
            <p className="about-hero-header-text">{headerText}</p>
            <p className="about-hero-detail-text">{detailText}</p>
          </div>
        </div>
        <div className="about-hero-image-wrapper">
          <Image
            src={heroImage}
            alt={heroImageAlt}
            fill
            className="about-hero-image"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}

