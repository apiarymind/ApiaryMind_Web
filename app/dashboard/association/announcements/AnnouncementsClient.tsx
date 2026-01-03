'use client'

import { useState, useEffect } from 'react';
import { sendMassNotification, getAssociationNotifications, AssociationNotification } from '@/app/actions/association-notifications';
import { getAssociationMembers } from '@/app/actions/association-members';
import { Send, Mail, Clock, User } from 'lucide-react';

interface AnnouncementsClientProps {
  associationId: string;
  initialNotifications: AssociationNotification[];
  memberCount: number;
}

export default function AnnouncementsClient({ 
  associationId, 
  initialNotifications,
  memberCount 
}: AnnouncementsClientProps) {
  const [notifications, setNotifications] = useState<AssociationNotification[]>(initialNotifications);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: ''
  });

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    const result = await getAssociationNotifications(associationId);
    if (result.error) {
      setError(result.error);
    } else {
      setNotifications(result.data);
    }
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Wypełnij wszystkie pola');
      return;
    }

    setIsSending(true);
    setError(null);

    const result = await sendMassNotification(
      associationId,
      formData.title,
      formData.message
    );

    setIsSending(false);

    if (result.success) {
      setFormData({ title: '', message: '' });
      setShowForm(false);
      await loadNotifications();
      alert(`Powiadomienie wysłane do ${memberCount} członków`);
    } else {
      setError(result.error || 'Błąd wysyłania powiadomienia');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Send Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-amber-950 dark:text-white">Powiadomienia</h2>
          <p className="text-sm text-amber-900/70 dark:text-gray-400 mt-1">
            Wyślij wiadomość do wszystkich {memberCount} członków związku
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {showForm ? 'Anuluj' : 'Wyślij Powiadomienie'}
        </button>
      </div>

      {/* Send Form */}
      {showForm && (
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
          <h3 className="text-lg font-bold text-amber-950 dark:text-white mb-4">Nowe Powiadomienie</h3>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-950 dark:text-white mb-2">
                Tytuł *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="np. Spotkanie koła pszczelarskiego"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-950 dark:text-white mb-2">
                Wiadomość *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Treść powiadomienia..."
                rows={6}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Wysyłanie...' : `Wyślij do ${memberCount} członków`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', message: '' });
                }}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {loading && notifications.length === 0 ? (
          <div className="text-white/60">Ładowanie...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5 text-center text-white/60">
            Brak powiadomień. Kliknij &quot;Wyślij Powiadomienie&quot;, aby wysłać pierwszą wiadomość do członków.
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-950 dark:text-white mb-2">
                    {notification.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                    {notification.author_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{notification.author_name}</span>
                      </div>
                    )}
                    {notification.sent_at && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(notification.sent_at)}</span>
                      </div>
                    )}
                    {notification.recipient_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>Do {notification.recipient_count} członków</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/80 whitespace-pre-wrap">{notification.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


