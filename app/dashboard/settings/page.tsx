import { GlassCard } from '@/app/components/ui/GlassCard';

export default function UserSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">Ustawienia Konta</h1>
      <GlassCard className="p-8">
        <p className="text-white/60 mb-4">Tutaj możesz zarządzać swoim profilem, hasłem i preferencjami.</p>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
          Moduł ustawień użytkownika jest w trakcie budowy.
        </div>
      </GlassCard>
    </div>
  );
}
