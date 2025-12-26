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
            regon: data.regon || '',
            address_street: data.address_street || '',
            zip_code: data.zip_code || '',
            city: data.city || '',
            wni_number: data.wni_number || '',
            rhd_number: data.rhd_number || '',
            sb_number: data.sb_number || '',
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
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ustawienia Konta</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap
                ${isActive
                  ? 'border-yellow-500 text-yellow-600 dark:text-yellow-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Dane Podstawowe
              </h2>

              <div>
                <label className="block text-sm font-medium mb-1">Pełne Imię i Nazwisko</label>
                <input
                  {...register('full_name')}
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Jan Kowalski"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Numer Telefonu</label>
                <input
                  {...register('phone_number')}
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="+48 123 456 789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email (Tylko do odczytu)</label>
                <input
                  {...register('email')}
                  disabled
                  className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-700 text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-4">
               <h2 className="text-lg font-semibold flex items-center gap-2">
                 Avatar
               </h2>
               <div className="flex items-center space-x-4">
                 <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {/* Placeholder for avatar, could implement upload later */}
                    <span className="text-2xl text-gray-400">?</span>
                 </div>
                 <div>
                   <p className="text-sm text-gray-500 mb-2">Avatar URL (opcjonalnie)</p>
                   <input
                    {...register('avatar_url')}
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                    placeholder="https://..."
                  />
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* Company Data Tab */}
        {activeTab === 'company' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="md:col-span-2">
               <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5" />
                Informacje o Firmie
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nazwa Firmy</label>
              <input
                {...register('company_name')}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="Pasieka Sp. z o.o."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">NIP</label>
              <input
                {...register('nip')}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">REGON</label>
              <input
                {...register('regon')}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ulica i Numer</label>
              <input
                {...register('address_street')}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="ul. Miodowa 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kod Pocztowy</label>
              <input
                {...register('zip_code')}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="00-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Miasto</label>
              <input
                {...register('city')}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="Warszawa"
              />
            </div>
          </div>
        )}

        {/* Veterinary Data Tab */}
        {activeTab === 'veterinary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="md:col-span-2">
               <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Stethoscope className="w-5 h-5" />
                Dane Weterynaryjne
              </h2>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-1 text-yellow-600 font-bold">Numer WNI (Weterynaryjny Numer Identyfikacyjny)</label>
              <input
                {...register('wni_number')}
                className="w-full p-2 border-2 border-yellow-400 rounded-md dark:bg-gray-800 dark:border-yellow-600 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="12345678"
              />
              <p className="text-xs text-gray-500 mt-1">Numer wymagany do sprzedaży produktów pszczelich.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Numer RHD (Rolniczy Handel Detaliczny)</label>
              <input
                {...register('rhd_number')}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Numer SB (Sprzedaż Bezpośrednia)</label>
              <input
                {...register('sb_number')}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Numer EP (ARiMR)</label>
              <input
                {...register('arimr_ep_number')}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="PL123456789"
              />
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5" />
              Subskrypcja i Saldo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <h3 className="text-sm uppercase tracking-wide text-yellow-800 dark:text-yellow-400 font-bold mb-2">Twój Plan</h3>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                  {watch('subscription_plan') || 'FREE'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Dostęp do podstawowych funkcji zarządzania pasieką.
                </p>
                <button type="button" className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg text-sm transition-colors">
                  Zmień Plan
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-2">Saldo EyesCoin</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{watch('eyescoin_balance') || 0}</span>
                  <span className="text-sm font-medium text-gray-500">EYC</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Punkty wymienialne na zniżki i usługi premium.
                </p>
                 <button type="button" className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm transition-colors">
                  Historia Transakcji
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button (Sticky/Fixed or just at bottom) */}
        {activeTab !== 'subscription' && (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
