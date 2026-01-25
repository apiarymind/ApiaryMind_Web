'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { NavigationItem } from '@/types/navigation';
import { getNavigation } from '@/app/actions/get-navigation';
import {
  LayoutDashboard,
  Sparkles,
  Briefcase,
  Home,
  Map,
  ClipboardList,
  Honeycomb,
  Droplet,
  Crown,
  QrCode,
  Package,
  Calendar,
  Stethoscope,
  Upload,
  Store,
  FileText,
  Beaker,
  LifeBuoy,
  Building2,
  Users,
  Megaphone,
  CalendarDays,
  Wallet,
  Users2,
  Dna,
  Boxes,
  CalendarClock,
  BarChart3,
  Shield,
  UserCog,
  CheckCircle2,
  LayoutGrid,
  FileCode2,
  Settings,
  Settings2,
  Palette,
  Share2,
  HelpCircle,
  ClipboardCheck,
  FlaskConical,
  Sliders,
  Navigation,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

// Typ dla komponentu ikony
type IconComponent = React.ComponentType<LucideProps>;

// Mapowanie nazw ikon na komponenty lucide-react
const IconMap: Record<string, IconComponent> = {
  LayoutDashboard,
  Sparkles,
  Briefcase,
  Home,
  Map,
  ClipboardList,
  Honeycomb,
  Droplet,
  Crown,
  QrCode,
  Package,
  Calendar,
  Stethoscope,
  Upload,
  Store,
  FileText,
  Beaker,
  LifeBuoy,
  Building2,
  Users,
  Megaphone,
  CalendarDays,
  Wallet,
  Users2,
  Dna,
  Boxes,
  CalendarClock,
  BarChart3,
  Shield,
  UserCog,
  CheckCircle2,
  LayoutGrid,
  FileCode2,
  Settings,
  Settings2,
  Palette,
  Share2,
  HelpCircle,
  ClipboardCheck,
  FlaskConical,
  Sliders,
  Navigation,
};

// Fallback icon
const DefaultIcon = LayoutDashboard;

/**
 * Pobiera komponent ikony na podstawie nazwy
 */
const getIcon = (name: string | null | undefined): IconComponent => {
  if (!name) return DefaultIcon;
  return IconMap[name] || DefaultIcon;
};

interface SidebarProps {
  navigationItems?: NavigationItem[];
}

export default function Sidebar({ navigationItems: propNavigationItems }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(propNavigationItems || []);
  const [isLoading, setIsLoading] = useState(!propNavigationItems || propNavigationItems.length === 0);

  // Pobierz dane z serwera jeśli nie zostały przekazane jako props
  useEffect(() => {
    if (!propNavigationItems || propNavigationItems.length === 0) {
      setIsLoading(true);
      getNavigation()
        .then((items) => {
          setNavigationItems(items);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error loading navigation:', error);
          setIsLoading(false);
        });
    }
  }, [propNavigationItems]);

  // Przygotuj role użytkownika do filtrowania
  const userRoles = useMemo(() => {
    const roles: string[] = [];
    
    if (profile) {
      // Dodaj plan użytkownika
      if (profile.plan) {
        roles.push(profile.plan.toUpperCase());
      }
      
      // Dodaj system_role użytkownika
      if (profile.system_role) {
        roles.push(profile.system_role.toUpperCase());
      }
      
      // Dodaj role (dla kompatybilności wstecznej)
      if (profile.role) {
        const roleUpper = profile.role.toUpperCase();
        if (roleUpper === 'SUPER_ADMIN') roles.push('SUPER_ADMIN');
        else if (roleUpper === 'ADMIN') roles.push('ADMIN');
        else roles.push('USER');
      }
    }
    
    return roles;
  }, [profile]);

  // Filtruj elementy na podstawie uprawnień
  const visibleItems = useMemo(() => {
    return navigationItems.filter((item) => {
      // Sprawdź czy użytkownik ma dostęp do tego elementu
      const userRolesSet = new Set(userRoles);
      const isVisible = item.allowed_roles.some((role) => 
        userRolesSet.has(role.toUpperCase())
      );
      
      return isVisible;
    });
  }, [navigationItems, userRoles]);

  // Grupuj elementy według kategorii
  const groupedItems = useMemo(() => {
    const groups: Record<string, NavigationItem[]> = {};
    
    visibleItems.forEach((item) => {
      const category = item.category || 'Inne';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    
    return groups;
  }, [visibleItems]);

  // Sprawdź czy ścieżka jest aktywna
  const isActive = (path: string) => {
    if (!pathname) return false;
    
    // Dokładne dopasowanie dla głównego dashboardu
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    
    // Dla innych ścieżek sprawdź czy pathname zaczyna się od path
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  if (isLoading) {
    return (
      <aside className="w-full h-full border-r border-amber-900/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-center h-32">
          <div className="text-amber-600 dark:text-amber-400 text-sm">Ładowanie menu...</div>
        </div>
      </aside>
    );
  }

  if (Object.keys(groupedItems).length === 0) {
    return (
      <aside className="w-full h-full border-r border-amber-900/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-center h-32">
          <div className="text-amber-600 dark:text-amber-400 text-sm">Brak elementów menu</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full h-full border-r border-amber-900/10 dark:border-white/10 bg-white/90 dark:bg-black/40 backdrop-blur-xl p-6 overflow-y-auto">
      <nav className="space-y-8">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category}>
            {category !== 'Inne' && (
              <h3 className="text-xs uppercase text-amber-600 dark:text-amber-400 font-bold mb-3 tracking-wider">
                {category}
              </h3>
            )}
            <ul className="space-y-2 text-sm">
              {items.map((item) => {
                const IconComponent = getIcon(item.icon_name);
                const active = isActive(item.path);
                
                return (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        active
                          ? 'bg-amber-500 text-amber-950 dark:text-amber-950 font-semibold'
                          : 'text-amber-950 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
