import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getBlogPostBySlug, getFeaturedBlogPost } from "@/lib/db/blog-queries"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params // ✅ Asegúrate de que esta línea esté aquí
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get("language") || "es"

    console.log(`🔍 API: Fetching blog post by slug: ${slug}`)

    if (slug === "featured") {
      // Obtener post destacado
      const post = await getFeaturedBlogPost(language)
      if (!post) {
        return NextResponse.json({ error: "Featured post not found" }, { status: 404 })
      }
      return NextResponse.json(post)
    } else {
      // Obtener post por slug
      const post = await getBlogPostBySlug(slug)
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }
      return NextResponse.json(post)
    }
  } catch (error) {
    console.error(`❌ API Error fetching blog post ${slug}:`, error)
    return NextResponse.json(
      { error: "Failed to fetch blog post", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
