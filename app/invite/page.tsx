'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { verifyInvitationToken, acceptInvitation } from '@/app/actions/business-team';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle, XCircle, Loader2, AlertCircle, Mail } from 'lucide-react';
import Link from 'next/link';

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error' | 'needs-auth'>('loading');
  const [message, setMessage] = useState<string>('');
  const [invitationEmail, setInvitationEmail] = useState<string>('');

  useEffect(() => {
    // Sprawdź czy jest token w URL lub localStorage (po zalogowaniu)
    const urlToken = searchParams.get('token');
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('pendingInviteToken') : null;
    const tokenToUse = urlToken || storedToken;

    if (!tokenToUse) {
      setStatus('error');
      setMessage('Brak tokenu zaproszenia w linku');
      return;
    }

    // Jeśli użytkownik się właśnie zalogował i mamy token w localStorage
    if (user && storedToken && !urlToken) {
      // Przekieruj z tokenem w URL
      router.replace(`/invite?token=${encodeURIComponent(storedToken)}`);
      return;
    }

    if (tokenToUse) {
      verifyAndAccept(tokenToUse);
    }
  }, [searchParams, user, authLoading, router]);

  const verifyAndAccept = async (tokenToUse: string) => {
    if (!tokenToUse) return;

    // Najpierw weryfikuj token
    const verification = await verifyInvitationToken(tokenToUse);
    
    if (!verification.valid || !verification.invitation) {
      setStatus('error');
      setMessage(verification.error || 'Nieprawidłowy lub wygasły token zaproszenia');
      return;
    }

    setInvitationEmail(verification.invitation.email);

    // Jeśli użytkownik nie jest zalogowany, przekieruj do logowania
    if (!user && !authLoading) {
      setStatus('needs-auth');
      // Zapisz token w localStorage aby po zalogowaniu móc go użyć
      localStorage.setItem('pendingInviteToken', token);
      return;
    }

    // Jeśli użytkownik jest zalogowany, akceptuj zaproszenie
    if (user) {
      setStatus('verifying');
      const result = await acceptInvitation(tokenToUse, user.id);
      
      if (result.success) {
        setStatus('success');
        setMessage('Zaproszenie zostało zaakceptowane! Zostałeś dodany do zespołu.');
        // Usuń token z localStorage
        localStorage.removeItem('pendingInviteToken');
        // Przekieruj po 3 sekundach
        setTimeout(() => {
          router.push('/dashboard/breeder/team');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Wystąpił błąd podczas akceptacji zaproszenia');
      }
    }
  };

  const handleLoginRedirect = () => {
    if (token) {
      router.push(`/login?redirect=/invite?token=${encodeURIComponent(token)}`);
    } else {
      router.push('/login');
    }
  };

  const handleRegisterRedirect = () => {
    if (token) {
      router.push(`/register?redirect=/invite?token=${encodeURIComponent(token)}`);
    } else {
      router.push('/register');
    }
  };

  if (status === 'loading' || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Weryfikowanie zaproszenia...</p>
        </div>
      </div>
    );
  }

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Akceptowanie zaproszenia...</p>
        </div>
      </div>
    );
  }

  if (status === 'needs-auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Zaproszenie do zespołu
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Otrzymałeś zaproszenie do dołączenia do zespołu na adres:
            </p>
            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mt-2">
              {invitationEmail}
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Aby zaakceptować zaproszenie, musisz się najpierw zalogować lub utworzyć konto.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLoginRedirect}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Zaloguj się
            </button>
            <button
              onClick={handleRegisterRedirect}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Utwórz konto
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Po zalogowaniu zaproszenie zostanie automatycznie zaakceptowane
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Zaproszenie zaakceptowane!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {message}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Przekierowywanie do panelu zespołu...
          </p>
          <Link
            href="/dashboard/breeder/team"
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Przejdź teraz
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Błąd zaproszenia
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {message}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Przejdź do panelu
            </Link>
            <Link
              href="/login"
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Ładowanie...</p>
        </div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}

