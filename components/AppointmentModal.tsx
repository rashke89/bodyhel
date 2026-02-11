'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  appointment?: any;
  initialData?: {
    date?: string;
    startTime?: string;
    duration?: number;
  };
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  appointment,
  initialData,
}: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    appointmentType: 'consultation',
    appointmentCategory: 'ambulatory',
    date: '',
    startTime: '',
    endTime: '',
    duration: 30,
    status: 'scheduled',
    reason: '',
    notes: '',
    roomNumber: '',
    bedNumber: '',
    isRecurring: false,
    recurringPattern: 'monthly',
    recurringEndDate: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      fetchPatients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (appointment) {
      setFormData({
        patient: appointment.patient?._id || appointment.patient || '',
        doctor: appointment.doctor?._id || appointment.doctor || '',
        appointmentType: appointment.appointmentType || 'consultation',
        appointmentCategory: appointment.appointmentCategory || 'ambulatory',
        date: appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : '',
        startTime: appointment.startTime || '',
        endTime: appointment.endTime || '',
        duration: appointment.duration || 30,
        status: appointment.status || 'scheduled',
        reason: appointment.reason || '',
        notes: appointment.notes || '',
        roomNumber: appointment.roomNumber || '',
        bedNumber: appointment.bedNumber || '',
        isRecurring: appointment.isRecurring || false,
        recurringPattern: appointment.recurringPattern || 'monthly',
        recurringEndDate: appointment.recurringEndDate ? new Date(appointment.recurringEndDate).toISOString().split('T')[0] : '',
      });
    } else {
      const startTime = initialData?.startTime || '';
      const duration = initialData?.duration || 30;
      setFormData({
        patient: '',
        doctor: '',
        appointmentType: 'consultation',
        appointmentCategory: 'ambulatory',
        date: initialData?.date || '',
        startTime,
        endTime: calculateEndTime(startTime, duration),
        duration,
        status: 'scheduled',
        reason: '',
        notes: '',
        roomNumber: '',
        bedNumber: '',
        isRecurring: false,
        recurringPattern: 'monthly',
        recurringEndDate: '',
      });
    }
  }, [appointment, isOpen, initialData]);

  const fetchDoctors = async () => {
    try {
      const response = await api.getUsers({ role: 'doctor', isActive: 'true' });
      setDoctors(response.users || []);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.getUsers({ role: 'patient', isActive: 'true' });
      setPatients(response.users || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const handleDurationChange = (duration: number) => {
    setFormData({
      ...formData,
      duration,
      endTime: calculateEndTime(formData.startTime, duration),
    });
  };

  const handleStartTimeChange = (startTime: string) => {
    setFormData({
      ...formData,
      startTime,
      endTime: calculateEndTime(startTime, formData.duration),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const appointmentData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      };

      if (appointment) {
        await api.updateAppointment(appointment._id, appointmentData);
      } else {
        await api.createAppointment(appointmentData);
      }
      onSave();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Greška pri čuvanju pregleda');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#2C6975]">
            {appointment ? 'Izmeni pregled' : 'Zakaži novi pregled'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient and Doctor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pacijent *
              </label>
              <select
                required
                value={formData.patient}
                onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              >
                <option value="">Izaberi pacijenta</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName} {patient.patientId ? `(${patient.patientId})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doktor *
              </label>
              <select
                required
                value={formData.doctor}
                onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              >
                <option value="">Izaberi doktora</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.firstName} {doctor.lastName} {doctor.specialization ? `- ${doctor.specialization}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Appointment Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tip pregleda *
              </label>
              <select
                required
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              >
                <option value="consultation">Konsultacija</option>
                <option value="checkup">Pregled</option>
                <option value="systematic">Sistematski pregled</option>
                <option value="dental">Stomatološki</option>
                <option value="emergency">Hitno</option>
                <option value="telemedicine">Telemedicina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorija *
              </label>
              <select
                required
                value={formData.appointmentCategory}
                onChange={(e) => setFormData({ ...formData, appointmentCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              >
                <option value="ambulatory">Ambulantno</option>
                <option value="inpatient">Stacionarno</option>
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vreme početka *
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trajanje (minuti) *
              </label>
              <select
                required
                value={formData.duration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vreme završetka
            </label>
            <input
              type="time"
              value={formData.endTime}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
            >
              <option value="scheduled">Zakazan</option>
              <option value="confirmed">Potvrđen</option>
              <option value="in-progress">U toku</option>
              <option value="completed">Završen</option>
              <option value="cancelled">Otkazan</option>
              <option value="no-show">Nije se pojavio</option>
              <option value="rescheduled">Premešten</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razlog pregleda
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
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
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
            />
          </div>

          {/* Room and Bed (for inpatient) */}
          {formData.appointmentCategory === 'inpatient' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Broj sobe
                </label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Broj kreveta
                </label>
                <input
                  type="text"
                  value={formData.bedNumber}
                  onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
            </div>
          )}

          {/* Recurring */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="rounded border-gray-300 text-[#6BB2A0] focus:ring-[#6BB2A0]"
              />
              <span className="text-sm font-medium text-gray-700">Ponavljajući pregled</span>
            </label>
            {formData.isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Učestalost
                  </label>
                  <select
                    value={formData.recurringPattern}
                    onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  >
                    <option value="weekly">Nedeljno</option>
                    <option value="biweekly">Svake 2 nedelje</option>
                    <option value="monthly">Mesečno</option>
                    <option value="quarterly">Kvartalno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Završetak ponavljanja
                  </label>
                  <input
                    type="date"
                    value={formData.recurringEndDate}
                    onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                    min={formData.date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  />
                </div>
              </div>
            )}
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
              {loading ? 'Čuvanje...' : appointment ? 'Sačuvaj izmene' : 'Zakaži pregled'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
