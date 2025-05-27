"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, CheckCircle, AlertTriangle, Loader2, ImageIcon } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  vehicleType: "boat" | "jetski"
  className?: string
}

// Función para validar y normalizar URLs
function normalizeImageUrl(url: string): { isValid: boolean; normalizedUrl: string; error?: string } {
  if (!url.trim()) {
    return { isValid: false, normalizedUrl: "", error: "URL vacía" }
  }

  const trimmedUrl = url.trim()

  // Si es una URL completa (http/https), validarla
  if (trimmedUrl.startsWith("http")) {
    try {
      new URL(trimmedUrl)
      return { isValid: true, normalizedUrl: trimmedUrl }
    } catch {
      return { isValid: false, normalizedUrl: trimmedUrl, error: "URL externa inválida" }
    }
  }

  // Si no empieza con /assets/, añadirlo automáticamente
  let normalizedUrl = trimmedUrl
  if (!normalizedUrl.startsWith("/assets/")) {
    // Remover / inicial si existe para evitar //assets/
    if (normalizedUrl.startsWith("/")) {
      normalizedUrl = normalizedUrl.substring(1)
    }
    normalizedUrl = `/assets/${normalizedUrl}`
  }

  // Validar que tenga una extensión de imagen
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
  const hasValidExtension = imageExtensions.some((ext) => normalizedUrl.toLowerCase().endsWith(ext))

  if (!hasValidExtension) {
    return {
      isValid: false,
      normalizedUrl,
      error: "Debe tener una extensión de imagen válida (.jpg, .png, .gif, .webp, .svg)",
    }
  }

  return { isValid: true, normalizedUrl }
}

export function ImageUpload({ value, onChange, vehicleType, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [urlError, setUrlError] = useState("")
  const [urlChecking, setUrlChecking] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Verificar si una URL existe
  const checkUrl = async (url: string) => {
    const { isValid, normalizedUrl, error } = normalizeImageUrl(url)

    if (!isValid) {
      setUrlError(error || "URL inválida")
      return
    }

    setUrlChecking(true)
    setUrlError("")

    try {
      if (normalizedUrl.startsWith("http")) {
        // Para URLs externas, intentar cargar la imagen
        const img = new window.Image()
        img.onload = () => {
          setUrlError("")
          setUrlChecking(false)
          onChange(normalizedUrl)
        }
        img.onerror = () => {
          setUrlError("No se puede cargar la imagen desde esta URL")
          setUrlChecking(false)
        }
        img.src = normalizedUrl
      } else {
        // Para rutas locales, verificar en el servidor
        const response = await fetch("/api/upload/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalizedUrl }),
        })

        const result = await response.json()
        if (!result.exists) {
          setUrlError("El archivo no existe en el servidor")
        } else {
          setUrlError("")
          onChange(normalizedUrl)
        }
      }
    } catch (error) {
      setUrlError("Error al verificar la URL")
    } finally {
      setUrlChecking(false)
    }
  }

  // Manejar subida de archivo
  const handleFileUpload = async (file: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("vehicleType", vehicleType)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        onChange(result.url)
        setInputValue(result.url)
        setUrlError("")
      } else {
        setUrlError(result.error || "Error al subir archivo")
      }
    } catch (error) {
      setUrlError("Error al subir archivo")
    } finally {
      setUploading(false)
    }
  }

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Manejar drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file)
    } else {
      setUrlError("Por favor, selecciona un archivo de imagen válido")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  // Manejar cambio en el input
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    setUrlError("")

    if (!newValue.trim()) {
      onChange("")
      return
    }

    // Validar en tiempo real
    const { isValid, normalizedUrl, error } = normalizeImageUrl(newValue)
    if (!isValid) {
      setUrlError(error || "URL inválida")
    } else {
      // Si es válida, actualizar el valor normalizado
      if (normalizedUrl !== newValue) {
        setInputValue(normalizedUrl)
      }
    }
  }

  // Obtener URL segura para mostrar
  const getSafeImageUrl = () => {
    if (!value) return "/placeholder.svg"

    const { isValid, normalizedUrl } = normalizeImageUrl(value)
    return isValid ? normalizedUrl : "/placeholder.svg"
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Vista previa de imagen actual */}
      {value && (
        <Card className="relative">
          <CardContent className="p-4">
            <div className="relative w-full h-48 bg-gray-50 rounded-lg overflow-hidden">
              <Image
                src={getSafeImageUrl() || "/placeholder.svg"}
                alt="Preview"
                fill
                className="object-contain"
                onError={() => setUrlError("Error al cargar imagen")}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange("")
                setInputValue("")
              }}
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Área de subida */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragOver
            ? "border-gold bg-gold/5"
            : uploading
              ? "border-blue-300 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                <p className="text-sm text-gray-600">Subiendo imagen...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Arrastra una imagen aquí o</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar archivo
                  </Button>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP hasta 5MB</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Input manual de URL */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">O introduce la ruta de la imagen:</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                /assets/
              </span>
              <Input
                value={inputValue.startsWith("/assets/") ? inputValue.substring(8) : inputValue}
                onChange={(e) => {
                  const newValue = `/assets/${e.target.value}`
                  handleInputChange(newValue)
                }}
                onBlur={(e) => {
                  const fullValue = `/assets/${e.target.value}`
                  if (fullValue !== "/assets/" && fullValue !== "/assets") {
                    checkUrl(fullValue)
                  }
                }}
                placeholder="motos/imagen.jpg"
                className={`rounded-l-none ${urlError ? "border-red-300" : ""}`}
                disabled={uploading}
              />
            </div>
          </div>
          {urlChecking && <Loader2 className="h-4 w-4 animate-spin self-center text-gray-400" />}
          {value && !urlChecking && !urlError && <CheckCircle className="h-4 w-4 self-center text-green-500" />}
        </div>

        {urlError && (
          <div className="flex items-center text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {urlError}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>
            <strong>Formato:</strong> /assets/carpeta/archivo.jpg
          </p>
          <p>
            <strong>Ejemplo:</strong> /assets/motos/gtx130.jpg
          </p>
        </div>
      </div>

      {/* Información adicional */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          <strong>Recomendado:</strong> Sube la imagen para mejor rendimiento
        </p>
        <p>
          <strong>Carpeta:</strong> Se guardará en /assets/{vehicleType === "boat" ? "barcos" : "motos"}/
        </p>
      </div>
    </div>
  )
}
