import { cn } from "@/utils/cn";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden p-6 transition-all duration-300",
        // Text colors remain static for readability
        "text-[#3E2723] dark:text-amber-50",
        // Enhanced shadows for light mode (Android-like elevation)
        "shadow-light-card-lg dark:shadow-none",
        // Hover Effect
        "hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] hover:border-primary/40 dark:hover:shadow-[0_0_20px_rgba(255,193,7,0.3)]",
        className
      )}
      style={{
        borderRadius: 'var(--theme-card-radius, 1.5rem)',
        borderColor: 'var(--theme-card-border)',
        borderWidth: 'var(--theme-card-border-width, 1px)',
        borderStyle: 'solid',
        // Override inline shadow with Tailwind class, but keep CSS variable as fallback
        boxShadow: 'var(--theme-card-shadow)',
        backdropFilter: 'var(--theme-card-blur, blur(20px))',
        backgroundColor: 'var(--theme-card-bg, rgba(255, 255, 255, 0.7))',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
