import { cn } from "@/utils/cn";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 transition-all duration-300",
        
        // Light Mode (Frost Glass)
        // Look: "Frost Glass" (Milky, clean, modern). CSS: bg-white/70, backdrop-blur-lg, border border-white/60, shadow-lg.
        "bg-white/70 backdrop-blur-lg border border-white/60 text-[#3E2723] shadow-lg",
        
        // Dark Mode (Onyx Glass)
        // Look: "Onyx Glass" (Deep, luxurious, readable). CSS: bg-black/40, backdrop-blur-xl, border border-white/10, shadow-2xl.
        "dark:bg-black/40 dark:backdrop-blur-xl dark:border-white/10 dark:text-amber-50 dark:shadow-2xl",
        
        // Hover Effect
        "hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] hover:border-primary/40",
        
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
