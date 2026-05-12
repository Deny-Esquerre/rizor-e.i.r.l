import * as React from "react"
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Key,
  Files
} from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

const menuItems = [
  {
    title: "Panel Principal",
    icon: LayoutDashboard,
    url: "/dashboard",
  },
  {
    title: "Inventario",
    icon: Package,
    url: "/inventory",
  },
  {
    title: "Gestión de Personal",
    icon: Users,
    url: "/personnel",
  },
  {
    title: "Gestión Financiera",
    icon: Receipt,
    url: "/finance",
  },
  {
    title: "Gestión de Documentos",
    icon: Files,
    items: [
      {
        title: "Contratos",
        url: "/documents/contracts",
      },
      {
        title: "Facturas",
        url: "/documents/invoices",
      },
      {
        title: "Reportes",
        url: "/documents/reports",
      },
      {
        title: "Permisos",
        url: "/documents/permissions",
      },
      {
        title: "Otros",
        url: "/documents/others",
      },
    ]
  },
]

import logoUrlDark from "@/assets/2018/2.2.png"
import logoUrlLight from "@/assets/2018/2.2.png"

export function CustomSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setTheme, theme } = useTheme()
  const { isMobile } = useSidebar()
  const { user, signOut } = useAuth()
  
  const userEmail = user?.email || "admin@erp.com"
  const userName = user?.user_metadata?.name || userEmail.split('@')[0].toUpperCase()

  const [openCollapsibles, setOpenCollapsibles] = React.useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}
    menuItems.forEach(item => {
      if (item.items) {
        initialState[item.title] = item.items.some(subItem => location.pathname.startsWith(subItem.url))
      }
    })
    return initialState
  })

  React.useEffect(() => {
    setOpenCollapsibles(prev => {
      const newState = { ...prev }
      let changed = false
      menuItems.forEach(item => {
        if (item.items && item.items.some(subItem => location.pathname.startsWith(subItem.url))) {
          if (!newState[item.title]) {
            newState[item.title] = true
            changed = true
          }
        }
      })
      return changed ? newState : prev
    })
  }, [location.pathname])

  const toggleCollapsible = (title: string, isOpen: boolean) => {
    setOpenCollapsibles(prev => ({ ...prev, [title]: isOpen }))
  }

  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false)
  const [oldPassword, setOldPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      localStorage.removeItem("user_email")
      localStorage.removeItem("user_name")
      toast.success("Sesión cerrada correctamente")
      window.location.href = "https://landingpage-rizoeirl.vercel.app/"
    } catch (error) {
      toast.error("Error al cerrar sesión")
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden")
      return
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setIsChangingPassword(true)
    
    try {
      if (!user?.email) throw new Error("Usuario no encontrado")
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      })
      
      if (signInError) {
        toast.error("La contraseña actual es incorrecta")
        setIsChangingPassword(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        toast.error("Error al actualizar la contraseña")
        throw updateError
      }

      toast.success("Contraseña actualizada. La sesión se cerrará.")
      setIsPasswordModalOpen(false)
      
      setTimeout(() => {
        handleLogout()
      }, 2500)

    } catch (error) {
      console.error(error)
    } finally {
      setIsChangingPassword(false)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b p-4 flex items-center justify-center min-h-[80px]">
        <div className="w-full flex justify-center py-2 relative">
          <img 
            src={logoUrlLight} 
            alt="Logo Light" 
            className="w-full max-w-[150px] scale-[1.25] h-auto object-contain transition-all duration-300 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:max-w-none group-data-[collapsible=icon]:scale-100 dark:hidden" 
          />
          <img 
            src={logoUrlDark} 
            alt="Logo Dark" 
            className="w-full max-w-[150px] scale-[1.25] h-auto object-contain transition-all duration-300 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:max-w-none group-data-[collapsible=icon]:scale-100 hidden dark:block" 
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <React.Fragment key={item.title}>
                {item.items ? (
                  <Collapsible 
                    asChild 
                    open={openCollapsibles[item.title]}
                    onOpenChange={(isOpen) => toggleCollapsible(item.title, isOpen)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} className="transition-all duration-200 hover:scale-[1.02] hover:shadow-sm">
                          <item.icon className="size-4" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={item.title} className="transition-all duration-200 hover:scale-[1.02] hover:shadow-sm">
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </React.Fragment>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={userName}
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shrink-0 shadow-sm">
                    {userName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs opacity-70">{userEmail}</span>
                  </div>
                  <ChevronRight className="ml-auto size-4 group-data-[collapsible=icon]:hidden transition-transform duration-200" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "top" : "right"}
                align={isMobile ? "end" : "end"}
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold uppercase">{userName}</span>
                      <span className="truncate text-xs">{userEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? (
                    <Sun className="mr-2 size-4" />
                  ) : (
                    <Moon className="mr-2 size-4" />
                  )}
                  <span>Cambiar Tema</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)}>
                  <Key className="mr-2 size-4" />
                  <span>Cambiar Contraseña</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Modal Cambio de Contraseña */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handlePasswordChange}>
            <DialogHeader>
              <DialogTitle>Cambiar Contraseña</DialogTitle>
              <DialogDescription>
                Ingresa tu contraseña actual y la nueva contraseña. Por seguridad, se cerrará tu sesión.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="old-password">Contraseña Actual</Label>
                <Input
                  id="old-password"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? "Actualizando..." : "Actualizar Contraseña"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
