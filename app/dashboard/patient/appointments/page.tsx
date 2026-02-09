'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  useEffect(() => {
    if (showBookingModal) {
      fetchDoctors();
    }
  }, [showBookingModal]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailability();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchAppointments = async () => {
    try {
      const params: any = {};
      if (filter === 'upcoming') {
        params.startDate = new Date().toISOString();
      } else if (filter === 'past') {
        params.endDate = new Date().toISOString();
      }
      const response = await api.getAppointments(params);
      setAppointments(response.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.getPatientDoctors();
      setDoctors(response.doctors || []);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await api.getDoctorAvailability(selectedDoctor, selectedDate);
      setAvailableSlots(response.availableSlots || []);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    try {
      const [startTime, endTime] = selectedTime.split('-');
      await api.createAppointment({
        doctor: selectedDoctor,
        appointmentType: 'consultation',
        date: selectedDate,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        reason,
      });
      setShowBookingModal(false);
      fetchAppointments();
      // Reset form
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
    } catch (error: any) {
      alert(error.message || 'Failed to book appointment');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite da otkažete ovaj pregled?')) return;

    try {
      await api.cancelAppointment(id);
      fetchAppointments();
    } catch (error: any) {
      alert(error.message || 'Failed to cancel appointment');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#2C6975]">Moji pregledi</h1>
            <p className="text-gray-600 mt-1">Upravljajte svojim zakazanim pregledima</p>
          </div>
          <button
            onClick={() => setShowBookingModal(true)}
            className="bg-[#6BB2A0] text-white px-6 py-2 rounded-lg hover:bg-[#5a9d8c] transition-colors"
          >
            + Zakaži pregled
          </button>
        </div>

        {/* Filters */}
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
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'upcoming'
                ? 'bg-[#6BB2A0] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Predstojeći
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'past'
                ? 'bg-[#6BB2A0] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Prošli
          </button>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="text-center py-12">Učitavanje...</div>
        ) : appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div
                key={apt._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {apt.doctor?.firstName} {apt.doctor?.lastName}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          apt.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : apt.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {apt.status === 'scheduled' && 'Zakazan'}
                        {apt.status === 'confirmed' && 'Potvrđen'}
                        {apt.status === 'cancelled' && 'Otkazan'}
                        {apt.status === 'completed' && 'Završen'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{apt.doctor?.specialization}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Datum:</span>
                        <span className="ml-2 font-medium">
                          {new Date(apt.date).toLocaleDateString('sr-RS', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Vreme:</span>
                        <span className="ml-2 font-medium">
                          {apt.startTime} - {apt.endTime}
                        </span>
                      </div>
                      {apt.reason && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Razlog:</span>
                          <span className="ml-2">{apt.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col space-y-2">
                    {apt.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleCancel(apt._id)}
                          className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Otkaži
                        </button>
                        {apt.appointmentType === 'telemedicine' && (
                          <Link
                            href={`/dashboard/patient/telemedicine/${apt._id}`}
                            className="px-4 py-2 text-sm bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] text-center"
                          >
                            Pridruži se
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nemate zakazanih pregleda</p>
            <button
              onClick={() => setShowBookingModal(true)}
              className="mt-4 text-[#6BB2A0] hover:underline"
            >
              Zakažite prvi pregled
            </button>
          </div>
        )}

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-[#2C6975]">Zakaži pregled</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doktor *
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  >
                    <option value="">Izaberite doktora</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.firstName} {doc.lastName} - {doc.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datum *
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  />
                </div>

                {selectedDoctor && selectedDate && availableSlots.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dostupni termini *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedTime(`${slot.startTime}-${slot.endTime}`)}
                          className={`px-4 py-2 border rounded-lg text-sm ${
                            selectedTime === `${slot.startTime}-${slot.endTime}`
                              ? 'bg-[#6BB2A0] text-white border-[#6BB2A0]'
                              : 'border-gray-300 hover:border-[#6BB2A0]'
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razlog pregleda
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                    placeholder="Opišite razlog pregleda..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
                  >
                    Zakaži
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}