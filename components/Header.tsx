"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../lib/AuthContext";
import { ThemeToggle } from "@/app/components/ui/ThemeToggle";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Lock, Mail, Shield, X, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { NavigationItem } from "@/types/navigation";
import DemoTimer from "./DemoTimer";

// Helper component for user menu
function UserMenu() {
  const { user, profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleRestartTutorial = () => {
    // Reset flagi samouczka
    localStorage.removeItem('tutorial_completed');
    localStorage.removeItem('tutorial_disabled');
    
    // Wymuś start samouczka z parametrem URL
    router.push('/dashboard?force_onboarding=true');
    setIsOpen(false);
  };

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="Logowanie"
        title="Logowanie"
        className="text-white hover:text-primary transition-colors flex items-center"
      >
        <Lock className="w-5 h-5" />
      </Link>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-white hover:text-primary transition-colors focus:outline-none"
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-bold text-lg">
          {profile?.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
             <div className="px-4 py-3 border-b border-white/10">
               <div className="text-sm font-bold text-white">
                 Witaj, {profile?.displayName || user.email || 'Użytkowniku'}
               </div>
               <div className="text-xs text-white/60">
                 Rola: {(profile?.system_role || profile?.role || 'Użytkownik').toString().toUpperCase()}
               </div>
             </div>
             <Link href="/dashboard" className="block px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors" onClick={() => setIsOpen(false)}>
               Panel
             </Link>
             <Link href="/dashboard/settings" className="block px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors" onClick={() => setIsOpen(false)}>
               Ustawienia
             </Link>
             <button 
               onClick={handleRestartTutorial}
               className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors border-t border-white/10 flex items-center gap-2"
             >
               <HelpCircle className="w-4 h-4" />
               Samouczek / Pomoc
             </button>
             <button 
               onClick={() => { logout(); setIsOpen(false); }}
               className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors border-t border-white/10"
             >
               Wyloguj
             </button>
          </div>
        </>
      )}
    </div>
  );
}

const DEFAULT_ADMIN_ITEMS: NavigationItem[] = [
  { id: "admin-dashboard", label: "Pulpit Admina", path: "/dashboard/admin", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 510, is_active: true },
  { id: "admin-users", label: "Użytkownicy", path: "/dashboard/admin/users", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 520, is_active: true },
  { id: "admin-approvals", label: "Zatwierdzanie zgłoszeń", path: "/dashboard/admin/approvals", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 530, is_active: true },
  { id: "admin-cms-editor", label: "CMS Editor", path: "/dashboard/admin/cms-editor", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 540, is_active: true },
  { id: "admin-configuration", label: "Konfiguracja", path: "/dashboard/admin/configuration", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 550, is_active: true },
  { id: "admin-settings", label: "Ustawienia", path: "/dashboard/admin/settings", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 560, is_active: true },
  { id: "admin-theme", label: "Zarządzanie Wyglądem", path: "/dashboard/admin/theme", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 570, is_active: true },
  { id: "admin-social-media", label: "Media Społecznościowe", path: "/dashboard/admin/social-media", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 580, is_active: true },
  { id: "admin-support", label: "Wsparcie", path: "/dashboard/admin/support", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 590, is_active: true },
  { id: "admin-surveys", label: "Ankiety", path: "/dashboard/admin/surveys", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 600, is_active: true },
  { id: "admin-navigation", label: "Nawigacja", path: "/dashboard/admin/settings/navigation", allowed_roles: ["ADMIN","SUPER_ADMIN"], category: "Administrator", sort_order: 630, is_active: true }
];

function AdminDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const role = ((profile as any)?.role || (profile as any)?.system_role || "USER")
    .toString()
    .toUpperCase();
  const isAdmin = ["ADMIN", "ADMINISTRATOR", "SUPER_ADMIN"].includes(role);
  const [items, setItems] = useState<NavigationItem[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      setItems([]);
      return;
    }

    const loadItems = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("navigation_items")
        .select("id,label,path,category,sort_order,is_active")
        .eq("category", "Administrator")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error || !data || data.length === 0) {
        setItems(DEFAULT_ADMIN_ITEMS);
        return;
      }

      setItems(data as NavigationItem[]);
    };

    loadItems();
  }, [isAdmin]);

  const drawerItems = useMemo(
    () => (items.length > 0 ? items : DEFAULT_ADMIN_ITEMS),
    [items]
  );

  if (!isOpen || !isAdmin) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[80]" onClick={onClose}></div>
      <aside className="fixed top-0 right-0 h-full w-[400px] bg-zinc-900 text-white border-l border-zinc-700 shadow-2xl z-[90] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <div className="font-bold">Panel Administratora</div>
          <button
            onClick={onClose}
            aria-label="Zamknij panel admina"
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 grid grid-cols-2 gap-3 p-4 overflow-hidden">
          {drawerItems.map(item => (
            <Link
              key={item.id}
              href={item.path}
              onClick={onClose}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700 text-xs text-center"
            >
              <Shield className="w-5 h-5 text-white" />
              <span className="mt-1 text-white">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false);
  const supabase = createClient();
  
  // Check if user is anonymous
  // Supabase anonymous users have is_anonymous flag or no email
  const isAnonymous = user ? (user.is_anonymous === true || (!user.email && user.app_metadata?.provider === 'anonymous')) : false;
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [activeMailboxTab, setActiveMailboxTab] = useState<"SYSTEM" | "ASSOCIATION">("SYSTEM");
  const [mailboxItems, setMailboxItems] = useState<
    { id: string; title: string; content: string; type: string; created_at: string }[]
  >([]);
  const [isMailboxLoading, setIsMailboxLoading] = useState(false);
  const [mailboxHasMore, setMailboxHasMore] = useState(true);
  const [mailboxPage, setMailboxPage] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [announcementMeta, setAnnouncementMeta] = useState<{ id: string; type: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadSystem, setUnreadSystem] = useState(0);
  const [unreadAssociation, setUnreadAssociation] = useState(0);
  const mailboxRef = useRef<HTMLDivElement | null>(null);

  const role = ((profile as any)?.role || (profile as any)?.system_role || "USER")
    .toString()
    .toUpperCase();
  const isAdmin = ["ADMIN", "ADMINISTRATOR", "SUPER_ADMIN"].includes(role);

  const pageSize = 5;

  const normalizeItems = (items: any[]) =>
    items.map(item => ({
      ...item,
      id: String(item.id)
    })) as { id: string; title: string; content: string; type: string; created_at: string }[];

  const fetchReadIds = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", userId);

    if (!error && data) {
      setReadIds(new Set(data.map(row => String(row.announcement_id))));
    }
  };

  useEffect(() => {
    if (!profile?.id) return;

    const loadUnreadCount = async () => {
      const supabase = createClient();
      const [{ data: announcementData, error: announcementError }] = await Promise.all([
        supabase
          .from("announcements")
          .select("id,type")
          .order("created_at", { ascending: false })
          .limit(50)
      ]);

      if (!announcementError && announcementData) {
        setAnnouncementMeta(
          announcementData.map(item => ({ id: String(item.id), type: String(item.type) }))
        );
      }

      await fetchReadIds(profile.id);
    };

    loadUnreadCount();
  }, [profile?.id]);

  useEffect(() => {
    if (announcementMeta.length === 0) {
      setUnreadCount(0);
      setUnreadSystem(0);
      setUnreadAssociation(0);
      return;
    }
    const unread = announcementMeta.filter(item => !readIds.has(item.id));
    setUnreadCount(unread.length);
    setUnreadSystem(unread.filter(item => item.type === "SYSTEM").length);
    setUnreadAssociation(unread.filter(item => item.type === "ASSOCIATION").length);
  }, [announcementMeta, readIds]);

  useEffect(() => {
    if (!isMailboxOpen) return;

    if (profile?.id) {
      fetchReadIds(profile.id);
    }

    const loadAnnouncements = async (page: number, append: boolean) => {
      setIsMailboxLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("announcements")
        .select("id,title,content,type,created_at")
        .eq("type", activeMailboxTab)
        .order("created_at", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (!error && data) {
        const normalized = normalizeItems(data as any[]);
        setMailboxHasMore(normalized.length === pageSize);
        setMailboxItems(prev => (append ? [...prev, ...normalized] : normalized));
      }
      setIsMailboxLoading(false);
    };

    loadAnnouncements(0, false);
  }, [isMailboxOpen, activeMailboxTab, profile?.id]);

  useEffect(() => {
    if (!isMailboxOpen) return;
    setMailboxPage(0);
    setMailboxHasMore(true);
  }, [activeMailboxTab, isMailboxOpen]);

  useEffect(() => {
    if (!isMailboxOpen) return;
    const handler = (event: MouseEvent) => {
      if (mailboxRef.current && !mailboxRef.current.contains(event.target as Node)) {
        setIsMailboxOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMailboxOpen]);

  const handleLoadMore = async () => {
    if (isMailboxLoading || !mailboxHasMore) return;
    const nextPage = mailboxPage + 1;
    setMailboxPage(nextPage);
    setIsMailboxLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("id,title,content,type,created_at")
      .eq("type", activeMailboxTab)
      .order("created_at", { ascending: false })
      .range(nextPage * pageSize, nextPage * pageSize + pageSize - 1);

    if (!error && data) {
      const normalized = normalizeItems(data as any[]);
      setMailboxHasMore(normalized.length === pageSize);
      setMailboxItems(prev => [...prev, ...normalized]);
    }
    setIsMailboxLoading(false);
  };

  const handleMarkRead = (id: string) => {
    const targetId = String(id);
    if (!profile?.id || readIds.has(targetId)) return;
    const supabase = createClient();
    supabase
      .from("announcement_reads")
      .upsert(
        [{ user_id: profile.id, announcement_id: targetId }],
        { onConflict: "user_id,announcement_id" }
      )
      .then(({ error }) => {
        if (!error) {
          const next = new Set(readIds);
          next.add(targetId);
          setReadIds(next);
        }
      });
  };

  // Hide header on login, register and beta pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/beta') {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 backdrop-blur-xl border-b border-amber-900/10 dark:border-white/20 shadow-2xl bg-white/60 dark:bg-black/60 transition-all duration-300">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1 font-bold text-xl tracking-tight no-underline">
              <span className="text-amber-950 dark:text-white">Apiary</span>
              <Image src="/assets/bee-3d-icon.png" alt="Logo" width={32} height={32} />
              <span className="text-amber-500">Mind</span>
            </Link>
          </div>
          
          <nav className="flex gap-4 text-sm font-sans items-center text-amber-950 dark:text-white">
            {isAnonymous && user?.created_at && (
              <DemoTimer userId={user.id} createdAt={user.created_at} />
            )}
            <Link
              href="/"
              aria-label="Strona główna"
              title="Strona główna"
              className="hover:text-primary transition-colors flex items-center"
            >
              <Home className="w-5 h-5" />
            </Link>
          <div className="relative" ref={mailboxRef}>
            <button
              onClick={() => setIsMailboxOpen(prev => !prev)}
              aria-label="Powiadomienia"
              title="Powiadomienia"
              className="hover:text-primary transition-colors flex items-center"
            >
              <div className="relative">
                <Mail className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
            {isMailboxOpen && (
              <div className="absolute right-0 mt-3 w-[350px] rounded-xl border border-white/10 bg-black/90 text-white shadow-2xl z-[70] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="text-sm font-semibold">Wiadomości</span>
                  <button
                    onClick={() => setIsMailboxOpen(false)}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="Zamknij"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex border-b border-white/10">
                  <button
                    onClick={() => setActiveMailboxTab("SYSTEM")}
                    className={`flex-1 px-3 py-2 text-xs font-semibold uppercase ${
                      activeMailboxTab === "SYSTEM" ? "text-primary border-b-2 border-primary" : "text-white/60"
                    }`}
                  >
                    Systemowe{unreadSystem > 0 ? ` (${unreadSystem})` : ""}
                  </button>
                  <button
                    onClick={() => setActiveMailboxTab("ASSOCIATION")}
                    className={`flex-1 px-3 py-2 text-xs font-semibold uppercase ${
                      activeMailboxTab === "ASSOCIATION" ? "text-primary border-b-2 border-primary" : "text-white/60"
                    }`}
                  >
                    Od Związku{unreadAssociation > 0 ? ` (${unreadAssociation})` : ""}
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {isMailboxLoading ? (
                    <div className="px-4 py-6 text-sm text-white/60">Ładowanie...</div>
                  ) : mailboxItems.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-white/60">Brak nowych wiadomości</div>
                  ) : (
                    <div className="space-y-3 px-4 py-3">
                      {mailboxItems.map(item => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => handleMarkRead(item.id)}
                          className={`w-full text-left border-b border-white/10 pb-3 last:border-b-0 ${readIds.has(item.id) ? "opacity-60" : ""}`}
                        >
                          <div className="text-sm font-semibold">{item.title}</div>
                          <div className="text-xs text-white/70 line-clamp-2">
                            {item.content}
                          </div>
                          <div className="text-[10px] text-white/40 mt-1">
                            {new Date(item.created_at).toLocaleDateString("pl-PL")}
                          </div>
                          <div className="text-[10px] text-primary mt-2">
                            {readIds.has(item.id) ? "Przeczytane" : "Oznacz jako przeczytane"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!isMailboxLoading && mailboxHasMore && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={handleLoadMore}
                      className="w-full text-xs text-white/70 hover:text-white border border-white/10 rounded-lg py-2"
                    >
                      Pokaż więcej
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
            {isAdmin && (
              <button
                onClick={() => setIsAdminDrawerOpen(true)}
                aria-label="Panel administratora"
                title="Panel administratora"
                className="hover:text-primary transition-colors flex items-center"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            <UserMenu />
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <AdminDrawer
        isOpen={isAdminDrawerOpen}
        onClose={() => setIsAdminDrawerOpen(false)}
      />
    </>
  );
}
