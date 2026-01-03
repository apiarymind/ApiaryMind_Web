'use client'

import { useState, useEffect, useCallback } from 'react';
import {
  getAllTickets,
  getTicket,
  updateTicketStatus,
  addTicketReply,
  SupportTicket,
  TicketStatus,
  TicketPriority
} from '@/app/actions/support-tickets';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Send, Filter } from 'lucide-react';

export default function AdminSupportClient() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [filterTickets]);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    const result = await getAllTickets();
    if (result.error) {
      setError(result.error);
    } else {
      setTickets(result.data || []);
    }
    setLoading(false);
  };

  const filterTickets = useCallback(() => {
    if (filterStatus === 'all') {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(tickets.filter(t => t.status === filterStatus));
    }
  }, [tickets, filterStatus]);

  const handleViewTicket = async (ticketId: string) => {
    setLoading(true);
    const result = await getTicket(ticketId);
    if (result.data) {
      setSelectedTicket(result.data);
      setAdminNotes(result.data.admin_notes || '');
    } else {
      setError(result.error || 'Nie można załadować zgłoszenia');
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return;

    setLoading(true);
    const result = await updateTicketStatus(selectedTicket.id, status, adminNotes);
    if (result.success) {
      await handleViewTicket(selectedTicket.id);
      await loadTickets();
    } else {
      setError(result.error || 'Błąd podczas aktualizacji statusu');
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
      await loadTickets();
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
    return <div className="text-white/60">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Wszystkie Zgłoszenia</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/60" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Wszystkie</option>
            <option value="OPEN">Otwarte</option>
            <option value="IN_PROGRESS">W trakcie</option>
            <option value="RESOLVED">Rozwiązane</option>
            <option value="CLOSED">Zamknięte</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {filteredTickets.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-white/40" />
          <p className="text-white/60">Brak zgłoszeń.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => handleViewTicket(ticket.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{ticket.title}</h3>
                  <p className="text-sm text-white/60">
                    {ticket.user_name || ticket.user_email || 'Użytkownik'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>
              </div>
              <p className="text-white/70 text-sm mb-3 line-clamp-2">{ticket.description}</p>
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Kategoria: {ticket.category}</span>
                <span>{new Date(ticket.created_at).toLocaleDateString('pl-PL')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brown-900 border border-brown-700 rounded-xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTicket.title}</h3>
                <p className="text-sm text-white/60 mt-1">
                  Od: {selectedTicket.user_name || selectedTicket.user_email || 'Użytkownik'}
                </p>
              </div>
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

            {/* Admin Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/70 mb-1">Notatki Admina</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                placeholder="Wewnętrzne notatki (widoczne tylko dla adminów)..."
              />
            </div>

            {/* Status Actions */}
            <div className="flex gap-2 mb-4">
              {selectedTicket.status !== 'IN_PROGRESS' && (
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-bold text-sm disabled:opacity-50"
                >
                  Oznacz jako W trakcie
                </button>
              )}
              {selectedTicket.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black rounded-lg font-bold text-sm disabled:opacity-50"
                >
                  Oznacz jako Rozwiązane
                </button>
              )}
              {selectedTicket.status !== 'CLOSED' && (
                <button
                  onClick={() => handleUpdateStatus('CLOSED')}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-lg font-bold text-sm disabled:opacity-50"
                >
                  Zamknij
                </button>
              )}
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
                placeholder="Dodaj odpowiedź jako admin..."
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



