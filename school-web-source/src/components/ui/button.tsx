import Link from "next/link"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  href?: string
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-body font-medium transition-all duration-300 focus:outline-none"

  const variants = {
    primary:
      "bg-gradient-to-r from-pistachio to-sage text-white shadow-soft hover:shadow-lift hover:-translate-y-0.5",
    secondary:
      "border-2 border-pistachio/30 text-olive hover:bg-cream hover:border-pistachio/50",
    ghost: "text-olive/70 hover:text-olive hover:bg-cream",
  }

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-3.5 text-base",
  }

  const classes = cn(base, variants[variant], sizes[size], className)

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
