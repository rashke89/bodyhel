'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

export default function DoctorLabResultsPage() {
  const [labResults, setLabResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLabResults();
  }, [statusFilter, typeFilter]);

  const handleDownloadPDF = async (labResultId: string) => {
    try {
      const blob = await api.downloadLabResultPDF(labResultId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nalaz-${labResultId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const fetchLabResults = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.testType = typeFilter;
      const response = await api.getLabResults(params);
      setLabResults(response.labResults || []);
    } catch (error) {
      console.error('Failed to fetch lab results:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLabResults = useMemo(() => {
    if (!search) return labResults;
    const term = search.toLowerCase();
    return labResults.filter((result) => {
      const patientName = `${result.patient?.firstName || ''} ${result.patient?.lastName || ''}`.toLowerCase();
      const patientId = (result.patient?.patientId || '').toLowerCase();
      const orderNumber = (result.orderNumber || '').toLowerCase();
      const testName = (result.testName || '').toLowerCase();
      return (
        patientName.includes(term) ||
        patientId.includes(term) ||
        orderNumber.includes(term) ||
        testName.includes(term)
      );
    });
  }, [labResults, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C6975]">Lab rezultati</h1>
          <p className="text-gray-600 mt-1">Pregled svih laboratorijskih nalaza pacijenata</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              >
                <option value="">Svi</option>
                <option value="ordered">Naručeno</option>
                <option value="collected">Uzeto</option>
                <option value="in-progress">U toku</option>
                <option value="completed">Završeno</option>
                <option value="cancelled">Otkazano</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tip testa</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              >
                <option value="">Svi</option>
                <option value="blood">Krv</option>
                <option value="urine">Urin</option>
                <option value="imaging">Imaging</option>
                <option value="pathology">Patologija</option>
                <option value="microbiology">Mikrobiologija</option>
                <option value="other">Ostalo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pretraga</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pacijent, broj naloga, test"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Učitavanje...</div>
        ) : filteredLabResults.length > 0 ? (
          <div className="space-y-4">
            {filteredLabResults.map((result) => (
              <div
                key={result._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{result.testName}</h3>
                    <p className="text-gray-600 capitalize">{result.testType}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Pacijent: {result.patient?.firstName} {result.patient?.lastName} •{' '}
                      {result.patient?.patientId || '-'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Naručio: {result.orderedBy?.firstName} {result.orderedBy?.lastName} •{' '}
                      {new Date(result.orderedDate).toLocaleDateString('sr-RS')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Broj naloga: {result.orderNumber}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        result.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : result.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {result.status === 'completed' && 'Završeno'}
                      {result.status === 'in-progress' && 'U toku'}
                      {result.status === 'ordered' && 'Naručeno'}
                      {result.status === 'collected' && 'Uzeto'}
                      {result.status === 'cancelled' && 'Otkazano'}
                    </span>
                    {result.status === 'completed' && (
                      <button
                        onClick={() => handleDownloadPDF(result._id)}
                        className="px-3 py-1 bg-[#2C6975] text-white text-xs rounded-lg hover:bg-[#245a64] transition-colors"
                      >
                        Preuzmi PDF
                      </button>
                    )}
                  </div>
                </div>

                {result.status === 'completed' && result.results && result.results.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Rezultati:</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Parametar
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Vrednost
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Referentni opseg
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {result.results.map((res: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {res.parameter}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {res.value} {res.unit}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {res.referenceRange || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {res.flag && (
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                      res.flag === 'normal'
                                        ? 'bg-green-100 text-green-800'
                                        : res.flag === 'high' || res.flag === 'low'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {res.flag === 'normal' && 'Normalno'}
                                    {res.flag === 'high' && 'Povišeno'}
                                    {res.flag === 'low' && 'Nisko'}
                                    {res.flag === 'critical' && 'Kritično'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {result.interpretation && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Interpretacija:</h4>
                    <p className="text-sm text-gray-700">{result.interpretation}</p>
                    {result.reviewedBy && (
                      <p className="text-xs text-gray-500 mt-2">
                        Pregledao: {result.reviewedBy.firstName} {result.reviewedBy.lastName} •{' '}
                        {new Date(result.reviewedAt).toLocaleDateString('sr-RS')}
                      </p>
                    )}
                  </div>
                )}

                {result.findings && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Nalaz:</h4>
                    <p className="text-sm text-gray-700">{result.findings}</p>
                  </div>
                )}

                {result.attachments && result.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Prilozi:</h4>
                    <div className="space-y-2">
                      {result.attachments.map((attachment: any, idx: number) => (
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
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nema laboratorijskih rezultata</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
