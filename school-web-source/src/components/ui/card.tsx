import { cn } from "@/lib/utils"

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-soft-white rounded-3xl shadow-soft border border-white/50 p-6 md:p-8",
        hover && "transition-all duration-300 hover:shadow-card hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center mb-5",
        className
      )}
    >
      {children}
    </div>
  )
}
