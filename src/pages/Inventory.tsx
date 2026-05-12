import * as React from "react"
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2,
  Filter,
  Eye,
  AlertTriangle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { CustomSidebar } from "@/components/custom-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface InventoryItem {
  id: number
  name: string
  type: string
  area: string
  price: number
  quantity: number
  created_at: string
}

export default function InventoryPage() {
  const [items, setItems] = React.useState<InventoryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterType, setFilterType] = React.useState("Todos")
  const [filterArea, setFilterArea] = React.useState("Todas")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isAddingNewArea, setIsAddingNewArea] = React.useState(false)
  const [isAddingNewType, setIsAddingNewType] = React.useState(false)
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [itemToDeleteId, setItemToDeleteId] = React.useState<number | null>(null)

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    type: "Pescado",
    area: "Almacén A",
    price: 0,
    quantity: 0
  })
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [previewItem, setPreviewItem] = React.useState<InventoryItem | null>(null)

  React.useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (error) {
      toast.error("Error al cargar inventario")
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [id]: id === "price" || id === "quantity" ? parseFloat(value) || 0 : value 
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalData = {
      ...formData,
      area: formData.area || "Almacén A"
    }

    if (editingId) {
      const { error } = await supabase
        .from("inventory")
        .update(finalData)
        .eq("id", editingId)

      if (error) {
        toast.error("Error al actualizar producto")
      } else {
        toast.success("Producto actualizado correctamente")
        setEditingId(null)
        setIsDialogOpen(false)
        fetchItems()
      }
    } else {
      const { error } = await supabase
        .from("inventory")
        .insert([finalData])

      if (error) {
        toast.error("Error al registrar producto")
      } else {
        toast.success("Producto registrado correctamente")
        setIsDialogOpen(false)
        fetchItems()
      }
    }
    
    setFormData({ name: "", type: "Pescado", area: "Almacén A", price: 0, quantity: 0 })
    setIsAddingNewArea(false)
    setIsAddingNewType(false)
  }

  const handleDelete = (id: number) => {
    setItemToDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDeleteId) return

    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", itemToDeleteId)

    if (error) {
      toast.error("Error al eliminar producto")
    } else {
      toast.success("Producto eliminado")
      fetchItems()
    }
    setIsDeleteDialogOpen(false)
    setItemToDeleteId(null)
  }

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      type: item.type,
      area: item.area,
      price: item.price,
      quantity: item.quantity
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({ name: "", type: "Pescado", area: "Almacén A", price: 0, quantity: 0 })
    setIsAddingNewArea(false)
    setIsAddingNewType(false)
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "Todos" || item.type === filterType
    const matchesArea = filterArea === "Todas" || item.area === filterArea
    return matchesSearch && matchesType && matchesArea
  })

  return (
    <SidebarProvider>
      <CustomSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Centro de Control</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Inventario</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inventario General</h1>
              <p className="text-muted-foreground">Gestiona el stock, precios y ubicación de tus productos.</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg">
                  <Plus className="mr-2 size-4" /> Registrar Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Editar Producto' : 'Registrar Nuevo Producto'}</DialogTitle>
                    <DialogDescription>
                      Ingresa los detalles del producto para añadirlo al inventario.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre del Producto</Label>
                      <Input 
                        id="name" 
                        placeholder="Ej. Filete de Tilapia" 
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select 
                          onValueChange={(v) => {
                            if (v === "new") {
                              setIsAddingNewType(true)
                              handleSelectChange("type", "")
                            } else {
                              setIsAddingNewType(false)
                              handleSelectChange("type", v)
                            }
                          }} 
                          value={isAddingNewType ? "new" : formData.type}
                        >
                          <SelectTrigger id="type" className="rounded-xl">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {Array.from(new Set([...items.map(i => i.type), "Pescado", "Marisco", "Insumo"])).filter(Boolean).map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                            <SelectSeparator />
                            <SelectItem value="new" className="text-primary font-bold focus:text-primary focus:bg-primary/10 cursor-pointer">+ Nuevo Tipo...</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="area">Área</Label>
                        <Select 
                          onValueChange={(v) => {
                            if (v === "new") {
                              setIsAddingNewArea(true)
                              handleSelectChange("area", "")
                            } else {
                              setIsAddingNewArea(false)
                              handleSelectChange("area", v)
                            }
                          }} 
                          value={isAddingNewArea ? "new" : formData.area}
                        >
                          <SelectTrigger id="area" className="rounded-xl">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {Array.from(new Set([...items.map(i => i.area), "Almacén A", "Congelación", "Planta"])).filter(Boolean).map(area => (
                              <SelectItem key={area} value={area}>{area}</SelectItem>
                            ))}
                            <SelectSeparator />
                            <SelectItem value="new" className="text-primary font-bold focus:text-primary focus:bg-primary/10 cursor-pointer">+ Nueva Área...</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {isAddingNewType && (
                      <div className="grid gap-2 animate-in fade-in slide-in-from-top-1">
                        <Label htmlFor="newType">Nombre del Nuevo Tipo</Label>
                        <Input 
                          id="newType" 
                          placeholder="Ej. Congelados, Conservas..." 
                          className="rounded-xl border-primary/30 focus-visible:ring-primary/20"
                          value={formData.type}
                          onChange={(e) => handleSelectChange("type", e.target.value)}
                        />
                      </div>
                    )}

                    {isAddingNewArea && (
                      <div className="grid gap-2 animate-in fade-in slide-in-from-top-1">
                        <Label htmlFor="newArea">Nombre de la Nueva Área</Label>
                        <Input 
                          id="newArea" 
                          placeholder="Ej. Almacén B, Recepción..." 
                          className="rounded-xl border-primary/30 focus-visible:ring-primary/20"
                          value={formData.area}
                          onChange={(e) => handleSelectChange("area", e.target.value)}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price">Precio (S/)</Label>
                        <Input 
                          id="price" 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          value={formData.price}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="quantity">Cantidad</Label>
                        <Input 
                          id="quantity" 
                          type="number" 
                          placeholder="0" 
                          value={formData.quantity}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Producto</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar productos..." 
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
                  {(filterType !== "Todos" || filterArea !== "Todas") && (
                    <Badge className="ml-2 h-4 px-1 text-[10px] bg-primary text-primary-foreground">
                      !
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl p-2 border-border/40">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground/50 px-2 py-1">Filtrar por</DropdownMenuLabel>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="rounded-lg cursor-pointer py-2">
                    <span className="font-semibold text-sm">Categoría</span>
                    {filterType !== "Todos" && <span className="ml-auto text-[10px] text-primary font-bold">{filterType}</span>}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="rounded-xl p-2 shadow-2xl border-border/40">
                    <DropdownMenuRadioGroup value={filterType} onValueChange={setFilterType}>
                      <DropdownMenuRadioItem value="Todos" className="rounded-lg cursor-pointer">Todos</DropdownMenuRadioItem>
                      {Array.from(new Set(items.map(i => i.type))).filter(Boolean).map(type => (
                        <DropdownMenuRadioItem key={type} value={type} className="rounded-lg cursor-pointer">{type}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="rounded-lg cursor-pointer py-2 mt-1">
                    <span className="font-semibold text-sm">Ubicación</span>
                    {filterArea !== "Todas" && <span className="ml-auto text-[10px] text-primary font-bold">{filterArea}</span>}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="rounded-xl p-2 shadow-2xl border-border/40">
                    <DropdownMenuRadioGroup value={filterArea} onValueChange={setFilterArea}>
                      <DropdownMenuRadioItem value="Todas" className="rounded-lg cursor-pointer">Todas</DropdownMenuRadioItem>
                      {Array.from(new Set(items.map(i => i.area))).filter(Boolean).map(area => (
                        <DropdownMenuRadioItem key={area} value={area} className="rounded-lg cursor-pointer">{area}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {(filterType !== "Todos" || filterArea !== "Todas") && (
                  <>
                    <DropdownMenuSeparator className="my-2 opacity-50" />
                    <DropdownMenuItem 
                      onClick={() => { setFilterType("Todos"); setFilterArea("Todas"); }}
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
                  <TableHead className="w-[40%] min-w-[200px] font-bold text-foreground py-3">Producto / SKU</TableHead>
                  <TableHead className="w-[15%] font-bold text-foreground py-3">Tipo</TableHead>
                  <TableHead className="w-[15%] font-bold text-foreground py-3">Ubicación</TableHead>
                  <TableHead className="w-[10%] text-right font-bold text-foreground py-3 whitespace-nowrap">Precio Unit.</TableHead>
                  <TableHead className="w-[10%] text-right font-bold text-foreground py-3 whitespace-nowrap">Stock</TableHead>
                  <TableHead className="w-[10%] text-right font-bold text-foreground py-3 pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><div className="h-6 w-full animate-pulse rounded bg-muted/40" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm text-foreground">{item.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">REF: {item.id.toString().substring(0, 12)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="rounded-sm px-1.5 py-0 text-[10px] font-semibold border-border bg-muted/30 text-muted-foreground uppercase tracking-tight">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs text-foreground/80">{item.area}</span>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <span className="text-sm font-medium">S/ {item.price.toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <span className={`text-sm font-bold ${item.quantity < 10 ? 'text-destructive' : 'text-foreground'}`}>
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3 pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            className="hover:text-primary transition-colors h-7 w-7" 
                            title="Previsualizar"
                            onClick={() => setPreviewItem(item)}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            className="hover:text-primary transition-colors h-7 w-7" 
                            title="Editar"
                            onClick={() => startEdit(item)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            className="hover:text-destructive transition-colors h-7 w-7" 
                            title="Eliminar"
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
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground text-xs italic">
                      No se encontraron registros de inventario.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Diálogo de Previsualización */}
          <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
            <DialogContent className="rounded-2xl max-w-md border-border/60 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Detalles del Producto
                </DialogTitle>
                <DialogDescription>
                  Ficha técnica completa del registro de inventario.
                </DialogDescription>
              </DialogHeader>
              
              {previewItem && (
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground/60">Nombre</Label>
                      <p className="font-bold text-lg leading-none">{previewItem.name}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground/60">Categoría</Label>
                      <div>
                        <Badge className="rounded-sm bg-primary/10 text-primary border-none text-[10px] font-black">{previewItem.type}</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground/60">Ubicación</Label>
                      <p className="text-sm font-semibold">{previewItem.area}</p>
                    </div>
                    <div className="space-y-1 text-center border-x border-border/30">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground/60">Precio</Label>
                      <p className="text-sm font-black text-primary italic">S/ {previewItem.price.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground/60">Stock</Label>
                      <p className={`text-sm font-black ${previewItem.quantity < 10 ? 'text-destructive' : 'text-foreground'}`}>
                        {previewItem.quantity} <span className="text-[10px] opacity-40">un.</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-4 space-y-2 border border-border/20">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      <span>Identificador Único</span>
                      <span>Registrado el</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code className="text-[10px] font-mono bg-background/50 px-2 py-0.5 rounded border border-border/30">{previewItem.id}</code>
                      <span className="text-[10px] font-bold">{new Date(previewItem.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewItem(null)} className="rounded-xl font-bold w-full">
                  Cerrar Vista
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo de Confirmación de Eliminación */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="rounded-2xl max-w-sm border-border/60 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="size-5" /> 
                  ¿Eliminar Producto?
                </DialogTitle>
                <DialogDescription className="py-2 text-foreground/70">
                  Esta acción es irreversible. ¿Realmente deseas eliminar este registro del inventario?
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
                  Sí, Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
