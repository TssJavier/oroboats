import { pgTable, serial, text, varchar, boolean, timestamp, jsonb, integer, relations } from "drizzle-orm/pg-core"

// ✅ TABLAS EXISTENTES (mantener las que ya tienes)
// Aquí van tus tablas existentes como vehicles, bookings, etc.

// ✅ NUEVA TABLA: Posts del blog
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(), // URL amigable
  excerpt: text("excerpt").notNull(), // Resumen corto
  content: text("content").notNull(), // Contenido completo en markdown/HTML
  featuredImage: text("featured_image").default("https://source.unsplash.com/random/800x600/?boat,beach,summer"), // URL de imagen destacada
  language: varchar("language", { length: 2 }).notNull().default("es"), // 'es' | 'en'
  isFeatured: boolean("is_featured").default(false), // Solo uno puede ser featured por idioma
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  metaTitle: text("meta_title"), // SEO
  metaDescription: text("meta_description"), // SEO
  tags: jsonb("tags").default([]), // Array de tags
  readingTime: integer("reading_time").default(5), // Tiempo estimado de lectura en minutos
  views: integer("views").default(0), // Contador de vistas
  authorName: text("author_name").default("Oro Boats"),
  authorEmail: text("author_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Relaciones
export const blogPostsRelations = relations(blogPosts, ({ many }) => ({
  // Si en el futuro queremos comentarios o categorías
}))

// ✅ TIPOS TYPESCRIPT EXPORTADOS
export type BlogPost = typeof blogPosts.$inferSelect
export type NewBlogPost = typeof blogPosts.$inferInsert
