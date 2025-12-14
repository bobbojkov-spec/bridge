"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import "./main-nav.css";

export default function MainNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  
  // Demo cart data - in a real app, this would come from state/context
  const cartItems = [
    {
      id: 1,
      name: "Handmade Ceramic Bowl",
      price: 45.00,
      quantity: 1,
      image: "/images/product-3-300x300.jpg"
    }
  ];

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${isSticky ? "is-sticky" : ""}`}>
      <div className="site-header-inner">

        {/* MOBILE: hamburger on the LEFT */}
        <button
          className="mobile-toggle"
          aria-label="Toggle navigation"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span />
        </button>

        {/* LOGO: desktop = left in flow, mobile = centered by grid */}
        <div className="logo-wrap">
          <Link href="/" className="logo-link">
            <Image
              src="/images/Tonda-logo-heder.png"
              alt="Tonda"
              width={118}
              height={24}
              priority
            />
          </Link>
        </div>

        {/* DESKTOP MENU - CENTERED */}
        <nav className="main-menu" aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/about-us">About Us</Link>
          <Link href="/our-stores">Our Stores</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/blog">Blog</Link>
        </nav>

        {/* RIGHT SIDE: icons only */}
        <div className="right-wrap">
          <div className="nav-icons">
            {/* CART */}
            <div className="cart-wrapper">
              <button 
                className="icon-btn cart-btn" 
                aria-label="Cart"
                onClick={() => setCartOpen(!cartOpen)}
              >
                <svg viewBox="0 0 24 24" className="icon-svg">
                  <path d="M3 4h2l2 12h10l2-8H8" 
                    fill="none" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="19" r="1.2" />
                  <circle cx="17" cy="19" r="1.2" />
                </svg>
                <span className="cart-badge">{cartItems.length}</span>
              </button>

              {/* CART DROPDOWN */}
              {cartOpen && (
                <>
                  <div className="cart-overlay" onClick={() => setCartOpen(false)} />
                  <div className="cart-dropdown">
                    <div className="cart-header">
                      <h3 className="cart-title">Shopping Cart</h3>
                      <button 
                        className="cart-close" 
                        onClick={() => setCartOpen(false)}
                        aria-label="Close cart"
                      >
                        <svg viewBox="0 0 24 24" className="icon-svg">
                          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    <div className="cart-content">
                      {cartItems.length === 0 ? (
                        <p className="cart-empty">No products in the cart.</p>
                      ) : (
                        <>
                          <div className="cart-items">
                            {cartItems.map((item) => (
                              <div key={item.id} className="cart-item">
                                <div className="cart-item-image">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={80}
                                    height={80}
                                    style={{ objectFit: 'cover' }}
                                  />
                                </div>
                                <div className="cart-item-details">
                                  <h4 className="cart-item-name">{item.name}</h4>
                                  <div className="cart-item-meta">
                                    <span className="cart-item-quantity">{item.quantity} ×</span>
                                    <span className="cart-item-price">${item.price.toFixed(2)}</span>
                                  </div>
                                </div>
                                <button 
                                  className="cart-item-remove"
                                  aria-label="Remove item"
                                >
                                  <svg viewBox="0 0 24 24" className="icon-svg">
                                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="cart-footer">
                            <div className="cart-total">
                              <span className="cart-total-label">Total:</span>
                              <span className="cart-total-amount">
                                ${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="cart-actions">
                              <Link href="/cart" className="cart-button cart-button-view">
                                View Cart
                              </Link>
                              <Link href="/checkout" className="cart-button cart-button-checkout">
                                Checkout
                              </Link>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* SEARCH */}
            <button className="icon-btn" aria-label="Search">
              <svg viewBox="0 0 24 24" className="icon-svg">
                <circle cx="11" cy="11" r="6"
                  stroke="currentColor" strokeWidth="1.6" fill="none" />
                <line x1="15" y1="15" x2="20" y2="20"
                  stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" />
              </svg>
            </button>

            {/* SANDWICH / SIDEBAR MENU OPENER (Desktop only) */}
            <button 
              className="icon-btn sidebar-toggle desktop-only" 
              aria-label="Open side menu"
              onClick={() => setSidebarOpen(true)}
            >
              <svg viewBox="0 0 24 24" className="icon-svg">
                <line x1="4" y1="8" x2="20" y2="8"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="4" y1="12" x2="20" y2="12"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="4" y1="16" x2="20" y2="16"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE NAV DRAWER */}
      <nav
        className={`mobile-nav ${mobileOpen ? "open" : ""}`}
        aria-label="Mobile navigation"
      >
        <Link href="/">Home</Link>
        <Link href="/about-us">About Us</Link>
        <Link href="/our-stores">Our Stores</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/blog">Blog</Link>
      </nav>

      {/* DESKTOP RIGHT SIDEBAR (Social Panel) */}
      {sidebarOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className={`sidebar-panel ${sidebarOpen ? "open" : ""}`}>
            <button 
              className="sidebar-close" 
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <svg viewBox="0 0 24 24" className="icon-svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            <div className="sidebar-content">
              <div className="sidebar-logo">
                <Image
                  src="/images/Tonda-logo-heder.png"
                  alt="Tonda"
                  width={118}
                  height={24}
                />
              </div>

              <p className="sidebar-tagline">Lorem ipsum dolor sit amet</p>

              <div className="sidebar-social">
                <a href="#" aria-label="Vimeo">v</a>
                <a href="#" aria-label="Behance">Bē</a>
                <a href="#" aria-label="Facebook">f</a>
                <a href="#" aria-label="Twitter">𝕏</a>
              </div>

              <nav className="sidebar-nav">
                <Link href="/" onClick={() => setSidebarOpen(false)}>HOME</Link>
                <Link href="/about-us" onClick={() => setSidebarOpen(false)}>ABOUT US</Link>
                <Link href="/our-stores" onClick={() => setSidebarOpen(false)}>OUR STORES</Link>
                <Link href="/shop" onClick={() => setSidebarOpen(false)}>SHOP</Link>
                <Link href="/blog" onClick={() => setSidebarOpen(false)}>BLOG</Link>
              </nav>
            </div>
          </aside>
        </>
      )}

    </header>
  );
}

