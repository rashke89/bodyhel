'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import UserModal from '@/components/UserModal';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchUser();
    }
  }, [params?.id]);

  const fetchUser = async () => {
    try {
      const response = await api.getUser(params?.id as string);
      setUser(response.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      alert('Greška pri učitavanju korisnika');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Učitavanje...</div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Korisnik nije pronađen</p>
          <button
            onClick={() => router.push('/dashboard/admin/users')}
            className="mt-4 px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
          >
            Nazad na listu korisnika
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
              onClick={() => router.push('/dashboard/admin/users')}
              className="text-[#6BB2A0] hover:text-[#5a9d8c] mb-4"
            >
              ← Nazad
            </button>
            <h1 className="text-3xl font-bold text-[#2C6975]">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] flex items-center space-x-2"
          >
            <span>✏️</span>
            <span>Izmeni</span>
          </button>
        </div>

        {/* User Details */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Osnovni podaci</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Ime</label>
                <p className="text-gray-900">{user.firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Prezime</label>
                <p className="text-gray-900">{user.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Telefon</label>
                <p className="text-gray-900">{user.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Uloga</label>
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {user.role}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Aktivan' : 'Neaktivan'}
                </span>
              </div>
              {user.dateOfBirth && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Datum rođenja</label>
                  <p className="text-gray-900">
                    {new Date(user.dateOfBirth).toLocaleDateString('sr-RS')}
                  </p>
                </div>
              )}
              {user.gender && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Pol</label>
                  <p className="text-gray-900 capitalize">{user.gender}</p>
                </div>
              )}
            </div>
          </div>

          {/* Role-specific Information */}
          {(user.role === 'doctor' || user.role === 'nurse') && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Medicinski podaci</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.specialization && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Specijalizacija</label>
                    <p className="text-gray-900">{user.specialization}</p>
                  </div>
                )}
                {user.licenseNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Broj licence</label>
                    <p className="text-gray-900">{user.licenseNumber}</p>
                  </div>
                )}
                {user.department && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Odeljenje</label>
                    <p className="text-gray-900">{user.department}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {user.role === 'patient' && (
            <>
              {user.patientId && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Pacijent podaci</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ID pacijenta</label>
                      <p className="text-gray-900">{user.patientId}</p>
                    </div>
                    {user.bloodType && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Krvna grupa</label>
                        <p className="text-gray-900">{user.bloodType}</p>
                      </div>
                    )}
                    {user.insuranceNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Broj osiguranja</label>
                        <p className="text-gray-900">{user.insuranceNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {user.emergencyContact && (user.emergencyContact.name || user.emergencyContact.phone) && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Kontakt za hitne slučajeve</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {user.emergencyContact.name && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Ime</label>
                        <p className="text-gray-900">{user.emergencyContact.name}</p>
                      </div>
                    )}
                    {user.emergencyContact.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Telefon</label>
                        <p className="text-gray-900">{user.emergencyContact.phone}</p>
                      </div>
                    )}
                    {user.emergencyContact.relationship && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Srodstvo</label>
                        <p className="text-gray-900">{user.emergencyContact.relationship}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Address */}
          {user.address && (user.address.street || user.address.city) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Adresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.address.street && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Ulica</label>
                    <p className="text-gray-900">{user.address.street}</p>
                  </div>
                )}
                {user.address.city && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Grad</label>
                    <p className="text-gray-900">{user.address.city}</p>
                  </div>
                )}
                {user.address.postalCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Poštanski broj</label>
                    <p className="text-gray-900">{user.address.postalCode}</p>
                  </div>
                )}
                {user.address.country && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Država</label>
                    <p className="text-gray-900">{user.address.country}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              {user.createdAt && (
                <div>
                  <label className="font-medium">Kreiran:</label>
                  <p>{new Date(user.createdAt).toLocaleString('sr-RS')}</p>
                </div>
              )}
              {user.updatedAt && (
                <div>
                  <label className="font-medium">Ažuriran:</label>
                  <p>{new Date(user.updatedAt).toLocaleString('sr-RS')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <UserModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={() => {
          fetchUser();
          setEditModalOpen(false);
        }}
        user={user}
      />
    </DashboardLayout>
  );
}
