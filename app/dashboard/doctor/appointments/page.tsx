'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate && filters.endDate) {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      }

      const response = await api.getAppointments(params);
      const data = response.appointments || [];
      setAppointments(data);

      const total = data.length;
      const byStatus: any = {};
      data.forEach((apt: any) => {
        byStatus[apt.status] = (byStatus[apt.status] || 0) + 1;
      });

      setStats({ total, byStatus });
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateAppointment(id, { status: newStatus });
      fetchAppointments();
    } catch (error: any) {
      alert(error.message || 'Failed to update appointment');
    }
  };

  const filteredAppointments = useMemo(() => {
    if (!search) return appointments;
    const term = search.toLowerCase();
    return appointments.filter((apt) => {
      const patientName = `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.toLowerCase();
      const patientId = (apt.patient?.patientId || '').toLowerCase();
      return patientName.includes(term) || patientId.includes(term);
    });
  }, [appointments, search]);

  const groupedByStatus = useMemo(() => {
    const groups: Record<string, any[]> = {
      scheduled: [],
      confirmed: [],
      "in-progress": [],
      completed: [],
      cancelled: [],
      "no-show": [],
      rescheduled: [],
    };
    filteredAppointments.forEach((apt) => {
      const status = apt.status || "scheduled";
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(apt);
    });
    return groups;
  }, [filteredAppointments]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#2C6975]">Moji pregledi</h1>
            <p className="text-gray-600 mt-1">Pregled i upravljanje vašim pregledima</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-sm rounded-lg border ${
                viewMode === "table"
                  ? "bg-[#6BB2A0] text-white border-[#6BB2A0]"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Tabela
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 text-sm rounded-lg border ${
                viewMode === "kanban"
                  ? "bg-[#6BB2A0] text-white border-[#6BB2A0]"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Kanban
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ukupno pregleda</p>
                  <p className="text-2xl font-bold text-[#2C6975]">{stats.total}</p>
                </div>
                <div className="text-4xl">📅</div>
              </div>
            </div>
            {Object.entries(stats.byStatus || {}).map(([status, count]) => (
              <div key={status} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 capitalize">{status}</p>
                    <p className="text-2xl font-bold text-gray-700">{count as number}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              >
                <option value="">Svi</option>
                <option value="scheduled">Zakazan</option>
                <option value="confirmed">Potvrđen</option>
                <option value="in-progress">U toku</option>
                <option value="completed">Završen</option>
                <option value="cancelled">Otkazan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Od datuma</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Do datuma</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pretraga pacijenata</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ime, prezime ili ID pacijenta"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              />
            </div>
            <div className="md:col-span-3 lg:col-span-5 flex items-end">
              <button
                onClick={() => {
                  setFilters({ status: '', startDate: '', endDate: '' });
                  setSearch('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Obriši filtere
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Učitavanje...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nema pregleda za prikaz</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum i vreme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pacijent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razlog</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcije</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(apt.date).toLocaleDateString('sr-RS', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {apt.startTime} - {apt.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {apt.patient?.firstName} {apt.patient?.lastName}
                        </div>
                        {apt.patient?.patientId && (
                          <div className="text-sm text-gray-500">ID: {apt.patient.patientId}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                          {apt.appointmentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            apt.status === 'scheduled'
                              ? 'bg-yellow-100 text-yellow-800'
                              : apt.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : apt.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800'
                              : apt.status === 'completed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {apt.status === 'scheduled' && 'Zakazan'}
                          {apt.status === 'confirmed' && 'Potvrđen'}
                          {apt.status === 'in-progress' && 'U toku'}
                          {apt.status === 'completed' && 'Završen'}
                          {apt.status === 'cancelled' && 'Otkazan'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {apt.reason || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <select
                            value={apt.status}
                            onChange={(e) => handleUpdateStatus(apt._id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-[#6BB2A0]"
                          >
                            <option value="scheduled">Zakazan</option>
                            <option value="confirmed">Potvrđen</option>
                            <option value="in-progress">U toku</option>
                            <option value="completed">Završen</option>
                            <option value="cancelled">Otkazan</option>
                          </select>
                          {apt.patient && (
                            <Link
                              href={`/dashboard/doctor/patients/${apt.patient._id}`}
                              className="px-2 py-1 text-xs bg-[#6BB2A0] text-white rounded hover:bg-[#5a9d8c]"
                            >
                              EHR
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "scheduled", label: "Zakazani", color: "border-yellow-300" },
                { key: "confirmed", label: "Potvrđeni", color: "border-green-300" },
                { key: "in-progress", label: "U toku", color: "border-blue-300" },
                { key: "completed", label: "Završeni", color: "border-gray-300" },
                { key: "cancelled", label: "Otkazani", color: "border-red-300" },
              ].map((column) => (
                <div
                  key={column.key}
                  className={`bg-gray-50 rounded-lg border ${column.color} flex flex-col max-h-[480px]`}
                >
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700 uppercase">
                      {column.label}
                    </p>
                    <span className="text-xs text-gray-500">
                      {groupedByStatus[column.key]?.length || 0}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {groupedByStatus[column.key]?.map((apt) => (
                      <div
                        key={apt._id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {apt.patient?.firstName} {apt.patient?.lastName}
                            </p>
                            {apt.patient?.patientId && (
                              <p className="text-xs text-gray-500">
                                ID: {apt.patient.patientId}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <p>
                              {new Date(apt.date).toLocaleDateString("sr-RS", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                            <p>
                              {apt.startTime} - {apt.endTime}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {apt.reason || "Bez dodatnog opisa"}
                        </p>
                        <div className="flex items-center justify-between space-x-2 pt-1">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] capitalize">
                            {apt.appointmentType}
                          </span>
                          <div className="flex space-x-1">
                            {apt.status !== "scheduled" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStatus(apt._id, "scheduled")
                                }
                                className="px-2 py-1 text-[11px] border border-gray-200 rounded hover:bg-gray-50"
                              >
                                Zakazan
                              </button>
                            )}
                            {apt.status !== "confirmed" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStatus(apt._id, "confirmed")
                                }
                                className="px-2 py-1 text-[11px] border border-gray-200 rounded hover:bg-gray-50"
                              >
                                Potvrdi
                              </button>
                            )}
                            {apt.status !== "in-progress" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStatus(apt._id, "in-progress")
                                }
                                className="px-2 py-1 text-[11px] border border-gray-200 rounded hover:bg-gray-50"
                              >
                                U toku
                              </button>
                            )}
                            {apt.status !== "completed" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStatus(apt._id, "completed")
                                }
                                className="px-2 py-1 text-[11px] border border-gray-200 rounded hover:bg-gray-50"
                              >
                                Završi
                              </button>
                            )}
                          </div>
                        </div>
                        {apt.patient && (
                          <div className="pt-1">
                            <Link
                              href={`/dashboard/doctor/patients/${apt.patient._id}`}
                              className="inline-flex items-center text-[11px] text-[#2C6975] hover:underline"
                            >
                              Otvori EHR →
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!groupedByStatus[column.key] ||
                      groupedByStatus[column.key].length === 0) && (
                      <p className="text-xs text-gray-400 text-center py-4">
                        Nema pregleda u ovoj koloni.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
