import * as React from "react"
import { 
  Users, 
  Plus, 
  Search, 
  Pencil, 
  Trash2,
  Filter,
  Eye,
  AlertTriangle,
  Phone,
  CreditCard,
  MapPin
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
import { Checkbox } from "@/components/ui/checkbox"
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
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

interface PersonnelMember {
  id: string
  first_name: string
  last_name: string
  dni: string
  phone: string
  address: string
  area: string
  monthly_salary: number
  health_deduction_pct: number
  pension_type: string
  pension_deduction_pct: number
  status: string
  created_at: string
}

export default function PersonnelPage() {
  const [members, setMembers] = React.useState<PersonnelMember[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterArea, setFilterArea] = React.useState("Todas")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isAddingNewArea, setIsAddingNewArea] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = React.useState(false)
  const [memberToDeleteId, setMemberToDeleteId] = React.useState<string | null>(null)

  // Form state
  const [formData, setFormData] = React.useState({
    first_name: "",
    last_name: "",
    dni: "",
    phone: "",
    address: "",
    area: "Producción",
    monthly_salary: 0,
    health_deduction_pct: 9, // EsSalud por defecto
    pension_type: "ONP",
    pension_deduction_pct: 13 // ONP por defecto
  })
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [previewMember, setPreviewMember] = React.useState<PersonnelMember | null>(null)

  // Cálculos de deducciones
  const healthAmount = (formData.monthly_salary * formData.health_deduction_pct) / 100
  const salaryAfterHealth = formData.monthly_salary - healthAmount
  const pensionAmount = (formData.monthly_salary * formData.pension_deduction_pct) / 100
  const totalNetSalary = formData.monthly_salary - healthAmount - pensionAmount

  React.useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("personnel")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (error) {
      toast.error("Error al cargar personal")
    } else {
      const mappedData = (data || []).map(item => {
        return {
          ...item,
          first_name: item.name || "",
          last_name: item.surname || "",
          monthly_salary: item.salary || 0,
          health_deduction_pct: item.health_deduction_pct || 9,
          pension_type: item.pension_type || "ONP",
          pension_deduction_pct: item.pension_deduction_pct || 13
        }
      })
      setMembers(mappedData as PersonnelMember[])
    }
    setLoading(false)
  }

  const handleSelectChange = (field: string, value: string) => {
    if (field === "pension_type") {
      const rates: Record<string, number> = {
        "ONP": 13,
        "AFP Prima": 11.60,
        "AFP Habitat": 11.73,
        "AFP Integra": 11.74,
        "AFP Profuturo": 11.69
      }
      setFormData(prev => ({ ...prev, pension_type: value, pension_deduction_pct: rates[value] || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    
    // Validaciones de longitud y números
    if (id === "dni") {
      if (value.length > 8) return
      if (value !== "" && !/^\d+$/.test(value)) return
    }
    if (id === "phone") {
      if (value.length > 9) return
      if (value !== "" && !/^\d+$/.test(value)) return
    }

    setFormData(prev => ({ 
      ...prev, 
      [id]: id === "monthly_salary" ? parseFloat(value) || 0 : value 
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones finales
    if (formData.dni.length !== 8) {
      toast.error("El DNI debe tener exactamente 8 dígitos")
      return
    }
    if (formData.phone.length !== 9) {
      toast.error("El teléfono debe tener exactamente 9 dígitos")
      return
    }
    if (!formData.first_name || !formData.last_name || !formData.area) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    const finalData = {
      name: formData.first_name,
      surname: formData.last_name,
      dni: formData.dni,
      phone: formData.phone,
      address: formData.address,
      area: formData.area || "Producción",
      salary: Number(formData.monthly_salary) || 0,
      health_deduction_pct: formData.health_deduction_pct,
      pension_type: formData.pension_type,
      pension_deduction_pct: formData.pension_deduction_pct
    }

    if (editingId) {
      const { error } = await supabase
        .from("personnel")
        .update(finalData)
        .eq("id", editingId)

      if (error) {
        toast.error("Error al actualizar personal")
      } else {
        toast.success("Información actualizada correctamente")
        setEditingId(null)
        setIsDialogOpen(false)
        fetchMembers()
      }
    } else {
      const { error } = await supabase
        .from("personnel")
        .insert([finalData])

      if (error) {
        toast.error("Error al registrar personal")
      } else {
        toast.success("Personal registrado correctamente")
        setIsDialogOpen(false)
        fetchMembers()
      }
    }
    
    setFormData({ 
      first_name: "", 
      last_name: "", 
      dni: "", 
      phone: "", 
      address: "", 
      area: "Producción", 
      monthly_salary: 0,
      health_deduction_pct: 9,
      pension_type: "ONP",
      pension_deduction_pct: 13
    })
    setIsAddingNewArea(false)
  }

  const handleDelete = (id: string) => {
    setItemToDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredMembers.map(m => m.id))
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    setIsBatchDeleteDialogOpen(true)
  }

  const confirmBatchDelete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("personnel")
        .delete()
        .in("id", selectedIds)

      if (error) {
        toast.error("Error al eliminar los registros seleccionados")
      } else {
        toast.success(`${selectedIds.length} registros eliminados correctamente`)
        setSelectedIds([])
        fetchMembers()
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setLoading(false)
      setIsBatchDeleteDialogOpen(false)
    }
  }

  const confirmDelete = async () => {
    if (!memberToDeleteId) return

    const { error } = await supabase
      .from("personnel")
      .delete()
      .eq("id", memberToDeleteId)

    if (error) {
      toast.error("Error al eliminar registro")
    } else {
      toast.success("Registro eliminado")
      fetchMembers()
    }
    setIsDeleteDialogOpen(false)
    setMemberToDeleteId(null)
  }

  const startEdit = (member: PersonnelMember) => {
    setEditingId(member.id)
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      dni: member.dni,
      phone: member.phone,
      address: member.address,
      area: member.area,
      monthly_salary: member.monthly_salary,
      health_deduction_pct: member.health_deduction_pct || 9,
      pension_type: member.pension_type || "ONP",
      pension_deduction_pct: member.pension_deduction_pct || 13
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({ 
      first_name: "", 
      last_name: "", 
      dni: "", 
      phone: "", 
      address: "", 
      area: "Producción", 
      monthly_salary: 0,
      health_deduction_pct: 9,
      pension_type: "ONP",
      pension_deduction_pct: 13
    })
    setIsAddingNewArea(false)
  }

  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || member.dni.includes(searchTerm)
    const matchesArea = filterArea === "Todas" || member.area === filterArea
    return matchesSearch && matchesArea
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
                  <BreadcrumbPage>Gestión de Personal</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestión de Personal</h1>
              <p className="text-muted-foreground">Control de empleados, planilla y asignación de áreas.</p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedIds.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={handleBatchDelete}
                  className="animate-in fade-in zoom-in duration-200 shadow-md bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  <Trash2 className="mr-2 size-4" /> 
                  Eliminar ({selectedIds.length})
                </Button>
              )}
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg rounded-xl">
                    <Plus className="mr-2 size-4" /> Registrar Personal
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Editar Personal' : 'Nuevo Registro de Personal'}</DialogTitle>
                    <DialogDescription>
                      Ingresa los datos detallados del colaborador.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="first_name">Nombres</Label>
                        <Input 
                          id="first_name" 
                          placeholder="Ej. Juan Carlos" 
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="last_name">Apellidos</Label>
                        <Input 
                          id="last_name" 
                          placeholder="Ej. Pérez Gómez" 
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="dni">DNI (8 dígitos)</Label>
                        <Input 
                          id="dni" 
                          placeholder="Ej. 70451234" 
                          value={formData.dni}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono (9 dígitos)</Label>
                        <Input 
                          id="phone" 
                          placeholder="Ej. 912345678" 
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input 
                        id="address" 
                        placeholder="Ej. Av. Las Magnolias 123..." 
                        value={formData.address}
                        onChange={handleInputChange}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="area">Área Asignada</Label>
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
                            {Array.from(new Set([...members.map(m => m.area), "Producción", "Limpieza", "Ventas", "Administración"])).filter(Boolean).map(area => (
                              <SelectItem key={area} value={area}>{area}</SelectItem>
                            ))}
                            <SelectSeparator />
                            <SelectItem value="new" className="text-primary font-bold focus:text-primary focus:bg-primary/10 cursor-pointer">+ Nueva Área...</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="monthly_salary">Sueldo Mensual (S/)</Label>
                        <Input 
                          id="monthly_salary" 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          value={formData.monthly_salary}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Descuentos de Ley */}
                    <div className="space-y-4 p-4 mt-2 bg-muted/30 rounded-2xl border border-border/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descuento Salud</Label>
                          <div className="flex items-center gap-2 px-3 py-2 bg-background/50 border border-border/60 rounded-xl h-10 shadow-sm">
                            <span className="text-sm font-black text-rose-600">9%</span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">(EsSalud)</span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-end pb-1 text-right">
                          <span className="text-[9px] font-black text-muted-foreground/60 uppercase leading-none mb-1">Monto - Salud</span>
                          <span className="text-sm font-bold text-foreground">S/ {salaryAfterHealth.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                        <div className="grid gap-1.5">
                          <Label htmlFor="pension_type" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Pensión</Label>
                          <Select 
                            onValueChange={(v) => handleSelectChange("pension_type", v)} 
                            value={formData.pension_type}
                          >
                            <SelectTrigger id="pension_type" className="rounded-xl h-10 bg-background/50 shadow-sm">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="ONP">ONP (13%)</SelectItem>
                              <SelectItem value="AFP Prima">AFP Prima</SelectItem>
                              <SelectItem value="AFP Habitat">AFP Habitat</SelectItem>
                              <SelectItem value="AFP Integra">AFP Integra</SelectItem>
                              <SelectItem value="AFP Profuturo">AFP Profuturo</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1.5 ml-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Tasa aplicada:</span>
                            <span className="text-xs font-black text-rose-600">{formData.pension_deduction_pct}%</span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-end pb-1 text-right">
                          <span className="text-[10px] font-black text-primary uppercase leading-none mb-1">Total a Recibir</span>
                          <span className="text-2xl font-black text-primary leading-none">S/ {totalNetSalary.toFixed(2)}</span>
                        </div>
                      </div>
                      <p className="text-[8px] text-muted-foreground/60 italic text-center leading-tight uppercase font-bold tracking-widest">
                        * Cálculos automáticos según ley vigente
                      </p>
                    </div>
                    
                    {isAddingNewArea && (
                      <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                        <Input 
                          placeholder="Nombre de la nueva área..." 
                          className="flex-1 rounded-xl"
                          autoFocus
                          value={formData.area}
                          onChange={(e) => handleSelectChange("area", e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingId ? 'Guardar Cambios' : 'Registrar Colaborador'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>


          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o DNI..." 
                className="pl-9 bg-card rounded-xl border-border/60" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl">
                  <Filter className="mr-2 size-4" /> 
                  Áreas 
                  {filterArea !== "Todas" && (
                    <Badge className="ml-2 h-4 px-1 text-[10px] bg-primary text-primary-foreground">!</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl p-2">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground/50 px-2 py-1">Filtrar área</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filterArea} onValueChange={setFilterArea}>
                  <DropdownMenuRadioItem value="Todas" className="rounded-lg cursor-pointer">Todas</DropdownMenuRadioItem>
                  {Array.from(new Set(members.map(m => m.area))).filter(Boolean).map(area => (
                    <DropdownMenuRadioItem key={area} value={area} className="rounded-lg cursor-pointer">{area}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px] pl-6 pr-4">
                    <Checkbox 
                      checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="Seleccionar todo"
                    />
                  </TableHead>
                  <TableHead className="w-[30%] font-bold text-foreground py-4 px-4">Nombre Completo</TableHead>
                  <TableHead className="w-[15%] font-bold text-foreground py-4 px-4">Documento / Tel.</TableHead>
                  <TableHead className="w-[20%] font-bold text-foreground py-4 px-4">Área / Cargo</TableHead>
                  <TableHead className="w-[15%] text-right font-bold text-foreground py-4 px-4 whitespace-nowrap">Sueldo Neto</TableHead>
                  <TableHead className="w-[20%] text-right font-bold text-foreground py-4 pr-8 px-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><div className="h-12 w-full animate-pulse rounded-lg bg-muted/40" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6 pr-4">
                        <Checkbox 
                          checked={selectedIds.includes(member.id)}
                          onCheckedChange={() => handleToggleSelect(member.id)}
                          aria-label={`Seleccionar ${member.first_name}`}
                        />
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-sm text-foreground">{member.first_name} {member.last_name}</span>
                          <div className="flex items-center gap-1.5 opacity-60">
                            <MapPin className="size-2.5" />
                            <span className="text-[10px] font-medium truncate max-w-[150px]">{member.address}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        <div className="flex flex-col gap-1.5">
                          <Badge variant="outline" className="w-fit rounded-sm px-1.5 py-0 text-[9px] font-black border-border/60 bg-muted/50 text-muted-foreground uppercase tracking-widest">
                            DNI: {member.dni}
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-primary italic">
                            <Phone className="size-2.5" /> {member.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        <div className="flex">
                          <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border-none uppercase">
                            {member.area}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-5 px-4">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-foreground">S/ {(member.monthly_salary * (1 - (member.health_deduction_pct + member.pension_deduction_pct) / 100)).toFixed(2)}</span>
                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">Neto (Líquido)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-5 pr-8 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            className="hover:text-primary transition-colors h-7 w-7 rounded-lg" 
                            onClick={() => setPreviewMember(member)}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            className="hover:text-primary transition-colors h-7 w-7 rounded-lg" 
                            onClick={() => startEdit(member)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            className="hover:text-destructive transition-colors h-7 w-7 rounded-lg" 
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground text-xs italic">
                      No se encontraron registros de personal.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Diálogo de Previsualización */}
          <Dialog open={!!previewMember} onOpenChange={() => setPreviewMember(null)}>
            <DialogContent className="rounded-[2.5rem] max-w-md border-border/60 shadow-2xl overflow-hidden p-0">
              <div className="bg-primary/10 p-8 flex flex-col items-center text-center gap-2">
                <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center border-4 border-background shadow-xl">
                  <Users className="size-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-none mb-1">
                    {previewMember?.first_name} {previewMember?.last_name}
                  </h2>
                  <Badge className="bg-primary text-primary-foreground font-black text-[10px] uppercase rounded-full px-3">
                    {previewMember?.area}
                  </Badge>
                </div>
              </div>
              
              {previewMember && (
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Documento Nacional</Label>
                      <p className="font-bold flex items-center gap-2"><CreditCard className="size-4 text-muted-foreground" /> {previewMember.dni}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Teléfono Directo</Label>
                      <p className="font-bold flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {previewMember.phone}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Domicilio Registrado</Label>
                    <p className="text-sm font-semibold flex items-start gap-2"><MapPin className="size-4 text-muted-foreground mt-0.5" /> {previewMember.address}</p>
                  </div>

                  <div className="bg-card ring-1 ring-border/40 rounded-2xl p-5 flex justify-between items-center shadow-sm">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-black text-primary/60 tracking-widest">Sueldo Líquido Final</Label>
                      <p className="text-2xl font-black text-emerald-600">S/ {(previewMember.monthly_salary * (1 - (previewMember.health_deduction_pct + previewMember.pension_deduction_pct) / 100)).toFixed(2)}</p>
                      <p className="text-[9px] font-bold text-muted-foreground italic">Bruto: S/ {Number(previewMember.monthly_salary).toFixed(2)} (Incl. {previewMember.pension_type})</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">
                      ESTADO: ACTIVO
                    </Badge>
                  </div>
                </div>
              )}
              
              <div className="p-8 pt-0">
                <Button variant="secondary" onClick={() => setPreviewMember(null)} className="rounded-2xl font-black w-full h-12 uppercase tracking-widest text-xs">
                  Cerrar Ficha
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Diálogo de Confirmación de Eliminación */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="rounded-3xl max-w-sm border-border/60 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="size-5" /> 
                  ¿Dar de Baja?
                </DialogTitle>
                <DialogDescription className="py-2 text-foreground/70">
                  Eliminarás permanentemente al colaborador del sistema. Esta acción no se puede deshacer.
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
                  Sí, Eliminar Registro
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo de Confirmación de Eliminación Masiva */}
          <Dialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
            <DialogContent className="rounded-3xl max-w-sm border-border/60 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="size-5" /> 
                  ¿Eliminar Personal Seleccionado?
                </DialogTitle>
                <DialogDescription className="py-2 text-foreground/70">
                  Estás por eliminar a <span className="font-bold text-rose-600">{selectedIds.length} personas</span> del sistema. Esta acción es irreversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsBatchDeleteDialogOpen(false)}
                  className="rounded-xl font-bold w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmBatchDelete}
                  className="rounded-xl font-bold w-full sm:w-auto bg-rose-600 hover:bg-rose-700"
                >
                  Sí, Eliminar {selectedIds.length} Registros
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
