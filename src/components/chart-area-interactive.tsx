import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { supabase } from "@/lib/supabase"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "An interactive area chart"

const chartConfig = {
  transactions: {
    label: "Flujo de Caja",
  },
  ingreso: {
    label: "Ingresos",
    color: "var(--chart-1)",
  },
  gasto: {
    label: "Gastos",
    color: "#ef4444",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState("90d")
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("date, type, amount")
        .order("date", { ascending: true })

      if (error) {
        console.error("Error fetching chart data:", error)
      } else if (data) {
        // Agrupar por fecha
        const grouped = data.reduce((acc: any, curr: any) => {
          const date = curr.date
          if (!acc[date]) {
            acc[date] = { date, ingreso: 0, gasto: 0 }
          }
          if (curr.type === "Ingreso") {
            acc[date].ingreso += Number(curr.amount) || 0
          } else {
            acc[date].gasto += Number(curr.amount) || 0
          }
          return acc
        }, {})

        setItems(Object.values(grouped))
      }
    } catch (err) {
      console.error("Unexpected error:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = React.useMemo(() => {
    if (!items.length) return []
    
    const today = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    
    const startDate = new Date()
    startDate.setDate(today.getDate() - daysToSubtract)
    const startDateStr = startDate.toISOString().split("T")[0]

    return items.filter((item) => item.date >= startDateStr)
  }, [items, timeRange])

  return (
    <Card className="pt-0 border-none ring-1 ring-border/50 shadow-sm overflow-hidden">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b border-border/50 py-5 sm:flex-row bg-muted/20">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-xl font-bold">Flujo de Caja Interactivo</CardTitle>
          <CardDescription>
            Análisis de ingresos y gastos reales del sistema
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex bg-card"
            aria-label="Seleccionar rango"
          >
            <SelectValue placeholder="Últimos 3 meses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Últimos 3 meses
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Últimos 30 días
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Últimos 7 días
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillIngreso" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-ingreso)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-ingreso)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillGasto" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-gasto)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-gasto)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value + "T12:00:00")
                  return date.toLocaleDateString("es-ES", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value + "T12:00:00").toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="gasto"
                type="natural"
                fill="url(#fillGasto)"
                stroke="var(--color-gasto)"
                stackId="a"
              />
              <Area
                dataKey="ingreso"
                type="natural"
                fill="url(#fillIngreso)"
                stroke="var(--color-ingreso)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
