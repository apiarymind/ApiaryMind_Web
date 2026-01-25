'use client';

import { ShieldCheck, Globe, X, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassCard } from '@/app/components/ui/GlassCard';

export interface BreederDetailsProfile {
  full_name: string;
  wni_number: string | null;
  city?: string | null;
  voivodeship?: string | null;
  phone_number?: string | null;
  allegro_link?: string | null;
  olx_link?: string | null;
  website_url?: string | null;
}

export interface BreederDetailsScores {
  honey_score: number;
  gentleness_score: number;
  swarming_score: number;
  wintering_score: number;
}

interface BreederDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BreederDetailsProfile;
  scores: BreederDetailsScores;
}

const clampScore = (value?: number) => Math.max(0, Math.min(100, value ?? 0));

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
};

const normalizeUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // If URL already has protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If URL starts with www., add https://
  if (url.startsWith('www.')) {
    return `https://${url}`;
  }
  
  // For other cases, add https://
  return `https://${url}`;
};

export function BreederDetailsModal({ isOpen, onClose, profile, scores }: BreederDetailsModalProps) {
  if (!isOpen) return null;

  const initials = getInitials(profile.full_name);
  const isVerified = Boolean(profile.wni_number);
  const averageScore = Math.round(
    (scores.honey_score + scores.gentleness_score + scores.swarming_score + scores.wintering_score) / 4
  );
  const starCount = Math.round(averageScore / 20);

  const metrics = [
    { label: 'Miodność', value: clampScore(scores.honey_score) },
    { label: 'Łagodność', value: clampScore(scores.gentleness_score) },
    { label: 'Nierojliwość', value: clampScore(scores.swarming_score) },
    { label: 'Zimowla', value: clampScore(scores.wintering_score) },
  ];

  const getBarColor = (value: number) => {
    if (value < 50) return 'bg-red-500';
    if (value < 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getComparisonText = (value: number) => {
    const percent = Math.round((value / 50) * 100);
    return `${value}/100 - ${percent}% normy`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Zamknij modal"
        onClick={onClose}
      />
      <GlassCard
        className={cn(
          'relative w-full max-w-3xl mx-4 p-6'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Szczegóły hodowcy"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-white"
          aria-label="Zamknij"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-xl">
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xl font-semibold text-gray-900 dark:text-amber-50">{profile.full_name}</span>
                  {isVerified && (
                    <ShieldCheck className="h-5 w-5 text-green-600 dark:text-success" aria-label="Zweryfikowany hodowca" />
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-700 dark:text-amber-200 space-y-0.5">
                  {(profile.city || profile.voivodeship) && (
                    <div>
                      {[profile.city, profile.voivodeship].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {profile.phone_number && (
                    <a href={`tel:${profile.phone_number}`} className="hover:text-amber-600 dark:hover:text-amber-300 transition-colors">
                      {profile.phone_number}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-primary/30 bg-white dark:bg-primary/20 p-4 shadow-md dark:shadow-none">
              <div className="text-sm font-semibold text-gray-800 dark:text-amber-50">
                Wynik ogólny
              </div>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-3xl font-bold text-amber-700 dark:text-amber-400">{averageScore}</span>
                <span className="text-base font-semibold text-gray-700 dark:text-amber-200">
                  / 100
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const isFilled = index < starCount;
                    return (
                      <Star
                        key={index}
                        className={cn('h-5 w-5', isFilled ? 'text-amber-600 dark:text-amber-400' : 'text-amber-300 dark:text-amber-600/50')}
                        fill={isFilled ? 'currentColor' : 'none'}
                      />
                    );
                  })}
                </div>
                <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-primary/40 bg-white dark:bg-secondary/40 px-3 py-1 text-xs font-semibold text-gray-800 dark:text-amber-100">
                  Total Score: {averageScore}/100
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="text-sm font-semibold text-gray-800 dark:text-amber-50">
              Szczegółowa Analiza Linii
            </div>
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900 dark:text-amber-50">{metric.label}</span>
                    <span className="text-sm text-gray-700 dark:text-amber-200">
                      {getComparisonText(metric.value)}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-black/30 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', getBarColor(metric.value))}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold text-gray-800 dark:text-amber-50 mb-3">
            Gdzie kupić?
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {profile.allegro_link ? (
              <a
                className="inline-flex items-center justify-center rounded-2xl bg-gray-900 dark:bg-black/80 border border-amber-400 dark:border-amber-500/30 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-gray-800 dark:hover:bg-black/70 transition-colors shadow-md dark:shadow-none"
                href={normalizeUrl(profile.allegro_link) || '#'}
                target="_blank"
                rel="noreferrer"
                aria-label="Allegro"
              >
                <svg viewBox="0 0 100 30" className="h-6 w-auto fill-current" aria-label="Allegro">
                  <path d="M5.4 13.9c0 4.1 3 6.9 7.1 6.9 2.1 0 3.7-.6 4.9-1.3l.8 3.5c-1.5 1-3.8 1.5-6.3 1.5-6.5 0-11.7-4.5-11.7-11.3 0-6.6 4.9-11.4 11.2-11.4 6 0 9.8 4 9.8 9.7v1.1h-11c-.1 3.5 1.5 5.5 4.3 5.5 1.5 0 2.7-.4 3.4-.8l.5 2.8c-1 .6-2.6 1.1-4.6 1.1-4.6 0-7.3-3.1-7.3-7.3zm10.7-2.6c-.1-2.9-1.9-4.5-4.5-4.5-2.5 0-4.3 1.9-4.5 4.5h9z" fill="#FF5A00"/>
                  <text x="25" y="20" fontSize="18" fontWeight="bold" fill="currentColor">allegro</text>
                </svg>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-2xl bg-gray-200 dark:bg-black/40 border border-gray-300 dark:border-white/10 px-4 py-3 text-sm font-semibold text-gray-500 dark:text-amber-200/50 grayscale opacity-30 cursor-not-allowed"
              >
                <svg viewBox="0 0 100 30" className="h-6 w-auto fill-current" aria-label="Allegro">
                  <path d="M5.4 13.9c0 4.1 3 6.9 7.1 6.9 2.1 0 3.7-.6 4.9-1.3l.8 3.5c-1.5 1-3.8 1.5-6.3 1.5-6.5 0-11.7-4.5-11.7-11.3 0-6.6 4.9-11.4 11.2-11.4 6 0 9.8 4 9.8 9.7v1.1h-11c-.1 3.5 1.5 5.5 4.3 5.5 1.5 0 2.7-.4 3.4-.8l.5 2.8c-1 .6-2.6 1.1-4.6 1.1-4.6 0-7.3-3.1-7.3-7.3zm10.7-2.6c-.1-2.9-1.9-4.5-4.5-4.5-2.5 0-4.3 1.9-4.5 4.5h9z" fill="#FF5A00"/>
                  <text x="25" y="20" fontSize="18" fontWeight="bold" fill="currentColor">allegro</text>
                </svg>
              </button>
            )}
            {profile.olx_link ? (
              <a
                className="inline-flex items-center justify-center rounded-2xl bg-gray-900 dark:bg-black/80 border border-amber-400 dark:border-amber-500/30 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-gray-800 dark:hover:bg-black/70 transition-colors shadow-md dark:shadow-none"
                href={normalizeUrl(profile.olx_link) || '#'}
                target="_blank"
                rel="noreferrer"
                aria-label="OLX"
              >
                <svg viewBox="0 0 100 50" className="h-8 w-auto" aria-label="OLX">
                  <path fill="#002F34" d="M37.8 14.1c-6.8 0-12.3 5.5-12.3 12.3 0 6.8 5.5 12.3 12.3 12.3 6.8 0 12.3-5.5 12.3-12.3 0-6.8-5.5-12.3-12.3-12.3zm0 18.2c-3.2 0-5.9-2.6-5.9-5.9 0-3.2 2.6-5.9 5.9-5.9 3.2 0 5.9 2.6 5.9 5.9 0 3.2-2.7 5.9-5.9 5.9zM12.9 14.1C6.1 14.1.6 19.6.6 26.4c0 6.8 5.5 12.3 12.3 12.3 6.8 0 12.3-5.5 12.3-12.3 0-6.8-5.5-12.3-12.3-12.3zm0 18.2c-3.2 0-5.9-2.6-5.9-5.9 0-3.2 2.6-5.9 5.9-5.9 3.2 0 5.9 2.6 5.9 5.9 0 3.2-2.7 5.9-5.9 5.9z"/>
                  <path fill="#002F34" d="M72.9 14.1l-6.9 9.9-6.9-9.9h-8l10.8 15.2-11.2 16h8.2l7.1-10.2 7.1 10.2h8.2L80 29.3l10.8-15.2h-7.9z"/>
                </svg>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-2xl bg-gray-200 dark:bg-black/40 border border-gray-300 dark:border-white/10 px-4 py-3 text-sm font-semibold text-gray-500 dark:text-amber-200/50 grayscale opacity-30 cursor-not-allowed"
              >
                <svg viewBox="0 0 100 50" className="h-8 w-auto" aria-label="OLX">
                  <path fill="#002F34" d="M37.8 14.1c-6.8 0-12.3 5.5-12.3 12.3 0 6.8 5.5 12.3 12.3 12.3 6.8 0 12.3-5.5 12.3-12.3 0-6.8-5.5-12.3-12.3-12.3zm0 18.2c-3.2 0-5.9-2.6-5.9-5.9 0-3.2 2.6-5.9 5.9-5.9 3.2 0 5.9 2.6 5.9 5.9 0 3.2-2.7 5.9-5.9 5.9zM12.9 14.1C6.1 14.1.6 19.6.6 26.4c0 6.8 5.5 12.3 12.3 12.3 6.8 0 12.3-5.5 12.3-12.3 0-6.8-5.5-12.3-12.3-12.3zm0 18.2c-3.2 0-5.9-2.6-5.9-5.9 0-3.2 2.6-5.9 5.9-5.9 3.2 0 5.9 2.6 5.9 5.9 0 3.2-2.7 5.9-5.9 5.9z"/>
                  <path fill="#002F34" d="M72.9 14.1l-6.9 9.9-6.9-9.9h-8l10.8 15.2-11.2 16h8.2l7.1-10.2 7.1 10.2h8.2L80 29.3l10.8-15.2h-7.9z"/>
                </svg>
              </button>
            )}
            {profile.website_url ? (
              <a
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 dark:bg-black/80 border border-amber-400 dark:border-amber-500/30 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-gray-800 dark:hover:bg-black/70 transition-colors shadow-md dark:shadow-none"
                href={normalizeUrl(profile.website_url) || '#'}
                target="_blank"
                rel="noreferrer"
                aria-label="Strona WWW"
              >
                <Globe className="h-5 w-5" />
                <span>WWW</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-200 dark:bg-black/40 border border-gray-300 dark:border-white/10 px-4 py-3 text-sm font-semibold text-gray-500 dark:text-amber-200/50 grayscale opacity-50 cursor-not-allowed"
              >
                <Globe className="h-5 w-5" />
                <span>WWW</span>
              </button>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
