'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
          <Link href="/shop" className="logo">
            <Image 
              src="/images/Tonda-logo-heder.png" 
              alt="Bridge" 
              width={120}
              height={28}
              priority
              style={{ height: '28px', width: 'auto' }}
            />
          </Link>

          <nav className="nav-links">
            <Link href="/shop">Home</Link>
            <Link href="/about-us">About Us</Link>
            <Link href="/our-stores">Our Stores</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/blog">Blog</Link>
          </nav>

          <div className="actions">
            <button className="icon-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21L16.65 16.65"/>
              </svg>
            </button>
            <Link href="/cart" className="icon-btn" aria-label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z"/>
                <path d="M3 6H21"/>
                <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"/>
              </svg>
            </Link>
          </div>

          <button 
            className="hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12H21M3 6H21M3 18H21"/>
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-drawer">
            <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/about-us" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            <Link href="/our-stores" onClick={() => setMobileMenuOpen(false)}>Our Stores</Link>
            <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
          </div>
        )}
      </header>

      <style jsx>{`
        .header {
          position: sticky;
          top: 0;
          width: 100%;
          background: #FFFFFF;
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: height 0.25s ease, padding 0.25s ease, box-shadow 0.25s ease;
          padding: 0 40px;
          z-index: 1000;
        }

        .header.scrolled {
          height: 64px;
          padding: 0 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }

        .header-inner {
          max-width: 1440px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          transition: transform 0.25s ease;
        }

        .header.scrolled .logo {
          transform: scale(0.92);
        }

        .nav-links {
          display: flex;
          gap: 32px;
          font-family: Inter, sans-serif;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.5px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .nav-links a {
          color: #111827;
          text-decoration: none;
          transition: color 0.25s ease;
        }

        .nav-links a:hover {
          color: #D97757;
        }

        .actions {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .icon-btn {
          background: transparent;
          border: none;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111827;
          text-decoration: none;
        }

        .icon-btn:hover {
          background: rgba(0,0,0,0.04);
        }

        .hamburger {
          display: none;
          background: transparent;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: #111827;
        }

        .mobile-drawer {
          display: none;
        }

        @media (max-width: 768px) {
          .header {
            padding: 0 24px;
          }

          .header.scrolled {
            padding: 0 24px;
          }

          .nav-links {
            display: none;
          }

          .actions {
            display: none;
          }

          .hamburger {
            display: block;
          }

          .mobile-drawer {
            display: block;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #FFFFFF;
            animation: slideDown 0.3s ease;
            padding-top: 24px;
          }

          .mobile-drawer a {
            display: block;
            padding: 16px 24px;
            border-bottom: 1px solid #E5E7EB;
            font-family: Inter, sans-serif;
            font-size: 18px;
            font-weight: 500;
            color: #111827;
            text-decoration: none;
            transition: color 0.25s ease;
          }

          .mobile-drawer a:first-child {
            margin-top: 0;
          }

          .mobile-drawer a:hover {
            color: #D97757;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
