import { CustomSidebar } from "@/components/custom-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FolderOpen, 
  Upload,
  Search,
  Files
} from "lucide-react"

export default function OthersPage() {
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
                  <BreadcrumbPage className="font-bold flex items-center gap-2 text-muted-foreground">
                    <Files className="size-4" /> Documentos
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-black text-foreground">
                    Otros Documentos
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Otros Documentos</h1>
              <p className="text-muted-foreground">Archivos varios, manuales de usuario y políticas internas de la empresa.</p>
            </div>
            
            <Button className="bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg">
              <Upload className="mr-2 size-4" /> Subir Documento
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar documento por nombre..." 
                className="pl-9 bg-card rounded-xl border-border/60" 
              />
            </div>
          </div>

          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden flex-1">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Directorio General</CardTitle>
              <CardDescription>Consulta y administra archivos y recursos no categorizados.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
              <FolderOpen className="size-12 mb-4 text-muted-foreground/20" />
              <p className="font-medium">No hay otros documentos en este directorio.</p>
              <p className="text-sm">Sube cualquier archivo importante aquí.</p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
