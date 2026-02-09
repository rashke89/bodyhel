'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientMessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await api.getMessages();
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !content) return;

    try {
      await api.sendMessage({
        recipient,
        subject,
        content,
        type: 'message',
      });
      setShowCompose(false);
      setRecipient('');
      setSubject('');
      setContent('');
      fetchMessages();
    } catch (error: any) {
      alert(error.message || 'Failed to send message');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markAsRead(id);
      fetchMessages();
      if (selectedMessage?._id === id) {
        setSelectedMessage({ ...selectedMessage, read: true });
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#2C6975]">Poruke</h1>
            <p className="text-gray-600 mt-1">Komunikacija sa vašim lekarima</p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="bg-[#6BB2A0] text-white px-6 py-2 rounded-lg hover:bg-[#5a9d8c] transition-colors"
          >
            + Nova poruka
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Primljene poruke</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Učitavanje...</div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.read) {
                        handleMarkAsRead(msg._id);
                      }
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !msg.read ? 'bg-blue-50' : ''
                    } ${selectedMessage?._id === msg._id ? 'bg-[#CDE0C9]' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {msg.sender?.firstName} {msg.sender?.lastName}
                      </h3>
                      {!msg.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    {msg.subject && (
                      <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(msg.createdAt).toLocaleDateString('sr-RS', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">Nema poruka</div>
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            {selectedMessage ? (
              <div className="p-6">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">
                        {selectedMessage.subject || 'Bez naslova'}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Od: {selectedMessage.sender?.firstName} {selectedMessage.sender?.lastName}
                        {selectedMessage.sender?.specialization && (
                          <span className="text-gray-500">
                            {' '}
                            • {selectedMessage.sender.specialization}
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedMessage.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : selectedMessage.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedMessage.priority === 'urgent' && 'Hitno'}
                      {selectedMessage.priority === 'high' && 'Visok prioritet'}
                      {selectedMessage.priority === 'normal' && 'Normalno'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedMessage.createdAt).toLocaleDateString('sr-RS', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Prilozi:</h3>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment: any, idx: number) => (
                        <a
                          key={idx}
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-[#6BB2A0] hover:underline"
                        >
                          <span>📎</span>
                          <span>{attachment.fileName || 'Prilog'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <p>Izaberite poruku za pregled</p>
              </div>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-[#2C6975]">Nova poruka</h2>
                <button
                  onClick={() => setShowCompose(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primaoc (Email ili ID doktora)
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                    placeholder="doktor@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Naslov (opciono)
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poruka *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                    placeholder="Napišite vašu poruku..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
                  >
                    Pošalji
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}