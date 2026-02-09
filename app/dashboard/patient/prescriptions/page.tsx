'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchPrescriptions();
  }, [filter]);

  const handleDownloadPDF = async (prescriptionId: string) => {
    try {
      const blob = await api.downloadPrescriptionPDF(prescriptionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recept-${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const params: any = {};
      if (filter === 'active') {
        params.status = 'active';
      } else if (filter === 'completed') {
        params.status = 'completed';
      }
      const response = await api.getPrescriptions(params);
      setPrescriptions(response.prescriptions || []);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C6975]">Recepti</h1>
          <p className="text-gray-600 mt-1">Pregled vaših recepta</p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-[#6BB2A0] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Svi
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'active'
                ? 'bg-[#6BB2A0] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Aktivni
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'completed'
                ? 'bg-[#6BB2A0] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Završeni
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Učitavanje...</div>
        ) : prescriptions.length > 0 ? (
          <div className="space-y-4">
            {prescriptions.map((presc) => (
              <div
                key={presc._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {presc.doctor?.firstName} {presc.doctor?.lastName}
                    </h3>
                    <p className="text-gray-600">{presc.doctor?.specialization}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Izdato: {new Date(presc.issueDate).toLocaleDateString('sr-RS')}
                    </p>
                    {presc.diagnosis && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Dijagnoza:</span> {presc.diagnosis.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        presc.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {presc.status === 'active' ? 'Aktivan' : 'Završen'}
                    </span>
                    <button
                      onClick={() => handleDownloadPDF(presc._id)}
                      className="px-3 py-1 bg-[#2C6975] text-white text-xs rounded-lg hover:bg-[#245a64] transition-colors"
                    >
                      Preuzmi PDF
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Lekovi:</h4>
                  <div className="space-y-3">
                    {presc.medications.map((med: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{med.name}</p>
                            {med.genericName && (
                              <p className="text-sm text-gray-600">{med.genericName}</p>
                            )}
                            <div className="mt-2 space-y-1 text-sm text-gray-700">
                              <p>
                                <span className="font-medium">Doza:</span> {med.dosage?.amount}{' '}
                                {med.dosage?.unit}
                              </p>
                              <p>
                                <span className="font-medium">Učestalost:</span> {med.frequency}
                              </p>
                              <p>
                                <span className="font-medium">Trajanje:</span> {med.duration}
                              </p>
                              {med.instructions && (
                                <p className="text-gray-600 italic">{med.instructions}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {presc.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Napomena:</span> {presc.notes}
                    </p>
                  </div>
                )}

                {presc.ePrescriptionId && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      e-Recept ID: {presc.ePrescriptionId}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nemate recepta</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}