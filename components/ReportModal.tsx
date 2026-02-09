'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  report?: any;
}

export default function ReportModal({ isOpen, onClose, onSave, report }: ReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    reportType: 'appointments',
    description: '',
    startDate: '',
    endDate: '',
    filters: {} as any,
    tags: [] as string[],
    notes: '',
    status: 'draft' as 'draft' | 'generated' | 'archived',
  });

  useEffect(() => {
    if (report) {
      setFormData({
        title: report.title || '',
        reportType: report.reportType || 'appointments',
        description: report.description || '',
        startDate: report.startDate ? new Date(report.startDate).toISOString().split('T')[0] : '',
        endDate: report.endDate ? new Date(report.endDate).toISOString().split('T')[0] : '',
        filters: report.filters || {},
        tags: report.tags || [],
        notes: report.notes || '',
        status: report.status || 'draft',
      });
    } else {
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      setFormData({
        title: '',
        reportType: 'appointments',
        description: '',
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        filters: {},
        tags: [],
        notes: '',
        status: 'draft',
      });
    }
  }, [report, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reportData = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      if (report) {
        await api.updateSavedReport(report._id, reportData);
      } else {
        await api.createSavedReport(reportData);
      }
      onSave();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Greška pri čuvanju izveštaja');
    } finally {
      setLoading(false);
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#2C6975]">
            {report ? 'Izmeni izveštaj' : 'Kreiraj novi izveštaj'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Osnovni podaci</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naziv izveštaja *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  placeholder="npr. Mesečni izveštaj o pregledima"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tip izveštaja *
                </label>
                <select
                  required
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                >
                  <option value="appointments">Pregledi</option>
                  <option value="prescriptions">Recepti</option>
                  <option value="lab-results">Lab rezultati</option>
                  <option value="demographics">Demografija</option>
                  <option value="financial">Finansijski</option>
                  <option value="custom">Prilagođen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  placeholder="Kratak opis izveštaja..."
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Od datuma
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Do datuma
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
            >
              <option value="draft">Nacrt</option>
              <option value="generated">Generisan</option>
              <option value="archived">Arhiviran</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tagovi
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#6BB2A0] text-white"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="ml-2 text-white hover:text-gray-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Dodaj tag (Enter za dodavanje)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Napomene
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              placeholder="Dodatne napomene o izveštaju..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] disabled:opacity-50"
            >
              {loading ? 'Čuvanje...' : report ? 'Sačuvaj izmene' : 'Kreiraj izveštaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
