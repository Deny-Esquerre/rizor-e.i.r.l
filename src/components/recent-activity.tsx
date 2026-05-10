import { useState, useEffect } from "react"
import { IconCircleCheck, IconUserPlus, IconInfoCircle, IconLoader2 } from "@tabler/icons-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Activity {
  id: string
  text: string
  time: string
  type: "sale" | "person"
  date: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

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
    </div>
  )
}