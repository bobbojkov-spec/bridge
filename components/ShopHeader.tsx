"use client";

import Image from "next/image";
import "./shop-header.css";

export default function ShopHeader() {
  return (
    <section className="shop-header">
      <div className="shop-header-image-wrapper">
        <Image
          src="/images/title-img-3.jpg"
          alt="Shop"
          fill
          priority
          className="shop-header-image"
        />
        <div className="shop-header-overlay">
          <h1 className="shop-header-title">SHOP</h1>
        </div>
      </div>
    </section>
  );
}


