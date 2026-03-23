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
    title: post.metaTitle || `${post.title} - Oro Boats Blog`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
      type: "article",
      publishedTime: (post.publishedAt?.toISOString?.() ?? post.createdAt?.toISOString?.()),
      authors: [post.authorName || "Oro Boats"],
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

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <BlogPostContent post={post} />
      <Footer />
    </div>
  )
}
