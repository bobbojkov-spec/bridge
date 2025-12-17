import { NextRequest, NextResponse } from 'next/server';
import { createNewsArticle, getNewsArticleBySlug, updateNewsArticle } from '@/lib/db/repositories/news';

// POST /api/news/generate-initial - Generate initial 3 news articles from BlogSection
export async function POST(request: NextRequest) {
  try {
    const articles = [
      {
        title: "Japan Design 2023: Handmade Ceramic Ideas",
        slug: "japan-design-2023",
        subtitle: "Exploring innovative ceramic design trends from Japan",
        featured_image: "/images/blog-1s-413x647.jpg",
        excerpt: "Discover the latest handmade ceramic ideas and techniques from Japan Design 2023.",
        content: `Japan Design 2023 showcased an incredible array of handmade ceramic ideas that blend traditional techniques with modern innovation. This year's exhibition featured over 200 artists from across Japan, each bringing their unique perspective to ceramic art.

The event highlighted several key trends:
- **Minimalist Aesthetics**: Many artists embraced clean lines and simple forms, focusing on the natural beauty of the clay itself.
- **Sustainable Practices**: A strong emphasis on eco-friendly materials and processes.
- **Cultural Fusion**: Traditional Japanese techniques combined with contemporary design sensibilities.

Visitors were particularly drawn to the functional art pieces that seamlessly blend utility with artistic expression. From tea sets that honor centuries-old traditions to modern vases that push the boundaries of form, the exhibition demonstrated the versatility and enduring appeal of ceramic art.

The featured artists shared their insights during workshops and panel discussions, making this not just an exhibition but a learning experience for ceramic enthusiasts of all levels.`,
        cta_text: "Read More",
        cta_link: null, // Will link to detail page
        order: 0,
        active: true,
        publish_status: 'published' as const,
        publish_date: new Date('2023-12-14'),
        author: "Nina Marling",
        meta_title: "Japan Design 2023: Handmade Ceramic Ideas | Bridge Studio",
        meta_description: "Discover innovative handmade ceramic ideas and techniques from Japan Design 2023. Explore traditional and modern ceramic art.",
      },
      {
        title: "London Design 2023: Make Unique Handmade Mugs",
        slug: "london-design-2023",
        subtitle: "Crafting personalized ceramic mugs with character",
        featured_image: "/images/blog-2s-413x647.jpg",
        excerpt: "Learn how to create unique handmade mugs that reflect your personal style and craftsmanship.",
        content: `London Design 2023 brought together ceramic artists and enthusiasts for an inspiring exploration of handmade mug design. The workshop series focused on creating functional pieces that are both beautiful and personal.

Key techniques covered:
- **Throwing on the Wheel**: Mastering the fundamentals of creating consistent shapes.
- **Hand Building**: Alternative methods for those who prefer a more tactile approach.
- **Surface Decoration**: Glazing techniques, carving, and texture application.
- **Personalization**: Adding unique touches that make each piece one-of-a-kind.

Participants learned that the best mugs aren't just containers for beverages—they're an extension of the morning ritual, a moment of comfort, and a reflection of the maker's personality. The workshop emphasized the importance of ergonomics, ensuring that each mug feels comfortable in the hand.

The event also featured a gallery of exceptional mug designs from contemporary ceramic artists, showcasing everything from minimalist Scandinavian-inspired pieces to bold, colorful creations that celebrate individuality.`,
        cta_text: "Read More",
        cta_link: null,
        order: 1,
        active: true,
        publish_status: 'published' as const,
        publish_date: new Date('2023-12-15'),
        author: "Nina Marling",
        meta_title: "London Design 2023: Make Unique Handmade Mugs | Bridge Studio",
        meta_description: "Learn to create unique handmade ceramic mugs. Workshop techniques and design inspiration from London Design 2023.",
      },
      {
        title: "Japan Design 2023: Color Inspo For All Visual Arts",
        slug: "japan-design-color-inspo",
        subtitle: "Color palettes and inspiration from Japanese design",
        featured_image: "/images/blog-3s-413x647.jpg",
        excerpt: "Explore stunning color combinations and palettes inspired by Japanese design principles.",
        content: `Color plays a crucial role in Japanese design, and Japan Design 2023 offered a masterclass in how to use color effectively across all visual arts. The color theory sessions were among the most popular at the event.

**Traditional Color Palettes:**
- **Wabi-Sabi Neutrals**: Earthy tones that celebrate imperfection and natural beauty.
- **Seasonal Colors**: Palettes inspired by Japan's distinct four seasons.
- **Ceramic Glazes**: How traditional firing techniques create unique color variations.

**Modern Applications:**
Contemporary artists are reinterpreting traditional color relationships for modern contexts. The exhibition featured stunning examples of how classic Japanese color combinations can work in contemporary ceramics, textiles, and graphic design.

The color inspiration sessions were particularly valuable for ceramic artists, as they explored how different glazes interact with various clay bodies and firing temperatures. Participants learned about creating depth through layered glazes and how to achieve specific color effects through controlled oxidation and reduction firing.

The event also included a digital color palette generator that translated physical ceramic samples into digital color swatches, making it easy to apply these inspirations to other design projects.`,
        cta_text: "Read More",
        cta_link: null,
        order: 2,
        active: true,
        publish_status: 'published' as const,
        publish_date: new Date('2023-12-16'),
        author: "Nina Marling",
        meta_title: "Japan Design 2023: Color Inspiration for Visual Arts | Bridge Studio",
        meta_description: "Discover color palettes and design inspiration from Japan Design 2023. Learn about traditional and modern color applications.",
      },
    ];

    const created = [];
    const updated = [];
    const skipped: string[] = [];
    const errors = [];

    for (const article of articles) {
      try {
        // Check if article with this slug already exists
        const existing = await getNewsArticleBySlug(article.slug);
        
        if (existing) {
          // Update existing article
          await updateNewsArticle(existing.id, {
            title: article.title,
            subtitle: article.subtitle || null,
            featured_image: article.featured_image || null,
            excerpt: article.excerpt || null,
            content: article.content || null,
            cta_text: article.cta_text || null,
            cta_link: article.cta_link || null,
            order: article.order || 0,
            active: article.active !== undefined ? article.active : true,
            publish_status: article.publish_status || 'draft',
            publish_date: article.publish_date ? new Date(article.publish_date) : null,
            author: article.author || null,
            meta_title: article.meta_title || null,
            meta_description: article.meta_description || null,
          });
          updated.push({ id: existing.id, title: article.title });
        } else {
          // Create new article
          const articleId = await createNewsArticle(article);
          if (articleId > 0) {
            created.push({ id: articleId, title: article.title });
          } else {
            errors.push({ title: article.title, error: 'Failed to create article (insertId was 0)' });
          }
        }
      } catch (error: any) {
        console.error(`Error processing article "${article.title}":`, error);
        console.error('Error stack:', error.stack);
        console.error('Article data:', JSON.stringify(article, null, 2));
        errors.push({ 
          title: article.title, 
          error: error.message || String(error),
          details: error.code || error.errno || undefined,
        });
      }
    }

    return NextResponse.json({
      success: created.length > 0 || updated.length > 0,
      message: `Created ${created.length} new articles, updated ${updated.length} existing articles. ${errors.length} failed.`,
      created,
      updated,
      skipped: skipped.length > 0 ? skipped : undefined,
      errors: errors.length > 0 ? errors : undefined,
      totalAttempted: articles.length,
    });
  } catch (error: any) {
    console.error('Error generating initial news articles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate initial news articles',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

