'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

export default function AdminSettingsPage() {
  const [organization, setOrganization] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchOrg = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getMyOrganization();
        setOrganization(res.organization);
      } catch (err: any) {
        setError(
          err?.message ||
            'Nije moguće učitati podatke o ustanovi. Proverite da li je admin dodeljen ustanovi.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, []);

  const handleChange = (field: string, value: any) => {
    setOrganization((prev: any) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setOrganization((prev: any) => ({
      ...(prev || {}),
      address: {
        ...(prev?.address || {}),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: organization.name,
        legalName: organization.legalName,
        logoUrl: organization.logoUrl,
        phone: organization.phone,
        email: organization.email,
        address: organization.address,
      };
      const res = await api.updateMyOrganization(payload);
      setOrganization(res.organization);
      setSuccess('Podešavanja su sačuvana.');
    } catch (err: any) {
      setError(err?.message || 'Greška pri čuvanju podešavanja');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold text-[#2C6975]">
            Podešavanja ustanove
          </h1>
          <p className="text-gray-600 mt-1">
            Izmeni osnovne podatke o medicinskoj ustanovi koju administriraš.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Učitavanje podataka o ustanovi...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : !organization ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">
              Nema dodeljene ustanove za ovog admina.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow p-6 space-y-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naziv ustanove *
                </label>
                <input
                  type="text"
                  value={organization.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poslovni naziv (pravni naziv)
                </label>
                <input
                  type="text"
                  value={organization.legalName || ''}
                  onChange={(e) =>
                    handleChange('legalName', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={organization.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
                {organization.logoUrl && (
                  <div className="mt-3 flex items-center space-x-3">
                    <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={organization.logoUrl}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      Pregled logotipa
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  value={organization.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={organization.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">
                Adresa
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ulica i broj
                  </label>
                  <input
                    type="text"
                    value={organization.address?.street || ''}
                    onChange={(e) =>
                      handleAddressChange('street', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grad
                  </label>
                  <input
                    type="text"
                    value={organization.address?.city || ''}
                    onChange={(e) =>
                      handleAddressChange('city', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poštanski broj
                  </label>
                  <input
                    type="text"
                    value={organization.address?.postalCode || ''}
                    onChange={(e) =>
                      handleAddressChange('postalCode', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Država
                  </label>
                  <input
                    type="text"
                    value={organization.address?.country || ''}
                    onChange={(e) =>
                      handleAddressChange('country', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600">
                {success}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] disabled:opacity-50"
              >
                {saving ? 'Čuvanje...' : 'Sačuvaj podešavanja'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

