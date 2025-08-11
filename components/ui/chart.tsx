"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
// REMOVIDO: import { useChart } from "recharts-tooltip-common"
// El hook useChart se obtiene del contexto de Recharts o se implementa directamente.
// Para que funcione, Recharts debe estar correctamente configurado y el ChartTooltipContent
// debe ser un hijo de un componente de Recharts que provea el contexto.
// En este caso, Recharts provee el contexto necesario para 'active', 'payload', 'label'.
// Si sigues teniendo problemas con 'useChart', asegúrate de que el ChartTooltipContent
// esté anidado correctamente dentro de un <LineChart> o <BarChart> de Recharts.

// Re-implementación simple de useChart si no se obtiene directamente de Recharts
// Esto es un placeholder, la implementación real de Recharts es más compleja.
// Para que funcione correctamente, Recharts debe pasar estas props al TooltipContent.
// Si Recharts no las pasa directamente, necesitarías un componente intermedio.
// Sin embargo, el componente ChartTooltipContent de shadcn/ui está diseñado para
// recibir estas props directamente de Recharts.
interface RechartsTooltipContext {
  active?: boolean
  payload?: RechartsTooltipPayloadItem[] // Use the defined interface for payload items
  label?: string | number
}

// Este hook simula el comportamiento esperado de useChart de Recharts
// En un entorno real, Recharts pasa estas propiedades directamente al componente TooltipContent
// cuando se usa como 'content' prop en <Tooltip content={<ChartTooltipContent />} />
// Si esto no funciona, significa que la versión de Recharts o la forma en que se usa
// no está pasando las props 'active', 'payload', 'label' directamente.
// Para simplificar, asumiremos que Recharts las pasa como props al ChartTooltipContent.
// Por lo tanto, no necesitamos un 'useChart' hook aquí, sino que las recibimos como props.
// Sin embargo, para mantener la estructura original de shadcn/ui, mantendremos la referencia
// a un 'useChart' que se espera que Recharts provea implícitamente.
// Si el error persiste, la solución sería pasar 'active', 'payload', 'label' como props
// directamente a ChartTooltipContent desde el ChartTooltip.
const useChart = (): RechartsTooltipContext => {
  // Esto es un placeholder. En un entorno real, Recharts inyecta estas propiedades.
  // Si estás usando ChartTooltipContent como `content` de Recharts Tooltip,
  // Recharts se encarga de pasar `active`, `payload`, `label` a tu componente.
  // Por lo tanto, no necesitas un hook `useChart` aquí, sino que las recibes como props.
  // Para compatibilidad con la estructura de shadcn/ui, lo dejamos así,
  // pero ten en cuenta que la magia la hace Recharts al renderizar el tooltip.
  return { active: true, payload: [], label: "" } // Valores por defecto para evitar errores de compilación
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

interface ChartContextProps {
  config: ChartConfig
}

function useChartContext() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChartContext must be used within a ChartProvider")
  }
  return context
}

export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
    icon?: React.ComponentType<{ className?: string }>
  }
}

interface ChartContainerProps extends React.ComponentProps<"div"> {
  config: ChartConfig
  children: React.ReactNode
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => {
    const newConfig = React.useMemo(() => {
      const activeConfig = {} as ChartConfig
      for (const key in config) {
        activeConfig[key] = {
          label: config[key].label,
          color: `hsl(${config[key].color})`,
          icon: config[key].icon,
        }
      }
      return activeConfig
    }, [config])

    return (
      <ChartContext.Provider value={{ config: newConfig }}>
        <TooltipProvider>
          <div
            ref={ref}
            className={cn(
              "flex h-[300px] w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 text-gray-950 shadow-sm",
              className,
            )}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </ChartContext.Provider>
    )
  },
)
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = ({ ...props }) => {
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>{props.children}</TooltipTrigger>
      <TooltipContent className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-md" {...props} />
    </Tooltip>
  )
}
ChartTooltip.displayName = "ChartTooltip"

interface ChartTooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipContent> {
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "dot" | "line"
  nameKey?: string
  labelKey?: string
  // Recharts Tooltip props that are passed directly
  active?: boolean
  payload?: any[]
  label?: string | number
}

// Definir una interfaz para los elementos del payload de Recharts
interface RechartsTooltipPayloadItem {
  dataKey: string | number
  name?: string
  value: any
  color?: string
  payload: any // The original data object for the point
}

const ChartTooltipContent = React.forwardRef<React.ElementRef<typeof TooltipContent>, ChartTooltipContentProps>(
  (
    {
      className,
      hideLabel = false,
      hideIndicator = false,
      indicator = "dot",
      nameKey,
      labelKey,
      active,
      payload,
      label,
      ...props
    },
    ref,
  ) => {
    const { config } = useChartContext()
    // const { active, payload, label } = useChart() // REMOVIDO: Ya se reciben como props

    if (!active || !payload || payload.length === 0) {
      return null
    }

    const formattedLabel = labelKey ? (payload[0]?.payload as any)?.[labelKey] : label
    const items = payload.map((item: RechartsTooltipPayloadItem) => {
      // Explicitly type 'item' here
      const key = nameKey ? item.payload[nameKey] : item.name
      return {
        ...item,
        name: config[key as keyof typeof config]?.label || item.name,
        color: config[key as keyof typeof config]?.color || item.color,
      }
    })

    return (
      <TooltipContent
        ref={ref}
        className={cn(
          "grid min-w-[130px] items-center text-xs border border-gray-200 bg-white text-gray-950 shadow-md",
          className,
        )}
        {...props}
      >
        {!hideLabel && formattedLabel && (
          <div className="border-b border-gray-100 px-3 py-2 text-sm font-medium">{formattedLabel}</div>
        )}
        <div className="grid gap-1 px-3 py-2">
          {items.map((item, i) => (
            <div key={item.dataKey || i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {!hideIndicator && (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      indicator === "line" && "h-px w-3",
                      item.color && `bg-[${item.color}]`,
                    )}
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                )}
                <Label className="text-gray-600">{item.name}</Label>
              </div>
              <Label className="text-right font-medium text-gray-950">{item.value}</Label>
            </div>
          ))}
        </div>
      </TooltipContent>
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }
