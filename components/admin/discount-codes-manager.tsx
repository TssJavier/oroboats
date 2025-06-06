"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"

interface DiscountCode {
  id: number
  code: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minAmount: number
  maxUses: number | null
  usedCount: number
  validFrom: string
  validUntil: string | null
  active: boolean
  createdAt: string
}

export function DiscountCodesManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minAmount: "",
    maxUses: "",
    validUntil: "",
  })

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      const response = await fetch("/api/discount-codes")
      const data = await response.json()
      setCodes(data)
    } catch (error) {
      alert("Error cargando códigos")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCode ? `/api/discount-codes/${editingCode.id}` : "/api/discount-codes"
      const method = editingCode ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          discountValue: Number.parseFloat(formData.discountValue),
          minAmount: Number.parseFloat(formData.minAmount) || 0,
          maxUses: formData.maxUses ? Number.parseInt(formData.maxUses) : null,
          validUntil: formData.validUntil || null,
        }),
      })

      if (response.ok) {
        alert("✅ Operación completada exitosamente")
        setShowForm(false)
        resetForm()
        fetchCodes()
      } else {
        const error = await response.json()
        alert("❌ Error: " + error.error)
      }
    } catch (error) {
      alert("❌ Error guardando código")
    }
  }

  const toggleActive = async (id: number, active: boolean) => {
    try {
      const response = await fetch(`/api/discount-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      })

      if (response.ok) {
        alert("✅ Código " + (active ? "activado" : "desactivado"))
        fetchCodes()
      }
    } catch (error) {
      alert("❌ Error actualizando código")
    }
  }

  const deleteCode = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este código?")) return

    try {
      const response = await fetch(`/api/discount-codes/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("✅ Código eliminado")
        fetchCodes()
      }
    } catch (error) {
      alert("❌ Error eliminando código")
    }
  }

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minAmount: "",
      maxUses: "",
      validUntil: "",
    })
    setEditingCode(null)
  }

  const openEditForm = (code: DiscountCode) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      description: code.description,
      discountType: code.discountType,
      discountValue: code.discountValue.toString(),
      minAmount: code.minAmount.toString(),
      maxUses: code.maxUses?.toString() || "",
      validUntil: code.validUntil ? code.validUntil.split("T")[0] : "",
    })
    setShowForm(true)
  }

  if (loading) {
    return <div className="text-center py-8">⏳ Cargando códigos...</div>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🎫 Códigos de Descuento</h2>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancelar" : "Nuevo Código"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{editingCode ? "✏️ Editar Código" : "➕ Crear Nuevo Código"}</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder=""
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  disabled={!!editingCode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "percentage" | "fixed" })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Cantidad fija (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descuento de verano..."
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valor {formData.discountType === "percentage" ? "(%)" : "(€)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Monto mínimo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Usos máximos</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="Ilimitado"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Válido hasta</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingCode ? "💾 Actualizar" : "➕ Crear"}
              </Button>
              <Button type="button" onClick={() => setShowForm(false)} className="bg-gray-500 hover:bg-gray-600">
                ❌ Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Codes List */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">📋 Códigos Existentes</h3>
        </div>

        <div className="p-4 space-y-4">
          {codes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay códigos creados aún</p>
          ) : (
            codes.map((code) => (
              <div key={code.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm font-bold">{code.code}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        code.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {code.active ? "🟢 Activo" : "🔴 Inactivo"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">{code.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      💰 {code.discountValue}
                      {code.discountType === "percentage" ? "%" : "€"}
                    </span>
                    <span>
                      👥 {code.usedCount}/{code.maxUses || "∞"} usos
                    </span>
                    {code.validUntil && <span>📅 Hasta: {new Date(code.validUntil).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => toggleActive(code.id, !code.active)}
                    className={code.active ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
                  >
                    {code.active ? "🔴 Desactivar" : "🟢 Activar"}
                  </Button>

                  <Button size="sm" onClick={() => openEditForm(code)} className="bg-blue-500 hover:bg-blue-600">
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button size="sm" onClick={() => deleteCode(code.id)} className="bg-red-500 hover:bg-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
