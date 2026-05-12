import * as React from "react"
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
  Upload,
  Search,
  Edit,
  Trash2,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { DatePicker } from "@/components/date-picker"

const BUCKET = "contracts"

interface ContractRecord {
  id: string
  contract_number: string
  worker_name: string
  contract_date: string
  details: string
  file_name: string
  file_path: string
  file_size: number
  file_url: string
  created_at: string
}

export default function ContractsPage() {
  const [contracts, setContracts] = React.useState<ContractRecord[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  // Modal eliminar
  const [deleteTarget, setDeleteTarget] = React.useState<ContractRecord | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  // Form
  const [contractNumber, setContractNumber] = React.useState("")
  const [workerName, setWorkerName] = React.useState("")
  const [contractDate, setContractDate] = React.useState("")
  const [details, setDetails] = React.useState("")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // ── Cargar desde Supabase ──
  const fetchContracts = React.useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Error al cargar contratos: " + error.message)
    } else {
      setContracts(data || [])
    }
    setLoading(false)
  }, [])

  React.useEffect(() => { fetchContracts() }, [fetchContracts])

  // ── Abrir modales ──
  const openCreate = () => {
    setIsEditing(false)
    setEditingId(null)
    setContractNumber("")
    setWorkerName("")
    setContractDate("")
    setDetails("")
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setIsModalOpen(true)
  }

  const openEdit = (c: ContractRecord) => {
    setIsEditing(true)
    setEditingId(c.id)
    setContractNumber(c.contract_number)
    setWorkerName(c.worker_name)
    setContractDate(c.contract_date)
    setDetails(c.details || "")
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setIsModalOpen(true)
  }

  // ── Validar archivo ──
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

  // ── Guardar (crear o editar) ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditing && !selectedFile) {
      toast.error("Debes adjuntar un archivo PDF.")
      return
    }
    setSaving(true)

    try {
      let filePath = ""
      let fileName = ""
      let fileSize = 0
      let fileUrl = ""

      // Si hay archivo nuevo, subir a Storage
      if (selectedFile) {
        const uniquePath = `${Date.now()}_${selectedFile.name.replace(/\s+/g, "_")}`
        
        // Si estamos editando, borrar el archivo viejo
        if (isEditing && editingId) {
          const old = contracts.find(c => c.id === editingId)
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
        // Actualizar registro
        const updatePayload: Partial<ContractRecord> = {
          contract_number: contractNumber,
          worker_name: workerName,
          contract_date: contractDate,
          details: details,
        }
        if (selectedFile) {
          updatePayload.file_name = fileName
          updatePayload.file_path = filePath
          updatePayload.file_size = fileSize
          updatePayload.file_url = fileUrl
        }
        const { error } = await supabase.from("contracts").update(updatePayload).eq("id", editingId)
        if (error) throw new Error(error.message)
        toast.success("Contrato actualizado correctamente")
      } else {
        // Insertar nuevo registro
        const { error } = await supabase.from("contracts").insert({
          contract_number: contractNumber,
          worker_name: workerName,
          contract_date: contractDate,
          details: details,
          file_name: fileName,
          file_path: filePath,
          file_size: fileSize,
          file_url: fileUrl,
        })
        if (error) throw new Error(error.message)
        toast.success("Contrato guardado correctamente")
      }

      setIsModalOpen(false)
      fetchContracts()
    } catch (err: any) {
      toast.error(err.message || "Error inesperado")
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ──
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.file_path) {
        await supabase.storage.from(BUCKET).remove([deleteTarget.file_path])
      }
      const { error } = await supabase.from("contracts").delete().eq("id", deleteTarget.id)
      if (error) throw new Error(error.message)
      if (selectedId === deleteTarget.id) setSelectedId(null)
      toast.success("Contrato eliminado correctamente")
      fetchContracts()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filtered = contracts.filter(c =>
    c.worker_name.toLowerCase().includes(search.toLowerCase()) ||
    c.contract_number.toLowerCase().includes(search.toLowerCase())
  )

  const selectedContract = contracts.find(c => c.id === selectedId)

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
                  <BreadcrumbPage>Contratos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestión de Contratos</h1>
              <p className="text-muted-foreground">Administra contratos laborales y acuerdos comerciales.</p>
            </div>
            <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg w-full sm:w-auto">
              <Upload className="mr-2 size-4" /> Subir Contrato (Máx. 3MB)
            </Button>
          </div>

          {/* Split layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Lista */}
            <div className="flex flex-col gap-4 lg:col-span-1 h-full">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por N° o trabajador..."
                  className="pl-9 bg-card rounded-xl border-border/60"
                />
              </div>

              <Card className="rounded-2xl border-border/60 shadow-sm flex-1 flex flex-col min-h-[300px]">
                <CardHeader className="bg-muted/30 pb-4 shrink-0">
                  <CardTitle className="text-lg">Directorio de Contratos</CardTitle>
                  <CardDescription>Visualiza y administra todos los contratos activos y finalizados.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <Loader2 className="size-6 animate-spin mr-2" /> Cargando...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <img src="/icono_contratos.svg" alt="contrato" className="size-28 mx-auto opacity-50" />
                      <p className="font-medium">{search ? "Sin resultados." : "No hay contratos registrados."}</p>
                      <p className="text-sm mt-1">{search ? "Intenta con otra búsqueda." : "Sube el primero con el botón de arriba."}</p>
                    </div>
                  ) : (
                    <div className="divide-y border-t">
                      {filtered.map(doc => (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedId(doc.id)}
                          className={cn(
                            "p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedId === doc.id ? "bg-muted/50 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                          )}
                        >

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-foreground">{doc.worker_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">N° {doc.contract_number} • {doc.contract_date}</p>
                            <p className="text-xs text-muted-foreground truncate">{doc.file_name} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
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

            {/* Visor PDF */}
            <div className="lg:col-span-2 h-[500px] lg:h-full">
              <Card className="rounded-2xl border-border/60 shadow-sm h-full flex flex-col overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 border-b shrink-0">
                  <CardTitle className="text-lg">Visualización del Documento</CardTitle>
                  {selectedContract ? (
                    <div className="space-y-1">
                      <CardDescription>
                        Contrato: <span className="font-medium text-foreground">{selectedContract.contract_number}</span> • {selectedContract.worker_name}
                      </CardDescription>
                      {selectedContract.details && (
                        <p className="text-xs text-muted-foreground bg-primary/5 p-2 rounded-lg border border-primary/10">
                          <span className="font-bold text-primary uppercase text-[10px] block mb-1">Detalles del Contrato:</span>
                          {selectedContract.details}
                        </p>
                      )}
                    </div>
                  ) : (
                    <CardDescription>Selecciona un contrato para previsualizarlo aquí.</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0 flex-1 bg-muted/10 relative">
                  {selectedContract?.file_url ? (
                    <iframe
                      src={`${selectedContract.file_url}#view=FitH`}
                      className="absolute inset-0 w-full h-full border-0 rounded-b-2xl"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                      <img src="/icono_contratos.svg" alt="visor" className="size-36 mx-auto opacity-50" />
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

      {/* Modal Crear / Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Contrato" : "Subir Nuevo Contrato"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Modifica los datos. Si subes un nuevo PDF, el anterior se reemplazará."
                  : "Completa los campos y adjunta el archivo PDF (máx. 3MB)."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="contractNumber">Número de Contrato</Label>
                <Input
                  id="contractNumber"
                  value={contractNumber}
                  onChange={e => setContractNumber(e.target.value)}
                  placeholder="Ej. CT-2026-001"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workerName">Nombre del Trabajador</Label>
                <Input
                  id="workerName"
                  value={workerName}
                  onChange={e => setWorkerName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Fecha del Contrato</Label>
                <DatePicker value={contractDate} onChange={setContractDate} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="details">Detalles</Label>
                <textarea
                  id="details"
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Ej. Contrato de tiempo parcial, renovable..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file">
                  Archivo PDF {isEditing && <span className="text-muted-foreground font-normal">(opcional si no cambias el archivo)</span>}
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    ✔ Seleccionado: <span className="font-medium text-foreground">{selectedFile.name}</span> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 size-4 animate-spin" /> Guardando...</> : isEditing ? "Guardar Cambios" : "Subir Contrato"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Eliminar Contrato
            </DialogTitle>
            <DialogDescription className="pt-2">
              ¿Estás seguro de que deseas eliminar el contrato de{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.worker_name}</span>
              {" "}(N° {deleteTarget?.contract_number})?{" "}
              <span className="text-destructive font-medium">Esta acción no se puede deshacer.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Eliminando...</> : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

