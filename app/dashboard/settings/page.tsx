'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { 
  Building2, 
  User, 
  Stethoscope, 
  CreditCard,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { updateProfile } from '@/app/actions/profile';
import { Profile } from '@/types/supabase';
import { useRouter } from 'next/navigation';

type Tab = 'profile' | 'company' | 'veterinary' | 'subscription';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Profile>();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        // Ensure default values for potentially null fields to avoid uncontrolled input warnings
        reset({
            ...data,
            company_name: data.company_name || '',
            nip: data.nip || '',
            city: data.city || '',
            wni_number: data.wni_number || '',
            rhd_number: data.rhd_number || '',
            shp_number: data.shp_number || '',
            arimr_ep_number: data.arimr_ep_number || '',
            avatar_url: data.avatar_url || '',
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase, router, reset]);

  const onSubmit: SubmitHandler<Profile> = async (data) => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateProfile(data);
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Zapisano zmiany' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Wystąpił błąd podczas zapisu' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'company', label: 'Dane Firmowe', icon: Building2 },
    { id: 'veterinary', label: 'Dane Weterynaryjne', icon: Stethoscope },
    { id: 'subscription', label: 'Subskrypcja', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Ustawienia Konta</h1>
        <p className="text-white/70 mt-1">Zarządzaj danymi profilu, firmowymi i weterynaryjnymi</p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap
                ${isActive 
                  ? 'border-amber-500 text-amber-400' 
                  : 'border-transparent text-white/60 hover:text-white/80'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <User className="w-5 h-5" />
                  Dane Podstawowe
                </h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Pełne Imię i Nazwisko</label>
                  <input 
                    {...register('full_name')}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                    placeholder="Jan Kowalski"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Numer Telefonu</label>
                  <input 
                    {...register('phone_number')}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                    placeholder="+48 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">Email (Tylko do odczytu)</label>
                  <input 
                    {...register('email')}
                    disabled
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                 <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                   Avatar
                 </h2>
                 <div className="flex items-center space-x-4">
                   <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                      <span className="text-2xl text-white/40">?</span>
                   </div>
                   <div className="flex-1">
                     <label className="block text-sm font-medium mb-2 text-white/80">Avatar URL (opcjonalnie)</label>
                     <input 
                      {...register('avatar_url')}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                      placeholder="https://..."
                    />
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Data Tab */}
        {activeTab === 'company' && (
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                 <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-white">
                  <Building2 className="w-5 h-5" />
                  Informacje o Firmie
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Nazwa Firmy</label>
                <input 
                  {...register('company_name')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="Pasieka Sp. z o.o."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">NIP</label>
                <input 
                  {...register('nip')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="1234567890"
                />
              </div>

              <div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Miasto</label>
                <input 
                  {...register('city')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="Warszawa"
                />
              </div>
            </div>
          </div>
        )}

        {/* Veterinary Data Tab */}
        {activeTab === 'veterinary' && (
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                 <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-white">
                  <Stethoscope className="w-5 h-5" />
                  Dane Weterynaryjne
                </h2>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-amber-400 font-bold">Numer WNI (Weterynaryjny Numer Identyfikacyjny)</label>
                <input 
                  {...register('wni_number')}
                  className="w-full px-4 py-2 bg-white/10 border-2 border-amber-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="12345678"
                />
                <p className="text-xs text-white/60 mt-1">Numer wymagany do sprzedaży produktów pszczelich.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Numer RHD (Rolniczy Handel Detaliczny)</label>
                <input 
                  {...register('rhd_number')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Numer SHP (Sprzedaż Bezpośrednia)</label>
                <input 
                  {...register('shp_number')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="12345678"
                />
                <p className="text-xs text-white/60 mt-1">Sprzedaż Handlowa/Produktów (SB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Numer EP (ARiMR)</label>
                <input 
                  {...register('arimr_ep_number')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="PL123456789"
                />
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-white">
                <CreditCard className="w-5 h-5" />
                Subskrypcja i Saldo
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-xl">
                  <h3 className="text-sm uppercase tracking-wide text-amber-400 font-bold mb-2">Twój Plan</h3>
                  <div className="text-3xl font-extrabold text-white mb-2">
                    {watch('subscription_plan') || 'FREE'}
                  </div>
                  <p className="text-sm text-white/70">
                    Dostęp do podstawowych funkcji zarządzania pasieką.
                  </p>
                  <button type="button" className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-colors">
                    Zmień Plan
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                  <h3 className="text-sm uppercase tracking-wide text-white/80 font-bold mb-2">Saldo EyesCoin</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">{watch('eyes_coin_balance') || 0}</span>
                    <span className="text-sm font-medium text-white/60">EYC</span>
                  </div>
                  <p className="text-sm text-white/70 mt-2">
                    Punkty wymienialne na zniżki i usługi premium.
                  </p>
                   <button type="button" className="mt-4 px-4 py-2 border border-white/20 hover:bg-white/10 text-white font-medium rounded-lg text-sm transition-colors">
                    Historia Transakcji
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {activeTab !== 'subscription' && (
          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Zapisywanie...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Zapisz Zmiany</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
