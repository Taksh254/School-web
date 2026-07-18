import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

export default function SectionHeader({
  label,
  title,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "max-w-2xl mb-10 md:mb-14",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {label && (
        <span className="inline-block px-4 py-1.5 rounded-full bg-sage/10 text-sage-dark text-sm font-medium font-display mb-3">
          {label}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-navy leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-navy/60 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
