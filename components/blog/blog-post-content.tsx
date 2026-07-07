"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Eye, User, ArrowLeft, Share2, Star, Ship, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useApp } from "@/components/providers"
import type { BlogPost } from "@/lib/db/schema"

interface BlogPostContentProps {
  post: BlogPost
}

const translations = {
  es: {
    backToBlog: "Volver al Blog",
    by: "Por",
    published: "Publicado el",
    readingTime: "min de lectura",
    views: "vistas",
    share: "Compartir",
    featured: "Destacado",
    relatedPosts: "Artículos Relacionados",
    ctaTitle: "¿List@ para lanzarte al agua?",
    ctaText:
      "Barcos y motos de agua, con o sin licencia, en La Herradura, Carboneras e Ibiza. Reserva online en un par de minutos.",
    ctaButton: "Alquilar barco o moto de agua",
    floatingCta: "Alquila tu barco o moto",
  },
  en: {
    backToBlog: "Back to Blog",
    by: "By",
    published: "Published on",
    readingTime: "min read",
    views: "views",
    share: "Share",
    featured: "Featured",
    relatedPosts: "Related Articles",
    ctaTitle: "Ready to hit the water?",
    ctaText:
      "Boats and jet skis, with or without a licence, in La Herradura, Carboneras and Ibiza. Book online in a couple of minutes.",
    ctaButton: "Rent a boat or jet ski",
    floatingCta: "Rent a boat or jet ski",
  },
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  const { language } = useApp()
  const t = translations[language]
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    // Cargar posts relacionados
    fetchRelatedPosts()
  }, [post.id, language])

  const fetchRelatedPosts = async () => {
    try {
      const response = await fetch(`/api/blog?published=true&language=${post.language}`)
      if (response.ok) {
        const allPosts = await response.json()
        // Filtrar el post actual y tomar los 3 más recientes
        const related = allPosts.filter((p: BlogPost) => p.id !== post.id).slice(0, 3)
        setRelatedPosts(related)
      }
    } catch (error) {
      console.error("Error fetching related posts:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copiar URL al portapapeles
      navigator.clipboard.writeText(window.location.href)
      alert("URL copiada al portapapeles")
    }
  }

  return (
    <article className="py-24 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="outline" className="hover:bg-gray-50 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.backToBlog}
            </Button>
          </Link>
        </div>

        {/* Post Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={post.language === "es" ? "default" : "secondary"}>
              {post.language === "es" ? "🇪🇸 Español" : "🇬🇧 English"}
            </Badge>
            {post.isFeatured && (
              <Badge className="bg-yellow-500 text-white">
                <Star className="h-3 w-3 mr-1" />
                {t.featured}
              </Badge>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">{post.title}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">{post.excerpt}</p>

          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
            <span className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              {t.by} {post.authorName}
            </span>
            <span className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            <span className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              {post.readingTime} {t.readingTime}
            </span>
            <span className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              {post.views} {t.views}
            </span>
            <Button variant="outline" size="sm" onClick={handleShare} className="ml-auto bg-transparent">
              <Share2 className="h-4 w-4 mr-2" />
              {t.share}
            </Button>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-12">
              <Image
                src={post.featuredImage || "/placeholder.svg"}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </header>

        {/* Post Content */}
        <div className="max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: post.content }} className="blog-content" />
        </div>

        {/* CTA de reserva al final del artículo */}
        <div className="my-12 rounded-2xl bg-black text-white p-8 md:p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{t.ctaTitle}</h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">{t.ctaText}</p>
          <Link href="/boats">
            <Button className="bg-gold text-black hover:bg-yellow-400 font-bold text-base md:text-lg px-8 py-6 h-auto">
              <Ship className="h-5 w-5 mr-2" />
              {t.ctaButton}
            </Button>
          </Link>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-black mb-8">{t.relatedPosts}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.id} className="hover:shadow-lg transition-shadow">
                  {relatedPost.featuredImage && (
                    <div className="relative h-32 overflow-hidden">
                      <Image
                        src={relatedPost.featuredImage || "/placeholder.svg"}
                        alt={relatedPost.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-black mb-2 line-clamp-2">{relatedPost.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{relatedPost.excerpt}</p>
                    <Link href={`/blog/${relatedPost.slug}`}>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Leer más
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Espaciador para que la barra flotante no tape el contenido en móvil */}
        <div className="h-24 sm:h-0" />
      </div>

      {/* Banner flotante CTA: barra inferior en móvil, botón flotante en escritorio */}
      <div className="fixed z-40 inset-x-0 bottom-0 sm:inset-x-auto sm:right-6 sm:bottom-6 print:hidden">
        <Link
          href="/boats"
          className="flex items-center justify-center gap-2 bg-gold text-black font-bold shadow-2xl px-5 py-4 hover:bg-yellow-400 transition-colors sm:rounded-full sm:px-6 sm:py-3"
        >
          <Ship className="h-5 w-5 shrink-0" />
          <span>{t.floatingCta}</span>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </Link>
      </div>
    </article>
  )
}
