"use client";

import { useMemo, useState, useTransition } from "react";
import { updateNavigationPermissions } from "@/app/actions/admin/navigation-items";
import { NavigationItem } from "@/types/navigation";

const ROLE_COLUMNS = [
  "FREE",
  "PLUS",
  "PRO",
  "PRO_PLUS",
  "BUSINESS",
  "ADMIN",
  "SUPER_ADMIN"
];

interface NavigationManagerClientProps {
  items: NavigationItem[];
}

export default function NavigationManagerClient({ items }: NavigationManagerClientProps) {
  const [localItems, setLocalItems] = useState<NavigationItem[]>(items);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedItems = useMemo(() => {
    return [...localItems].sort((a, b) => a.sort_order - b.sort_order);
  }, [localItems]);

  const toggleRole = (itemId: string, role: string) => {
    setLocalItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const roles = new Set(item.allowed_roles || []);
        if (roles.has(role)) {
          roles.delete(role);
        } else {
          roles.add(role);
        }
        return { ...item, allowed_roles: Array.from(roles) };
      })
    );
  };

  const toggleActive = (itemId: string) => {
    setLocalItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        return { ...item, is_active: !item.is_active };
      })
    );
  };

  const handleSave = () => {
    setStatusMessage(null);
    const updates = localItems.map(item => ({
      id: item.id,
      allowed_roles: item.allowed_roles || [],
      is_active: item.is_active,
      sort_order: item.sort_order
    }));

    startTransition(async () => {
      const result = await updateNavigationPermissions(updates);
      if (result.success) {
        setStatusMessage("Zapisano zmiany uprawnień.");
      } else {
        setStatusMessage(result.error || "Nie udało się zapisać zmian.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-dark/70 dark:text-amber-200/70">
        Zaznacz role/plan subskrypcji, które mają widzieć dany link w menu bocznym.
      </p>

      <div className="overflow-x-auto border border-white/10 rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-black/30">
            <tr>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-white/60">
                Link
              </th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-white/60">
                Kategoria
              </th>
              <th className="text-center px-3 py-3 text-xs uppercase tracking-wide text-white/60">
                Wyświetlaj
              </th>
              {ROLE_COLUMNS.map(role => (
                <th
                  key={role}
                  className="text-center px-3 py-3 text-xs uppercase tracking-wide text-white/60"
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{item.label}</div>
                  <div className="text-xs text-white/50">{item.path}</div>
                </td>
                <td className="px-4 py-3 text-white/70">{item.category || "—"}</td>
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={item.is_active || false}
                    onChange={() => toggleActive(item.id)}
                    className="h-4 w-4 accent-primary"
                    title="Wyświetlaj w sidebare"
                  />
                </td>
                {ROLE_COLUMNS.map(role => (
                  <td key={role} className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.allowed_roles?.includes(role) || false}
                      onChange={() => toggleRole(item.id, role)}
                      className="h-4 w-4 accent-primary"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">{statusMessage}</span>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2 rounded-xl bg-primary text-brown-900 font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Zapisywanie..." : "Zapisz"}
        </button>
      </div>
    </div>
  );
}
