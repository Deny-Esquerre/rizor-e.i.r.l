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

const BUCKET = "invoices"

interface InvoiceRecord {
  id: string
  invoice_number: string
  client_name: string
  invoice_date: string
  amount: number
  file_name: string
  file_path: string
  file_size: number
  file_url: string
  created_at: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [formData, setFormData] = useState({
    invoice_number: "",
    client_name: "",
    invoice_date: "",
    amount: 0
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchInvoices() }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setInvoices(data)
    }
    setLoading(false)
  }

  const filtered = invoices.filter(inv =>
    inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(search.toLowerCase())
  )

  const selectedInvoice = invoices.find(inv => inv.id === selectedId)

  const resetForm = () => {
    setFormData({ invoice_number: "", client_name: "", invoice_date: "", amount: 0 })
    setSelectedFile(null)
    setEditingId(null)
    setIsEditing(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const openCreate = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEdit = (inv: InvoiceRecord) => {
    setIsEditing(true)
    setEditingId(inv.id)
    setFormData({
      invoice_number: inv.invoice_number,
      client_name: inv.client_name,
      invoice_date: inv.invoice_date,
      amount: inv.amount
    })
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setIsModalOpen(true)
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
    setSaving(true)

    try {
      let filePath = ""
      let fileName = ""
      let fileSize = 0
      let fileUrl = ""

      if (selectedFile) {
        const uniquePath = `${Date.now()}_${selectedFile.name.replace(/\s+/g, "_")}`

        if (isEditing && editingId) {
          const old = invoices.find(inv => inv.id === editingId)
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
        const updatePayload: Partial<InvoiceRecord> = {
          invoice_number: formData.invoice_number,
          client_name: formData.client_name,
          invoice_date: formData.invoice_date,
          amount: formData.amount,
        }
        if (selectedFile) {
          updatePayload.file_name = fileName
          updatePayload.file_path = filePath
          updatePayload.file_size = fileSize
          updatePayload.file_url = fileUrl
        }
        const { error } = await supabase.from("invoices").update(updatePayload).eq("id", editingId)
        if (error) throw new Error(error.message)
        toast.success("Factura actualizada correctamente")
      } else {
        const { error } = await supabase.from("invoices").insert({
          invoice_number: formData.invoice_number,
          client_name: formData.client_name,
          invoice_date: formData.invoice_date,
          amount: formData.amount,
          file_name: fileName,
          file_path: filePath,
          file_size: fileSize,
          file_url: fileUrl,
        })
        if (error) throw new Error(error.message)
        toast.success("Factura guardada correctamente")
      }

      setIsModalOpen(false)
      fetchInvoices()
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
      const { error } = await supabase.from("invoices").delete().eq("id", deleteTarget.id)
      if (error) throw new Error(error.message)
      if (selectedId === deleteTarget.id) setSelectedId(null)
      toast.success("Factura eliminada correctamente")
      fetchInvoices()
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
                  <BreadcrumbPage>Facturas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 h-[calc(100vh-4rem)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Facturación y Comprobantes</h1>
              <p className="text-muted-foreground">Archivo digital de facturas emitidas y recibidas por la empresa.</p>
            </div>
            <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg w-full sm:w-auto">
              <Upload className="mr-2 size-4" /> Subir Factura (PDF, Máx. 3MB)
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="flex flex-col gap-4 lg:col-span-1 h-full">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por número o cliente..."
                  className="pl-9 bg-card rounded-xl border-border/60"
                />
              </div>

              <Card className="rounded-2xl border-border/60 shadow-sm flex-1 flex flex-col min-h-[300px]">
                <CardHeader className="bg-muted/30 pb-4 shrink-0">
                  <CardTitle className="text-lg">Directorio de Facturas</CardTitle>
                  <CardDescription>Visualiza y administra todos los comprobantes de pago.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <Loader2 className="size-6 animate-spin mr-2" /> Cargando...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <img src="/icono_facturas.svg" alt="visor" className="size-36 mx-auto opacity-50" />
                      <p className="font-medium">{search ? "Sin resultados." : "No hay facturas registradas."}</p>
                      <p className="text-sm mt-1">{search ? "Intenta con otra búsqueda." : "Sube la primera con el botón de arriba."}</p>
                    </div>
                  ) : (
                    <div className="divide-y border-t">
                      {filtered.map(inv => (
                        <div
                          key={inv.id}
                          onClick={() => setSelectedId(inv.id)}
                          className={cn(
                            "p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedId === inv.id ? "bg-muted/50 border-l-4 border-l-emerald-500" : "border-l-4 border-l-transparent"
                          )}
                        >
                          <div className="p-4 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0">
                            <img src="/icono_facturas.svg" alt="factura" className="size-20" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-foreground">{inv.client_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">N° {inv.invoice_number} • {inv.invoice_date}</p>
                            <p className="text-xs font-medium text-emerald-600 mt-0.5">S/ {Number(inv.amount).toFixed(2)}</p>
                            {inv.file_name && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{inv.file_name}</p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={e => { e.stopPropagation(); openEdit(inv) }}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={e => { e.stopPropagation(); setDeleteTarget(inv) }}
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
                  {selectedInvoice ? (
                    <CardDescription>
                      Factura: <span className="font-medium text-foreground">{selectedInvoice.invoice_number}</span> • {selectedInvoice.client_name}
                    </CardDescription>
                  ) : (
                    <CardDescription>Selecciona una factura para previsualizarla aquí.</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0 flex-1 bg-muted/10 relative">
                  {selectedInvoice?.file_url ? (
                    <iframe
                      src={`${selectedInvoice.file_url}#view=FitH`}
                      className="absolute inset-0 w-full h-full border-0 rounded-b-2xl"
                      title="PDF Preview"
                    />
                  ) : selectedInvoice ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                      <img src="/icono_facturas.svg" alt="visor" className="size-36 mx-auto opacity-50" />
                      <p className="font-medium">Factura N° {selectedInvoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground mt-1">Cliente: {selectedInvoice.client_name}</p>
                      <p className="text-lg font-bold text-emerald-600 mt-2">S/ {Number(selectedInvoice.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-2">Sin archivo PDF adjunto</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                      <img src="/icono_facturas.svg" alt="visor" className="size-36 mx-auto opacity-50" />
                      <p className="font-medium">El visor está listo.</p>
                      <p className="text-sm mt-1">Selecciona una factura del panel izquierdo.</p>
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
              <DialogTitle>{isEditing ? "Editar Factura" : "Subir Nueva Factura"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Modifica los datos. Si subes un nuevo PDF, el anterior se reemplazará."
                  : "Completa los campos y adjunta el archivo PDF (máx. 3MB)."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="invoice_number">Número de Factura</Label>
                <Input id="invoice_number" value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} placeholder="Ej. F001-0001" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client_name">Nombre del Cliente</Label>
                <Input id="client_name" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} placeholder="Ej. Empresa ABC" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fecha</Label>
                  <DatePicker value={formData.invoice_date} onChange={(v) => setFormData({...formData, invoice_date: v})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Monto (S/)</Label>
                  <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} required />
                </div>
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
                      ? "border-emerald-500 bg-emerald-500/10 scale-[1.02]"
                      : selectedFile
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-border hover:border-emerald-400 hover:bg-muted/50"
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
                      <FileText className="size-10 text-emerald-500" />
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
                {saving ? <><Loader2 className="mr-2 size-4 animate-spin" /> Guardando...</> : isEditing ? "Guardar Cambios" : "Subir Factura"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Eliminar Factura
            </DialogTitle>
            <DialogDescription className="pt-2">
              ¿Estás seguro de que deseas eliminar la factura N°{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.invoice_number}</span>
              {" "}de {deleteTarget?.client_name}?{" "}
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
