'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import AppointmentModal from '@/components/AppointmentModal';

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchAppointment();
    }
  }, [params.id]);

  const fetchAppointment = async () => {
    try {
      const response = await api.getAppointment(params.id as string);
      setAppointment(response.appointment);
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
      alert('Greška pri učitavanju pregleda');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      scheduled: 'Zakazan',
      confirmed: 'Potvrđen',
      'in-progress': 'U toku',
      completed: 'Završen',
      cancelled: 'Otkazan',
      'no-show': 'Nije se pojavio',
      rescheduled: 'Premešten',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Učitavanje...</div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Pregled nije pronađen</p>
          <button
            onClick={() => router.push('/dashboard/admin/appointments')}
            className="mt-4 px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
          >
            Nazad na listu pregleda
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
              onClick={() => router.push('/dashboard/admin/appointments')}
              className="text-[#6BB2A0] hover:text-[#5a9d8c] mb-4"
            >
              ← Nazad
            </button>
            <h1 className="text-3xl font-bold text-[#2C6975]">Pregled</h1>
            <p className="text-gray-600 mt-1">
              {new Date(appointment.date).toLocaleDateString('sr-RS', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] flex items-center space-x-2"
          >
            <span>✏️</span>
            <span>Izmeni</span>
          </button>
        </div>

        {/* Appointment Details */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Osnovni podaci</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Pacijent</label>
                <p className="text-gray-900 font-medium">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </p>
                {appointment.patient?.patientId && (
                  <p className="text-sm text-gray-500">ID: {appointment.patient.patientId}</p>
                )}
                {appointment.patient?.email && (
                  <p className="text-sm text-gray-500">{appointment.patient.email}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Doktor</label>
                <p className="text-gray-900 font-medium">
                  {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                </p>
                {appointment.doctor?.specialization && (
                  <p className="text-sm text-gray-500">{appointment.doctor.specialization}</p>
                )}
                {appointment.doctor?.email && (
                  <p className="text-sm text-gray-500">{appointment.doctor.email}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Datum i vreme</label>
                <p className="text-gray-900">
                  {new Date(appointment.date).toLocaleDateString('sr-RS')} u {appointment.startTime} - {appointment.endTime}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Trajanje</label>
                <p className="text-gray-900">{appointment.duration} minuta</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tip pregleda</label>
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                  {appointment.appointmentType}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Kategorija</label>
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 capitalize">
                  {appointment.appointmentCategory === 'ambulatory' ? 'Ambulantno' : 'Stacionarno'}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                  {getStatusLabel(appointment.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Reason */}
          {appointment.reason && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Razlog pregleda</h2>
              <p className="text-gray-900 whitespace-pre-wrap">{appointment.reason}</p>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Napomene</h2>
              <p className="text-gray-900 whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}

          {/* Inpatient Details */}
          {appointment.appointmentCategory === 'inpatient' && (appointment.roomNumber || appointment.bedNumber) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Stacionarno lečenje</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointment.roomNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Broj sobe</label>
                    <p className="text-gray-900">{appointment.roomNumber}</p>
                  </div>
                )}
                {appointment.bedNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Broj kreveta</label>
                    <p className="text-gray-900">{appointment.bedNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rescheduling Info */}
          {appointment.rescheduledFrom && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informacije o premeštanju</h2>
              <p className="text-gray-900">
                Premešten sa: {new Date(appointment.rescheduledFrom).toLocaleString('sr-RS')}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              {appointment.createdAt && (
                <div>
                  <label className="font-medium">Kreiran:</label>
                  <p>{new Date(appointment.createdAt).toLocaleString('sr-RS')}</p>
                </div>
              )}
              {appointment.updatedAt && (
                <div>
                  <label className="font-medium">Ažuriran:</label>
                  <p>{new Date(appointment.updatedAt).toLocaleString('sr-RS')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AppointmentModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={() => {
          fetchAppointment();
          setEditModalOpen(false);
        }}
        appointment={appointment}
      />
    </DashboardLayout>
  );
}
