'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function PatientDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await api.getPatientDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-[#2C6975]">Učitavanje...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C6975] mb-2">Dashboard</h1>
          <p className="text-gray-600">Dobrodošli na vaš pacijent portal</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Zakazani pregledi</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.summary?.totalAppointments || 0}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktivni recepti</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.summary?.activePrescriptions || 0}
                </p>
              </div>
              <div className="text-4xl">💊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nepročitane poruke</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.unreadMessagesCount || 0}
                </p>
              </div>
              <div className="text-4xl">💬</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lab rezultati</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.summary?.recentLabResults || 0}
                </p>
              </div>
              <div className="text-4xl">🔬</div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#2C6975]">Predstojeći pregledi</h2>
            <Link
              href="/dashboard/patient/appointments"
              className="text-sm text-[#6BB2A0] hover:underline"
            >
              Vidi sve →
            </Link>
          </div>
          <div className="p-6">
            {dashboardData?.upcomingAppointments?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingAppointments.map((apt: any) => (
                  <div
                    key={apt._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {apt.doctor?.firstName} {apt.doctor?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{apt.doctor?.specialization}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(apt.date).toLocaleDateString('sr-RS')} u {apt.startTime}
                        </p>
                        {apt.reason && (
                          <p className="text-sm text-gray-600 mt-1">Razlog: {apt.reason}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            apt.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {apt.status === 'confirmed' ? 'Potvrđen' : 'Zakazan'}
                        </span>
                        {apt.remindersSent > 0 && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                            Podsetnik poslat
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nemate zakazanih pregleda</p>
            )}
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#2C6975]">Aktivni recepti</h2>
            <Link
              href="/dashboard/patient/prescriptions"
              className="text-sm text-[#6BB2A0] hover:underline"
            >
              Vidi sve →
            </Link>
          </div>
          <div className="p-6">
            {dashboardData?.recentPrescriptions?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentPrescriptions.map((presc: any) => (
                  <div
                    key={presc._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {presc.doctor?.firstName} {presc.doctor?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Izdato: {new Date(presc.issueDate).toLocaleDateString('sr-RS')}
                        </p>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Lekovi:</p>
                          <ul className="text-sm text-gray-600 mt-1">
                            {presc.medications?.slice(0, 2).map((med: any, idx: number) => (
                              <li key={idx}>• {med.name} - {med.frequency}</li>
                            ))}
                            {presc.medications?.length > 2 && (
                              <li className="text-gray-500">+ {presc.medications.length - 2} više</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        Aktivno
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nemate aktivnih recepta</p>
            )}
          </div>
        </div>

        {/* Medical Alerts */}
        {dashboardData?.activeAlerts?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">⚠️ Medicinska upozorenja</h2>
            <div className="space-y-2">
              {dashboardData.activeAlerts.map((alert: any, idx: number) => (
                <div key={idx} className="text-sm text-yellow-700">
                  • {alert.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}