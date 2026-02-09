'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import ReportModal from '@/components/ReportModal';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  const fetchReport = async () => {
    try {
      const response = await api.getSavedReport(params.id as string);
      setReport(response.report);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      alert('Greška pri učitavanju izveštaja');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'generated':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      draft: 'Nacrt',
      generated: 'Generisan',
      archived: 'Arhiviran',
    };
    return labels[status] || status;
  };

  const getReportTypeLabel = (type: string) => {
    const labels: any = {
      appointments: 'Pregledi',
      prescriptions: 'Recepti',
      'lab-results': 'Lab rezultati',
      demographics: 'Demografija',
      financial: 'Finansijski',
      custom: 'Prilagođen',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Učitavanje...</div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Izveštaj nije pronađen</p>
          <button
            onClick={() => router.push('/dashboard/admin/reports')}
            className="mt-4 px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
          >
            Nazad na listu izveštaja
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={() => router.push('/dashboard/admin/reports')}
              className="text-[#6BB2A0] hover:text-[#5a9d8c] mb-4"
            >
              ← Nazad
            </button>
            <h1 className="text-3xl font-bold text-[#2C6975]">{report.title}</h1>
            <p className="text-gray-600 mt-1">{getReportTypeLabel(report.reportType)}</p>
          </div>
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] flex items-center space-x-2"
          >
            <span>✏️</span>
            <span>Izmeni</span>
          </button>
        </div>

        {/* Report Details */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Osnovni podaci</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Naziv</label>
                <p className="text-gray-900 font-medium">{report.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tip izveštaja</label>
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {getReportTypeLabel(report.reportType)}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                  {getStatusLabel(report.status)}
                </span>
              </div>
              {report.createdBy && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Kreirao</label>
                  <p className="text-gray-900">
                    {report.createdBy.firstName} {report.createdBy.lastName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Opis</h2>
              <p className="text-gray-900 whitespace-pre-wrap">{report.description}</p>
            </div>
          )}

          {/* Date Range */}
          {(report.startDate || report.endDate) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Period</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.startDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Od datuma</label>
                    <p className="text-gray-900">
                      {new Date(report.startDate).toLocaleDateString('sr-RS')}
                    </p>
                  </div>
                )}
                {report.endDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Do datuma</label>
                    <p className="text-gray-900">
                      {new Date(report.endDate).toLocaleDateString('sr-RS')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filters */}
          {report.filters && Object.keys(report.filters).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Filteri</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(report.filters, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Data */}
          {report.data && Object.keys(report.data).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Podaci izveštaja</h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(report.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tags */}
          {report.tags && report.tags.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tagovi</h2>
              <div className="flex flex-wrap gap-2">
                {report.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-block px-3 py-1 rounded-full text-sm bg-[#6BB2A0] text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {report.notes && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Napomene</h2>
              <p className="text-gray-900 whitespace-pre-wrap">{report.notes}</p>
            </div>
          )}

          {/* Exported File */}
          {report.exportedFile && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Izvezen fajl</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Naziv fajla</label>
                  <p className="text-gray-900">{report.exportedFile.fileName}</p>
                </div>
                {report.exportedFile.exportedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Datum izvoza</label>
                    <p className="text-gray-900">
                      {new Date(report.exportedFile.exportedAt).toLocaleString('sr-RS')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              {report.createdAt && (
                <div>
                  <label className="font-medium">Kreiran:</label>
                  <p>{new Date(report.createdAt).toLocaleString('sr-RS')}</p>
                </div>
              )}
              {report.updatedAt && (
                <div>
                  <label className="font-medium">Ažuriran:</label>
                  <p>{new Date(report.updatedAt).toLocaleString('sr-RS')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ReportModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={() => {
          fetchReport();
          setEditModalOpen(false);
        }}
        report={report}
      />
    </DashboardLayout>
  );
}
