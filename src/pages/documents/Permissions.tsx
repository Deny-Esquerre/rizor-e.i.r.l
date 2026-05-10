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
  ShieldCheck,
  Upload,
  Search,
  Edit,
  Trash2,
  Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface PermissionRecord {
  id: string
  name: string
  type: string
  issue_date: string
  expiry_date: string
  status: string
  description: string
  created_at: string
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PermissionRecord | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    type: "Licencia",
    issue_date: "",
    expiry_date: "",
    status: "Vigente",
    description: ""
  })

  useEffect(() => { fetchPermissions() }, [])

  const fetchPermissions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setPermissions(data)
    }
    setLoading(false)
  }

  const filtered = permissions.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  )

  const selectedPermission = permissions.find(p => p.id === selectedId)

  const resetForm = () => {
    setFormData({ name: "", type: "Licencia", issue_date: "", expiry_date: "", status: "Vigente", description: "" })
    setEditingId(null)
    setIsEditing(false)
  }

  const openEdit = (p: PermissionRecord) => {
    setIsEditing(true)
    setEditingId(p.id)
    setFormData({
      name: p.name,
      type: p.type,
      issue_date: p.issue_date,
      expiry_date: p.expiry_date,
      status: p.status,
      description: p.description
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing && editingId) {
        await supabase.from("permissions").update(formData).eq("id", editingId)
      } else {
        await supabase.from("permissions").insert([formData])
      }
      fetchPermissions()
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
    await supabase.from("permissions").delete().eq("id", deleteTarget.id)
    if (selectedId === deleteTarget.id) setSelectedId(null)
    setDeleteTarget(null)
    fetchPermissions()
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
                  <BreadcrumbPage>Permisos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 h-[calc(100vh-4rem)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Permisos y Licencias</h1>
              <p className="text-muted-foreground">Documentación legal, licencias de funcionamiento y permisos de personal.</p>
            </div>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg w-full sm:w-auto">
              <Upload className="mr-2 size-4" /> Nuevo Permiso
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="flex flex-col gap-4 lg:col-span-1 h-full">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o tipo..."
                  className="pl-9 bg-card rounded-xl border-border/60"
                />
              </div>

              <Card className="rounded-2xl border-border/60 shadow-sm flex-1 flex flex-col min-h-[300px]">
                <CardHeader className="bg-muted/30 pb-4 shrink-0">
                  <CardTitle className="text-lg">Directorio de Permisos</CardTitle>
                  <CardDescription>Consulta el estado de licencias y permisos importantes.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <Loader2 className="size-6 animate-spin mr-2" /> Cargando...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <ShieldCheck className="size-12 mb-4 text-amber-500/20" />
                      <p className="font-medium">{search ? "Sin resultados." : "Directorio de permisos sin documentos."}</p>
                      <p className="text-sm mt-1">{search ? "Intenta con otra búsqueda." : "Registra el primer permiso con el botón de arriba."}</p>
                    </div>
                  ) : (
                    <div className="divide-y border-t">
                      {filtered.map(perm => (
                        <div
                          key={perm.id}
                          onClick={() => setSelectedId(perm.id)}
                          className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedId === perm.id ? "bg-muted/50 border-l-4 border-l-amber-500" : "border-l-4 border-l-transparent"}`}
                        >
                          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
                            <ShieldCheck className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-foreground">{perm.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{perm.type} • {perm.issue_date}</p>
                            <p className={`text-xs font-medium mt-0.5 ${perm.status === "Vigente" ? "text-emerald-600" : "text-rose-600"}`}>
                              {perm.status}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={e => { e.stopPropagation(); openEdit(perm) }}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={e => { e.stopPropagation(); setDeleteTarget(perm) }}
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
                  <CardTitle className="text-lg">Detalles del Permiso</CardTitle>
                  {selectedPermission ? (
                    <CardDescription>
                      Permiso: <span className="font-medium text-foreground">{selectedPermission.name}</span> • {selectedPermission.type}
                    </CardDescription>
                  ) : (
                    <CardDescription>Selecciona un permiso para ver sus detalles aquí.</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0 flex-1 bg-muted/10 relative flex items-center justify-center">
                  {selectedPermission ? (
                    <div className="text-center p-8">
                      <ShieldCheck className="size-16 mb-4 text-amber-500/20 mx-auto" />
                      <p className="font-medium text-lg">{selectedPermission.name}</p>
                      <p className="text-sm text-muted-foreground mt-2">{selectedPermission.description}</p>
                      <div className="flex justify-center gap-4 mt-4">
                        <span className="text-xs text-muted-foreground">Emitido: {selectedPermission.issue_date}</span>
                        <span className="text-xs text-muted-foreground">Vence: {selectedPermission.expiry_date}</span>
                      </div>
                      <p className={`text-sm font-bold mt-4 ${selectedPermission.status === "Vigente" ? "text-emerald-600" : "text-rose-600"}`}>
                        {selectedPermission.status}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                      <ShieldCheck className="size-16 mb-4 text-amber-500/20 opacity-50" />
                      <p className="font-medium">El visor está listo.</p>
                      <p className="text-sm mt-1">Selecciona un permiso del panel izquierdo.</p>
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
              <DialogTitle>{isEditing ? "Editar Permiso" : "Nuevo Permiso"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Modifica los datos del permiso." : "Ingresa los datos del nuevo permiso."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Permiso</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Licencia de Funcionamiento" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ej. Permiso municipal para operar" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Input id="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="Ej. Licencia, Permiso, Certificado" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="issue_date">Fecha de Emisión</Label>
                  <Input id="issue_date" type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiry_date">Fecha de Vencimiento</Label>
                  <Input id="expiry_date" type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Input id="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} placeholder="Ej. Vigente, Vencido, En proceso" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Permiso"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Eliminar Permiso
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el permiso "{deleteTarget?.name}"?
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