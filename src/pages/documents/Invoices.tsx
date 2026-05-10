import * as React from "react"
import { useState } from "react"
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
  Receipt,
  Upload,
  Search,
  Edit,
  Trash2,
  Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface InvoiceRecord {
  id: string
  invoice_number: string
  client_name: string
  invoice_date: string
  amount: number
  file_name: string
  file_path: string
  file_url: string
  created_at: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRecord | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    invoice_number: "",
    client_name: "",
    invoice_date: "",
    amount: 0
  })

  useState(() => {
    fetchInvoices()
  })

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
    setEditingId(null)
    setIsEditing(false)
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
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing && editingId) {
        await supabase.from("invoices").update(formData).eq("id", editingId)
      } else {
        await supabase.from("invoices").insert([formData])
      }
      fetchInvoices()
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
    await supabase.from("invoices").delete().eq("id", deleteTarget.id)
    if (selectedId === deleteTarget.id) setSelectedId(null)
    setDeleteTarget(null)
    fetchInvoices()
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
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg w-full sm:w-auto">
              <Upload className="mr-2 size-4" /> Nueva Factura
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
                      <Receipt className="size-12 mb-4 text-emerald-500/20" />
                      <p className="font-medium">{search ? "Sin resultados." : "No hay facturas registradas."}</p>
                      <p className="text-sm mt-1">{search ? "Intenta con otra búsqueda." : "Registra la primera con el botón de arriba."}</p>
                    </div>
                  ) : (
                    <div className="divide-y border-t">
                      {filtered.map(inv => (
                        <div
                          key={inv.id}
                          onClick={() => setSelectedId(inv.id)}
                          className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedId === inv.id ? "bg-muted/50 border-l-4 border-l-emerald-500" : "border-l-4 border-l-transparent"}`}
                        >
                          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0">
                            <Receipt className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-foreground">{inv.client_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">N° {inv.invoice_number} • {inv.invoice_date}</p>
                            <p className="text-xs font-medium text-emerald-600 mt-0.5">S/ {Number(inv.amount).toFixed(2)}</p>
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
                  <CardTitle className="text-lg">Vista Previa de Factura</CardTitle>
                  {selectedInvoice ? (
                    <CardDescription>
                      Factura: <span className="font-medium text-foreground">{selectedInvoice.invoice_number}</span> • {selectedInvoice.client_name}
                    </CardDescription>
                  ) : (
                    <CardDescription>Selecciona una factura para previsualizarla aquí.</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0 flex-1 bg-muted/10 relative flex items-center justify-center">
                  {selectedInvoice ? (
                    <div className="text-center">
                      <Receipt className="size-16 mb-4 text-emerald-500/20 mx-auto" />
                      <p className="font-medium">Factura N° {selectedInvoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground mt-1">Cliente: {selectedInvoice.client_name}</p>
                      <p className="text-lg font-bold text-emerald-600 mt-2">S/ {Number(selectedInvoice.amount).toFixed(2)}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                      <Receipt className="size-16 mb-4 text-emerald-500/20 opacity-50" />
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
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Factura" : "Nueva Factura"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Modifica los datos de la factura." : "Ingresa los datos de la nueva factura."}
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
                  <Label htmlFor="invoice_date">Fecha</Label>
                  <Input id="invoice_date" type="date" value={formData.invoice_date} onChange={e => setFormData({...formData, invoice_date: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Monto (S/)</Label>
                  <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Factura"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Eliminar Factura
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la factura N° {deleteTarget?.invoice_number}?
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