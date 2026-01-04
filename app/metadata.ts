import { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  title: {
    default: 'ApiaryMind - Nowoczesne Zarządzanie Pasieką',
    template: '%s | ApiaryMind'
  },
  description: 'Profesjonalne narzędzie do zarządzania pasieką. Ewidencja uli, przeglądy, moduł weterynaryjny, AI Scoring i więcej. Dołącz do społeczności pszczelarzy.',
  keywords: ['pszczelarstwo', 'zarządzanie pasieką', 'ewidencja uli', 'pszczoły', 'hodowla pszczół', 'apiarymind', 'aplikacja pszczelarska'],
  authors: [{ name: 'ApiaryMind' }],
  creator: 'ApiaryMind',
  publisher: 'ApiaryMind',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://apiarymind.com'),
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://apiarymind.com',
    siteName: 'ApiaryMind',
    title: 'ApiaryMind - Nowoczesne Zarządzanie Pasieką',
    description: 'Profesjonalne narzędzie do zarządzania pasieką. Ewidencja uli, przeglądy, moduł weterynaryjny, AI Scoring.',
    images: [
      {
        url: '/assets/beeAI-3d-icon.png',
        width: 1200,
        height: 630,
        alt: 'ApiaryMind Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApiaryMind - Nowoczesne Zarządzanie Pasieką',
    description: 'Profesjonalne narzędzie do zarządzania pasieką.',
    images: ['/assets/beeAI-3d-icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};




