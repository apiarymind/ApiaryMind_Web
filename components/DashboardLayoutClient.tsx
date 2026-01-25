"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-[calc(100vh-65px)] relative">
      {/* Mobile Toggle - Floating Button (Bottom Left) */}
      <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed bottom-6 left-6 z-50 w-12 h-12 flex items-center justify-center bg-amber-500 rounded-full text-amber-950 dark:text-amber-950 font-bold shadow-xl border-2 border-amber-600 hover:scale-110 transition-transform"
          title="Menu"
      >
        {isSidebarOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar Container */}
      {/* Mobile: Fixed full height (minus header approx), slide-in. Desktop: Static. */}
      <div className={`
          fixed top-[61px] bottom-0 left-0 z-40 w-64 bg-white/90 dark:bg-black/40 backdrop-blur-xl transform transition-transform duration-300 ease-in-out border-r border-amber-900/10 dark:border-white/10
          md:translate-x-0 md:static md:block md:z-auto md:top-auto md:bottom-auto md:h-auto
          ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
         <Sidebar />
      </div>
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
