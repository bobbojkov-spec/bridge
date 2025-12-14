"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import "./hero-section.css";

export default function HeroSection() {
  const slides = [
    {
      id: 1,
      image: "/images/h3-slide-1.jpg",
      title: "INSPIRED BY THE SEA",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suscipit ultrices nunc. Cras ipsum dolor, eleifend",
    },
    {
      id: 2,
      image: "/images/h3-slide-2.jpg",
      title: "CREATED WITH LOVE",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suscipit ultrices nunc. Cras ipsum dolor, eleifend",
    },
    {
      id: 3,
      image: "/images/h3-slide-3.jpg",
      title: "TOUCHED BY THE NATURE",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suscipit ultrices nunc. Cras ipsum dolor, eleifend",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [slides.length]);

  // Fade animation on slide change
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  const goToSlide = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
  };

  const currentSlide = slides[activeIndex];

  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Main Image with Text Overlay */}
        <div className="hero-image-wrapper">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              ref={(el) => {
                imageRefs.current[index] = el;
              }}
              className={`hero-slide-image ${index === activeIndex ? "active" : ""} ${isTransitioning ? "transitioning" : ""}`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                className="hero-image"
                sizes="(max-width: 1000px) 100vw, calc(100vw - 90px)"
              />
            </div>
          ))}
          
          {/* Text Overlay */}
          <div className={`hero-overlay ${isTransitioning ? "transitioning" : ""}`}>
            <h1 className="hero-title">{currentSlide.title}</h1>
            <div className="hero-divider"></div>
            <p className="hero-text">{currentSlide.text}</p>
            <Link href="/shop" className="hero-cta">LEARN MORE</Link>
          </div>
        </div>

        {/* Desktop: Right Side Navigation Controls */}
        <div className="hero-controls">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              className={`control-item ${index === activeIndex ? "active" : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              <span className="control-number">{String(index + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
