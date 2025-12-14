import MainNav from '@/components/MainNav'
import HeroSection from '@/components/HeroSection'
import ProductSection from '@/components/ProductSection'
import DesignersSection from '@/components/DesignersSection'
import BlogSection from '@/components/BlogSection'
import WorkshopSection from '@/components/WorkshopSection'
import GallerySection from '@/components/GallerySection'
import SearchSection from '@/components/SearchSection'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'

export default function Home() {
  return (
    <div>
      <MainNav />
      <HeroSection />
      <ProductSection />
      <DesignersSection />
      <BlogSection />
      <WorkshopSection />
      <GallerySection />
      <SearchSection />
      <Footer />
      <BackToTop />
    </div>
  )
}
