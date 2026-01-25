'use client';

import { Shield, ShieldAlert, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface QuarantinePanelProps {
  isActive: boolean;
  endDate: string | null;
}

export function QuarantinePanel({ isActive, endDate }: QuarantinePanelProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: pl });
    } catch {
      return dateString;
    }
  };

  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const end = new Date(dateString);
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  };

  const daysRemaining = getDaysRemaining(endDate);
  const formattedDate = formatDate(endDate);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 h-[400px] flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-amber-200">Status Bezpieczeństwa</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {isActive ? (
          <>
            {/* Active Quarantine - Red Status */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-red-500/20 border-4 border-red-500/50 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <ShieldAlert className="w-12 h-12 text-red-400" />
              </div>
              <h4 className="text-2xl font-bold text-red-400 mb-2">
                KARENCJA AKTYWNA
              </h4>
              <p className="text-sm text-red-300/80 mb-6">
                Nie można wykonywać miodobrania w tej pasiece.
              </p>
            </div>

            {/* End Date Info */}
            {endDate && (
              <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold text-red-300/80 uppercase">
                    Koniec karencji
                  </span>
                </div>
                <p className="text-lg font-bold text-red-300 mb-1">
                  {formattedDate}
                </p>
                {daysRemaining !== null && (
                  <p className="text-sm text-red-300/60">
                    {daysRemaining > 0
                      ? `Pozostało ${daysRemaining} ${daysRemaining === 1 ? 'dzień' : daysRemaining < 5 ? 'dni' : 'dni'}`
                      : daysRemaining === 0
                      ? 'Kończy się dzisiaj'
                      : 'Karencja wygasła'}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Safe Status - Green */}
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500/50 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-12 h-12 text-green-400" />
              </div>
              <h4 className="text-2xl font-bold text-green-400 mb-2">
                BEZPIECZNIE
              </h4>
              <p className="text-sm text-green-300/80">
                Pasieka gotowa do miodobrania.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-xs text-amber-200/40 text-center">
          Strażnik Karencji monitoruje okresy karencji po zastosowaniu leków
        </p>
      </div>
    </div>
  );
}



