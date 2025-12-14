"use client";

import "./search-section.css";

export default function SearchSection() {
  return (
    <section className="search-section">
      <div className="search-container">
        <form className="search-form" role="search">
          <label htmlFor="search-input" className="search-label">SEARCH</label>
          <input
            type="search"
            id="search-input"
            name="search"
            placeholder="SEARCH HERE"
            className="search-input"
            aria-label="Search"
          />
          <button type="submit" className="search-button" aria-label="Submit search">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="search-icon"
            >
              <circle cx="11" cy="11" r="6" />
              <line x1="15" y1="15" x2="20" y2="20" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}


