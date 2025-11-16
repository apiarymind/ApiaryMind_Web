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
      <aside className="bg-brown-800/80 border border-brown-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-amber-200 mb-3">
          Panele ApiaryMind
        </h2>
        <nav className="flex flex-col gap-1 text-sm">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "px-3 py-2 rounded-lg hover:bg-brown-700",
                pathname === item.href && "bg-brown-700 text-amber-200 font-semibold"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="bg-brown-800/60 border border-brown-700 rounded-xl p-4">
        {children}
      </section>
    </div>
  );
}