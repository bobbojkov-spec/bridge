import MainNav from '@/components/MainNav'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import BlogSection from '@/components/BlogSection'

export default function Blog() {
  return (
    <div>
      <MainNav />
      <main style={{ paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px', padding: '0 20px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Blog</h1>
          <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            Stay updated with our latest news, design tips, and product features.
          </p>
        </div>
        <BlogSection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}

