"use client";

import "./contact-section.css";

interface ContactSectionProps {
  title?: string;
  subtitle?: string;
  phone?: string;
  address?: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function ContactSection({
  title = "WE ARE AVAILABLE. INTERESTED IN COLLABORATION?",
  subtitle = "Get in touch.",
  phone,
  address,
  ctaText = "Contact Us",
  ctaLink = "/contact",
}: ContactSectionProps) {
  return (
    <section className="contact-section">
      <div className="contact-container">
        <div className="contact-content">
          <h2 className="contact-title">{title}</h2>
          {subtitle && <p className="contact-subtitle">{subtitle}</p>}
          <div className="contact-info">
            {phone && (
              <div className="contact-item">
                <h3 className="contact-label">contact</h3>
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="contact-value">
                  {phone}
                </a>
              </div>
            )}
            {address && (
              <div className="contact-item">
                <h3 className="contact-label">address</h3>
                <p className="contact-value">{address}</p>
              </div>
            )}
          </div>
          {ctaLink && (
            <a href={ctaLink} className="contact-cta">
              {ctaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

