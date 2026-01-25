import "./globals.css";
import { Montserrat, Lato } from 'next/font/google';
import { defaultMetadata } from './metadata';
import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';
import { getThemeSettings } from './actions/admin/theme-settings';
import { getSocialMediaAll } from './actions/get-social-media-all';

export const metadata: Metadata = defaultMetadata;

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const lato = Lato({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-lato',
  display: 'swap',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Pobierz ustawienia motywu i social media na poziomie serwera
  const [themeSettings, socialMedia] = await Promise.all([
    getThemeSettings(),
    getSocialMediaAll().catch(() => []) // Fallback do pustej tablicy w przypadku błędu
  ]);

  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${lato.variable} font-sans min-h-screen transition-colors duration-300`} suppressHydrationWarning>
        <ClientLayout initialThemeSettings={themeSettings} socialMedia={socialMedia}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
