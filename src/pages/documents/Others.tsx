import * as React from "react"
import { useState, useEffect } from "react"
import { CustomSidebar } from "@/components/custom-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  FolderOpen,
  Upload,
  Search,
  Edit,
  Trash2,
  Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface OtherRecord {
  id: string
  name: string
  category: string
  description: string
  file_name: string
  file_path: string
  file_url: string
  created_at: string
}

export default function OthersPage() {
  const [others, setOthers] = useState<OtherRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OtherRecord | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    description: ""
  })

  useEffect(() => { fetchOthers() }, [])

  const fetchOthers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("others")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setOthers(data)
    }
    setLoading(false)
  }

  const filtered = others.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.category.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOther = others.find(o => o.id === selectedId)

  const resetForm = () => {
    setFormData({ name: "", category: "General", description: "" })
    setEditingId(null)
    setIsEditing(false)
  }

  const openEdit = (o: OtherRecord) => {
    setIsEditing(true)
    setEditingId(o.id)
    setFormData({
      name: o.name,
      category: o.category,
      description: o.description
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing && editingId) {
        await supabase.from("others").update(formData).eq("id", editingId)
      } else {
        await supabase.from("others").insert([formData])
      }
      fetchOthers()
      setIsModalOpen(false)
      resetForm()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await supabase.from("others").delete().eq("id", deleteTarget.id)
    if (selectedId === deleteTarget.id) setSelectedId(null)
    setDeleteTarget(null)
    fetchOthers()
  }

  return (
    <SidebarProvider>
      <CustomSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-muted-foreground">Centro de Control</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground">Gestión de Documentos</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Otros Documentos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 h-[calc(100vh-4rem)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Otros Documentos</h1>
              <p className="text-muted-foreground">Archivos varios, manuales de usuario y políticas internas de la empresa.</p>
            </div>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg w-full sm:w-auto">
              <Upload className="mr-2 size-4" /> Nuevo Documento
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="flex flex-col gap-4 lg:col-span-1 h-full">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o categoría..."
                  className="pl-9 bg-card rounded-xl border-border/60"
                />
              </div>

              <Card className="rounded-2xl border-border/60 shadow-sm flex-1 flex flex-col min-h-[300px]">
                <CardHeader className="bg-muted/30 pb-4 shrink-0">
                  <CardTitle className="text-lg">Directorio General</CardTitle>
                  <CardDescription>Consulta y administra archivos y recursos no categorizados.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <Loader2 className="size-6 animate-spin mr-2" /> Cargando...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <img src="/icono_otros.svg" alt="visor" className="size-16 mx-auto opacity-50" />
                      <p className="font-medium">{search ? "Sin resultados." : "No hay otros documentos en este directorio."}</p>
                      <p className="text-sm mt-1">{search ? "Intenta con otra búsqueda." : "Sube un archivo importante con el botón de arriba."}</p>
                    </div>
                  ) : (
                    <div className="divide-y border-t">
                      {filtered.map(doc => (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedId(doc.id)}
                          className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedId === doc.id ? "bg-muted/50 border-l-4 border-l-violet-500" : "border-l-4 border-l-transparent"}`}
                        >
                          <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500 shrink-0">
                            <img src="/icono_otros.svg" alt="otro" className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-foreground">{doc.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{doc.category}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.description}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={e => { e.stopPropagation(); openEdit(doc) }}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={e => { e.stopPropagation(); setDeleteTarget(doc) }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 h-[500px] lg:h-full">
              <Card className="rounded-2xl border-border/60 shadow-sm h-full flex flex-col overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 border-b shrink-0">
                  <CardTitle className="text-lg">Vista Previa del Documento</CardTitle>
                  {selectedOther ? (
                    <CardDescription>
                      Documento: <span className="font-medium text-foreground">{selectedOther.name}</span> • {selectedOther.category}
                    </CardDescription>
                  ) : (
                    <CardDescription>Selecciona un documento para previsualizarlo aquí.</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0 flex-1 bg-muted/10 relative flex items-center justify-center">
                  {selectedOther ? (
                    <div className="text-center p-8">
                      <FolderOpen className="size-16 mb-4 text-violet-500/20 mx-auto" />
                      <p className="font-medium text-lg">{selectedOther.name}</p>
                      <p className="text-sm text-muted-foreground mt-2">{selectedOther.description}</p>
                      <p className="text-xs text-muted-foreground mt-4">Categoría: {selectedOther.category}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                      <img src="/icono_otros.svg" alt="visor" className="size-16 mx-auto opacity-50" />
                      <p className="font-medium">El visor está listo.</p>
                      <p className="text-sm mt-1">Selecciona un documento del panel izquierdo.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Documento" : "Nuevo Documento"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Modifica los datos del documento." : "Ingresa los datos del nuevo documento."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Documento</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Manual de Usuario" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ej. Guía de uso del sistema" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ej. Manual, Política, Procedimiento" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Documento"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Eliminar Documento
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el documento "{deleteTarget?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Sí, eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}