import "./globals.css";
import { Montserrat, Lato } from 'next/font/google';
import { defaultMetadata } from './metadata';
import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${lato.variable} font-sans min-h-screen transition-colors duration-300 bg-light-pattern dark:bg-dark-pattern bg-fixed bg-repeat bg-[length:350px_auto]`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
