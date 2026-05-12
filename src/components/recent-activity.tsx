import { useState, useEffect } from "react"
import { IconCircleCheck, IconUserPlus, IconInfoCircle, IconLoader2 } from "@tabler/icons-react"
import { FileSpreadsheet, FileText } from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

interface Activity {
  id: string
  text: string
  time: string
  type: "sale" | "person"
  date: string
}

interface Transaction {
  id: string
  date: string
  description: string
  type: string
  category: string
  amount: number
  status: string
}

type Period = "week" | "month" | "all"
type Format = "excel" | "pdf"

function getPeriodRange(period: Period): { start: string; end: string } | null {
  if (period === "all") return null
  const now = new Date()
  const end = now.toISOString().split("T")[0]

  if (period === "week") {
    const start = new Date(now)
    start.setDate(start.getDate() - start.getDay())
    return { start: start.toISOString().split("T")[0], end }
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start: start.toISOString().split("T")[0], end }
  }

  return null
}

async function fetchTransactionsByPeriod(period: Period): Promise<Transaction[]> {
  let query = supabase
    .from("transactions")
    .select("id, date, description, type, category, amount, status")
    .order("date", { ascending: false })

  const range = getPeriodRange(period)
  if (range) {
    query = query.gte("date", range.start).lte("date", range.end)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((t: any) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    type: t.type,
    category: t.category,
    amount: Number(t.amount) || 0,
    status: t.status,
  }))
}

function exportToExcel(transactions: Transaction[], period: Period) {
  try {
    const periodLabel = period === "week" ? "Semanal" : period === "month" ? "Mensual" : "General"
    const dataToExport = transactions.map(item => ({
      Fecha: item.date,
      Descripción: item.description,
      Tipo: item.type,
      Categoría: item.category,
      Monto: item.amount,
      Estado: item.status,
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Finanzas")
    XLSX.writeFile(wb, `Reporte_${periodLabel}_${format(new Date(), "ddMMyyyy")}.xlsx`)
    toast.success(`Reporte ${periodLabel.toLowerCase()} exportado en Excel`)
  } catch {
    toast.error("Error al generar Excel")
  }
}

function exportToPDF(transactions: Transaction[], period: Period) {
  try {
    const periodLabel = period === "week" ? "Semanal" : period === "month" ? "Mensual" : "General"
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`Reporte de Gestión Financiera - ${periodLabel}`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Fecha de generación: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30)

    const tableColumn = ["Fecha", "Descripción", "Tipo", "Categoría", "Monto", "Estado"]
    const tableRows = transactions.map(item => [
      item.date,
      item.description,
      item.type,
      item.category,
      `S/ ${item.amount.toFixed(2)}`,
      item.status,
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    })

    doc.save(`Reporte_${periodLabel}_${format(new Date(), "ddMMyyyy")}.pdf`)
    toast.success(`Reporte ${periodLabel.toLowerCase()} exportado en PDF`)
  } catch {
    toast.error("Error al generar PDF")
  }
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<Format | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    async function fetchActivities() {
      try {
        const today = new Date().toISOString().split("T")[0]

        const [transactionsRes, personnelRes] = await Promise.all([
          supabase
            .from("transactions")
            .select("id, description, amount, date, type, created_at")
            .eq("type", "Ingreso")
            .eq("date", today)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("personnel")
            .select("id, name, surname, created_at")
            .order("created_at", { ascending: false })
            .limit(3),
        ])

        const combined: Activity[] = []

        if (transactionsRes.data) {
          transactionsRes.data.forEach((t: any) => {
            const date = new Date(t.created_at)
            const timeStr = date.toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            })
            combined.push({
              id: `sale-${t.id}`,
              text: `Venta: ${t.description} - S/ ${Number(t.amount).toFixed(2)}`,
              time: `Hoy ${timeStr}`,
              type: "sale",
              date: t.created_at,
            })
          })
        }

        if (personnelRes.data) {
          personnelRes.data.forEach((p: any) => {
            const date = new Date(p.created_at)
            const timeStr = date.toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            })
            combined.push({
              id: `person-${p.id}`,
              text: `${p.name} ${p.surname || ""} se unió al equipo`,
              time: `Hoy ${timeStr}`,
              type: "person",
              date: p.created_at,
            })
          })
        }

        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setActivities(combined.slice(0, 6))
      } catch (err) {
        console.error("Error fetching activities:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const handleExport = async (format: Format, period: Period) => {
    setExporting(format)
    try {
      const transactions = await fetchTransactionsByPeriod(period)
      if (transactions.length === 0) {
        toast.error("No hay transacciones en el período seleccionado")
        return
      }
      if (format === "excel") {
        exportToExcel(transactions, period)
      } else {
        exportToPDF(transactions, period)
      }
    } catch {
      toast.error("Error al obtener datos financieros")
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 rounded-xl border border-border/50 bg-card/50">
        <IconLoader2 className="size-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Cargando actividad...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 pr-4 border-r border-border/50">
        <div className="size-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Actividad Reciente</span>
      </div>

      <div className="flex-1 flex flex-wrap items-center gap-x-8 gap-y-2">
        {activities.length > 0 ? (
          activities.map((activity) => {
            const isSale = activity.type === "sale"
            return (
              <div key={activity.id} className="flex items-center gap-2 group cursor-default">
                <div
                  className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform ${
                    isSale ? "bg-emerald-500/10" : "bg-blue-500/10"
                  }`}
                >
                  {isSale ? (
                    <IconCircleCheck className="size-4 text-emerald-500" />
                  ) : (
                    <IconUserPlus className="size-4 text-blue-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium leading-none">{activity.text}</span>
                  <span className="text-[11px] text-muted-foreground/70">{activity.time}</span>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex items-center gap-2">
            <IconInfoCircle className="size-4 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">No hay actividad reciente por ahora</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={exporting === "excel"} className="rounded-xl h-8 text-xs font-semibold shadow-sm border-border/60 px-3">
              <FileSpreadsheet className={`size-3.5 mr-1.5 ${exporting === "excel" ? "animate-spin" : ""} text-emerald-600`} />
              Exportar Excel
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-2xl p-2 border-border/40">
            <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground/50 px-2 py-1">Seleccionar período</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("excel", "week")} className="rounded-lg cursor-pointer py-2">
              <span className="font-semibold text-sm">Esta Semana</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("excel", "month")} className="rounded-lg cursor-pointer py-2">
              <span className="font-semibold text-sm">Este Mes</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("excel", "all")} className="rounded-lg cursor-pointer py-2">
              <span className="font-semibold text-sm">General</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={exporting === "pdf"} className="rounded-xl h-8 text-xs font-semibold shadow-sm border-border/60 px-3">
              <FileText className={`size-3.5 mr-1.5 ${exporting === "pdf" ? "animate-spin" : ""} text-rose-600`} />
              Exportar PDF
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-2xl p-2 border-border/40">
            <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground/50 px-2 py-1">Seleccionar período</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("pdf", "week")} className="rounded-lg cursor-pointer py-2">
              <span className="font-semibold text-sm">Esta Semana</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf", "month")} className="rounded-lg cursor-pointer py-2">
              <span className="font-semibold text-sm">Este Mes</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf", "all")} className="rounded-lg cursor-pointer py-2">
              <span className="font-semibold text-sm">General</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
