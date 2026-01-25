import { notFound } from 'next/navigation';
import { getQueenPublic } from '@/app/actions/get-queen-public';
import { Crown, Calendar, MapPin, Users, Star, Scissors, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: queen } = await getQueenPublic(params.id);
  
  if (!queen) {
    return {
      title: 'Matka nie znaleziona | ApiaryMind',
    };
  }

  return {
    title: `Matka Pszczela ${queen.marking_code || queen.id.slice(0, 8)} | ApiaryMind`,
    description: `Rodowód matki pszczelej - ${queen.lineage || 'Brak linii'}, Hodowca: ${queen.breeder_name || 'Nieznany'}`,
  };
}

export default async function QueenPublicPage({ params }: { params: { id: string } }) {
  const { data: queen, error } = await getQueenPublic(params.id);

  if (error || !queen) {
    notFound();
  }

  const getQueenColor = (year: number) => {
    const colors = [
      { year: 2024, color: 'bg-blue-500' },
      { year: 2023, color: 'bg-white' },
      { year: 2022, color: 'bg-yellow-500' },
      { year: 2021, color: 'bg-red-500' },
      { year: 2020, color: 'bg-green-500' },
    ];
    const found = colors.find(c => c.year === year);
    return found?.color || 'bg-gray-500';
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30"><CheckCircle2 className="w-3 h-3" />Aktywna</span>;
      case 'DEAD':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30"><XCircle className="w-3 h-3" />Martwa</span>;
      case 'SOLD':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Sprzedana</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">{status || 'Nieznany'}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[url('/assets/bg-light-pattern.png')] bg-cover bg-center dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 mb-4 text-sm font-medium">
            ← Powrót do strony głównej
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-amber-950 dark:text-white mb-2">
            Rodowód Matki Pszczelej
          </h1>
          <p className="text-amber-900/70 dark:text-gray-400">
            Publiczny rodowód i dane hodowlane
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 md:p-8 dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10">
            
            {/* Queen Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-amber-900/10 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full ${getQueenColor(queen.year)} flex items-center justify-center text-2xl font-bold text-white shadow-lg`}>
                  {queen.year.toString().slice(-2)}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-amber-950 dark:text-white flex items-center gap-2">
                    {queen.marking_code || 'Brak oznaczenia'}
                    {queen.is_clipped && (
                      <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <Scissors className="w-3 h-3" /> Przycięta
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-amber-900/60 dark:text-gray-400 mt-1">
                    Rok urodzenia: {queen.year}
                  </p>
                </div>
              </div>
              {getStatusBadge(queen.status)}
            </div>

            {/* Score */}
            {queen.score && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-1">Ocena Wartości Hodowlanej</div>
                    <div className="text-xs text-amber-900/70 dark:text-amber-200/70">{queen.score.label}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${i < queen.score!.score ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Lineage */}
              <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-bold text-amber-950 dark:text-white">Linia Hodowlana</h3>
                </div>
                <p className="text-amber-900 dark:text-gray-300">{queen.lineage || 'Nieznana'}</p>
              </div>

              {/* Breeder */}
              <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-bold text-amber-950 dark:text-white">Hodowca</h3>
                </div>
                <p className="text-amber-900 dark:text-gray-300">
                  {queen.breeder_name || queen.original_breeder?.company_name || queen.original_breeder?.full_name || 'Nieznany'}
                </p>
              </div>

              {/* Batch */}
              {queen.batch && (
                <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-bold text-amber-950 dark:text-white">Partia Hodowlana</h3>
                  </div>
                  <p className="text-amber-900 dark:text-gray-300">{queen.batch.batch_code}</p>
                  {queen.batch.start_date && (
                    <p className="text-xs text-amber-900/60 dark:text-gray-400 mt-1">
                      Data startu: {new Date(queen.batch.start_date).toLocaleDateString('pl-PL')}
                    </p>
                  )}
                </div>
              )}

              {/* Current Hive */}
              {queen.current_hive && (
                <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-bold text-amber-950 dark:text-white">Aktualny Ul</h3>
                  </div>
                  <p className="text-amber-900 dark:text-gray-300">
                    Ul #{queen.current_hive.hive_number}
                    {queen.current_hive.apiary && (
                      <span className="text-xs text-amber-900/60 dark:text-gray-400 block mt-1">
                        Pasieka: {queen.current_hive.apiary.name}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Inspections Summary */}
            {queen.inspections && queen.inspections.length > 0 && (
              <div className="mt-8 pt-6 border-t border-amber-900/10 dark:border-white/10">
                <h3 className="font-bold text-lg mb-4 text-amber-950 dark:text-white">Historia Przeglądów</h3>
                <div className="space-y-2">
                  {queen.inspections.slice(0, 10).map((insp: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/30 dark:bg-black/20 border border-white/20 dark:border-white/5">
                      <div>
                        <div className="text-sm font-medium text-amber-950 dark:text-white">
                          {new Date(insp.inspection_date).toLocaleDateString('pl-PL')}
                        </div>
                        <div className="text-xs text-amber-900/60 dark:text-gray-400">
                          Siła: {insp.colony_strength || '--'} | 
                          Nastrój: {insp.mood || '--'} |
                          {insp.honey_supers_count !== null && ` Nadstawki: ${insp.honey_supers_count}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  {queen.inspections.length > 10 && (
                    <p className="text-xs text-center text-amber-900/60 dark:text-gray-400 mt-2">
                      ...i {queen.inspections.length - 10} więcej przeglądów
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* QR Code Info */}
            <div className="mt-8 pt-6 border-t border-amber-900/10 dark:border-white/10 text-center">
              <p className="text-xs text-amber-900/60 dark:text-gray-400">
                Ten kod QR prowadzi do publicznego rodowodu matki. Skanuj, aby uzyskać dostęp do pełnej historii.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}










