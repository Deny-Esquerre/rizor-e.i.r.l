import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Upload,
  Search,
  Edit,
  Trash2,
  Loader2,
  FileUp,
  FileText,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { DatePicker } from "@/components/date-picker"
import { toast } from "sonner"

const BUCKET = "permissions"

interface Worker {
  id: string
  name: string
  surname: string
}

interface PermissionRecord {
  id: string
  worker_id: string
  worker_name: string
  name: string
  type: string
  issue_date: string
  expiry_date: string
  status: string
  description: string
  file_name: string
  file_path: string
  file_size: number
  file_url: string
  created_at: string
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionRecord[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PermissionRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [formData, setFormData] = useState({
    worker_id: "",
    name: "",
    type: "Licencia",
    issue_date: "",
    expiry_date: "",
    status: "Vigente",
    description: ""
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchPermissions(); fetchWorkers() }, [])

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

  const fetchWorkers = async () => {
    const { data, error } = await supabase
      .from("personnel")
      .select("id, name, surname")
      .order("name", { ascending: true })

    if (!error && data) {
      setWorkers(data)
    }
  }

  const getWorkerName = (w: Worker) => `${w.name} ${w.surname}`

  const filtered = permissions.filter(p =>
    (p.worker_name || p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  )

  const selectedPermission = permissions.find(p => p.id === selectedId)

  const resetForm = () => {
    setFormData({ worker_id: "", name: "", type: "Licencia", issue_date: "", expiry_date: "", status: "Vigente", description: "" })
    setSelectedFile(null)
    setEditingId(null)
    setIsEditing(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const openCreate = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEdit = (p: PermissionRecord) => {
    setIsEditing(true)
    setEditingId(p.id)
    setFormData({
      worker_id: p.worker_id || "",
      name: p.name,
      type: p.type,
      issue_date: p.issue_date,
      expiry_date: p.expiry_date,
      status: p.status,
      description: p.description
    })
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setIsModalOpen(true)
  }

  const handleWorkerChange = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId)
    setFormData(prev => ({
      ...prev,
      worker_id: workerId,
      name: worker ? `${worker.name} ${worker.surname}` : ""
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 3MB.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    setSelectedFile(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF.")
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 3MB.")
      return
    }
    setSelectedFile(file)
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditing && !selectedFile) {
      toast.error("Debes adjuntar un archivo PDF.")
      return
    }
    if (!formData.worker_id) {
      toast.error("Debes seleccionar un trabajador.")
      return
    }
    setSaving(true)

    try {
      let filePath = ""
      let fileName = ""
      let fileSize = 0
      let fileUrl = ""

      if (selectedFile) {
        const uniquePath = `${Date.now()}_${selectedFile.name.replace(/\s+/g, "_")}`

        if (isEditing && editingId) {
          const old = permissions.find(p => p.id === editingId)
          if (old?.file_path) {
            await supabase.storage.from(BUCKET).remove([old.file_path])
          }
        }

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(uniquePath, selectedFile, { contentType: "application/pdf", upsert: false })

        if (uploadError) {
          console.error("Storage upload error:", JSON.stringify(uploadError, null, 2))
          throw new Error(`Error al subir archivo: ${uploadError.message} (${JSON.stringify(uploadError)})`)
        }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uniquePath)
        filePath = uniquePath
        fileName = selectedFile.name
        fileSize = selectedFile.size
        fileUrl = urlData.publicUrl
      }

      if (isEditing && editingId) {
        const updatePayload: Partial<PermissionRecord> = {
          worker_id: formData.worker_id,
          worker_name: formData.name,
          name: formData.name,
          type: formData.type,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date,
          status: formData.status,
          description: formData.description,
        }
        if (selectedFile) {
          updatePayload.file_name = fileName
          updatePayload.file_path = filePath
          updatePayload.file_size = fileSize
          updatePayload.file_url = fileUrl
        }
        const { error } = await supabase.from("permissions").update(updatePayload).eq("id", editingId)
        if (error) throw new Error(error.message)
        toast.success("Permiso actualizado correctamente")
      } else {
        const { error } = await supabase.from("permissions").insert({
          worker_id: formData.worker_id,
          worker_name: formData.name,
          name: formData.name,
          type: formData.type,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date,
          status: formData.status,
          description: formData.description,
          file_name: fileName,
          file_path: filePath,
          file_size: fileSize,
          file_url: fileUrl,
        })
        if (error) throw new Error(error.message)
        toast.success("Permiso guardado correctamente")
      }

      setIsModalOpen(false)
      fetchPermissions()
    } catch (err: any) {
      toast.error(err.message || "Error inesperado")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.file_path) {
        await supabase.storage.from(BUCKET).remove([deleteTarget.file_path])
      }
      const { error } = await supabase.from("permissions").delete().eq("id", deleteTarget.id)
      if (error) throw new Error(error.message)
      if (selectedId === deleteTarget.id) setSelectedId(null)
      toast.success("Permiso eliminado correctamente")
      fetchPermissions()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
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
                <BreadcrumbItem className="hidden sm:inline-flex">
                  <BreadcrumbLink href="/dashboard" className="text-muted-foreground">Centro de Control</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
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
            <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg w-full sm:w-auto">
              <Upload className="mr-2 size-4" /> Subir Permiso (PDF, Máx. 3MB)
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="flex flex-col gap-4 lg:col-span-1 h-full">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por trabajador o tipo..."
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
                      <img src="/icono_permisos.svg" alt="visor" className="size-36 mx-auto opacity-50" />
                      <p className="font-medium">{search ? "Sin resultados." : "Directorio de permisos sin documentos."}</p>
                      <p className="text-sm mt-1">{search ? "Intenta con otra búsqueda." : "Sube el primero con el botón de arriba."}</p>
                    </div>
                  ) : (
                    <div className="divide-y border-t">
                      {filtered.map(perm => (
                        <div
                          key={perm.id}
                          onClick={() => setSelectedId(perm.id)}
                          className={cn(
                            "p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedId === perm.id ? "bg-muted/50 border-l-4 border-l-amber-500" : "border-l-4 border-l-transparent"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-foreground">{perm.worker_name || perm.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{perm.type} • {perm.issue_date}</p>
                            <p className={cn("text-xs font-medium mt-0.5", perm.status === "Vigente" ? "text-emerald-600" : "text-rose-600")}>
                              {perm.status}
                            </p>
                            {perm.file_name && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{perm.file_name}</p>
                            )}
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
                  <CardTitle className="text-lg">Visualización del Documento</CardTitle>
                  {selectedPermission ? (
                    <CardDescription>
                        Permiso de <span className="font-medium text-foreground">{selectedPermission.worker_name || selectedPermission.name}</span> • {selectedPermission.type}
                    </CardDescription>
                  ) : (
                    <CardDescription>Selecciona un permiso para previsualizarlo aquí.</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0 flex-1 bg-muted/10 relative">
                  {selectedPermission?.file_url ? (
                    <iframe
                      src={`${selectedPermission.file_url}#view=FitH`}
                      className="absolute inset-0 w-full h-full border-0 rounded-b-2xl"
                      title="PDF Preview"
                    />
                  ) : selectedPermission ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                      <img src="/icono_permisos.svg" alt="visor" className="size-36 mx-auto opacity-50" />
                      <p className="font-medium text-lg">{selectedPermission.worker_name || selectedPermission.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedPermission.type}</p>
                      <p className="text-sm text-muted-foreground mt-2">{selectedPermission.description}</p>
                      <div className="flex justify-center gap-4 mt-4">
                        <span className="text-xs text-muted-foreground">Emitido: {selectedPermission.issue_date}</span>
                        <span className="text-xs text-muted-foreground">Vence: {selectedPermission.expiry_date}</span>
                      </div>
                      <p className={cn("text-sm font-bold mt-4", selectedPermission.status === "Vigente" ? "text-emerald-600" : "text-rose-600")}>
                        {selectedPermission.status}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Sin archivo PDF adjunto</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                      <img src="/icono_permisos.svg" alt="visor" className="size-36 mx-auto opacity-50" />
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
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Permiso" : "Subir Nuevo Permiso"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Modifica los datos. Si subes un nuevo PDF, el anterior se reemplazará."
                  : "Completa los campos y adjunta el archivo PDF (máx. 3MB)."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Trabajador</Label>
                <Select value={formData.worker_id} onValueChange={handleWorkerChange}>
                  <SelectTrigger className="w-full bg-card rounded-xl border-border/60">
                    <SelectValue placeholder="Seleccionar trabajador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {getWorkerName(w)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Label>Fecha de Emisión</Label>
                  <DatePicker value={formData.issue_date} onChange={(v) => setFormData({...formData, issue_date: v})} />
                </div>
                <div className="grid gap-2">
                  <Label>Fecha de Vencimiento</Label>
                  <DatePicker value={formData.expiry_date} onChange={(v) => setFormData({...formData, expiry_date: v})} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Input id="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} placeholder="Ej. Vigente, Vencido, En proceso" required />
              </div>

              <div className="grid gap-2">
                <Label>Archivo PDF</Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all",
                    isDragging
                      ? "border-amber-500 bg-amber-500/10 scale-[1.02]"
                      : selectedFile
                        ? "border-amber-500 bg-amber-500/5"
                        : "border-border hover:border-amber-400 hover:bg-muted/50"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="size-10 text-amber-500" />
                      <p className="font-medium text-sm text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                      >
                        <X className="size-4 mr-1" /> Quitar archivo
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileUp className="size-10" />
                      <p className="font-medium text-sm">Arrastra tu PDF aquí</p>
                      <p className="text-xs">o haz clic para seleccionar un archivo (máx. 3MB)</p>
                    </div>
                  )}
                </div>
                {isEditing && !selectedFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    * Deja vacío para mantener el PDF actual
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 size-4 animate-spin" /> Guardando...</> : isEditing ? "Guardar Cambios" : "Subir Permiso"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Eliminar Permiso
            </DialogTitle>
            <DialogDescription className="pt-2">
              ¿Estás seguro de que deseas eliminar el permiso de{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.worker_name || deleteTarget?.name}</span>?{" "}
              <span className="text-destructive font-medium">Esta acción no se puede deshacer.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Eliminando...</> : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
