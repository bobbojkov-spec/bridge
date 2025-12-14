import MainNav from '@/components/MainNav'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'

export default function OurStores() {
  return (
    <div>
      <MainNav />
      <main style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '30px', textAlign: 'center' }}>Our Stores</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', marginTop: '40px' }}>
          <div style={{ padding: '30px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Main Store</h2>
            <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
              <strong>Address:</strong><br />
              123 Main Street<br />
              City, State 12345
            </p>
            <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
              <strong>Hours:</strong><br />
              Monday - Friday: 9:00 AM - 6:00 PM<br />
              Saturday: 10:00 AM - 4:00 PM<br />
              Sunday: Closed
            </p>
            <p style={{ lineHeight: '1.6' }}>
              <strong>Phone:</strong> (555) 123-4567
            </p>
          </div>
          <div style={{ padding: '30px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Downtown Location</h2>
            <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
              <strong>Address:</strong><br />
              456 Commerce Avenue<br />
              City, State 12345
            </p>
            <p style={{ marginBottom: '10px', lineHeight: '1.6' }}>
              <strong>Hours:</strong><br />
              Monday - Saturday: 10:00 AM - 8:00 PM<br />
              Sunday: 12:00 PM - 6:00 PM
            </p>
            <p style={{ lineHeight: '1.6' }}>
              <strong>Phone:</strong> (555) 234-5678
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}

