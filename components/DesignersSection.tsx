"use client";

import Image from "next/image";
import Link from "next/link";
import "./designers-section.css";

export default function DesignersSection() {
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
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget
              dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes,
              nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.
            </p>

            <Link href="/about-us" className="read-more-button">
              READ MORE
            </Link>
          </div>

          <figure className="designers-media">
            <Image
              src="/images/about-us-img-1-1.jpg"
              alt="Designers Eva and Nina in the ceramic studio"
              width={600}
              height={800}
              className="designers-image"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}

