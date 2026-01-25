"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import clsx from "clsx";

const items = [
  { href: "/dashboard", label: "Mój panel" },
  { href: "/dashboard/beekeeper", label: "Pszczelarz" },
  { href: "/dashboard/association", label: "Związek / koło" },
  { href: "/dashboard/admin", label: "Administrator" }
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[220px,1fr] gap-6">
      <aside className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-amber-900/10 dark:border-white/10 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-amber-950 dark:text-white mb-3">
          Panele ApiaryMind
        </h2>
        <nav className="flex flex-col gap-1 text-sm">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "px-3 py-2 rounded-lg text-amber-950 dark:text-white hover:bg-amber-500/20 dark:hover:bg-amber-500/20 transition-colors",
                pathname === item.href && "bg-amber-500/20 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-amber-900/10 dark:border-white/10 rounded-xl p-4">
        {children}
      </section>
    </div>
  );
}