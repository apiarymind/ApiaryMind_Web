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
  MapPin,
  BookOpen,
  FileText, // Added for DocumentTextIcon equivalent
  Lock,      // Added for LockClosedIcon equivalent
  Calendar   // For sanitary exam date
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { updateProfile } from '@/app/actions/profile';
import { Profile } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import { fetchLocationByZip } from '@/utils/postal-code-api';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import PrintPortal from '@/app/components/PrintPortal';
import { useAuth } from '@/lib/AuthContext';
import { useOnboarding } from '@/lib/OnboardingContext';
import OnboardingFooter from '@/app/components/onboarding/OnboardingFooter';

type Tab = 'profile' | 'company' | 'veterinary' | 'legal' | 'subscription' | 'security';
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
  const [legalStatusText, setLegalStatusText] = useState<string>('Brak');
  const qrRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { resetOnboarding } = useOnboarding();
  
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
            sanitary_exam_expires_at: data.sanitary_exam_expires_at || '',
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

  const handleStartOnboarding = () => {
    resetOnboarding();
    // Redirect to step 1 route (Warehouse)
    router.push('/dashboard/beekeeper/warehouse');
  };

  // Definicja zakładek zgodnie z wymaganiem
  const tabs = [
    { 
      id: 'profile', 
      label: 'Profil Użytkownika', 
      icon: User 
    },
    { 
      id: 'company', 
      label: 'Wizytówka', 
      icon: QrCode 
    },
    { 
      id: 'legal', // To jest kluczowa zakładka dla onboardingu! (RHD/SB)
      label: 'Dane Pasieki / RHD', 
      icon: FileText 
    },
    { 
      id: 'subscription', 
      label: 'Subskrypcja', 
      icon: CreditCard 
    },
    { 
      id: 'security', 
      label: 'Ważność Badań', 
      icon: Calendar 
    }
  ];

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicProfileUrl = profileId ? `${baseUrl}/public/beekeeper/${profileId}` : '';
  const isPublicProfileEnabled = watch('is_public_profile_enabled');
  const firstName = watch('first_name') || '';
  const lastName = watch('last_name') || '';
  const ownerName = `${firstName} ${lastName}`.trim();

  const handlePrint = () => {
    if (publicProfileUrl) {
      // Small delay to ensure render
      setTimeout(() => {
        window.print();
      }, 300);
    } else {
      setMessage({ type: 'error', text: 'Błąd: Brak URL wizytówki' });
    }
  };

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
        <h1 className="text-3xl font-bold text-amber-50">Ustawienia Konta</h1>
        <p className="text-amber-100 mt-1">Zarządzaj danymi profilu, firmowymi i weterynaryjnymi</p>
      </div>
      
      {/* Tabs */}
      <div 
        className="flex border-b mb-6 overflow-x-auto"
        style={{
          borderBottomColor: 'var(--theme-card-border)',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap
                ${isActive 
                  ? 'border-amber-500 text-amber-500' 
                  : 'border-transparent text-amber-200 hover:text-amber-100'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {message && (
        <div 
          className="p-4 rounded-xl flex items-center space-x-2"
          style={{
            backgroundColor: message.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            borderColor: message.type === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
            borderWidth: '1px',
            borderStyle: 'solid',
            color: message.type === 'success' ? 'rgb(76, 175, 80)' : 'rgb(244, 67, 54)',
          }}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div 
            className="backdrop-blur-md rounded-xl p-6 shadow-light-card-lg dark:shadow-none dark:border-primary/50 dark:shadow-[0_0_15px_rgba(244,181,36,0.15)]"
            style={{
              borderRadius: 'var(--theme-card-radius, 1.5rem)',
              borderColor: 'var(--theme-card-border)',
              borderWidth: 'var(--theme-card-border-width, 1px)',
              borderStyle: 'solid',
              boxShadow: 'var(--theme-card-shadow)',
              backdropFilter: 'var(--theme-card-blur, blur(20px))',
              backgroundColor: 'var(--theme-card-bg)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-50">
                  <User className="w-5 h-5" />
                  Dane Podstawowe
                </h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-100">Imię i Nazwisko</label>
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
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="Jan Kowalski"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-100">Numer Telefonu</label>
                  <input 
                    {...register('phone_number')}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="+48 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-100">Email (Tylko do odczytu)</label>
                  <input 
                    {...register('email')}
                    disabled
                    className="w-full px-4 py-2 rounded-lg cursor-not-allowed" 
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--text-muted)',
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                 <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-50">
                   Avatar
                 </h2>
                 <div className="flex items-center space-x-4">
                   <div 
                     className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                     style={{
                       backgroundColor: 'var(--input-bg)',
                       borderColor: 'var(--input-border)',
                       borderWidth: '1px',
                       borderStyle: 'solid',
                     }}
                   >
                      <span className="text-2xl text-amber-200">?</span>
                   </div>
                   <div className="flex-1">
                     <label className="block text-sm font-medium mb-2 text-amber-100">Avatar URL (opcjonalnie)</label>
                     <input 
                      {...register('avatar_url')}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="https://..."
                    />
                   </div>
                 </div>
              </div>
            </div>

            {/* Address Section */}
            <div 
              className="md:col-span-2 mt-6 pt-6"
              style={{
                borderTopColor: 'var(--theme-card-border)',
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
              }}
            >
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-amber-50">
                <MapPin className="w-5 h-5" />
                Adres Zamieszkania / Siedziba Pasieki
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-100">Ulica i numer</label>
                  <input 
                    {...register('street_address')}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="ul. Pszczela 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-100">Kod pocztowy</label>
                  <div className="relative">
                    <input 
                      {...register('postal_code')}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-20"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        color: 'var(--text-primary)',
                      }} 
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
                  <label className="block text-sm font-medium mb-2 text-amber-100">Miasto</label>
                  <input 
                    {...register('city')}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="Warszawa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-100">Województwo</label>
                  <select
                    {...register('voivodeship')}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}>Wybierz województwo</option>
                    {POLISH_VOIVODESHIPS.map((voivodeship) => (
                      <option key={voivodeship} value={voivodeship} style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                        {voivodeship}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company / Business Card Tab */}
        {activeTab === 'company' && (
          <div 
            className="backdrop-blur-md rounded-xl p-6 shadow-light-card-lg dark:shadow-none dark:border-primary/50 dark:shadow-[0_0_15px_rgba(244,181,36,0.15)]"
            style={{
              borderRadius: 'var(--theme-card-radius, 1.5rem)',
              borderColor: 'var(--theme-card-border)',
              borderWidth: 'var(--theme-card-border-width, 1px)',
              borderStyle: 'solid',
              boxShadow: 'var(--theme-card-shadow)',
              backdropFilter: 'var(--theme-card-blur, blur(20px))',
              backgroundColor: 'var(--theme-card-bg)',
            }}
          >
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-amber-50">
              <QrCode className="w-5 h-5" />
              Wizytówka Pasieki
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register('is_public_profile_enabled')}
                  id="is_public_profile_enabled"
                  className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  style={{
                    accentColor: 'var(--amber-500)',
                  }}
                />
                <label htmlFor="is_public_profile_enabled" className="text-sm font-medium text-amber-100 cursor-pointer">
                  Włącz publiczną wizytówkę pszczelarza
                </label>
              </div>

              {isPublicProfileEnabled && (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', borderWidth: '1px', borderStyle: 'solid' }}>
                    <p className="text-xs text-amber-200 mb-3">
                      Twoja wizytówka będzie dostępna pod adresem:
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <code className="text-xs px-3 py-2 rounded flex-1" style={{ backgroundColor: 'var(--theme-card-bg)', color: 'var(--text-primary)' }}>
                        {publicProfileUrl || 'Ładowanie...'}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          if (publicProfileUrl) {
                            navigator.clipboard.writeText(publicProfileUrl);
                            setMessage({ type: 'success', text: 'Link skopiowany do schowka' });
                          }
                        }}
                        className="text-xs px-3 py-2 rounded-lg transition-colors text-amber-100 hover:text-amber-50"
                        style={{
                          backgroundColor: 'var(--input-bg)',
                          borderColor: 'var(--input-border)',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        Kopiuj
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register('public_profile_config.show_address')}
                          id="show_address"
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                          style={{
                            accentColor: 'var(--amber-500)',
                          }}
                        />
                        <label htmlFor="show_address" className="text-xs text-amber-100 cursor-pointer">
                          Pokaż adres
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register('public_profile_config.show_company')}
                          id="show_company"
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                          style={{
                            accentColor: 'var(--amber-500)',
                          }}
                        />
                        <label htmlFor="show_company" className="text-xs text-amber-100 cursor-pointer">
                          Pokaż dane firmy
                        </label>
                      </div>
                    </div>
                  </div>

                  {publicProfileUrl && (
                    <div 
                      className="p-6 rounded-xl border-2 shadow-[0_0_15px_rgba(34,197,94,0.2)] dark:shadow-[0_0_15px_rgba(34,197,94,0.2)]" 
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'rgba(34, 197, 94, 0.7)' }}
                    >
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="flex-shrink-0">
                          <div 
                            ref={qrRef}
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: '#FFFFFF' }}
                          >
                            <QRCode
                              value={publicProfileUrl}
                              size={200}
                              level="H"
                              includeMargin={true}
                            />
                          </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-lg font-bold mb-2 text-amber-50">{ownerName || 'Pszczelarz'}</h3>
                          {watch('phone_number') && (
                            <p className="text-sm text-amber-100 mb-1">
                              <span className="text-amber-200">Tel:</span> {watch('phone_number')}
                            </p>
                          )}
                          {watch('company_name') && watch('public_profile_config.show_company') && (
                            <p className="text-sm text-amber-100 mb-1">
                              <span className="text-amber-200">Firma:</span> {watch('company_name')}
                            </p>
                          )}
                          {watch('city') && watch('public_profile_config.show_address') && (
                            <p className="text-sm text-amber-100">
                              <span className="text-amber-200">Lokalizacja:</span> {watch('city')}
                              {watch('voivodeship') && `, ${watch('voivodeship')}`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-6 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (!publicProfileUrl) {
                              setMessage({ type: 'error', text: 'Błąd: Brak URL wizytówki' });
                              return;
                            }
                            // Wywołaj handlePrint, który sam zadba o konwersję QR i opóźnienie
                            handlePrint();
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all"
                          style={{
                            backgroundColor: 'var(--amber-500)',
                            color: '#2A1C10',
                          }}
                        >
                          <FileText className="w-4 h-4" />
                          Drukuj Wizytówkę
                        </button>
                        <button
                          type="button"
                          onClick={downloadQrPng}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all"
                          style={{
                            backgroundColor: 'var(--input-bg)',
                            borderColor: 'var(--input-border)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <QrCode className="w-4 h-4" />
                          Pobierz QR
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legal / Veterinary Data Tab (Renamed from 'veterinary') */}
        {activeTab === 'legal' && (
          <div 
            className="backdrop-blur-md rounded-xl p-6 shadow-light-card-lg dark:shadow-none dark:border-primary/50 dark:shadow-[0_0_15px_rgba(244,181,36,0.15)]"
            style={{
              borderRadius: 'var(--theme-card-radius, 1.5rem)',
              borderColor: 'var(--theme-card-border)',
              borderWidth: 'var(--theme-card-border-width, 1px)',
              borderStyle: 'solid',
              boxShadow: 'var(--theme-card-shadow)',
              backdropFilter: 'var(--theme-card-blur, blur(20px))',
              backgroundColor: 'var(--theme-card-bg)',
            }}
          >
            <div className="space-y-6">
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-amber-50">
                  <FileText className="w-5 h-5" />
                  Dane Pasieki / RHD
                </h2>
              </div>

              {/* Legal Status Selector */}
              <div className="space-y-4">
                <label className="block text-sm font-medium mb-2 text-amber-100">Status Prawny</label>
                {!isAddressComplete && (
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-lg shadow-light-card dark:shadow-none">
                    <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Wpisz kod pocztowy i adres w Profilu, aby odblokować.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label 
                    className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      legalStatus === 'hobby' 
                        ? 'border-green-500/70 shadow-[0_0_15px_rgba(34,197,94,0.2)] dark:border-green-500/70 dark:shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                        : 'dark:border-primary/30 dark:hover:border-primary/50'
                    }`}
                    style={legalStatus === 'hobby' ? {
                      borderColor: 'rgba(34, 197, 94, 0.7)',
                      backgroundColor: 'var(--input-bg)',
                    } : {
                      borderColor: 'var(--theme-card-border)',
                      backgroundColor: 'var(--input-bg)',
                    }}
                  >
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
                        className="w-4 h-4 text-green-500 focus:ring-green-500"
                      />
                      <span className="font-semibold text-amber-50">Hobby / Własny użytek</span>
                    </div>
                    <p className="text-xs text-amber-200">Nie sprzedaję miodu lub robię to okazjonalnie bez rejestracji.</p>
                  </label>

                  <label 
                    className={`flex flex-col p-4 rounded-xl border-2 transition-all relative ${
                      !isAddressComplete 
                        ? 'opacity-50 cursor-not-allowed shadow-light-card dark:shadow-none dark:border-primary/20' 
                        : legalStatus === 'rhd'
                          ? 'border-green-500/70 shadow-[0_0_15px_rgba(34,197,94,0.2)] dark:border-green-500/70 dark:shadow-[0_0_15px_rgba(34,197,94,0.2)] cursor-pointer shadow-light-card dark:shadow-none'
                          : 'cursor-pointer shadow-light-card dark:shadow-none hover:shadow-light-card-lg dark:hover:shadow-none dark:border-primary/30 dark:hover:border-primary/50'
                    }`}
                    style={!isAddressComplete ? {
                      borderColor: 'var(--theme-card-border)',
                      backgroundColor: 'var(--input-bg)',
                    } : legalStatus === 'rhd' ? {
                      borderColor: 'rgba(34, 197, 94, 0.7)',
                      backgroundColor: 'var(--input-bg)',
                    } : {
                      borderColor: 'var(--theme-card-border)',
                      backgroundColor: 'var(--input-bg)',
                    }}
                  >
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
                      <span className={`font-semibold ${!isAddressComplete ? 'text-amber-200' : 'text-amber-50'}`}>
                        Rolniczy Handel Detaliczny (RHD)
                      </span>
                    </div>
                    <p className={`text-xs ${!isAddressComplete ? 'text-amber-200' : 'text-amber-200'}`}>
                      Sprzedaż konsumentom, limit przychodów do 100 tys. zł.
                    </p>
                  </label>

                  <label 
                    className={`flex flex-col p-4 rounded-xl border-2 transition-all relative ${
                      !isAddressComplete 
                        ? 'opacity-50 cursor-not-allowed shadow-light-card dark:shadow-none dark:border-primary/20' 
                        : legalStatus === 'sb'
                          ? 'border-green-500/70 shadow-[0_0_15px_rgba(34,197,94,0.2)] dark:border-green-500/70 dark:shadow-[0_0_15px_rgba(34,197,94,0.2)] cursor-pointer shadow-light-card dark:shadow-none'
                          : 'cursor-pointer shadow-light-card dark:shadow-none hover:shadow-light-card-lg dark:hover:shadow-none dark:border-primary/30 dark:hover:border-primary/50'
                    }`}
                    style={!isAddressComplete ? {
                      borderColor: 'var(--theme-card-border)',
                      backgroundColor: 'var(--input-bg)',
                    } : legalStatus === 'sb' ? {
                      borderColor: 'rgba(34, 197, 94, 0.7)',
                      backgroundColor: 'var(--input-bg)',
                    } : {
                      borderColor: 'var(--theme-card-border)',
                      backgroundColor: 'var(--input-bg)',
                    }}
                  >
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
                      <span className={`font-semibold ${!isAddressComplete ? 'text-amber-200' : 'text-amber-50'}`}>
                        Sprzedaż Bezpośrednia (SB)
                      </span>
                    </div>
                    <p className={`text-xs ${!isAddressComplete ? 'text-amber-200' : 'text-amber-200'}`}>
                      Sprzedaż produktów nieprzetworzonych, limity terytorialne.
                    </p>
                  </label>
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-amber-500 font-bold">
                  Numer WNI (Weterynaryjny Numer Identyfikacyjny)
                </label>
                <input 
                  {...register('wni_number')}
                  className="w-full px-4 py-2 border-2 border-amber-500 dark:border-amber-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="12345678"
                />
                <p className="text-xs text-amber-200 mt-1">Numer stały pszczelarza do auto-uzupełniania dokumentów.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-amber-100">
                  Miasto Twojego Inspektoratu Weterynarii
                </label>
                  <input
                    {...register('default_vet_authority')}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--text-primary)',
                    }}
                  placeholder="np. Tychy"
                />
              </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {legalStatus === 'rhd' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-amber-100">
                      Numer RHD <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <input 
                      {...register('rhd_number', { required: legalStatus === 'rhd' })}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="12345678"
                    />
                    {errors.rhd_number && (
                      <p className="text-xs text-red-400 mt-1">To pole jest wymagane</p>
                    )}
                  </div>
                )}

                {legalStatus === 'sb' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-amber-100">
                      Numer Wet. (SB) <span className="text-red-400">*</span>
                    </label>
                    <input 
                      {...register('shp_number', { required: legalStatus === 'sb' })}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="12345678"
                    />
                    {errors.shp_number && (
                      <p className="text-xs text-red-400 mt-1">To pole jest wymagane</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-100">Numer EP (ARiMR)</label>
                  <input 
                    {...register('arimr_ep_number')}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="PL123456789"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div 
              className="backdrop-blur-md rounded-xl p-6 shadow-light-card-lg dark:shadow-none dark:border-primary/50 dark:shadow-[0_0_15px_rgba(244,181,36,0.15)]"
              style={{
                borderRadius: 'var(--theme-card-radius, 1.5rem)',
                borderColor: 'var(--theme-card-border)',
                borderWidth: 'var(--theme-card-border-width, 1px)',
                borderStyle: 'solid',
                boxShadow: 'var(--theme-card-shadow)',
                backdropFilter: 'var(--theme-card-blur, blur(20px))',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-amber-50">
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
                  <div 
                    className="border-2 shadow-[0_0_15px_rgba(34,197,94,0.2)] dark:border-green-500/70 dark:shadow-[0_0_15px_rgba(34,197,94,0.2)] p-6 rounded-xl shadow-light-card dark:shadow-none"
                    style={{
                      borderColor: 'rgba(34, 197, 94, 0.7)',
                      backgroundColor: 'var(--input-bg)',
                    }}
                  >
                    <h3 className="text-sm uppercase tracking-wide text-green-600 dark:text-green-400 font-bold mb-2">Twój Plan</h3>
                    <div className="text-2xl md:text-3xl font-extrabold text-amber-50 mb-2">
                      {currentPlan.label}
                    </div>
                    <div className="text-xs text-amber-200 mb-4">{currentPlan.price}</div>
                    <ul className="text-sm text-amber-100 space-y-2 list-disc pl-5">
                      {currentPlan.features.map(feature => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>

            <div 
              className="backdrop-blur-md rounded-xl p-6 shadow-light-card-lg dark:shadow-none dark:border-primary/50 dark:shadow-[0_0_15px_rgba(244,181,36,0.15)]"
              style={{
                borderRadius: 'var(--theme-card-radius, 1.5rem)',
                borderColor: 'var(--theme-card-border)',
                borderWidth: 'var(--theme-card-border-width, 1px)',
                borderStyle: 'solid',
                boxShadow: 'var(--theme-card-shadow)',
                backdropFilter: 'var(--theme-card-blur, blur(20px))',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <h3 className="text-lg font-semibold text-amber-50 mb-4">Inne Plany</h3>
              {(() => {
                const currentPlanKey = (watch('subscription_plan') || 'FREE').toString().toUpperCase();
                const planEntries = Object.entries(PLAN_DETAILS).filter(([key]) => key !== currentPlanKey);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {planEntries.map(([key, plan]) => (
                      <div
                        key={key}
                        className="border rounded-xl p-4 shadow-light-card dark:shadow-none"
                        style={{
                          borderColor: 'var(--theme-card-border)',
                          backgroundColor: 'var(--input-bg)',
                        }}
                      >
                        <h4 className="text-sm uppercase tracking-wide text-amber-50 font-bold">{plan.label}</h4>
                        <div className="text-xs text-amber-200 mb-3">{plan.price}</div>
                        <ul className="text-xs text-amber-100 space-y-2 list-disc pl-4">
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

        {/* Security Tab - Ważność Badań Sanitarno-Epidemiologicznych */}
        {activeTab === 'security' && (() => {
          const examDate = watch('sanitary_exam_expires_at');
          const examDateObj = examDate ? new Date(examDate) : null;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let statusColor = 'green';
          let statusText = 'Badania aktualne';
          let statusBg = 'rgba(34, 197, 94, 0.1)';
          let statusBorder = 'rgba(34, 197, 94, 0.3)';
          let statusTextColor = 'rgb(34, 197, 94)';
          
          if (examDateObj) {
            examDateObj.setHours(0, 0, 0, 0);
            const daysUntilExpiry = Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry < 0) {
              // Wygasły
              statusColor = 'red';
              statusText = 'Badania nieważne!';
              statusBg = 'rgba(244, 67, 54, 0.1)';
              statusBorder = 'rgba(244, 67, 54, 0.3)';
              statusTextColor = 'rgb(244, 67, 54)';
            } else if (daysUntilExpiry < 30) {
              // Wygasają wkrótce
              statusColor = 'yellow';
              statusText = 'Wygasają wkrótce';
              statusBg = 'rgba(255, 193, 7, 0.1)';
              statusBorder = 'rgba(255, 193, 7, 0.3)';
              statusTextColor = 'rgb(255, 193, 7)';
            }
          } else {
            statusColor = 'gray';
            statusText = 'Brak danych o badaniach';
            statusBg = 'rgba(158, 158, 158, 0.1)';
            statusBorder = 'rgba(158, 158, 158, 0.3)';
            statusTextColor = 'rgb(158, 158, 158)';
          }
          
          return (
            <div 
              className="backdrop-blur-md rounded-xl p-6 shadow-light-card-lg dark:shadow-none dark:border-primary/50 dark:shadow-[0_0_15px_rgba(244,181,36,0.15)]"
              style={{
                borderRadius: 'var(--theme-card-radius, 1.5rem)',
                borderColor: 'var(--theme-card-border)',
                borderWidth: 'var(--theme-card-border-width, 1px)',
                borderStyle: 'solid',
                boxShadow: 'var(--theme-card-shadow)',
                backdropFilter: 'var(--theme-card-blur, blur(20px))',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-amber-50">
                <Calendar className="w-5 h-5" />
                Ważność Badań Sanitarno-Epidemiologicznych
              </h2>
              
              <div className="space-y-6">
                {/* Status Alert */}
                {examDate && (
                  <div 
                    className="p-4 rounded-xl border-2"
                    style={{
                      backgroundColor: statusBg,
                      borderColor: statusBorder,
                      color: statusTextColor,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">{statusText}</span>
                    </div>
                    {examDateObj && (
                      <p className="text-sm mt-2">
                        Data ważności: {examDateObj.toLocaleDateString('pl-PL')}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Date Input */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-100">
                    Data ważności badań sanitarno-epidemiologicznych
                  </label>
                  <input 
                    type="date"
                    {...register('sanitary_exam_expires_at')}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-light-input dark:shadow-none" 
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <p className="text-xs text-amber-200 mt-1">
                    Wprowadź datę wygaśnięcia ważności badań sanitarno-epidemiologicznych
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Save Button */}
        {activeTab !== 'subscription' && activeTab !== 'company' && (
          <div 
            className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            style={{
              borderTopColor: 'var(--theme-card-border)',
              borderTopWidth: '1px',
              borderTopStyle: 'solid',
            }}
          >
            {activeTab === 'profile' && (
              <button
                type="button"
                onClick={handleStartOnboarding}
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

      {/* Onboarding Footer - Krok 4 */}
      <OnboardingFooter
        step={4}
        statusText={legalStatusText}
        iconName="FileText"
        infoText="Ostatni szlif. Wybierz status RHD lub SB i wpisz numer weterynaryjny, aby odblokować sprzedaż i legalne raporty."
        buttonLabel="Zakończ Konfigurację"
      />

      {/* Portal-based Print Area */}
      {publicProfileUrl && (
        <PrintPortal>
          <div className="print-container">
            <style dangerouslySetInnerHTML={{
              __html: `
                @media print {
                  @page { size: A4 portrait; margin: 0; }

                  /* Hide everything in body except the print portal */
                  body > *:not(#print-portal-root) {
                    display: none !important;
                  }

                  /* Ensure the portal root is visible and takes full space */
                  #print-portal-root {
                    display: block !important;
                    position: fixed !important;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: white;
                    z-index: 9999;
                  }

                  .print-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                  }

                  .print-header {
                    font-size: 48pt;
                    font-weight: 800;
                    color: black;
                    margin-bottom: 40px;
                    font-family: sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                  }

                  .qr-wrapper {
                    padding: 20px;
                    background: white;
                  }
                }

                @media screen {
                  .print-container { display: none; }
                }
              `
            }} />

            <h1 className="print-header">ApiaryMind</h1>
            <div className="qr-wrapper">
              <QRCode
                value={publicProfileUrl}
                size={450}
                level="H"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
          </div>
        </PrintPortal>
      )}
    </div>
  );
}
