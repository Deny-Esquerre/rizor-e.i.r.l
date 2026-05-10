import * as React from "react"
import { IconCircleCheck, IconPackageImport, IconUserPlus, IconInfoCircle, IconLoader2 } from "@tabler/icons-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Activity {
  id: number
  text: string
  time: string
  type: 'sale' | 'stock' | 'person' | 'info'
}

const iconMap = {
  sale: { icon: <IconCircleCheck className="size-4 text-primary" />, bg: "bg-primary/10" },
  stock: { icon: <IconPackageImport className="size-4 text-blue-500" />, bg: "bg-blue-500/10" },
  person: { icon: <IconUserPlus className="size-4 text-green-500" />, bg: "bg-green-500/10" },
  info: { icon: <IconInfoCircle className="size-4 text-orange-500" />, bg: "bg-orange-500/10" },
}

export function RecentActivity() {
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    async function fetchActivities() {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) throw error
        if (data) {
          // Mapear created_at a un formato de tiempo relativo si fuera necesario
          setActivities(data as any)
        }
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
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Actividad</span>
      </div>
      
      <div className="flex-1 flex flex-wrap items-center gap-x-8 gap-y-2">
        {activities.length > 0 ? (
          activities.map((activity) => {
            const config = iconMap[activity.type] || iconMap.info
            return (
              <div key={activity.id} className="flex items-center gap-2 group cursor-default">
                <div className={`p-1.5 rounded-lg ${config.bg} group-hover:scale-110 transition-transform`}>
                  {config.icon}
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
