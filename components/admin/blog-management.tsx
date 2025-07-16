"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Trash2, Search, Edit, Eye, Star, Calendar, Clock, FileText, Save, X } from "lucide-react"
import type { BlogPost, NewBlogPost } from "@/lib/db/schema"

type BlogManagementProps = {}

export function BlogManagement({}: BlogManagementProps) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all")
  const [isCreating, setIsCreating] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<NewBlogPost>>({
    title: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    language: "es",
    isFeatured: false,
    isPublished: false,
    metaTitle: "",
    metaDescription: "",
    tags: [],
    authorName: "Oro Boats",
    authorEmail: "",
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/blog?admin=true")
      if (!response.ok) {
        throw new Error("Failed to fetch blog posts")
      }
      const data: BlogPost[] = await response.json()
      setPosts(data)
    } catch (err) {
      console.error("Error fetching blog posts:", err)
      setError(err instanceof Error ? err.message : "Error al cargar posts del blog.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title?.trim() || !formData.content?.trim()) {
      setError("El título y el contenido son obligatorios.")
      return
    }

    setError(null)
    try {
      const url = editingPost ? `/api/blog?id=${editingPost.id}` : "/api/blog"
      const method = editingPost ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `Failed to ${editingPost ? "update" : "create"} post`)
      }

      resetForm()
      fetchPosts()
    } catch (err) {
      console.error(`Error ${editingPost ? "updating" : "creating"} post:`, err)
      setError(err instanceof Error ? err.message : `Error al ${editingPost ? "actualizar" : "crear"} post.`)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este post?")) {
      return
    }

    setError(null)
    try {
      const response = await fetch(`/api/blog?id=${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to delete post")
      }
      fetchPosts()
    } catch (err) {
      console.error("Error deleting post:", err)
      setError(err instanceof Error ? err.message : "Error al eliminar post.")
    }
  }

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      featuredImage: post.featuredImage || "",
      language: post.language,
      isFeatured: post.isFeatured,
      isPublished: post.isPublished,
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      tags: post.tags || [],
      authorName: post.authorName || "Oro Boats",
      authorEmail: post.authorEmail || "",
    })
    setIsCreating(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      featuredImage: "",
      language: "es",
      isFeatured: false,
      isPublished: false,
      metaTitle: "",
      metaDescription: "",
      tags: [],
      authorName: "Oro Boats",
      authorEmail: "",
    })
    setEditingPost(null)
    setIsCreating(false)
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLanguage = selectedLanguage === "all" || post.language === selectedLanguage
    return matchesSearch && matchesLanguage
  })

  if (loading) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-black">Gestión del Blog</h2>
        <p className="text-gray-600">Cargando posts del blog...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black">Gestión del Blog</h2>
          <p className="text-gray-600">Administra los artículos del blog en ambos idiomas.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-black text-white hover:bg-gray-800">
          <PlusCircle className="h-4 w-4 mr-2" />
          Nuevo Post
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Formulario de creación/edición */}
      {isCreating && (
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {editingPost ? "Editar Post" : "Crear Nuevo Post"}
              </span>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título del artículo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt">Resumen *</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt || ""}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Breve descripción del artículo"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Contenido *</Label>
                <Textarea
                  id="content"
                  value={formData.content || ""}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Contenido completo del artículo (HTML/Markdown)"
                  rows={10}
                  required
                />
              </div>

              <div>
                <Label htmlFor="featuredImage">Imagen Destacada (URL)</Label>
                <Input
                  id="featuredImage"
                  value={formData.featuredImage || ""}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Título (SEO)</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    El título que aparece en los resultados de búsqueda y en la pestaña del navegador. Debe ser conciso
                    (idealmente menos de 60 caracteres) y contener palabras clave importantes para SEO.
                  </p>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle || ""}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="Título para SEO"
                  />
                </div>
                <div>
                  <Label htmlFor="authorName">Autor</Label>
                  <Input
                    id="authorName"
                    value={formData.authorName || ""}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="Nombre del autor"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Descripción (SEO)</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Un resumen breve (idealmente menos de 160 caracteres) que aparece debajo del título en los resultados
                  de búsqueda. Debe ser atractivo y contener palabras clave para animar al clic.
                </p>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription || ""}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="Descripción para motores de búsqueda"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  />
                  <Label htmlFor="isFeatured">Artículo Destacado</Label>
                  <p className="text-sm text-gray-500 ml-2">
                    Si está activado, este artículo aparecerá en una sección prominente del blog (solo uno puede ser
                    destacado por idioma).
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                  />
                  <Label htmlFor="isPublished">Publicado</Label>
                  <p className="text-sm text-gray-500 ml-2">
                    Controla si el artículo es visible para el público en el blog.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-black text-white hover:bg-gray-800">
                  <Save className="h-4 w-4 mr-2" />
                  {editingPost ? "Actualizar" : "Crear"} Post
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de posts */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Posts del Blog
          </CardTitle>
          <CardDescription>{filteredPosts.length} posts encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por título o contenido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los idiomas</SelectItem>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPosts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron posts.</p>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start justify-between p-4 border border-gray-100 rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">{post.title}</h3>
                      <Badge variant={post.language === "es" ? "default" : "secondary"}>
                        {post.language === "es" ? "🇪🇸 ES" : "🇬🇧 EN"}
                      </Badge>
                      {post.isFeatured && (
                        <Badge className="bg-yellow-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Destacado
                        </Badge>
                      )}
                      <Badge variant={post.isPublished ? "default" : "secondary"}>
                        {post.isPublished ? "Publicado" : "Borrador"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readingTime} min lectura
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {post.views} vistas
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/blog/${post.slug}`, "_blank")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
