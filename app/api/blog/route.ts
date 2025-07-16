import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  getAllBlogPosts,
  getPublishedBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  generateUniqueSlug,
} from "@/lib/db/blog-queries"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get("language") || "es"
    const published = searchParams.get("published")
    const admin = searchParams.get("admin")

    console.log("🔍 API: Fetching blog posts...", { language, published, admin })

    let posts
    if (admin === "true") {
      // Admin: obtener todos los posts
      posts = await getAllBlogPosts()
    } else if (published === "true") {
      // Frontend: solo posts publicados
      posts = await getPublishedBlogPosts(language)
    } else {
      // Por defecto: posts publicados
      posts = await getPublishedBlogPosts(language)
    }

    console.log(`✅ API: Returning ${posts.length} blog posts`)
    return NextResponse.json(posts)
  } catch (error) {
    console.error("❌ API Error fetching blog posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog posts", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 API: Creating new blog post...")
    const postData = await request.json()

    // Generar slug único
    const slug = await generateUniqueSlug(postData.title, postData.language || "es")

    // Calcular tiempo de lectura estimado (aproximadamente 200 palabras por minuto)
    const wordCount = postData.content.split(/\s+/).length
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))

    const newPost = {
      ...postData,
      slug,
      readingTime,
      publishedAt: postData.isPublished ? new Date() : null,
    }

    const post = await createBlogPost(newPost)
    console.log("✅ Blog post created successfully:", post.id)

    return NextResponse.json({
      success: true,
      post,
      message: "Post creado exitosamente",
    })
  } catch (error) {
    console.error("❌ Error creating blog post:", error)
    return NextResponse.json(
      {
        error: "Failed to create blog post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    console.log(`🔄 API: Updating blog post ${id}...`)
    const postData = await request.json()

    // Si se cambió el título, regenerar slug
    if (postData.title) {
      postData.slug = await generateUniqueSlug(postData.title, postData.language || "es", Number.parseInt(id))
    }

    // Recalcular tiempo de lectura si se cambió el contenido
    if (postData.content) {
      const wordCount = postData.content.split(/\s+/).length
      postData.readingTime = Math.max(1, Math.ceil(wordCount / 200))
    }

    // Actualizar publishedAt si se está publicando por primera vez
    if (postData.isPublished && !postData.publishedAt) {
      postData.publishedAt = new Date()
    }

    const post = await updateBlogPost(Number.parseInt(id), postData)
    console.log("✅ Blog post updated successfully:", post.id)

    return NextResponse.json({
      success: true,
      post,
      message: "Post actualizado exitosamente",
    })
  } catch (error) {
    console.error("❌ Error updating blog post:", error)
    return NextResponse.json(
      {
        error: "Failed to update blog post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    console.log(`🔄 API: Deleting blog post ${id}...`)
    await deleteBlogPost(Number.parseInt(id))
    console.log("✅ Blog post deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Post eliminado exitosamente",
    })
  } catch (error) {
    console.error("❌ Error deleting blog post:", error)
    return NextResponse.json(
      {
        error: "Failed to delete blog post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
