"use client";

import { ThemeProvider } from "./ThemeProvider";
import { ThemeEngineProvider } from "../lib/ThemeEngineProvider";
import AIChat from "./AIChat";
import { AuthProvider } from "../lib/AuthContext";
import { OnboardingProvider } from "../lib/OnboardingContext";
import Header from "./Header";
import Footer from "./Footer";
import { ToastProvider } from "./ui/toast";
import { usePathname } from "next/navigation";
import type { ThemeSettings } from "@/types/theme";
import type { AllSocialMedia } from "@/app/actions/get-social-media-all";
import CookieWall from "./CookieWall";

export default function ClientLayout({ 
  children,
  initialThemeSettings,
  socialMedia
}: { 
  children: React.ReactNode;
  initialThemeSettings: ThemeSettings;
  socialMedia: AllSocialMedia[];
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/beta';
  const isDashboard = pathname?.startsWith('/dashboard') ?? false;
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
      enableColorScheme={false}
    >
      <ThemeEngineProvider initialThemeSettings={initialThemeSettings}>
        <AuthProvider>
          <OnboardingProvider>
            <ToastProvider>
              <Header />
              <main className={`min-h-screen ${isAuthPage ? '' : 'pt-32'} text-text-dark dark:text-amber-50`} suppressHydrationWarning>
                {children}
              </main>
              {!isAuthPage && (
                <div className={isDashboard ? 'md:ml-[288px]' : ''}>
                  <Footer socialMedia={socialMedia} />
                </div>
              )}
              {!isAuthPage && <AIChat />}
              <CookieWall />
            </ToastProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeEngineProvider>
    </ThemeProvider>
  );
}


