'use client'

import { useState, useEffect } from 'react';
import {
  createTicket,
  getUserTickets,
  getTicket,
  addTicketReply,
  SupportTicket,
  TicketStatus,
  TicketPriority
} from '@/app/actions/support-tickets';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react';

export default function SupportTicketsClient() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('technical');
  const [formPriority, setFormPriority] = useState<TicketPriority>('MEDIUM');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    const result = await getUserTickets();
    if (result.error) {
      setError(result.error);
    } else {
      setTickets(result.data || []);
    }
    setLoading(false);
  };

  const handleCreateTicket = async () => {
    if (!formTitle || !formDescription) {
      setError('Tytuł i opis są wymagane');
      return;
    }

    setLoading(true);
    setError(null);
    const result = await createTicket(formTitle, formDescription, formCategory, formPriority);
    if (result.success) {
      setIsModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      setFormCategory('technical');
      setFormPriority('MEDIUM');
      await loadTickets();
    } else {
      setError(result.error || 'Błąd podczas tworzenia zgłoszenia');
    }
    setLoading(false);
  };

  const handleViewTicket = async (ticketId: string) => {
    setLoading(true);
    const result = await getTicket(ticketId);
    if (result.data) {
      setSelectedTicket(result.data);
    } else {
      setError(result.error || 'Nie można załadować zgłoszenia');
    }
    setLoading(false);
  };

  const handleAddReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setLoading(true);
    const result = await addTicketReply(selectedTicket.id, replyMessage);
    if (result.success) {
      setReplyMessage('');
      await handleViewTicket(selectedTicket.id);
    } else {
      setError(result.error || 'Błąd podczas dodawania odpowiedzi');
    }
    setLoading(false);
  };

  const getStatusBadge = (status: TicketStatus) => {
    const badges = {
      OPEN: { icon: Clock, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Otwarte' },
      IN_PROGRESS: { icon: AlertCircle, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'W trakcie' },
      RESOLVED: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Rozwiązane' },
      CLOSED: { icon: XCircle, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Zamknięte' }
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const badges = {
      LOW: 'bg-gray-500/20 text-gray-400',
      MEDIUM: 'bg-blue-500/20 text-blue-400',
      HIGH: 'bg-orange-500/20 text-orange-400',
      URGENT: 'bg-red-500/20 text-red-400'
    };
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${badges[priority]}`}>
        {priority}
      </span>
    );
  };

  if (loading && tickets.length === 0) {
    return <div className="text-gray-700 dark:text-white/60">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Moje Zgłoszenia</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Nowe Zgłoszenie
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-white dark:bg-primary/15 border border-gray-300 dark:border-primary/30 rounded-xl p-8 text-center shadow-lg dark:shadow-none">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-white/40" />
          <p className="text-gray-800 dark:text-white/60">Nie masz jeszcze żadnych zgłoszeń.</p>
          <p className="text-gray-600 dark:text-white/40 text-sm mt-2">Utwórz pierwsze zgłoszenie, aby uzyskać pomoc.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-white dark:bg-primary/15 border border-gray-300 dark:border-primary/30 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-md dark:shadow-none"
              onClick={() => handleViewTicket(ticket.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{ticket.title}</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>
              </div>
              <p className="text-gray-700 dark:text-white/70 text-sm mb-3 line-clamp-2">{ticket.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/50">
                <span>Kategoria: {ticket.category}</span>
                <span>{new Date(ticket.created_at).toLocaleDateString('pl-PL')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brown-900 border border-brown-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Nowe Zgłoszenie</h3>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Tytuł</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  placeholder="Krótki opis problemu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Kategoria</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="technical">Problem techniczny</option>
                  <option value="billing">Płatności</option>
                  <option value="feature">Prośba o funkcję</option>
                  <option value="other">Inne</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Priorytet</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                  className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="LOW">Niski</option>
                  <option value="MEDIUM">Średni</option>
                  <option value="HIGH">Wysoki</option>
                  <option value="URGENT">Pilny</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Opis</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={6}
                  className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  placeholder="Szczegółowy opis problemu lub pytania..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Anuluj
                </button>
                <button onClick={handleCreateTicket} className="btn-primary" disabled={loading}>
                  {loading ? 'Tworzenie...' : 'Utwórz Zgłoszenie'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brown-900 border border-brown-700 rounded-xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{selectedTicket.title}</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              {getStatusBadge(selectedTicket.status)}
              {getPriorityBadge(selectedTicket.priority)}
            </div>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-white/80 whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>

            {/* Replies */}
            <div className="space-y-4 mb-4">
              <h4 className="font-bold text-white">Odpowiedzi</h4>
              {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                selectedTicket.replies.map(reply => (
                  <div
                    key={reply.id}
                    className={`p-4 rounded-lg ${
                      reply.is_admin
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white">
                        {reply.is_admin ? '👨‍💼 Admin' : reply.user_name || 'Użytkownik'}
                      </span>
                      <span className="text-xs text-white/50">
                        {new Date(reply.created_at).toLocaleString('pl-PL')}
                      </span>
                    </div>
                    <p className="text-white/80 whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-white/50 text-sm">Brak odpowiedzi</p>
              )}
            </div>

            {/* Reply Form */}
            <div className="border-t border-white/10 pt-4">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={3}
                className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white mb-2"
                placeholder="Dodaj odpowiedź..."
              />
              <button
                onClick={handleAddReply}
                disabled={loading || !replyMessage.trim()}
                className="btn-primary flex items-center gap-2"
              >
                <Send size={16} />
                Wyślij Odpowiedź
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}










