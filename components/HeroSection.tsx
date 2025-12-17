"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import "./hero-section.css";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  backgroundImage: string;
  ctaText: string | null;
  ctaLink: string | null;
  order: number;
  active: boolean;
}

export default function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetchHeroSlides();
  }, []);

  const fetchHeroSlides = async () => {
    try {
      const response = await fetch('/api/hero-slides?activeOnly=true');
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        // Sort by order and filter active slides
        const sortedSlides = result.data
          .filter((slide: HeroSlide) => slide.active)
          .sort((a: HeroSlide, b: HeroSlide) => (a.order || 0) - (b.order || 0));
        setSlides(sortedSlides);
      }
    } catch (error) {
      console.error('Error fetching hero slides:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (slides.length === 0) return;
    
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

  if (loading) {
    return (
      <section className="hero-section">
        <div className="hero-container">
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999' }}>
            Loading hero slides...
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

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
                src={slide.backgroundImage || '/images/placeholder.jpg'}
                alt={slide.title}
                fill
                priority={index === 0}
                className="hero-image"
                sizes="(max-width: 1000px) 100vw, calc(100vw - 90px)"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/images/placeholder.jpg') {
                    target.src = '/images/placeholder.jpg';
                  }
                }}
              />
            </div>
          ))}
          
          {/* Text Overlay */}
          <div className={`hero-overlay ${isTransitioning ? "transitioning" : ""}`}>
            <h1 className="hero-title">{currentSlide.title}</h1>
            <div className="hero-divider"></div>
            <p className="hero-text">{currentSlide.description || currentSlide.subtitle || ''}</p>
            <Link href={currentSlide.ctaLink || '/shop'} className="hero-cta">
              {currentSlide.ctaText || 'LEARN MORE'}
            </Link>
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
