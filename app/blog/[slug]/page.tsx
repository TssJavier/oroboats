import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/db/blog-queries"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { BlogPostContent } from "@/components/blog/blog-post-content"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface BlogPostPageProps {
  params: Promise<{ slug: string }> // ✅ MUY IMPORTANTE: Asegúrate de que el tipo sea Promise
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params // ✅ MUY IMPORTANTE: Await params aquí
  console.log("🔍 generateMetadata: Fetching post for slug:", slug) // <-- ESTE LOG
  const post = await getBlogPostBySlug(slug)

  if (post) {
    console.log("✅ generateMetadata: Post found:", post?.title) // <-- ESTE LOG
  } else {
    console.log("❌ generateMetadata: Post not found for slug:", slug) // <-- ESTE LOG
  }

  if (!post) {
    return {
      title: "Post no encontrado - Oro Boats",
    }
  }

  return {
    title: post.metaTitle || `${post.title} - OroBoats Blog`,
    description: post.metaDescription || post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      images: post.featuredImage ? [post.featuredImage] : [],
      type: "article",
      publishedTime: (post.publishedAt?.toISOString?.() ?? post.createdAt?.toISOString?.()),
      authors: [post.authorName || "OroBoats"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription || post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  }
}

// Permite que slugs no pre-generados se resuelvan en el servidor (nuevos artículos sin redeploy)
export const dynamic = "force-dynamic"

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  console.log("🔍 BlogPostPage: Fetching post for slug:", slug) // <-- ESTE LOG
  console.log("✅ Test Page: Received slug:", slug) // <-- Nuevo log de prueba

  if (!slug) {
    notFound()
  }

  const post = await getBlogPostBySlug(slug)

  if (post && post.isPublished) {
    console.log("✅ BlogPostPage: Post found and published:", post?.title) // <-- ESTE LOG
  } else {
    console.log("❌ BlogPostPage: Post not found or not published for slug:", slug) // <-- ESTE LOG
  }

  if (!post || !post.isPublished) {
    notFound()
  }

  const baseUrl = "https://www.oroboats.com"
  const postUrl = `${baseUrl}/blog/${post.slug}`
  const publishedISO = post.publishedAt?.toISOString?.() ?? post.createdAt?.toISOString?.()
  const modifiedISO = post.updatedAt?.toISOString?.() ?? publishedISO

  // ✅ Datos estructurados: artículo + migas de pan (para rich results en Google)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    datePublished: publishedISO,
    dateModified: modifiedISO,
    inLanguage: post.language,
    author: { "@type": "Organization", name: post.authorName || "OroBoats" },
    publisher: {
      "@type": "Organization",
      name: "OroBoats",
      logo: { "@type": "ImageObject", url: `${baseUrl}/apple-touch-icon.png` },
    },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navigation />
      <BlogPostContent post={post} />
      <Footer />
    </div>
  )
}
