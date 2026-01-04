import { notFound } from 'next/navigation';
import { getApiaryPublic } from '@/app/actions/get-apiary-public';
import { MapPin, Users, Calendar, BarChart3, ExternalLink, Phone, Globe, Facebook, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: apiary } = await getApiaryPublic(params.id);
  
  if (!apiary) {
    return {
      title: 'Pasieka nie znaleziona | ApiaryMind',
    };
  }

  return {
    title: `Pasieka ${apiary.name} | ApiaryMind`,
    description: `Publiczna wizytówka pasieki ${apiary.name}${apiary.owner?.city ? ` - ${apiary.owner.city}` : ''}`,
  };
}

export default async function ApiaryPublicPage({ params }: { params: { id: string } }) {
  const { data: apiary, error } = await getApiaryPublic(params.id);

  if (error || !apiary) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[url('/assets/marble-texture.jpg')] bg-cover bg-center dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 mb-4 text-sm font-medium">
            ← Powrót do strony głównej
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-amber-950 dark:text-white mb-2">
            Wizytówka Pasieki
          </h1>
        </div>

        {/* Main Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 md:p-8 dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10">
            
            {/* Apiary Header */}
            <div className="mb-8 pb-6 border-b border-amber-900/10 dark:border-white/10">
              <h2 className="text-3xl md:text-4xl font-bold text-amber-950 dark:text-white mb-4">
                {apiary.name}
              </h2>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-amber-900/70 dark:text-gray-400">
                {apiary.location_geo && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{apiary.location_geo}</span>
                  </div>
                )}
                {apiary.owner?.city && (
                  <div className="flex items-center gap-2">
                    <span>{apiary.owner.city}</span>
                    {apiary.owner.voivodeship && <span>({apiary.owner.voivodeship})</span>}
                  </div>
                )}
                {apiary.type && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 text-xs font-bold">
                      {apiary.type === 'STATIONARY' ? 'Stacjonarna' : 'Wędrowna'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            {apiary.statistics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-bold text-amber-950 dark:text-white">Rodziny Pszczele</h3>
                  </div>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">{apiary.hives_count}</p>
                  <p className="text-xs text-amber-900/60 dark:text-amber-200/70 mt-1">
                    {apiary.statistics.active_hives} aktywnych
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-bold text-amber-950 dark:text-white">Przeglądy</h3>
                  </div>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                    {apiary.statistics.total_inspections}
                  </p>
                  <p className="text-xs text-amber-900/60 dark:text-amber-200/70 mt-1">
                    Wszystkich przeglądów
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-bold text-amber-950 dark:text-white">Średnia Wydajność</h3>
                  </div>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                    {apiary.statistics.avg_honey_supers}
                  </p>
                  <p className="text-xs text-amber-900/60 dark:text-amber-200/70 mt-1">
                    Nadstawek na rodzinę
                  </p>
                </div>
              </div>
            )}

            {/* Owner Info */}
            {apiary.owner && (
              <div className="mb-8 p-6 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5">
                <h3 className="font-bold text-lg mb-4 text-amber-950 dark:text-white">
                  O Pszczelarzu
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-amber-950 dark:text-white">
                      {apiary.owner.company_name || apiary.owner.full_name || 'Nieznany pszczelarz'}
                    </p>
                  </div>

                  {apiary.owner.description && (
                    <p className="text-sm text-amber-900/80 dark:text-gray-300">
                      {apiary.owner.description}
                    </p>
                  )}

                  {/* Contact Links */}
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-amber-900/10 dark:border-white/10">
                    {apiary.owner.phone_number && (
                      <a
                        href={`tel:${apiary.owner.phone_number}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-900 dark:text-amber-300 transition-colors text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        {apiary.owner.phone_number}
                      </a>
                    )}
                    
                    {apiary.owner.website_url && (
                      <a
                        href={apiary.owner.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-900 dark:text-amber-300 transition-colors text-sm"
                      >
                        <Globe className="w-4 h-4" />
                        Strona WWW
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    
                    {apiary.owner.facebook_link && (
                      <a
                        href={apiary.owner.facebook_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-900 dark:text-blue-300 transition-colors text-sm"
                      >
                        <Facebook className="w-4 h-4" />
                        Facebook
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    
                    {apiary.owner.allegro_link && (
                      <a
                        href={apiary.owner.allegro_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-900 dark:text-orange-300 transition-colors text-sm"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Allegro
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    
                    {apiary.owner.olx_link && (
                      <a
                        href={apiary.owner.olx_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-900 dark:text-green-300 transition-colors text-sm"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        OLX
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Info Footer */}
            <div className="mt-8 pt-6 border-t border-amber-900/10 dark:border-white/10 text-center">
              <p className="text-xs text-amber-900/60 dark:text-gray-400">
                Ta wizytówka jest publicznie dostępna. Udostępnij link do swojej pasieki!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




