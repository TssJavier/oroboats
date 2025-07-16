"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Eye, Search, Star, ArrowRight, User, Globe, BookOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useApp } from "@/components/providers"
import type { BlogPost } from "@/lib/db/schema"

interface BlogSectionProps {
  showLanguageSelector?: boolean
}

const translations = {
  es: {
    title: "Nuestro Blog",
    subtitle: "Descubre consejos, noticias y experiencias sobre deportes acuáticos",
    featuredPost: "Artículo Destacado",
    latestPosts: "Últimos Artículos",
    readMore: "Leer Más",
    readingTime: "min de lectura",
    views: "vistas",
    searchPlaceholder: "Buscar artículos...",
    noResults: "No se encontraron artículos",
    loadMore: "Cargar Más",
    by: "Por",
    published: "Publicado el",
    featured: "Destacado",
    selectLanguage: "Idioma",
    spanish: "Español",
    english: "English",
    allPosts: "Todos los Artículos",
    backToBlog: "Volver al Blog",
  },
  en: {
    title: "Our Blog",
    subtitle: "Discover tips, news and experiences about water sports",
    featuredPost: "Featured Article",
    latestPosts: "Latest Articles",
    readMore: "Read More",
    readingTime: "min read",
    views: "views",
    searchPlaceholder: "Search articles...",
    noResults: "No articles found",
    loadMore: "Load More",
    by: "By",
    published: "Published on",
    featured: "Featured",
    selectLanguage: "Language",
    spanish: "Español",
    english: "English",
    allPosts: "All Articles",
    backToBlog: "Back to Blog",
  },
}

export function BlogSection({ showLanguageSelector = true }: BlogSectionProps) {
  const { language, setLanguage } = useApp()
  const t = translations[language]

  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBlogData()
  }, [language])

  const fetchBlogData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener post destacado
      const featuredResponse = await fetch(`/api/blog/featured?language=${language}`)
      if (featuredResponse.ok) {
        const featured = await featuredResponse.json()
        setFeaturedPost(featured)
      }

      // Obtener todos los posts publicados
      const postsResponse = await fetch(`/api/blog?published=true&language=${language}`)
      if (postsResponse.ok) {
        const allPosts = await postsResponse.json()
        // Filtrar el post destacado de la lista general
        const regularPosts = allPosts.filter((post: BlogPost) => !post.isFeatured)
        setPosts(regularPosts)
      }
    } catch (err) {
      console.error("Error fetching blog data:", err)
      setError("Error al cargar el blog")
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <section className="py-24 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-24 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchBlogData} className="mt-4">
              Reintentar
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">{t.title}</h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8">{t.subtitle}</p>

          {/* Language Selector */}
          {showLanguageSelector && (
            <div className="flex items-center justify-center gap-4 mb-8">
              <Globe className="h-5 w-5 text-gray-500" />
              <div className="flex gap-2">
                <Button
                  variant={language === "es" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("es")}
                  className={language === "es" ? "bg-black text-white" : ""}
                >
                  🇪🇸 {t.spanish}
                </Button>
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("en")}
                  className={language === "en" ? "bg-black text-white" : ""}
                >
                  🇬🇧 {t.english}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <Star className="h-6 w-6 text-yellow-500 mr-2" />
              <h2 className="text-3xl font-bold text-black">{t.featuredPost}</h2>
            </div>

            <Card className="overflow-hidden border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <div className="md:flex">
                {featuredPost.featuredImage && (
                  <div className="md:w-1/2">
                    <div className="relative h-64 md:h-full">
                      <Image
                        src={featuredPost.featuredImage || "/placeholder.svg"}
                        alt={featuredPost.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className={`${featuredPost.featuredImage ? "md:w-1/2" : "w-full"} p-8`}>
                  <Badge className="bg-yellow-500 text-white mb-4">
                    <Star className="h-3 w-3 mr-1" />
                    {t.featured}
                  </Badge>
                  <h3 className="text-2xl md:text-3xl font-bold text-black mb-4">{featuredPost.title}</h3>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">{featuredPost.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {featuredPost.authorName}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {featuredPost.readingTime} {t.readingTime}
                    </span>
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {featuredPost.views} {t.views}
                    </span>
                  </div>
                  <Link href={`/blog/${featuredPost.slug}`}>
                    <Button className="bg-black text-white hover:bg-gray-800">
                      {t.readMore}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="mb-12">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Latest Posts */}
        <div>
          <div className="flex items-center mb-8">
            <BookOpen className="h-6 w-6 text-gray-700 mr-2" />
            <h2 className="text-3xl font-bold text-black">{t.latestPosts}</h2>
            {searchTerm && (
              <Badge variant="secondary" className="ml-4">
                {filteredPosts.length} resultados
              </Badge>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{t.noResults}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                  {post.featuredImage && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={post.featuredImage || "/placeholder.svg"}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-black group-hover:text-gray-700 transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readingTime} {t.readingTime}
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {post.views}
                      </span>
                    </div>
                    <Link href={`/blog/${post.slug}`}>
                      <Button
                        variant="outline"
                        className="w-full group-hover:bg-black group-hover:text-white transition-colors bg-transparent"
                      >
                        {t.readMore}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
