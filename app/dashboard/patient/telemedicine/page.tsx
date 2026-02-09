'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function PatientTelemedicinePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.getTelemedicineSessions();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C6975]">Telemedicina</h1>
          <p className="text-gray-600 mt-1">Video i audio konsultacije sa vašim lekarima</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Učitavanje...</div>
        ) : sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {session.doctor?.firstName} {session.doctor?.lastName}
                    </h3>
                    <p className="text-gray-600">{session.doctor?.specialization}</p>
                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Tip sesije:</span>{' '}
                        {session.sessionType === 'video' && '📹 Video'}
                        {session.sessionType === 'audio' && '🎤 Audio'}
                        {session.sessionType === 'chat' && '💬 Chat'}
                      </p>
                      <p>
                        <span className="font-medium">Zakazano za:</span>{' '}
                        {new Date(session.scheduledStart).toLocaleDateString('sr-RS', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {session.actualStart && (
                        <p>
                          <span className="font-medium">Trajanje:</span>{' '}
                          {session.duration ? `${Math.floor(session.duration / 60)} min` : '-'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        session.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : session.status === 'scheduled'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {session.status === 'scheduled' && 'Zakazano'}
                      {session.status === 'in-progress' && 'U toku'}
                      {session.status === 'completed' && 'Završeno'}
                      {session.status === 'cancelled' && 'Otkazano'}
                    </span>
                    {session.status === 'scheduled' && (
                      <Link
                        href={`/dashboard/patient/telemedicine/${session._id}`}
                        className="px-4 py-2 text-sm bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] text-center"
                      >
                        Pridruži se
                      </Link>
                    )}
                    {session.status === 'in-progress' && (
                      <Link
                        href={`/dashboard/patient/telemedicine/${session._id}`}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                      >
                        Nastavi sesiju
                      </Link>
                    )}
                    {session.status === 'completed' && session.recordingUrl && (
                      <a
                        href={session.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center"
                      >
                        Pregledaj snimak
                      </a>
                    )}
                  </div>
                </div>

                {session.summary && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Sažetak:</h4>
                    <p className="text-sm text-gray-700">{session.summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nemate telemedicina sesija</p>
            <p className="text-gray-400 text-sm mt-2">
              Telemedicina sesije se kreiraju automatski kada zakazete pregled tipa "telemedicine"
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}