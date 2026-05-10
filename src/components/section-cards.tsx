import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:bg-gradient-to-br *:data-[slot=card]:from-primary/10 *:data-[slot=card]:via-card *:data-[slot=card]:to-card *:data-[slot=card]:shadow-md dark:*:data-[slot=card]:from-primary/20 dark:*:data-[slot=card]:to-card/80">
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <CardDescription>Ventas del Día</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums">
            S/ 0.00
          </CardTitle>
          <CardAction>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-semibold">
              <IconTrendingUp className="mr-1 size-3.5" />
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs border-t-0 bg-transparent pt-0">
          <div className="flex items-center gap-1.5 font-medium text-primary/80">
            Tendencia de hoy <IconTrendingUp className="size-3.5" />
          </div>
          <div className="text-muted-foreground/70">
            Comparado con ayer
          </div>
        </CardFooter>
      </Card>
      
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <CardDescription>Productos en Stock</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums">
            0
          </CardTitle>
          <CardAction>
            <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-semibold">
              <IconTrendingDown className="mr-1 size-3.5" />
              0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs border-t-0 bg-transparent pt-0">
          <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
            Estado del inventario <IconTrendingDown className="size-3.5" />
          </div>
          <div className="text-muted-foreground/70">
            Productos registrados
          </div>
        </CardFooter>
      </Card>

      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <CardDescription>Personal Activo</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums">
            0
          </CardTitle>
          <CardAction>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-semibold">
              <IconTrendingUp className="mr-1 size-3.5" />
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs border-t-0 bg-transparent pt-0">
          <div className="flex items-center gap-1.5 font-medium text-primary/80">
            Equipo de trabajo <IconTrendingUp className="size-3.5" />
          </div>
          <div className="text-muted-foreground/70">Colaboradores actuales</div>
        </CardFooter>
      </Card>

      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <CardDescription>Tasa de Crecimiento</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums">
            0%
          </CardTitle>
          <CardAction>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-semibold">
              <IconTrendingUp className="mr-1 size-3.5" />
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs border-t-0 bg-transparent pt-0">
          <div className="flex items-center gap-1.5 font-medium text-primary/80">
            Crecimiento mensual <IconTrendingUp className="size-3.5" />
          </div>
          <div className="text-muted-foreground/70">Proyecciones del sistema</div>
        </CardFooter>
      </Card>
    </div>
  )
}
