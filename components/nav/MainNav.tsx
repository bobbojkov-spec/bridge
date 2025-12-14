"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import "./main-nav.css";

export default function MainNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${isSticky ? "is-sticky" : ""}`}>
      <div className="site-header-inner">

        {/* MOBILE: HAMBURGER LEFT */}
        <button
          className="mobile-toggle"
          aria-label="Toggle mobile menu"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span></span>
        </button>

        {/* MOBILE + DESKTOP: LOGO CENTER ON MOBILE, LEFT ON DESKTOP */}
        <div className="logo-wrap">
          <Link href="/">
            <Image 
              src="/images/Tonda-logo-heder.png" 
              alt="Bridge" 
              width={120}
              height={40}
              priority
              className="logo-img"
            />
          </Link>
        </div>

        {/* DESKTOP MENU + ICONS (RIGHT) */}
        <div className="right-wrap">
          <nav className="main-menu" aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/about-us">About Us</Link>
            <Link href="/our-stores">Our Stores</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/blog">Blog</Link>
          </nav>

          <div className="icons">
            <button className="icon-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21L16.65 16.65"/>
              </svg>
            </button>
            <Link href="/cart" className="icon-btn" aria-label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z"/>
                <path d="M3 6H21"/>
                <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* MOBILE NAV DRAWER */}
      <nav className={`mobile-nav ${mobileOpen ? "open" : ""}`}>
        <Link href="/">Home</Link>
        <Link href="/about-us">About Us</Link>
        <Link href="/our-stores">Our Stores</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/blog">Blog</Link>
      </nav>
    </header>
  );
}
