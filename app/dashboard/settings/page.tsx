'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { 
  Building2, 
  User, 
  Stethoscope, 
  QrCode,
  CreditCard,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { updateProfile } from '@/app/actions/profile';
import { Profile } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import { fetchLocationByZip } from '@/utils/postal-code-api';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '@/lib/AuthContext';
import OnboardingWizard from '@/components/OnboardingWizard';
import { OnboardingProvider } from '@/lib/OnboardingContext';
import { BookOpen } from 'lucide-react';
import OnboardingFooter from '@/app/components/onboarding/OnboardingFooter';

type Tab = 'profile' | 'company' | 'veterinary' | 'legal' | 'subscription';
type LegalStatus = 'hobby' | 'rhd' | 'sb';

const PLAN_DETAILS = {
  FREE: {
    label: 'FREE (Start)',
    price: '0 zł',
    features: [
      'Ule produkcyjne: max 10',
      'Odkłady: max 2 (ważność 3 miesiące, potem LOCKED)',
      'Historia: 30 dni (potem eksport PDF)',
      'Moduł weterynaryjny: TAK',
      'Platformy: Android + WWW'
    ]
  },
  PLUS: {
    label: 'PLUS (Hobby)',
    price: '~99 zł / rok',
    features: [
      'Ule produkcyjne: max 20',
      'Odkłady: max 10 (ważność 6 miesięcy, potem LOCKED)',
      'Historia: 1 rok + 30 dni',
      'Moduł weterynaryjny: TAK',
      'Platformy: Android + WWW'
    ]
  },
  PRO: {
    label: 'PRO (Zawodowiec)',
    price: '~249 zł / rok',
    features: [
      'Ule produkcyjne: bez limitu',
      'Odkłady: bez limitu (zawsze aktywny)',
      'Historia: 6 lat (wymogi prawne)',
      'Moduł weterynaryjny: TAK',
      'Platformy: Android + WWW'
    ]
  },
  PRO_PLUS: {
    label: 'PRO+ (Hodowca)',
    price: '250 zł / rok (jako moduł dodatkowy do PRO)',
    features: [
      'Ule produkcyjne: bez limitu',
      'Odkłady: bez limitu (zawsze aktywny)',
      'Historia: 6 lat',
      'Specjalne: Panel Hodowcy (Matki, Serie hodowlane)',
      'Platformy: Android + WWW'
    ]
  },
  BUSINESS: {
    label: 'BUSINESS (Gospodarstwo)',
    price: 'Wycena B2B',
    features: [
      'Ule/Odkłady: Bez limitu',
      'Historia: 6 lat',
      'Specjalne: Zarządzanie pracownikami',
      'Platformy: Android + WWW'
    ]
  }
} as const;

const POLISH_VOIVODESHIPS = [
  'Dolnośląskie',
  'Kujawsko-pomorskie',
  'Lubelskie',
  'Lubuskie',
  'Łódzkie',
  'Małopolskie',
  'Mazowieckie',
  'Opolskie',
  'Podkarpackie',
  'Podlaskie',
  'Pomorskie',
  'Śląskie',
  'Świętokrzyskie',
  'Warmińsko-mazurskie',
  'Wielkopolskie',
  'Zachodniopomorskie',
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [legalStatus, setLegalStatus] = useState<LegalStatus>('hobby');
  const [postalCodeLoading, setPostalCodeLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [legalStatusText, setLegalStatusText] = useState<string>('Brak');
  const qrRef = useRef<HTMLDivElement | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<Profile>();
  const supabase = createClient();
  
  // State for combined name field
  const [fullNameInput, setFullNameInput] = useState<string>('');

  // Check if user is anonymous (only for UI purposes - hiding subscription tab)
  const isAnonymous = user ? (user.is_anonymous === true || (!user.email && user.app_metadata?.provider === 'anonymous')) : false;

  // Watch address fields for validation
  const streetAddress = watch('street_address') || '';
  const postalCode = watch('postal_code') || '';
  const city = watch('city') || '';
  const voivodeship = watch('voivodeship') || '';
  const isAddressComplete = streetAddress.trim() !== '' && 
                           postalCode.trim() !== '' && 
                           city.trim() !== '' && 
                           voivodeship.trim() !== '';

  // Auto-switch to Hobby if address becomes incomplete while on RHD/SB
  useEffect(() => {
    if (!isAddressComplete && (legalStatus === 'rhd' || legalStatus === 'sb')) {
      setLegalStatus('hobby');
      setValue('rhd_number', '');
      setValue('shp_number', '');
    }
  }, [isAddressComplete, legalStatus, setValue]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
        return;
      }

      // If anonymous and on subscription tab, switch to profile
      const anonymous = authUser.is_anonymous === true || (!authUser.email && authUser.app_metadata?.provider === 'anonymous');
      if (anonymous && activeTab === 'subscription') {
        setActiveTab('profile');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfileId(data.id);
        // Determine legal status from existing data
        let initialLegalStatus: LegalStatus = 'hobby';
        if (data.rhd_number && data.rhd_number.trim() !== '') {
          initialLegalStatus = 'rhd';
        } else if (data.shp_number && data.shp_number.trim() !== '') {
          initialLegalStatus = 'sb';
        }
        setLegalStatus(initialLegalStatus);

        // Ensure default values for potentially null fields to avoid uncontrolled input warnings
        // Combine first_name and last_name for the single input field
        const combinedName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        setFullNameInput(combinedName);
        
        reset({
            ...data,
            company_name: data.company_name || '',
            nip: data.nip || '',
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone_number: data.phone_number || '',
            city: data.city || '',
            street_address: data.street_address || '',
            postal_code: data.postal_code || '',
            voivodeship: data.voivodeship || '',
            wni_number: data.wni_number || '',
            default_vet_authority: data.default_vet_authority || '',
            health_cert_number: data.health_cert_number || '',
            health_cert_date: data.health_cert_date || '',
            is_public_profile_enabled: data.is_public_profile_enabled ?? false,
            public_profile_config: {
              show_address: data.public_profile_config?.show_address ?? false,
              show_company: data.public_profile_config?.show_company ?? false,
            },
            rhd_number: data.rhd_number || '',
            shp_number: data.shp_number || '',
            arimr_ep_number: data.arimr_ep_number || '',
            avatar_url: data.avatar_url || '',
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase, router, reset, activeTab]);

  const onSubmit: SubmitHandler<Profile> = async (data) => {
    setSaving(true);
    setMessage(null);
    try {
      // Validate voivodeship if SB is selected
      if (legalStatus === 'sb' && (!data.voivodeship || data.voivodeship.trim() === '')) {
        setMessage({ type: 'error', text: 'Województwo jest wymagane dla Sprzedaży Bezpośredniej (SB)' });
        setSaving(false);
        return;
      }

      // Apply conditional logic based on legal status
      const submitData = { ...data };
      
      if (legalStatus === 'hobby') {
        // Option A: Send null for both rhd_number and shp_number
        submitData.rhd_number = null;
        submitData.shp_number = null;
      } else if (legalStatus === 'rhd') {
        // Option B: Save rhd_number, send null for shp_number
        submitData.shp_number = null;
      } else if (legalStatus === 'sb') {
        // Option C: Save shp_number, send null for rhd_number
        submitData.rhd_number = null;
      }

      submitData.public_profile_config = {
        show_address: data.public_profile_config?.show_address ?? false,
        show_company: data.public_profile_config?.show_company ?? false,
      };

      const result = await updateProfile(submitData);
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Zapisano zmiany' });
        // Aktualizuj status tekst dla paska onboardingu
        if (legalStatus === 'rhd') {
          setLegalStatusText('RHD');
        } else if (legalStatus === 'sb') {
          setLegalStatusText('SB');
        } else {
          setLegalStatusText('Brak');
        }
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Wystąpił błąd podczas zapisu' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'company', label: 'Dane Firmowe', icon: Building2 },
    { id: 'veterinary', label: 'Dane Weterynaryjne', icon: Stethoscope },
    { id: 'legal', label: 'Wirtualna Wizytówka', icon: QrCode },
    // Hide subscription tab for anonymous users (Demo mode)
    ...(isAnonymous ? [] : [{ id: 'subscription' as const, label: 'Subskrypcja', icon: CreditCard }]),
  ];

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicProfileUrl = profileId ? `${baseUrl}/public/beekeeper/${profileId}` : '';
  const isPublicProfileEnabled = watch('is_public_profile_enabled');
  const firstName = watch('first_name') || '';
  const lastName = watch('last_name') || '';
  const ownerName = `${firstName} ${lastName}`.trim();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Wizytowka_Pasieki_QR',
  });

  const downloadQrPng = () => {
    if (!qrRef.current || !publicProfileUrl) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = 'apiarymind-qr.png';
      link.click();
    };
    image.src = url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ustawienia Konta</h1>
        <p className="text-gray-700 dark:text-white/70 mt-1">Zarządzaj danymi profilu, firmowymi i weterynaryjnymi</p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-300 dark:border-primary/30 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap
                ${isActive 
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400' 
                  : 'border-transparent text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80'
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
            ? 'bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-primary/15 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-primary/30 shadow-light-card-lg dark:shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <User className="w-5 h-5" />
                  Dane Podstawowe
                </h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Imię i Nazwisko</label>
                  <input 
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFullNameInput(value);
                      
                      // Parse the input: first word is first_name, rest is last_name
                      const trimmed = value.trim();
                      if (trimmed === '') {
                        setValue('first_name', '');
                        setValue('last_name', '');
                      } else {
                        const parts = trimmed.split(/\s+/);
                        const firstName = parts[0] || '';
                        const lastName = parts.slice(1).join(' ') || '';
                        
                        setValue('first_name', firstName, { shouldValidate: false });
                        setValue('last_name', lastName, { shouldValidate: false });
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure parsing happens on blur as well
                      const trimmed = e.target.value.trim();
                      if (trimmed === '') {
                        setValue('first_name', '');
                        setValue('last_name', '');
                      } else {
                        const parts = trimmed.split(/\s+/);
                        const firstName = parts[0] || '';
                        const lastName = parts.slice(1).join(' ') || '';
                        
                        setValue('first_name', firstName, { shouldValidate: true });
                        setValue('last_name', lastName, { shouldValidate: true });
                      }
                    }}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    placeholder="Jan Kowalski"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Numer Telefonu</label>
                  <input 
                    {...register('phone_number')}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    placeholder="+48 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Email (Tylko do odczytu)</label>
                  <input 
                    {...register('email')}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-primary/15 border border-gray-300 dark:border-primary/30 rounded-lg text-gray-500 dark:text-white/50 cursor-not-allowed" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                 <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                   Avatar
                 </h2>
                 <div className="flex items-center space-x-4">
                   <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-primary/20 border border-gray-300 dark:border-primary/40 flex items-center justify-center overflow-hidden">
                      <span className="text-2xl text-gray-400 dark:text-white/40">?</span>
                   </div>
                   <div className="flex-1">
                     <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Avatar URL (opcjonalnie)</label>
                     <input 
                      {...register('avatar_url')}
                      className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                      placeholder="https://..."
                    />
                   </div>
                 </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-300 dark:border-primary/30">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                <MapPin className="w-5 h-5" />
                Adres Zamieszkania / Siedziba Pasieki
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Ulica i numer</label>
                  <input 
                    {...register('street_address')}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    placeholder="ul. Pszczela 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Kod pocztowy</label>
                  <div className="relative">
                    <input 
                      {...register('postal_code')}
                      className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-20" 
                      placeholder="00-000"
                      maxLength={6}
                      onChange={async (e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 5) {
                          const formatted = value.length > 2 ? `${value.slice(0, 2)}-${value.slice(2)}` : value;
                          e.target.value = formatted;
                          setValue('postal_code', formatted, { shouldValidate: false });
                          
                          // Trigger auto-complete when postal code is complete (6 chars: XX-XXX)
                          if (formatted.length === 6 && formatted.match(/^\d{2}-\d{3}$/)) {
                            setPostalCodeLoading(true);
                            try {
                              const location = await fetchLocationByZip(formatted);
                              if (location) {
                                if (location.city) {
                                  setValue('city', location.city, { shouldValidate: false });
                                }
                                if (location.voivodeship) {
                                  setValue('voivodeship', location.voivodeship, { shouldValidate: false });
                                }
                              }
                            } catch (error) {
                              console.error('Error fetching location:', error);
                              // Silently fail - user can still manually enter city and voivodeship
                            } finally {
                              setPostalCodeLoading(false);
                            }
                          }
                        }
                      }}
                      onBlur={async (e) => {
                        const value = e.target.value.trim();
                        // Also try to fetch on blur if valid format but wasn't triggered during onChange
                        if (value.match(/^\d{2}-\d{3}$/) && !postalCodeLoading) {
                          const currentCity = watch('city') || '';
                          const currentVoivodeship = watch('voivodeship') || '';
                          
                          // Only auto-fill if fields are empty
                          if (!currentCity || !currentVoivodeship) {
                            setPostalCodeLoading(true);
                            try {
                              const location = await fetchLocationByZip(value);
                              if (location) {
                                if (location.city && !currentCity) {
                                  setValue('city', location.city, { shouldValidate: false });
                                }
                                if (location.voivodeship && !currentVoivodeship) {
                                  setValue('voivodeship', location.voivodeship, { shouldValidate: false });
                                }
                              }
                            } catch (error) {
                              console.error('Error fetching location:', error);
                            } finally {
                              setPostalCodeLoading(false);
                            }
                          }
                        }
                      }}
                    />
                    {postalCodeLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-amber-400 text-xs pointer-events-none">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Szukam...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Miasto</label>
                  <input 
                    {...register('city')}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    placeholder="Warszawa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Województwo</label>
                  <select
                    {...register('voivodeship')}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none"
                  >
                    <option value="" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Wybierz województwo</option>
                    {POLISH_VOIVODESHIPS.map((voivodeship) => (
                      <option key={voivodeship} value={voivodeship} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                        {voivodeship}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Data Tab */}
        {activeTab === 'company' && (
          <div className="bg-white dark:bg-primary/15 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-primary/30 shadow-light-card-lg dark:shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                 <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                  <Building2 className="w-5 h-5" />
                  Informacje o Firmie
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Nazwa Firmy</label>
                <input 
                  {...register('company_name')}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none"
                  placeholder="Pasieka Sp. z o.o."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">NIP</label>
                <input 
                  {...register('nip')}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none"
                  placeholder="1234567890"
                />
              </div>
            </div>
          </div>
        )}

        {/* Veterinary Data Tab */}
        {activeTab === 'veterinary' && (
          <div className="bg-white dark:bg-primary/15 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-primary/30 shadow-light-card-lg dark:shadow-none">
            <div className="space-y-6">
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                  <Stethoscope className="w-5 h-5" />
                  Dane Weterynaryjne
                </h2>
              </div>

              {/* Legal Status Selector */}
              <div className="space-y-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Status Prawny</label>
                {!isAddressComplete && (
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-lg shadow-light-card dark:shadow-none">
                    <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Wpisz kod pocztowy i adres w Profilu, aby odblokować.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    legalStatus === 'hobby' 
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' 
                      : 'border-gray-300 dark:border-primary/40 bg-gray-50 dark:bg-primary/15 hover:bg-gray-100 dark:hover:bg-primary/20'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="radio"
                        name="legal_status"
                        value="hobby"
                        checked={legalStatus === 'hobby'}
                        onChange={(e) => {
                          setLegalStatus('hobby');
                          setLegalStatusText('Brak');
                          setValue('rhd_number', '');
                          setValue('shp_number', '');
                        }}
                        className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="font-semibold text-gray-900 dark:text-white">Hobby / Własny użytek</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-white/60">Nie sprzedaję miodu lub robię to okazjonalnie bez rejestracji.</p>
                  </label>

                  <label className={`flex flex-col p-4 rounded-xl border-2 transition-all relative ${
                    !isAddressComplete 
                      ? 'border-gray-300 dark:border-primary/30 bg-gray-100 dark:bg-primary/15 opacity-50 cursor-not-allowed shadow-light-card dark:shadow-none' 
                      : legalStatus === 'rhd'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 cursor-pointer shadow-light-card dark:shadow-none'
                        : 'border-gray-300 dark:border-primary/40 bg-gray-50 dark:bg-primary/15 hover:bg-gray-100 dark:hover:bg-primary/20 cursor-pointer shadow-light-card dark:shadow-none hover:shadow-light-card-lg dark:hover:shadow-none'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="radio"
                        name="legal_status"
                        value="rhd"
                        checked={legalStatus === 'rhd'}
                        disabled={!isAddressComplete}
                        onChange={(e) => {
                          if (isAddressComplete) {
                            setLegalStatus('rhd');
                            setLegalStatusText('RHD');
                            setValue('shp_number', '');
                          }
                        }}
                        className="w-4 h-4 text-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed"
                      />
                      <span className={`font-semibold ${!isAddressComplete ? 'text-gray-400 dark:text-white/50' : 'text-gray-900 dark:text-white'}`}>
                        Rolniczy Handel Detaliczny (RHD)
                      </span>
                    </div>
                    <p className={`text-xs ${!isAddressComplete ? 'text-gray-400 dark:text-white/40' : 'text-gray-600 dark:text-white/60'}`}>
                      Sprzedaż konsumentom, limit przychodów do 100 tys. zł.
                    </p>
                  </label>

                  <label className={`flex flex-col p-4 rounded-xl border-2 transition-all relative ${
                    !isAddressComplete 
                      ? 'border-gray-300 dark:border-primary/30 bg-gray-100 dark:bg-primary/15 opacity-50 cursor-not-allowed shadow-light-card dark:shadow-none' 
                      : legalStatus === 'sb'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 cursor-pointer shadow-light-card dark:shadow-none'
                        : 'border-gray-300 dark:border-primary/40 bg-gray-50 dark:bg-primary/15 hover:bg-gray-100 dark:hover:bg-primary/20 cursor-pointer shadow-light-card dark:shadow-none hover:shadow-light-card-lg dark:hover:shadow-none'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="radio"
                        name="legal_status"
                        value="sb"
                        checked={legalStatus === 'sb'}
                        disabled={!isAddressComplete}
                        onChange={(e) => {
                          if (isAddressComplete) {
                            setLegalStatus('sb');
                            setLegalStatusText('SB');
                            setValue('rhd_number', '');
                          }
                        }}
                        className="w-4 h-4 text-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed"
                      />
                      <span className={`font-semibold ${!isAddressComplete ? 'text-gray-400 dark:text-white/50' : 'text-gray-900 dark:text-white'}`}>
                        Sprzedaż Bezpośrednia (SB)
                      </span>
                    </div>
                    <p className={`text-xs ${!isAddressComplete ? 'text-gray-400 dark:text-white/40' : 'text-gray-600 dark:text-white/60'}`}>
                      Sprzedaż produktów nieprzetworzonych, limity terytorialne.
                    </p>
                  </label>
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-amber-700 dark:text-amber-400 font-bold">
                  Numer WNI (Weterynaryjny Numer Identyfikacyjny)
                </label>
                <input 
                  {...register('wni_number')}
                  className="w-full px-4 py-2 bg-white dark:bg-primary/20 border-2 border-amber-500 dark:border-amber-500/50 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  placeholder="12345678"
                />
                <p className="text-xs text-gray-600 dark:text-white/60 mt-1">Numer stały pszczelarza do auto-uzupełniania dokumentów.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">
                  Miasto Twojego Inspektoratu Weterynarii
                </label>
                  <input
                    {...register('default_vet_authority')}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none"
                  placeholder="np. Tychy"
                />
              </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {legalStatus === 'rhd' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">
                      Numer RHD <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <input 
                      {...register('rhd_number', { required: legalStatus === 'rhd' })}
                      className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                      placeholder="12345678"
                    />
                    {errors.rhd_number && (
                      <p className="text-xs text-red-400 mt-1">To pole jest wymagane</p>
                    )}
                  </div>
                )}

                {legalStatus === 'sb' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">
                      Numer Wet. (SB) <span className="text-red-400">*</span>
                    </label>
                    <input 
                      {...register('shp_number', { required: legalStatus === 'sb' })}
                      className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                      placeholder="12345678"
                    />
                    {errors.shp_number && (
                      <p className="text-xs text-red-400 mt-1">To pole jest wymagane</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Numer EP (ARiMR)</label>
                  <input 
                    {...register('arimr_ep_number')}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    placeholder="PL123456789"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Veterinary / Legal Tab */}
        {activeTab === 'legal' && (
          <div className="bg-white dark:bg-primary/15 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-primary/30 shadow-light-card-lg dark:shadow-none">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dane Weterynaryjne / Prawo</h2>
                <p className="text-sm text-gray-600 dark:text-white/60">
                  Globalna konfiguracja wizytówki publicznej i danych weterynaryjnych.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Numer Świadectwa Zdrowia</label>
                  <input
                    {...register('health_cert_number')}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none"
                    placeholder="np. PIW.1234.2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">Data ważności</label>
                  <input
                    type="date"
                    {...register('health_cert_date')}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-white/80">
                    Miasto Twojego Inspektoratu Weterynarii
                  </label>
                  <input
                    {...register('default_vet_authority')}
                    className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none"
                    placeholder="np. Tychy"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-300 dark:border-primary/30 bg-gray-50 dark:bg-primary/15 p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
                  <input
                    type="checkbox"
                    {...register('is_public_profile_enabled')}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500 bg-white dark:bg-transparent"
                  />
                  Aktywuj wizytówkę publiczną
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70">
                  <input
                    type="checkbox"
                    {...register('public_profile_config.show_address')}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500 bg-white dark:bg-transparent"
                  />
                  Pokaż adres zamieszkania
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70">
                  <input
                    type="checkbox"
                    {...register('public_profile_config.show_company')}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500 bg-white dark:bg-transparent"
                  />
                  Pokaż nazwę firmy
                </label>
              </div>

              {isPublicProfileEnabled && publicProfileUrl && (
                <div className="rounded-xl border border-gray-300 dark:border-primary/30 bg-gray-100 dark:bg-black/30 p-4 space-y-4 shadow-light-card dark:shadow-none">
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-lg" ref={qrRef}>
                      <QRCode value={publicProfileUrl} size={200} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white/70 text-center">
                      Zeskanuj, aby sprawdzić pasiekę
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href={publicProfileUrl}
                      className="px-4 py-2 rounded-lg border border-amber-500 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/10 text-sm font-semibold shadow-light-button hover:shadow-light-button-hover dark:shadow-none transition-all"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Podgląd wizytówki
                    </Link>
                    <button
                      type="button"
                      onClick={downloadQrPng}
                      className="px-4 py-2 rounded-lg border border-amber-500 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/10 text-sm font-semibold shadow-light-button hover:shadow-light-button-hover dark:shadow-none transition-all"
                    >
                      Pobierz kod QR (PNG)
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-primary/40 text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-primary/20 text-sm font-semibold shadow-light-button hover:shadow-light-button-hover dark:shadow-none transition-all"
                    >
                      Drukuj kod QR
                    </button>
                  </div>
                </div>
              )}

              {isPublicProfileEnabled && publicProfileUrl && (
                <div className="absolute -left-[10000px] top-0">
                  <div
                    ref={printRef}
                    className="flex flex-col items-center justify-center text-center p-10 bg-white text-black"
                  >
                    <div className="text-2xl font-bold mb-4">Apiary Mind</div>
                    <div className="bg-white p-4 rounded-lg mb-4">
                      <QRCode value={publicProfileUrl} size={300} />
                    </div>
                    <h2 className="text-lg font-semibold">Zeskanuj, aby sprawdzić dokumenty pasieki</h2>
                    {ownerName && <p className="text-sm mt-2">Własność: {ownerName}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-primary/15 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-primary/30 shadow-light-card-lg dark:shadow-none">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                <CreditCard className="w-5 h-5" />
                Subskrypcja
              </h2>

              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-100 text-sm rounded-xl px-4 py-3 mb-6 shadow-light-card dark:shadow-none">
                Zarządzanie subskrypcją i płatnościami dostępne jest wyłącznie w aplikacji mobilnej na Androida.
              </div>

              {(() => {
                const currentPlanKey = (watch('subscription_plan') || 'FREE').toString().toUpperCase();
                const currentPlan = PLAN_DETAILS[currentPlanKey as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.FREE;

                return (
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 p-6 rounded-xl shadow-light-card dark:shadow-none">
                    <h3 className="text-sm uppercase tracking-wide text-amber-700 dark:text-amber-400 font-bold mb-2">Twój Plan</h3>
                    <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                      {currentPlan.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-white/60 mb-4">{currentPlan.price}</div>
                    <ul className="text-sm text-gray-700 dark:text-white/80 space-y-2 list-disc pl-5">
                      {currentPlan.features.map(feature => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white dark:bg-primary/15 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-primary/30 shadow-light-card-lg dark:shadow-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inne Plany</h3>
              {(() => {
                const currentPlanKey = (watch('subscription_plan') || 'FREE').toString().toUpperCase();
                const planEntries = Object.entries(PLAN_DETAILS).filter(([key]) => key !== currentPlanKey);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {planEntries.map(([key, plan]) => (
                      <div
                        key={key}
                        className="border rounded-xl p-4 bg-gray-100 dark:bg-black/30 border-gray-300 dark:border-primary/30 shadow-light-card dark:shadow-none"
                      >
                        <h4 className="text-sm uppercase tracking-wide text-gray-700 dark:text-white/70 font-bold">{plan.label}</h4>
                        <div className="text-xs text-gray-600 dark:text-white/50 mb-3">{plan.price}</div>
                        <ul className="text-xs text-gray-600 dark:text-white/70 space-y-2 list-disc pl-4">
                          {plan.features.map(feature => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Save Button */}
        {activeTab !== 'subscription' && (
          <div className="pt-6 border-t border-gray-300 dark:border-primary/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {activeTab === 'profile' && (
              <button
                type="button"
                onClick={() => setShowOnboarding(true)}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-light-button hover:shadow-light-button-hover dark:shadow-none"
              >
                <BookOpen className="w-4 h-4" />
                <span>Uruchom Przewodnik</span>
              </button>
            )}
            <div className={activeTab === 'profile' ? '' : 'w-full flex justify-end'}>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 rounded-lg font-bold transition-all shadow-light-button hover:shadow-light-button-hover dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        )}
      </form>

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingProvider>
          <OnboardingWizard 
            forceStart={showOnboarding}
            onComplete={() => setShowOnboarding(false)}
          />
        </OnboardingProvider>
      )}

      {/* Onboarding Footer - Krok 4 */}
      <OnboardingFooter
        step={4}
        statusText={legalStatusText}
        iconName="FileText"
        infoText="Ostatni szlif. Wybierz status RHD lub SB i wpisz numer weterynaryjny, aby odblokować sprzedaż i legalne raporty."
        buttonLabel="Zakończ Konfigurację"
      />
    </div>
  );
}
