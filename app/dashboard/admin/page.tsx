'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await api.getAdminDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C6975]">Admin Dashboard</h1>
          <p className="text-gray-600">Pregled sistema</p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ukupno korisnika</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.users?.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Aktivnih: {dashboardData?.users?.active || 0}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pacijenti</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.users?.patients || 0}
                </p>
              </div>
              <div className="text-4xl">🏥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Doktori</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.users?.doctors || 0}
                </p>
              </div>
              <div className="text-4xl">👨‍⚕️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Današnji pregledi</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.appointments?.today || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ukupno: {dashboardData?.appointments?.total || 0}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">EHR zapisa</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.ehrs?.total || 0}
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recepta</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.prescriptions?.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Aktivnih: {dashboardData?.prescriptions?.active || 0}
                </p>
              </div>
              <div className="text-4xl">💊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lab rezultata</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.labResults?.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Na čekanju: {dashboardData?.labResults?.pending || 0}
                </p>
              </div>
              <div className="text-4xl">🔬</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nepročitanih poruka</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {dashboardData?.messages?.unread || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ukupno: {dashboardData?.messages?.total || 0}
                </p>
              </div>
              <div className="text-4xl">💬</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-[#2C6975] mb-4">Brze akcije</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/admin/users"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Upravljaj korisnicima</h3>
              <p className="text-sm text-gray-600">Dodaj, izmeni ili deaktiviraj korisnike</p>
            </Link>
            <Link
              href="/dashboard/admin/reports"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Izveštaji</h3>
              <p className="text-sm text-gray-600">Pregled statistike i izveštaja</p>
            </Link>
            <Link
              href="/dashboard/admin/audit-logs"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Audit logovi</h3>
              <p className="text-sm text-gray-600">Pregled aktivnosti sistema</p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}