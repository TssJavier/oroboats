import { db } from "./index"
import { blogPosts } from "./schema"
import { eq, and, desc, sql } from "drizzle-orm"
import type { NewBlogPost } from "./schema"

// ===== BLOG POSTS =====

// Obtener todos los posts (admin)
export async function getAllBlogPosts() {
  try {
    console.log("🔍 DB: Fetching all blog posts...")
    const result = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt))
    console.log(`✅ DB: Found ${result.length} blog posts`)
    return result
  } catch (error) {
    console.error("❌ DB Error fetching blog posts:", error)
    throw error
  }
}

// Obtener posts publicados por idioma (frontend)
export async function getPublishedBlogPosts(language = "es") {
  try {
    console.log(`🔍 DB: Fetching published blog posts for language: ${language}`)
    const result = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.isPublished, true), eq(blogPosts.language, language)))
      .orderBy(desc(blogPosts.publishedAt))
    console.log(`✅ DB: Found ${result.length} published posts in ${language}`)
    return result
  } catch (error) {
    console.error(`❌ DB Error fetching published posts for ${language}:`, error)
    throw error
  }
}

// Obtener post destacado por idioma
export async function getFeaturedBlogPost(language = "es") {
  try {
    console.log(`🔍 DB: Fetching featured blog post for language: ${language}`)
    const result = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.isPublished, true), eq(blogPosts.isFeatured, true), eq(blogPosts.language, language)))
      .limit(1)
    console.log(`✅ DB: Featured post found: ${result.length > 0 ? result[0].title : "none"}`)
    return result[0] || null
  } catch (error) {
    console.error(`❌ DB Error fetching featured post for ${language}:`, error)
    throw error
  }
}

// Obtener post por slug
export async function getBlogPostBySlug(slug: string) {
  try {
    console.log(`🔍 DB: Fetching blog post by slug: ${slug}`)
    const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1)

    if (result.length > 0) {
      // Incrementar contador de vistas
      await db
        .update(blogPosts)
        .set({ views: sql`${blogPosts.views} + 1` })
        .where(eq(blogPosts.id, result[0].id))

      console.log(`✅ DB: Post found and view count updated: ${result[0].title}`)
      return { ...result[0], views: result[0].views + 1 }
    }

    console.log(`❌ DB: Post not found for slug: ${slug}`)
    return null
  } catch (error) {
    console.error(`❌ DB Error fetching post by slug ${slug}:`, error)
    throw error
  }
}

// Crear nuevo post
export async function createBlogPost(post: NewBlogPost) {
  try {
    console.log("🔍 DB: Creating blog post...")

    // Si es featured, quitar featured de otros posts del mismo idioma
    if (post.isFeatured) {
      await db
        .update(blogPosts)
        .set({ isFeatured: false })
        .where(eq(blogPosts.language, post.language || "es"))
    }

    const result = await db.insert(blogPosts).values(post).returning()
    console.log(`✅ DB: Blog post created with ID ${result[0].id}`)
    return result[0]
  } catch (error) {
    console.error("❌ DB Error creating blog post:", error)
    throw error
  }
}

// Actualizar post
export async function updateBlogPost(id: number, post: Partial<NewBlogPost>) {
  try {
    console.log(`🔍 DB: Updating blog post ${id}...`)

    // Si es featured, quitar featured de otros posts del mismo idioma
    if (post.isFeatured) {
      const currentPost = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1)
      if (currentPost.length > 0) {
        await db
          .update(blogPosts)
          .set({ isFeatured: false })
          .where(and(eq(blogPosts.language, currentPost[0].language), sql`${blogPosts.id} != ${id}`))
      }
    }

    const result = await db
      .update(blogPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning()
    console.log(`✅ DB: Blog post ${id} updated`)
    return result[0]
  } catch (error) {
    console.error(`❌ DB Error updating blog post ${id}:`, error)
    throw error
  }
}

// Eliminar post
export async function deleteBlogPost(id: number) {
  try {
    console.log(`🔍 DB: Deleting blog post ${id}...`)
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning()
    console.log(`✅ DB: Blog post ${id} deleted`)
    return result[0]
  } catch (error) {
    console.error(`❌ DB Error deleting blog post ${id}:`, error)
    throw error
  }
}

// Generar slug único
export async function generateUniqueSlug(title: string, language: string, excludeId?: number) {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()

  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await db
      .select()
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.slug, slug),
          eq(blogPosts.language, language),
          excludeId ? sql`${blogPosts.id} != ${excludeId}` : undefined,
        ),
      )
      .limit(1)

    if (existing.length === 0) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}
