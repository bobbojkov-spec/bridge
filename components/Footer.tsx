"use client";

import Link from "next/link";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-widgets">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Contact Widget */}
            <section className="footer-widget footer-contact" aria-labelledby="footer-contact-heading">
              <h2 id="footer-contact-heading" className="footer-heading">contact</h2>
              <p className="footer-contact-item">
                <a href="tel:+1123456789">+1123456789</a>
              </p>
              <p className="footer-contact-item">
                <a href="https://www.google.com/maps" rel="noopener" target="_blank">
                  1316 Abbot Kinney Blvd. Copenhagen CA 90291
                </a>
              </p>
            </section>

            {/* Help Links */}
            <section className="footer-widget footer-help" aria-labelledby="footer-help-heading">
              <h2 id="footer-help-heading" className="footer-heading">Help</h2>
              <ul className="footer-links">
                <li><Link href="/faqs">FAQ's</Link></li>
                <li><Link href="/pricing-plans">Pricing Plans</Link></li>
                <li><Link href="/track-order">Track Your Order</Link></li>
                <li><Link href="/returns">Returns</Link></li>
              </ul>
            </section>

            {/* About Us Links */}
            <section className="footer-widget footer-about" aria-labelledby="footer-about-heading">
              <h2 id="footer-about-heading" className="footer-heading">About Us</h2>
              <ul className="footer-links">
                <li><Link href="/our-story">Our Story</Link></li>
                <li><Link href="/jobs">Job Opportunities</Link></li>
                <li><Link href="/store-locator">Store Locator</Link></li>
                <li><Link href="/contact-us">Contact Us</Link></li>
              </ul>
            </section>

            {/* Customer Services Links */}
            <section className="footer-widget footer-customer-service" aria-labelledby="footer-customer-heading">
              <h2 id="footer-customer-heading" className="footer-heading">Customer Services</h2>
              <ul className="footer-links">
                <li><Link href="/my-account">My Account</Link></li>
                <li><Link href="/terms-of-use">Terms of Use</Link></li>
                <li><Link href="/deliveries-returns">Deliveries & Returns</Link></li>
                <li><Link href="/gift-card">Gift card</Link></li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <p className="footer-copy">
            © 2024 <a href="https://qodeinteractive.com" rel="noopener" target="_blank">QODE INTERACTIVE</a>, ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </footer>
  );
}
