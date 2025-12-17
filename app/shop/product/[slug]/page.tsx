import MainNav from '@/components/MainNav'
import ProductDetail from '@/components/ProductDetail'
import RelatedProducts from '@/components/RelatedProducts'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  
  return (
    <div>
      <MainNav />
      <ProductDetail slug={slug} />
      <RelatedProducts currentProductSlug={slug} />
      <Footer />
      <BackToTop />
    </div>
  )
}

