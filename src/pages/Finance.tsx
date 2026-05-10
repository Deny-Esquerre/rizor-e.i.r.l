import * as React from "react"
import { CustomSidebar } from "@/components/custom-sidebar"
import { 
  SidebarInset, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectSeparator
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Transaction {
  id: string
  date: string
  description: string
  type: "Ingreso" | "Gasto"
  category: string
  amount: number
  status: "Completado" | "Pendiente"
  created_at?: string
}

const DEFAULT_CATEGORIES = ["Ventas", "Compras", "Gastos Operativos", "Nómina", "Servicios", "Logística", "Otros"]

export default function FinancePage() {
  const [items, setItems] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterType, setFilterType] = React.useState("Todos")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [isAddingNewCategory, setIsAddingNewCategory] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState("")
  const [localCategories, setLocalCategories] = React.useState<string[]>(DEFAULT_CATEGORIES)
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [itemToDeleteId, setItemToDeleteId] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    date: new Date(),
    description: "",
    type: "Ingreso" as "Ingreso" | "Gasto",
    category: "Ventas",
    amount: 0,
    status: "Completado" as "Completado" | "Pendiente"
  })

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
      
      if (!error && data) {
        const catNames = data.map(c => c.name)
        setLocalCategories(prev => Array.from(new Set([...prev, ...catNames])))
      }
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })

      if (error) {
        toast.error(`Error de base de datos: ${error.message}`)
      } else {
        const fetchedItems = data || []
        setItems(fetchedItems)
        const dbCategories = Array.from(new Set(fetchedItems.map((i: any) => i.category || "General")))
        setLocalCategories(prev => Array.from(new Set([...dbCategories, ...prev])))
      }
    } catch (err: any) {
      toast.error(`Error crítico al cargar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchTransactions()
    fetchCategories()
    toast.success("Sistema de Finanzas Conectado")
  }, [])

  const confirmNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("El nombre de la categoría no puede estar vacío")
      return
    }
    const name = newCategoryName.trim()
    setLocalCategories(prev => Array.from(new Set([...prev, name])))
    setFormData(prev => ({ ...prev, category: name }))
    setIsAddingNewCategory(false)
    setNewCategoryName("")
    toast.success(`Categoría "${name}" creada`)

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name }])
      if (error && error.code !== '23505') {
        console.warn("No se sincronizó la categoría con la BD:", error.message)
      }
    } catch (err) {
      console.warn("Error de red al sincronizar categoría:", err)
    }
  }

  const filteredItems = items.filter(item => {
    const desc = (item.description || "").toLowerCase()
    const matchesSearch = desc.includes(searchTerm.toLowerCase())
    const matchesType = filterType === "Todos" || item.type === filterType
    return matchesSearch && matchesType
  })

  const stats = {
    income: items.filter(i => i.type === "Ingreso").reduce((acc, i) => acc + (Number(i.amount) || 0), 0),
    expenses: items.filter(i => i.type === "Gasto").reduce((acc, i) => acc + (Number(i.amount) || 0), 0),
    balance: 0
  }
  stats.balance = stats.income - stats.expenses

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!formData.description) {
      toast.error("La descripción es obligatoria")
      return
    }

    try {
      const finalData = {
        date: format(formData.date, "yyyy-MM-dd"),
        description: formData.description,
        type: formData.type,
        category: formData.category || "Ventas",
        amount: Number(formData.amount) || 0,
        status: formData.status
      }

      let res;
      if (editingId) {
        res = await supabase
          .from('transactions')
          .update(finalData)
          .eq('id', editingId)
      } else {
        res = await supabase
          .from('transactions')
          .insert([finalData])
      }

      if (res.error) {
        toast.error(`Error de Supabase: ${res.error.message}`)
      } else {
        toast.success(editingId ? "Actualizado correctamente" : "Registrado con éxito")
        fetchTransactions()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (err: any) {
      toast.error(`Error inesperado: ${err.message}`)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({ 
      date: new Date(), 
      description: "", 
      type: "Ingreso", 
      category: "Ventas", 
      amount: 0, 
      status: "Completado" 
    })
    setIsAddingNewCategory(false)
  }

  const handleDelete = (id: string) => {
    setItemToDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDeleteId) return
    const { error } = await supabase.from('transactions').delete().eq('id', itemToDeleteId)
    if (error) toast.error("No se pudo eliminar")
    else {
      toast.success("Eliminado")
      fetchTransactions()
    }
    setIsDeleteDialogOpen(false)
    setItemToDeleteId(null)
  }

  const startEdit = (item: Transaction) => {
    setEditingId(item.id)
    setFormData({
      date: new Date(item.date + "T12:00:00"),
      description: item.description,
      type: item.type,
      category: item.category,
      amount: item.amount,
      status: item.status
    })
    setIsDialogOpen(true)
  }

  return (
    <SidebarProvider>
      <CustomSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-bold">Finanzas / FishFlow</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestión Financiera</h1>
              <p className="text-muted-foreground">Administra ingresos, egresos y el flujo de caja de la planta.</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg">
                  <Plus className="mr-2 size-4" /> Nuevo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Editar Registro' : 'Nueva Operación'}</DialogTitle>
                    <DialogDescription>
                      Completa los detalles de la transacción financiera.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select 
                          value={formData.type} 
                          onValueChange={v => setFormData({...formData, type: v as any})}
                        >
                          <SelectTrigger id="type" className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Ingreso">Ingreso (+)</SelectItem>
                            <SelectItem value="Gasto">Gasto (-)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Fecha</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start font-medium rounded-xl">
                              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                              {format(formData.date, "dd/MM/yyyy", { locale: es })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.date}
                              onSelect={(d) => d && setFormData({...formData, date: d})}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Input 
                        id="description"
                        placeholder="Ej. Venta de productos"
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Select 
                        onValueChange={(v) => {
                          if (v === "new") setIsAddingNewCategory(true)
                          else { setIsAddingNewCategory(false); setFormData({...formData, category: v}) }
                        }}
                        value={isAddingNewCategory ? "new" : formData.category}
                      >
                        <SelectTrigger id="category" className="rounded-xl">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {localCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                          <SelectSeparator />
                          <SelectItem value="new" className="text-primary font-bold focus:text-primary focus:bg-primary/10 cursor-pointer">+ Nueva Categoría...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isAddingNewCategory && (
                      <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                        <Input 
                          placeholder="Nombre de la nueva categoría..." 
                          className="flex-1 rounded-xl"
                          autoFocus
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), confirmNewCategory())}
                        />
                        <Button 
                          type="button"
                          size="icon" 
                          className="shrink-0 bg-emerald-500 hover:bg-emerald-600 rounded-xl"
                          onClick={confirmNewCategory}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Monto (S/)</Label>
                        <Input 
                          id="amount"
                          type="number" 
                          step="0.01" 
                          value={formData.amount} 
                          onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={v => setFormData({...formData, status: v as any})}
                        >
                          <SelectTrigger id="status" className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Completado">Completado</SelectItem>
                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit">{editingId ? 'Actualizar Registro' : 'Guardar Operación'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-emerald-500/10 via-card to-card shadow-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase text-emerald-600/60 tracking-wider">Ingresos Acumulados</CardDescription>
                <CardTitle className="text-2xl font-black text-emerald-700">S/ {stats.income.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</CardTitle>
                <div className="flex mt-1">
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px] px-1.5 py-0">
                    <ArrowUpRight className="mr-1 size-3" /> FLUJO POSITIVO
                  </Badge>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <Coins className="size-3" /> Total percibido en el periodo
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-rose-500/10 via-card to-card shadow-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase text-rose-600/60 tracking-wider">Gastos Acumulados</CardDescription>
                <CardTitle className="text-2xl font-black text-rose-700">S/ {stats.expenses.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</CardTitle>
                <div className="flex mt-1">
                  <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 border-none font-bold text-[10px] px-1.5 py-0">
                    <ArrowDownRight className="mr-1 size-3" /> SALIDA DE CAJA
                  </Badge>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <TrendingDown className="size-3" /> Egresos operativos y otros
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-primary/10 via-card to-card shadow-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase text-primary/60 tracking-wider">Balance Neto</CardDescription>
                <CardTitle className="text-2xl font-black text-primary">S/ {stats.balance.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</CardTitle>
                <div className="flex mt-1">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px] px-1.5 py-0">
                    <TrendingUp className="mr-1 size-3" /> DISPONIBLE
                  </Badge>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  Capital neto para reinversión
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar movimientos..." 
                className="pl-9 bg-card" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="sm:w-auto">
                  <Filter className="mr-2 size-4" /> 
                  Filtros 
                  {filterType !== "Todos" && (
                    <Badge className="ml-2 h-4 px-1 text-[10px] bg-primary text-primary-foreground">!</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl p-2 border-border/40">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground/50 px-2 py-1">Filtrar por</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filterType} onValueChange={v => setFilterType(v as any)}>
                  <DropdownMenuRadioItem value="Todos" className="rounded-lg cursor-pointer">Todos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Ingreso" className="rounded-lg cursor-pointer">Solo Ingresos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Gasto" className="rounded-lg cursor-pointer">Solo Gastos</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                {filterType !== "Todos" && (
                  <>
                    <DropdownMenuSeparator className="my-2 opacity-50" />
                    <DropdownMenuItem 
                      onClick={() => setFilterType("Todos")}
                      className="rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer py-2 font-bold text-xs"
                    >
                      Limpiar Filtros
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-md border border-border/60 bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[15%] font-bold text-foreground py-3">Fecha</TableHead>
                  <TableHead className="w-[45%] font-bold text-foreground py-3">Detalle / Categoría</TableHead>
                  <TableHead className="w-[20%] text-right font-bold text-foreground py-3">Monto</TableHead>
                  <TableHead className="w-[20%] text-right font-bold text-foreground py-3 pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}><div className="h-10 w-full animate-pulse rounded bg-muted/40" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3">
                        <span className="text-xs font-medium text-muted-foreground">{item.date}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm text-foreground leading-none mb-1">{item.description}</span>
                          <div className="flex">
                            <Badge variant="outline" className="rounded-sm px-1.5 py-0 text-[10px] font-semibold border-border bg-muted/30 text-muted-foreground uppercase tracking-tight">
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className={`inline-flex items-center gap-1 font-bold text-sm px-2 py-0.5 rounded-full ${
                          item.type === 'Ingreso' 
                            ? 'text-emerald-700 bg-emerald-500/10' 
                            : 'text-rose-700 bg-rose-500/10'
                        }`}>
                          {item.type === 'Ingreso' ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          S/ {Math.abs(item.amount).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3 pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            className="hover:text-primary transition-colors h-7 w-7" 
                            onClick={() => startEdit(item)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            className="hover:text-destructive transition-colors h-7 w-7" 
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-muted-foreground text-xs italic">
                      No se encontraron movimientos financieros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Diálogo de Confirmación de Eliminación */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="rounded-2xl max-w-sm border-border/60 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="size-5" /> 
                  ¿Eliminar Registro?
                </DialogTitle>
                <DialogDescription className="py-2 text-foreground/70">
                  Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este movimiento financiero?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="rounded-xl font-bold w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  className="rounded-xl font-bold w-full sm:w-auto bg-rose-600 hover:bg-rose-700"
                >
                  Confirmar Eliminación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
