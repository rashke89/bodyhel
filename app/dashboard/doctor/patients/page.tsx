'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DoctorPatientsPage() {
  const [ehrs, setEhrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await api.searchEHRs();
      setEhrs(response.ehrs || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    if (!search) return ehrs;
    const term = search.toLowerCase();
    return ehrs.filter((ehr) => {
      const patient = ehr.patient || {};
      const name = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
      const email = (patient.email || '').toLowerCase();
      const patientId = (patient.patientId || '').toLowerCase();
      return name.includes(term) || email.includes(term) || patientId.includes(term);
    });
  }, [ehrs, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#2C6975]">Pacijenti</h1>
            <p className="text-gray-600 mt-1">Pregled pacijenata i pristup EHR kartonima</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex space-x-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraži pacijente (ime, email, ID)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Učitavanje...</div>
        ) : filteredPatients.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pacijent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dijagnoze</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upozorenja</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcije</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((ehr) => (
                    <tr key={ehr._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {ehr.patient?.firstName} {ehr.patient?.lastName}
                        </div>
                        {ehr.patient?.patientId && (
                          <div className="text-sm text-gray-500">ID: {ehr.patient.patientId}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ehr.patient?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {ehr.diagnoses?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            (ehr.medicalAlerts?.filter((a: any) => a.active).length || 0) > 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {ehr.medicalAlerts?.filter((a: any) => a.active).length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/dashboard/doctor/patients/${ehr.patient?._id}`}
                          className="px-3 py-1 bg-[#6BB2A0] text-white rounded hover:bg-[#5a9d8c]"
                        >
                          Otvori EHR
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nema pacijenata za prikaz</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
