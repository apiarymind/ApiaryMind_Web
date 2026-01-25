export type MasterNavigationItem = {
  label: string;
  path: string;
  icon_name: string;
  section: string | null;
  required_role?: string;
  sort_order?: number;
};

export const MASTER_NAVIGATION: MasterNavigationItem[] = [
  { label: "Pulpit", path: "/dashboard", icon_name: "LayoutDashboard", section: null, sort_order: 10 },
  { label: "AI Scoring", path: "/dashboard/analytics", icon_name: "Sparkles", section: null, sort_order: 20 },
  { label: "Business Dashboard", path: "/dashboard/business", icon_name: "Briefcase", section: null, sort_order: 30, required_role: "PRO_PLUS" },

  { label: "Ule", path: "/dashboard/hives", icon_name: "Home", section: "Pszczelarz", sort_order: 110 },
  { label: "Pasieki", path: "/dashboard/apiaries", icon_name: "Map", section: "Pszczelarz", sort_order: 120 },
  { label: "Przeglądy", path: "/dashboard/inspections", icon_name: "ClipboardList", section: "Pszczelarz", sort_order: 130 },
  { label: "Miodobrania", path: "/dashboard/harvests", icon_name: "Honeycomb", section: "Pszczelarz", sort_order: 132 },
  { label: "Przetwarzanie Miodu", path: "/dashboard/processing", icon_name: "Droplet", section: "Pszczelarz", sort_order: 133 },
  { label: "Matki", path: "/dashboard/beekeeper/queens", icon_name: "Crown", section: "Pszczelarz", sort_order: 134 },
  { label: "Paszporty", path: "/dashboard/beekeeper/passports", icon_name: "QrCode", section: "Pszczelarz", sort_order: 135 },
  { label: "Magazyn", path: "/dashboard/beekeeper/warehouse", icon_name: "Package", section: "Pszczelarz", sort_order: 140 },
  { label: "Kalendarz Zadań", path: "/dashboard/calendar", icon_name: "Calendar", section: "Pszczelarz", sort_order: 150 },
  { label: "Moduł Weterynaryjny", path: "/dashboard/beekeeper/veterinary", icon_name: "Stethoscope", section: "Pszczelarz", sort_order: 160 },
  { label: "Import Danych", path: "/dashboard/beekeeper/import", icon_name: "Upload", section: "Pszczelarz", sort_order: 170 },
  { label: "Ewidencja Sprzedaży", path: "/dashboard/marketplace", icon_name: "Store", section: "Pszczelarz", sort_order: 180 },
  { label: "Raporty", path: "/dashboard/beekeeper/reports", icon_name: "FileText", section: "Pszczelarz", sort_order: 190 },
  { label: "Beta Testy", path: "/dashboard/beekeeper/beta", icon_name: "Beaker", section: "Pszczelarz", sort_order: 200 },
  { label: "Wsparcie Techniczne", path: "/dashboard/support", icon_name: "LifeBuoy", section: "Pszczelarz", sort_order: 210, required_role: "PLUS" },

  { label: "Pulpit Związku", path: "/dashboard/association", icon_name: "Building2", section: "Związek / Koło", sort_order: 310, required_role: "ADMIN" },
  { label: "Członkowie", path: "/dashboard/association/members", icon_name: "Users", section: "Związek / Koło", sort_order: 320, required_role: "ADMIN" },
  { label: "Ogłoszenia", path: "/dashboard/association/announcements", icon_name: "Megaphone", section: "Związek / Koło", sort_order: 330, required_role: "ADMIN" },
  { label: "Kalendarz", path: "/dashboard/association/calendar", icon_name: "CalendarDays", section: "Związek / Koło", sort_order: 340, required_role: "ADMIN" },
  { label: "Finanse", path: "/dashboard/association/finances", icon_name: "Wallet", section: "Związek / Koło", sort_order: 350, required_role: "ADMIN" },

  { label: "Mój Zespół", path: "/dashboard/breeder/team", icon_name: "Users2", section: "Hodowla", sort_order: 410, required_role: "PRO_PLUS" },
  { label: "Matki Reprodukcyjne", path: "/dashboard/breeder/mothers", icon_name: "Crown", section: "Hodowla", sort_order: 420, required_role: "PRO_PLUS" },
  { label: "Serie Mateczne", path: "/dashboard/breeder/production", icon_name: "Dna", section: "Hodowla", sort_order: 430, required_role: "PRO_PLUS" },
  { label: "Uliki Weselne", path: "/dashboard/breeder/nucs", icon_name: "Boxes", section: "Hodowla", sort_order: 440, required_role: "PRO_PLUS" },
  { label: "Kalendarz Zadań", path: "/dashboard/breeder/calendar", icon_name: "CalendarClock", section: "Hodowla", sort_order: 450, required_role: "PRO_PLUS" },
  { label: "Statystyki", path: "/dashboard/breeder/stats", icon_name: "BarChart3", section: "Hodowla", sort_order: 460, required_role: "PRO_PLUS" },

  { label: "Pulpit Admina", path: "/dashboard/admin", icon_name: "Shield", section: "Administrator", sort_order: 510, required_role: "ADMIN" },
  { label: "Użytkownicy", path: "/dashboard/admin/users", icon_name: "UserCog", section: "Administrator", sort_order: 520, required_role: "ADMIN" },
  { label: "Zatwierdzanie zgłoszeń", path: "/dashboard/admin/approvals", icon_name: "CheckCircle2", section: "Administrator", sort_order: 530, required_role: "ADMIN" },
  { label: "CMS Editor", path: "/dashboard/admin/cms-editor", icon_name: "LayoutGrid", section: "Administrator", sort_order: 540, required_role: "ADMIN" },
  { label: "CMS", path: "/dashboard/admin/cms", icon_name: "FileCode2", section: "Administrator", sort_order: 545, required_role: "ADMIN" },
  { label: "Konfiguracja", path: "/dashboard/admin/configuration", icon_name: "Settings", section: "Administrator", sort_order: 550, required_role: "ADMIN" },
  { label: "Ustawienia", path: "/dashboard/admin/settings", icon_name: "Settings2", section: "Administrator", sort_order: 560, required_role: "ADMIN" },
  { label: "Zarządzanie Wyglądem", path: "/dashboard/admin/theme", icon_name: "Palette", section: "Administrator", sort_order: 570, required_role: "ADMIN" },
  { label: "Media Społecznościowe", path: "/dashboard/admin/social-media", icon_name: "Share2", section: "Administrator", sort_order: 580, required_role: "ADMIN" },
  { label: "Wsparcie", path: "/dashboard/admin/support", icon_name: "HelpCircle", section: "Administrator", sort_order: 590, required_role: "ADMIN" },
  { label: "Ankiety", path: "/dashboard/admin/surveys", icon_name: "ClipboardCheck", section: "Administrator", sort_order: 600, required_role: "ADMIN" },
  { label: "Beta", path: "/dashboard/admin/beta", icon_name: "FlaskConical", section: "Administrator", sort_order: 610, required_role: "ADMIN" },
  { label: "Zarządzanie Betą", path: "/dashboard/admin/beta-management", icon_name: "Sliders", section: "Administrator", sort_order: 620, required_role: "ADMIN" },
  { label: "Nawigacja", path: "/dashboard/admin/settings/navigation", icon_name: "Navigation", section: "Administrator", sort_order: 630, required_role: "ADMIN" }
];
