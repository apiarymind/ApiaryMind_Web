"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { UserProfile } from "@/utils/profile-mapper";
import DashboardNews from "@/app/components/DashboardNews";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { NavigationItem } from "@/types/navigation";
import { MASTER_NAVIGATION } from "@/src/config/navigationConfig";

// Definicja sekcji sidebaru
interface SidebarSection {
  id: string;
  title?: string; // Opcjonalny nagłówek sekcji
  items: NavigationItem[];
}

// Mapowanie ścieżek do nowych sekcji
const SECTION_MAPPING: Record<string, string> = {
  // GŁÓWNE (bez nagłówka)
  '/dashboard': 'main',
  '/dashboard/analytics': 'main',
  '/dashboard/business': 'main',
  
  // ZASOBY (kolejność: Magazyn, Pasieki, Ule, Matki, Import)
  '/dashboard/beekeeper/warehouse': 'resources',
  '/dashboard/apiaries': 'resources',
  '/dashboard/hives': 'resources',
  '/dashboard/beekeeper/queens': 'resources',
  '/dashboard/beekeeper/import': 'resources',
  
  // PRACA (Gospodarka Pasieczna)
  '/dashboard/calendar': 'work',
  '/dashboard/inspections': 'work',
  '/dashboard/beekeeper/veterinary': 'work',
  
  // BIZNES (Produkcja i Biznes)
  '/dashboard/harvests': 'business',
  '/dashboard/beekeeper/harvests': 'business', // Stara ścieżka dla kompatybilności
  '/dashboard/processing': 'business',
  '/dashboard/marketplace': 'business',
  '/dashboard/beekeeper/reports': 'business',
  
  // SYSTEM
  '/dashboard/support': 'system',
  '/dashboard/beekeeper/beta': 'system',
};

const DEFAULT_NAV_ITEMS: NavigationItem[] = MASTER_NAVIGATION.map((item, index) => ({
  id: `nav-${index}`,
  label: item.label,
  path: item.path,
  allowed_roles: item.required_role ? [item.required_role] : ["FREE", "PLUS", "PRO", "PRO_PLUS", "BUSINESS", "ADMIN", "SUPER_ADMIN"],
  category: item.section,
  sort_order: item.sort_order ?? (index + 1) * 10,
  is_active: true,
  icon_name: item.icon_name
}));

interface DashboardSidebarProps {
  userProfile?: UserProfile | null;
  newsContent?: string;
  newsPosition?: 'top_banner' | 'modal_popup' | 'sidebar_widget' | 'hidden';
  navigationItems?: NavigationItem[];
}

export default function DashboardSidebar({
  userProfile,
  newsContent,
  newsPosition,
  navigationItems = []
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { profile: clientProfile } = useAuth();
  
  // Prefer server-fetched userProfile, fall back to clientProfile
  const profile = userProfile || clientProfile;
  const role = ((profile as any)?.role || (profile as any)?.system_role || 'USER').toString().toUpperCase();
  const plan = ((profile as any)?.plan || 'FREE').toString().toUpperCase();
  
  console.log('Current User Role:', role);

  const accessTokens = useMemo(() => {
    const tokens = new Set<string>();
    if (plan) tokens.add(plan);
    if (role) tokens.add(role);
    return tokens;
  }, [plan, role]);

  const canAccess = useCallback(
    (item: NavigationItem) => {
      const isAdmin = ['ADMIN', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(role);
      if (isAdmin) {
        return true;
      }
      return item.allowed_roles?.some(roleToken => accessTokens.has(roleToken.toUpperCase()));
    },
    [accessTokens, role]
  );

  const effectiveItems = navigationItems.length > 0 ? navigationItems : DEFAULT_NAV_ITEMS;
  const visibleItems = useMemo(
    () => {
      const allowedCategories = new Set(["Pszczelarz", "Hodowla", "Związek / Koło"]);
      return effectiveItems.filter(item => {
        if (!item.is_active || !canAccess(item)) return false;
        if (!item.category) return true;
        return allowedCategories.has(item.category);
      });
    },
    [effectiveItems, canAccess]
  );

  // Organizuj elementy w nowe sekcje z predefiniowaną kolejnością
  const organizedSections = useMemo(() => {
    const sections: Record<string, NavigationItem[]> = {
      main: [],
      resources: [],
      work: [],
      business: [],
      system: [],
    };

    // Definicja kolejności elementów w każdej sekcji (zgodnie z wymaganiami)
    const sectionOrder: Record<string, string[]> = {
      main: ['/dashboard', '/dashboard/analytics', '/dashboard/business'],
      resources: [
        '/dashboard/beekeeper/warehouse', // Magazyn - pierwszy
        '/dashboard/apiaries',            // Pasieki
        '/dashboard/hives',               // Ule
        '/dashboard/beekeeper/queens',    // Matki
        '/dashboard/beekeeper/import',    // Import Danych
      ],
      work: [
        '/dashboard/calendar',            // Kalendarz Zadań
        '/dashboard/inspections',         // Przeglądy
        '/dashboard/beekeeper/veterinary', // Weterynaria
      ],
      business: [
        '/dashboard/harvests',           // Miodobrania (nowa ścieżka)
        '/dashboard/beekeeper/harvests', // Miodobrania (stara ścieżka - kompatybilność)
        '/dashboard/processing',          // Rozlew Miodu
        '/dashboard/marketplace',        // Marketplace
        '/dashboard/beekeeper/reports',  // Raporty
      ],
      system: [
        '/dashboard/support',            // Wsparcie
        '/dashboard/beekeeper/beta',     // Beta Testy
      ],
    };

    visibleItems.forEach(item => {
      // Sprawdź mapowanie ścieżki
      let sectionId = SECTION_MAPPING[item.path];
      
      // Jeśli nie ma mapowania, spróbuj znaleźć po częściowej ścieżce
      if (!sectionId) {
        // Sprawdź czy ścieżka zawiera kluczowe słowa
        if (item.path.includes('/harvests') || item.path.includes('miodobrania')) {
          sectionId = 'business';
        } else if (item.path.includes('/processing') || item.path.includes('rozlew') || item.path.includes('przetwarzanie')) {
          sectionId = 'business';
        } else if (item.path.includes('/warehouse') || item.path.includes('magazyn')) {
          sectionId = 'resources';
        } else if (item.path.includes('/marketplace') || item.path.includes('marketplace')) {
          sectionId = 'business';
        } else if (item.path.includes('/support') || item.path.includes('wsparcie')) {
          sectionId = 'system';
        } else if (item.path.includes('/beta') || item.path.includes('beta')) {
          sectionId = 'system';
        }
      }
      
      if (sectionId && sections[sectionId]) {
        sections[sectionId].push(item);
      } else if (!item.category) {
        // Elementy bez kategorii trafiają do głównych
        sections.main.push(item);
      }
    });

    // Sortuj elementy w każdej sekcji według predefiniowanej kolejności
    // Usuń duplikaty (preferuj nowe ścieżki)
    Object.keys(sections).forEach(sectionKey => {
      const order = sectionOrder[sectionKey] || [];
      
      // Usuń duplikaty - jeśli są dwie ścieżki do tego samego miejsca, zostaw tylko jedną
      if (sectionKey === 'business') {
        const hasNewHarvests = sections[sectionKey].some(i => i.path === '/dashboard/harvests');
        sections[sectionKey] = sections[sectionKey].filter(item => {
          // Jeśli to stara ścieżka miodobrań i jest już nowa, usuń starą
          if (item.path === '/dashboard/beekeeper/harvests' && hasNewHarvests) {
            return false;
          }
          return true;
        });
      }
      
      sections[sectionKey].sort((a, b) => {
        const indexA = order.indexOf(a.path);
        const indexB = order.indexOf(b.path);
        
        // Jeśli oba są w kolejności, sortuj według kolejności
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // Jeśli tylko jeden jest w kolejności, daj mu priorytet
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // Jeśli żaden nie jest w kolejności, sortuj według sort_order
        return a.sort_order - b.sort_order;
      });
    });

    return sections;
  }, [visibleItems]);

  const [isMobileOpen, setMobileOpen] = useState(false);
  
  // Stan dla zwijalnych sekcji (collapsible groups)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    // Smart UX: Domyślnie otwórz sekcję zawierającą aktywną ścieżkę
    const initial: Record<string, boolean> = {
      main: true, // Sekcja główna zawsze otwarta
      resources: false,
      work: false,
      business: false,
      system: false,
    };
    
    // Sprawdź która sekcja zawiera aktywną ścieżkę
    if (pathname) {
      if (pathname.startsWith('/dashboard/beekeeper/warehouse') || 
          pathname.startsWith('/dashboard/apiaries') || 
          pathname.startsWith('/dashboard/hives') || 
          pathname.startsWith('/dashboard/beekeeper/queens') || 
          pathname.startsWith('/dashboard/beekeeper/import')) {
        initial.resources = true;
      } else if (pathname.startsWith('/dashboard/calendar') || 
                 pathname.startsWith('/dashboard/inspections') || 
                 pathname.startsWith('/dashboard/beekeeper/veterinary')) {
        initial.work = true;
      } else if (pathname.startsWith('/dashboard/harvests') || 
                 pathname.startsWith('/dashboard/beekeeper/harvests') || 
                 pathname.startsWith('/dashboard/processing') || 
                 pathname.startsWith('/dashboard/marketplace') || 
                 pathname.startsWith('/dashboard/beekeeper/reports')) {
        initial.business = true;
      } else if (pathname.startsWith('/dashboard/support') || 
                 pathname.startsWith('/dashboard/beekeeper/beta')) {
        initial.system = true;
      }
    }
    
    return initial;
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);
  
  // Aktualizuj otwarte sekcje gdy zmienia się aktywna ścieżka
  useEffect(() => {
    if (pathname) {
      setOpenSections(prev => {
        const updated = { ...prev };
        
        // Zamknij wszystkie sekcje oprócz głównej
        updated.resources = false;
        updated.work = false;
        updated.business = false;
        updated.system = false;
        
        // Otwórz sekcję z aktywną ścieżką
        if (pathname.startsWith('/dashboard/beekeeper/warehouse') || 
            pathname.startsWith('/dashboard/apiaries') || 
            pathname.startsWith('/dashboard/hives') || 
            pathname.startsWith('/dashboard/beekeeper/queens') || 
            pathname.startsWith('/dashboard/beekeeper/import')) {
          updated.resources = true;
        } else if (pathname.startsWith('/dashboard/calendar') || 
                   pathname.startsWith('/dashboard/inspections') || 
                   pathname.startsWith('/dashboard/beekeeper/veterinary')) {
          updated.work = true;
        } else if (pathname.startsWith('/dashboard/harvests') || 
                   pathname.startsWith('/dashboard/beekeeper/harvests') || 
                   pathname.startsWith('/dashboard/processing') || 
                   pathname.startsWith('/dashboard/marketplace') || 
                   pathname.startsWith('/dashboard/beekeeper/reports')) {
          updated.business = true;
        } else if (pathname.startsWith('/dashboard/support') || 
                   pathname.startsWith('/dashboard/beekeeper/beta')) {
          updated.system = true;
        }
        
        return updated;
      });
    }
  }, [pathname]);
  
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const getRoleBadge = () => {
    if (role === 'SUPER_ADMIN') return <span className="text-yellow-400 font-bold">SUPER ADMIN</span>;
    if (role === 'ADMIN') return <span className="text-red-400 font-bold">ADMIN</span>;
    return <span className="text-primary font-bold">PSZCZELARZ</span>;
  };

  const isActive = (path: string) => {
    if (!pathname) return false;
    
    // Exact match for root dashboard to avoid matching /dashboard/anything
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    
    // For other paths, check exact match or if it starts with path/
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Funkcja sprawdzająca czy link powinien być zablokowany podczas onboardingu
  const isLinkBlocked = (path: string) => {
    // Nowy system OnboardingGuide nie blokuje nawigacji
    // Użytkownik może swobodnie poruszać się po aplikacji
    // Modal pojawia się tylko gdy użytkownik nie jest na docelowej stronie
    return false;
  };

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-gray-300/30 dark:border-white/10">
        <h2 className="text-2xl font-bold font-heading text-primary">Panel</h2>
        <div className="text-xs text-gray-600 dark:text-white/60 mt-2">
          <div className="mt-1">{getRoleBadge()}</div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar pb-32">
        {/* Sekcja GŁÓWNE (bez nagłówka) */}
        {organizedSections.main.length > 0 && (
          <div className="space-y-1">
            {organizedSections.main.map(item => {
              const blocked = isLinkBlocked(item.path);
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary text-brown-900 dark:text-brown-900 font-bold shadow-lg'
                      : blocked
                      ? 'text-gray-400 dark:text-white/30 cursor-not-allowed opacity-50'
                      : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:translate-x-1'
                  }`}
                  onClick={(e) => {
                    if (blocked) {
                      e.preventDefault();
                    }
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Sekcja ZASOBY (Collapsible) */}
        {organizedSections.resources.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('resources')}
              className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider hover:text-gray-700 dark:hover:text-white/60 cursor-pointer transition-colors rounded-lg hover:bg-white/5 dark:hover:bg-white/5"
            >
              <span>ZASOBY</span>
              {openSections.resources ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openSections.resources ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1">
                {organizedSections.resources.map(item => (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-primary text-brown-900 dark:text-brown-900 font-bold shadow-lg'
                        : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:translate-x-1'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sekcja PRACA (Collapsible) */}
        {organizedSections.work.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('work')}
              className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider hover:text-gray-700 dark:hover:text-white/60 cursor-pointer transition-colors rounded-lg hover:bg-white/5 dark:hover:bg-white/5"
            >
              <span>PRACA</span>
              {openSections.work ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openSections.work ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1">
                {organizedSections.work.map(item => {
                  const blocked = isLinkBlocked(item.path);
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-primary text-brown-900 dark:text-brown-900 font-bold shadow-lg'
                          : blocked
                          ? 'text-gray-400 dark:text-white/30 cursor-not-allowed opacity-50'
                          : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:translate-x-1'
                      }`}
                      onClick={(e) => {
                        if (blocked) {
                          e.preventDefault();
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sekcja BIZNES (Collapsible) */}
        {organizedSections.business.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('business')}
              className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider hover:text-gray-700 dark:hover:text-white/60 cursor-pointer transition-colors rounded-lg hover:bg-white/5 dark:hover:bg-white/5"
            >
              <span>BIZNES</span>
              {openSections.business ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openSections.business ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1">
                {organizedSections.business.map(item => {
                  const blocked = isLinkBlocked(item.path);
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-primary text-brown-900 dark:text-brown-900 font-bold shadow-lg'
                          : blocked
                          ? 'text-gray-400 dark:text-white/30 cursor-not-allowed opacity-50'
                          : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:translate-x-1'
                      }`}
                      onClick={(e) => {
                        if (blocked) {
                          e.preventDefault();
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sekcja SYSTEM (Collapsible) */}
        {organizedSections.system.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('system')}
              className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider hover:text-gray-700 dark:hover:text-white/60 cursor-pointer transition-colors rounded-lg hover:bg-white/5 dark:hover:bg-white/5"
            >
              <span>SYSTEM</span>
              {openSections.system ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openSections.system ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1">
                {organizedSections.system.map(item => {
                  const blocked = isLinkBlocked(item.path);
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      className={`block px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-primary text-brown-900 dark:text-brown-900 font-bold shadow-lg'
                          : blocked
                          ? 'text-gray-400 dark:text-white/30 cursor-not-allowed opacity-50'
                          : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:translate-x-1'
                      }`}
                      onClick={(e) => {
                        if (blocked) {
                          e.preventDefault();
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Sidebar News Widget */}
      {newsContent && newsPosition === 'sidebar_widget' && (
        <div className="mt-auto pb-4">
          <DashboardNews content={newsContent} position="sidebar_widget" />
        </div>
      )}

      {/* Logout button removed as per requirements */}
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-24 left-4 z-[60] w-11 h-11 flex items-center justify-center rounded-full bg-primary text-brown-900 shadow-xl border border-brown-900/40"
        aria-label={isMobileOpen ? "Zamknij menu" : "Otwórz menu"}
        title={isMobileOpen ? "Zamknij menu" : "Otwórz menu"}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div
        className={`md:hidden fixed left-0 top-16 h-[calc(100vh-4rem)] z-[60] w-72 transform transition-transform duration-300 ease-in-out ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <aside className="flex flex-col h-full bg-white/95 dark:bg-black/60 backdrop-blur-xl border-r border-gray-300/40 dark:border-white/10 shadow-2xl z-[60]">
          {sidebarContent}
        </aside>
      </div>

      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 dark:bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      <aside className="hidden md:flex flex-col w-64 m-4 rounded-3xl bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-300/40 dark:border-white/10 fixed top-16 left-0 h-[calc(100vh-4rem)] overflow-hidden shadow-2xl z-[60]">
        {sidebarContent}
      </aside>
    </>
  );
}
