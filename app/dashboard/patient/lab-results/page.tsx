'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

export default function PatientLabResultsPage() {
  const [labResults, setLabResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  useEffect(() => {
    fetchLabResults();
  }, [filter]);

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
      if (filter === 'completed') {
        params.status = 'completed';
      } else if (filter === 'pending') {
        params.status = 'ordered';
      }
      const response = await api.getLabResults(params);
      setLabResults(response.labResults || []);
    } catch (error) {
      console.error('Failed to fetch lab results:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C6975]">Laboratorijski rezultati</h1>
          <p className="text-gray-600 mt-1">Pregled vaših laboratorijskih rezultata</p>
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
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'completed'
                ? 'bg-[#6BB2A0] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Završeni
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending'
                ? 'bg-[#6BB2A0] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Na čekanju
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Učitavanje...</div>
        ) : labResults.length > 0 ? (
          <div className="space-y-4">
            {labResults.map((result) => (
              <div
                key={result._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{result.testName}</h3>
                    <p className="text-gray-600 capitalize">{result.testType}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Naručio: {result.orderedBy?.firstName} {result.orderedBy?.lastName} •{' '}
                      {new Date(result.orderedDate).toLocaleDateString('sr-RS')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Broj narudžbe: {result.orderNumber}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        result.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {result.status === 'completed' && 'Završeno'}
                      {result.status === 'in-progress' && 'U toku'}
                      {result.status === 'ordered' && 'Naručeno'}
                      {result.status === 'collected' && 'Uzeto'}
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
            <p className="text-gray-500 text-lg">Nemate laboratorijskih rezultata</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}