import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-olive font-body">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none",
          "focus:bg-white focus:border-pistachio focus:shadow-glow",
          "font-body",
          className
        )}
        style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }}
        {...props}
      />
    </div>
  )
}
