'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function AdminOrganizationsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'clinic',
    legalName: '',
    taxId: '',
    logoUrl: '',
    phone: '',
    email: '',
    addressStreet: '',
    addressCity: '',
    addressPostalCode: '',
    addressCountry: '',
    isActive: true,
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: 'adminUser123',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSystemAdmin = user?.role === 'admin' && !user.organization;

  useEffect(() => {
    if (!isSystemAdmin) return;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getOrganizations();
        setOrganizations(res.organizations || []);
      } catch (err: any) {
        setError(err?.message || 'Nije moguće učitati organizacije.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isSystemAdmin]);

  const resetForm = () => {
    setForm({
      name: '',
      type: 'clinic',
      legalName: '',
      taxId: '',
      logoUrl: '',
      phone: '',
      email: '',
      addressStreet: '',
      addressCity: '',
      addressPostalCode: '',
      addressCountry: '',
      isActive: true,
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPhone: '',
      adminPassword: 'adminUser123',
    });
    setSelectedOrg(null);
    setMode(null);
    setError('');
    setSuccess('');
  };

  const fillFormFromOrg = (org: any) => {
    setForm({
      name: org.name || '',
      type: org.type || 'clinic',
      legalName: org.legalName || '',
      taxId: org.taxId || '',
      logoUrl: org.logoUrl || '',
      phone: org.phone || '',
      email: org.email || '',
      addressStreet: org.address?.street || '',
      addressCity: org.address?.city || '',
      addressPostalCode: org.address?.postalCode || '',
      addressCountry: org.address?.country || '',
      isActive: org.isActive !== false,
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPhone: '',
      adminPassword: 'adminUser123',
    });
  };

  const handleEdit = (org: any) => {
    setSelectedOrg(org);
    fillFormFromOrg(org);
    setMode('edit');
    setError('');
    setSuccess('');
  };

  const handleCreateClick = () => {
    resetForm();
    setMode('create');
  };

  const buildPayload = () => ({
    name: form.name,
    type: form.type,
    legalName: form.legalName,
    taxId: form.taxId,
    logoUrl: form.logoUrl,
    phone: form.phone,
    email: form.email,
    address: {
      street: form.addressStreet,
      city: form.addressCity,
      postalCode: form.addressPostalCode,
      country: form.addressCountry,
    },
    isActive: form.isActive,
    adminFirstName: form.adminFirstName,
    adminLastName: form.adminLastName,
    adminEmail: form.adminEmail,
    adminPhone: form.adminPhone,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mode) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = buildPayload();
      if (mode === 'create') {
        const res = await api.createOrganization(payload);
        const org = res.organization;
        setOrganizations((prev) => [...prev, org]);
        const adminEmail = res?.admin?.email || form.adminEmail;
        const defaultPassword = res?.admin?.defaultPassword || form.adminPassword;
        setSuccess(
          `Organizacija je kreirana. Admin login: ${adminEmail} / ${defaultPassword}`,
        );
        setSelectedOrg(org);
        setMode('edit');
      } else if (mode === 'edit' && selectedOrg) {
        const res = await api.updateOrganization(selectedOrg._id, payload);
        const org = res.organization;
        setOrganizations((prev) =>
          prev.map((o) => (o._id === org._id ? org : o)),
        );
        setSelectedOrg(org);
        setSuccess('Organizacija je ažurirana.');
      }
    } catch (err: any) {
      setError(err?.message || 'Greška pri čuvanju organizacije');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (org: any) => {
    if (
      !window.confirm(
        `Da li ste sigurni da želite da deaktivirate organizaciju "${org.name}"?`,
      )
    ) {
      return;
    }
    try {
      await api.deleteOrganization(org._id);
      setOrganizations((prev) =>
        prev.map((o) =>
          o._id === org._id ? { ...o, isActive: false } : o,
        ),
      );
      if (selectedOrg && selectedOrg._id === org._id) {
        setSelectedOrg({ ...org, isActive: false });
      }
    } catch (err: any) {
      setError(err?.message || 'Greška pri deaktivaciji organizacije');
    }
  };

  return (
    <DashboardLayout>
      {!isSystemAdmin ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-semibold text-[#2C6975] mb-2">
            Pristup odbijen
          </h1>
          <p className="text-sm text-gray-600">
            Samo super admin (admin bez dodeljene ustanove) može da upravlja
            organizacijama.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#2C6975]">
                  Organizacije
                </h1>
                <p className="text-gray-600 mt-1">
                  Pregled i upravljanje medicinskim ustanovama u sistemu.
                </p>
              </div>
              <button
                onClick={handleCreateClick}
                className="px-4 py-2 bg-[#6BB2A0] text-white text-sm rounded-lg hover:bg-[#5a9d8c]"
              >
                + Nova organizacija
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <div className="bg-white rounded-lg shadow p-4">
                  {loading ? (
                    <p className="text-gray-600 text-sm">Učitavanje...</p>
                  ) : organizations.length === 0 ? (
                    <p className="text-gray-600 text-sm">
                      Nema organizacija. Kreirajte prvu.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Naziv
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Tip
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Grad
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Akcije
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {organizations.map((org) => (
                            <tr key={org._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex items-center space-x-2">
                                  {org.logoUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={org.logoUrl}
                                      alt={org.name}
                                      className="w-6 h-6 rounded object-contain border border-gray-200"
                                    />
                                  )}
                                  <span>{org.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {org.type}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {org.address?.city || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    org.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  {org.isActive ? 'Aktivna' : 'Neaktivna'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(org)}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                  Uredi
                                </button>
                                {org.isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeactivate(org)}
                                    className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                                  >
                                    Deaktiviraj
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal za kreiranje/izmene organizacije */}
          {mode && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-[#2C6975]">
                    {mode === 'edit'
                      ? 'Uredi organizaciju'
                      : 'Nova organizacija'}
                  </h2>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Naziv *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tip
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                    >
                      <option value="clinic">Klinika</option>
                      <option value="hospital">Bolnica</option>
                      <option value="health-center">Dom zdravlja</option>
                      <option value="lab">Laboratorija</option>
                      <option value="other">Drugo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pravni naziv
                    </label>
                    <input
                      type="text"
                      value={form.legalName}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          legalName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      PIB / Matični broj
                    </label>
                    <input
                      type="text"
                      value={form.taxId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          taxId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Logo URL
                    </label>
                    <input
                      type="text"
                      value={form.logoUrl}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          logoUrl: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Telefon
                      </label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                      />
                    </div>
                  </div>

                  {mode === 'create' && (
                    <>
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-gray-700">
                          Podaci za admin nalog organizacije
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Ime admina *
                          </label>
                          <input
                            type="text"
                            value={form.adminFirstName}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                adminFirstName: e.target.value,
                              }))
                            }
                            required={mode === 'create'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Prezime admina *
                          </label>
                          <input
                            type="text"
                            value={form.adminLastName}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                adminLastName: e.target.value,
                              }))
                            }
                            required={mode === 'create'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Admin email *
                          </label>
                          <input
                            type="email"
                            value={form.adminEmail}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                adminEmail: e.target.value,
                              }))
                            }
                            required={mode === 'create'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Admin telefon
                          </label>
                          <input
                            type="text"
                            value={form.adminPhone}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                adminPhone: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Admin lozinka (default)
                        </label>
                        <input
                          type="password"
                          value={form.adminPassword}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ulica i broj
                    </label>
                    <input
                      type="text"
                      value={form.addressStreet}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          addressStreet: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Grad
                      </label>
                      <input
                        type="text"
                        value={form.addressCity}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            addressCity: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Poštanski broj
                      </label>
                      <input
                        type="text"
                        value={form.addressPostalCode}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            addressPostalCode: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Država
                    </label>
                    <input
                      type="text"
                      value={form.addressCountry}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          addressCountry: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6BB2A0]"
                    />
                  </div>

                  {mode === 'edit' && (
                    <div className="flex items-center space-x-2">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            isActive: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-[#6BB2A0] border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isActive"
                        className="text-xs text-gray-700"
                      >
                        Organizacija je aktivna
                      </label>
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  )}
                  {success && (
                    <p className="text-xs text-green-600 mt-1">{success}</p>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Otkaži
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-[#6BB2A0] text-white text-xs rounded-lg hover:bg-[#5a9d8c] disabled:opacity-50"
                    >
                      {saving ? 'Čuvanje...' : 'Sačuvaj'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

