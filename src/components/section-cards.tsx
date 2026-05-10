import { useState, useEffect } from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { supabase } from "@/lib/supabase"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface DashboardStats {
  salesToday: number
  salesYesterday: number
  productsStock: number
  activePersonnel: number
  growthRate: number
}

export function SectionCards() {
  const [stats, setStats] = useState<DashboardStats>({
    salesToday: 0,
    salesYesterday: 0,
    productsStock: 0,
    activePersonnel: 0,
    growthRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

      const formatDate = (date: Date) => date.toISOString().split("T")[0]

      const [
        transactionsRes,
        inventoryRes,
        personnelRes,
      ] = await Promise.all([
        supabase
          .from("transactions")
          .select("amount, type, date"),
        supabase
          .from("inventory")
          .select("id", { count: "exact" }),
        supabase
          .from("personnel")
          .select("id", { count: "exact" }),
      ])

      if (transactionsRes.data) {
        const todayStr = formatDate(today)
        const yesterdayStr = formatDate(yesterday)
        const monthStartStr = formatDate(firstDayOfMonth)
        const lastMonthStartStr = formatDate(firstDayLastMonth)
        const lastMonthEndStr = formatDate(lastDayLastMonth)

        const salesToday = transactionsRes.data
          .filter(t => t.type === "Ingreso" && t.date === todayStr)
          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)

        const salesYesterday = transactionsRes.data
          .filter(t => t.type === "Ingreso" && t.date === yesterdayStr)
          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)

        const salesThisMonth = transactionsRes.data
          .filter(t => t.type === "Ingreso" && t.date >= monthStartStr)
          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)

        const salesLastMonth = transactionsRes.data
          .filter(t => t.type === "Ingreso" && t.date >= lastMonthStartStr && t.date <= lastMonthEndStr)
          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)

        let growthRate = 0
        if (salesLastMonth > 0) {
          growthRate = ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100
        } else if (salesThisMonth > 0) {
          growthRate = 100
        }

        setStats(prev => ({
          ...prev,
          salesToday,
          salesYesterday,
          growthRate: Math.round(growthRate * 10) / 10,
        }))
      }

      if (inventoryRes.count !== null) {
        setStats(prev => ({ ...prev, productsStock: inventoryRes.count || 0 }))
      }

      if (personnelRes.count !== null) {
        setStats(prev => ({ ...prev, activePersonnel: personnelRes.count || 0 }))
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getTrendIcon = (value: number, isPositive: boolean = true) => {
    if (value === 0) return <IconTrendingDown className="mr-1 size-3.5" />
    return isPositive && value > 0 ? (
      <IconTrendingUp className="mr-1 size-3.5" />
    ) : (
      <IconTrendingDown className="mr-1 size-3.5" />
    )
  }

  const getTrendClass = (value: number, isPositive: boolean = true) => {
    if (value === 0) return "bg-muted text-muted-foreground border-none font-semibold"
    return isPositive && value > 0
      ? "bg-emerald-500/10 text-emerald-600 border-none font-semibold"
      : "bg-rose-500/10 text-rose-600 border-none font-semibold"
  }

  const getTrendValue = (value: number) => {
    if (value === 0) return "0%"
    return value > 0 ? `+${value}%` : `${value}%`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden border-none ring-1 ring-border/50 bg-gradient-to-br from-primary/10 via-card to-card">
            <CardHeader>
              <CardDescription>Cargando...</CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums">-</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:bg-gradient-to-br *:data-[slot=card]:from-primary/10 *:data-[slot=card]:via-card *:data-[slot=card]:to-card *:data-[slot=card]:shadow-md dark:*:data-[slot=card]:from-primary/20 dark:*:data-[slot=card]:to-card/80">
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-emerald-500/10 via-card to-card">
        <CardHeader>
          <CardDescription>Ventas del Día</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums">
            S/ {formatCurrency(stats.salesToday)}
          </CardTitle>
          <CardAction>
            <Badge variant="secondary" className={getTrendClass(stats.salesYesterday)}>
              {getTrendIcon(stats.salesYesterday)}
              {stats.salesYesterday > 0
                ? `+${formatCurrency(stats.salesToday - stats.salesYesterday)}`
                : formatCurrency(stats.salesToday)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs border-t-0 bg-transparent pt-0">
          <div className="flex items-center gap-1.5 font-medium text-emerald-600/80">
            vs ayer: S/ {formatCurrency(stats.salesYesterday)}
          </div>
          <div className="text-muted-foreground/70">
            Transacciones registradas hoy
          </div>
        </CardFooter>
      </Card>

      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <CardDescription>Productos en Stock</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums">
            {stats.productsStock}
          </CardTitle>
          <CardAction>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-semibold">
              <IconTrendingUp className="mr-1 size-3.5" />
              {stats.productsStock > 0 ? "Activo" : "Sin datos"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs border-t-0 bg-transparent pt-0">
          <div className="flex items-center gap-1.5 font-medium text-primary/80">
            Estado del inventario
          </div>
          <div className="text-muted-foreground/70">
            Productos registrados
          </div>
        </CardFooter>
      </Card>

      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-blue-500/10 via-card to-card">
        <CardHeader>
          <CardDescription>Personal Activo</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums">
            {stats.activePersonnel}
          </CardTitle>
          <CardAction>
            <Badge variant="secondary" className={getTrendClass(stats.activePersonnel, false)}>
              {stats.activePersonnel > 0 ? (
                <>
                  <IconTrendingUp className="mr-1 size-3.5" />
                  En planta
                </>
              ) : (
                <>
                  <IconTrendingDown className="mr-1 size-3.5" />
                  Sin registros
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs border-t-0 bg-transparent pt-0">
          <div className="flex items-center gap-1.5 font-medium text-blue-600/80">
            Equipo de trabajo
          </div>
          <div className="text-muted-foreground/70">Colaboradores actuales</div>
        </CardFooter>
      </Card>

      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-none ring-1 ring-border/50 bg-gradient-to-br from-amber-500/10 via-card to-card">
        <CardHeader>
          <CardDescription>Tasa de Crecimiento</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums">
            {getTrendValue(stats.growthRate)}
          </CardTitle>
          <CardAction>
            <Badge variant="secondary" className={getTrendClass(stats.growthRate)}>
              {getTrendIcon(stats.growthRate)}
              Mensual
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs border-t-0 bg-transparent pt-0">
          <div className="flex items-center gap-1.5 font-medium text-amber-600/80">
            vs mes anterior
          </div>
          <div className="text-muted-foreground/70">
            {stats.growthRate >= 0 ? "Crecimiento positivo" : "Necesita mejorar"}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}