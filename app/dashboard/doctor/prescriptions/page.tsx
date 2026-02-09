"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "cancelled" | "expired"
  >("all");
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    patient: "",
    diagnosisCode: "",
    diagnosisDescription: "",
    medications: [
      {
        name: "",
        genericName: "",
        dosageAmount: "",
        dosageUnit: "",
        frequency: "",
        duration: "",
        instructions: "",
        quantity: "",
        substitutionsAllowed: true,
      },
    ],
    notes: "",
    expiryDate: "",
  });

  useEffect(() => {
    fetchPrescriptions();
  }, [filter]);

  useEffect(() => {
    if (createModalOpen) {
      fetchPatients();
    }
  }, [createModalOpen]);

  const handleDownloadPDF = async (prescriptionId: string) => {
    try {
      const blob = await api.downloadPrescriptionPDF(prescriptionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recept-${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.searchEHRs();
      const uniquePatients = (response.ehrs || [])
        .map((ehr: any) => ehr.patient)
        .filter((patient: any) => patient?._id);
      setPatients(uniquePatients);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const params: any = {};
      if (filter !== "all") {
        params.status = filter;
      }
      const response = await api.getPrescriptions(params);
      setPrescriptions(response.prescriptions || []);
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = useMemo(() => {
    if (!search) return prescriptions;
    const term = search.toLowerCase();
    return prescriptions.filter((presc) => {
      const patientName =
        `${presc.patient?.firstName || ""} ${presc.patient?.lastName || ""}`.toLowerCase();
      const patientId = (presc.patient?.patientId || "").toLowerCase();
      const eId = (presc.ePrescriptionId || "").toLowerCase();
      return (
        patientName.includes(term) ||
        patientId.includes(term) ||
        eId.includes(term)
      );
    });
  }, [prescriptions, search]);

  const handleAddMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        {
          name: "",
          genericName: "",
          dosageAmount: "",
          dosageUnit: "",
          frequency: "",
          duration: "",
          instructions: "",
          quantity: "",
          substitutionsAllowed: true,
        },
      ],
    });
  };

  const handleRemoveMedication = (idx: number) => {
    if (formData.medications.length === 1) return;
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== idx),
    });
  };

  const handleMedicationChange = (idx: number, field: string, value: any) => {
    const updated = formData.medications.map((med, i) =>
      i === idx ? { ...med, [field]: value } : med,
    );
    setFormData({ ...formData, medications: updated });
  };

  const resetForm = () => {
    setFormData({
      patient: "",
      diagnosisCode: "",
      diagnosisDescription: "",
      medications: [
        {
          name: "",
          genericName: "",
          dosageAmount: "",
          dosageUnit: "",
          frequency: "",
          duration: "",
          instructions: "",
          quantity: "",
          substitutionsAllowed: true,
        },
      ],
      notes: "",
      expiryDate: "",
    });
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) {
      alert("Nije moguće kreirati recept bez prijavljenog doktora.");
      return;
    }
    setCreating(true);
    try {
      const payload: any = {
        patient: formData.patient,
        doctor: user._id,
        medications: formData.medications.map((med) => ({
          name: med.name,
          genericName: med.genericName || undefined,
          dosage:
            med.dosageAmount || med.dosageUnit
              ? { amount: med.dosageAmount, unit: med.dosageUnit }
              : undefined,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || undefined,
          quantity: med.quantity ? Number(med.quantity) : undefined,
          substitutionsAllowed: med.substitutionsAllowed,
        })),
        notes: formData.notes || undefined,
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : undefined,
      };
      if (formData.diagnosisCode || formData.diagnosisDescription) {
        payload.diagnosis = {
          code: formData.diagnosisCode,
          description: formData.diagnosisDescription,
        };
      }
      await api.createPrescription(payload);
      setCreateModalOpen(false);
      resetForm();
      fetchPrescriptions();
    } catch (error: any) {
      alert(error.message || "Greška pri kreiranju recepta");
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#2C6975]">Recepti</h1>
            <p className="text-gray-600 mt-1">
              Pregled recepata koje ste izdali
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
          >
            + Kreiraj recept
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Svi" },
            { id: "active", label: "Aktivni" },
            { id: "completed", label: "Završeni" },
            { id: "cancelled", label: "Otkazani" },
            { id: "expired", label: "Istekli" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-lg ${
                filter === tab.id
                  ? "bg-[#6BB2A0] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraga po pacijentu ili e-Recept ID"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Učitavanje...</div>
        ) : filteredPrescriptions.length > 0 ? (
          <div className="space-y-4">
            {filteredPrescriptions.map((presc) => (
              <div
                key={presc._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {presc.patient?.firstName} {presc.patient?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      ID pacijenta: {presc.patient?.patientId || "-"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Izdato:{" "}
                      {new Date(presc.issueDate).toLocaleDateString("sr-RS")}
                    </p>
                    {presc.expiryDate && (
                      <p className="text-sm text-gray-500">
                        Ističe:{" "}
                        {new Date(presc.expiryDate).toLocaleDateString("sr-RS")}
                      </p>
                    )}
                    {presc.diagnosis && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Dijagnoza:</span>{" "}
                        {presc.diagnosis.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        presc.status === "active"
                          ? "bg-green-100 text-green-800"
                          : presc.status === "completed"
                            ? "bg-gray-100 text-gray-800"
                            : presc.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {presc.status === "active" && "Aktivan"}
                      {presc.status === "completed" && "Završen"}
                      {presc.status === "cancelled" && "Otkazan"}
                      {presc.status === "expired" && "Istekao"}
                    </span>
                    <button
                      onClick={() => handleDownloadPDF(presc._id)}
                      className="px-3 py-1 bg-[#2C6975] text-white text-xs rounded-lg hover:bg-[#245a64] transition-colors"
                    >
                      Preuzmi PDF
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Lekovi:</h4>
                  <div className="space-y-3">
                    {presc.medications.map((med: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {med.name}
                            </p>
                            {med.genericName && (
                              <p className="text-sm text-gray-600">
                                {med.genericName}
                              </p>
                            )}
                            <div className="mt-2 space-y-1 text-sm text-gray-700">
                              <p>
                                <span className="font-medium">Doza:</span>{" "}
                                {med.dosage?.amount} {med.dosage?.unit}
                              </p>
                              <p>
                                <span className="font-medium">Učestalost:</span>{" "}
                                {med.frequency}
                              </p>
                              <p>
                                <span className="font-medium">Trajanje:</span>{" "}
                                {med.duration}
                              </p>
                              {med.instructions && (
                                <p className="text-gray-600 italic">
                                  {med.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {presc.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Napomena:</span>{" "}
                      {presc.notes}
                    </p>
                  </div>
                )}

                {presc.ePrescriptionId && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      e-Recept ID: {presc.ePrescriptionId}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nema recepata za prikaz</p>
          </div>
        )}
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-[#2C6975]">
                Kreiraj recept
              </h2>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePrescription} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pacijent *
                </label>
                <select
                  required
                  value={formData.patient}
                  onChange={(e) =>
                    setFormData({ ...formData, patient: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                >
                  <option value="">Izaberite pacijenta</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}{" "}
                      {patient.patientId ? `(${patient.patientId})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dijagnoza (šifra)
                  </label>
                  <input
                    type="text"
                    value={formData.diagnosisCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        diagnosisCode: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                    placeholder="ICD-10 kod"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dijagnoza (opis)
                  </label>
                  <input
                    type="text"
                    value={formData.diagnosisDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        diagnosisDescription: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                    placeholder="Opis dijagnoze"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Lekovi *
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="px-3 py-1 text-sm bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
                  >
                    + Dodaj lek
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.medications.map((med, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-medium text-gray-900">
                          Lek {idx + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="text-sm text-red-600 hover:underline"
                          disabled={formData.medications.length === 1}
                        >
                          Ukloni
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Naziv *
                          </label>
                          <input
                            type="text"
                            required
                            value={med.name}
                            onChange={(e) =>
                              handleMedicationChange(
                                idx,
                                "name",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Generički naziv
                          </label>
                          <input
                            type="text"
                            value={med.genericName}
                            onChange={(e) =>
                              handleMedicationChange(
                                idx,
                                "genericName",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Doza
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={med.dosageAmount}
                              onChange={(e) =>
                                handleMedicationChange(
                                  idx,
                                  "dosageAmount",
                                  e.target.value,
                                )
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                              placeholder="npr. 500"
                            />
                            <input
                              type="text"
                              value={med.dosageUnit}
                              onChange={(e) =>
                                handleMedicationChange(
                                  idx,
                                  "dosageUnit",
                                  e.target.value,
                                )
                              }
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                              placeholder="mg"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Učestalost *
                          </label>
                          <input
                            type="text"
                            required
                            value={med.frequency}
                            onChange={(e) =>
                              handleMedicationChange(
                                idx,
                                "frequency",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                            placeholder="npr. 2x dnevno"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trajanje *
                          </label>
                          <input
                            type="text"
                            required
                            value={med.duration}
                            onChange={(e) =>
                              handleMedicationChange(
                                idx,
                                "duration",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                            placeholder="npr. 7 dana"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Količina
                          </label>
                          <input
                            type="number"
                            value={med.quantity}
                            onChange={(e) =>
                              handleMedicationChange(
                                idx,
                                "quantity",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                            min={0}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Uputstvo
                          </label>
                          <input
                            type="text"
                            value={med.instructions}
                            onChange={(e) =>
                              handleMedicationChange(
                                idx,
                                "instructions",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="inline-flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={med.substitutionsAllowed}
                              onChange={(e) =>
                                handleMedicationChange(
                                  idx,
                                  "substitutionsAllowed",
                                  e.target.checked,
                                )
                              }
                              className="rounded border-gray-300 text-[#6BB2A0] focus:ring-[#6BB2A0]"
                            />
                            <span className="text-sm text-gray-700">
                              Dozvoljena zamena
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datum isteka
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Napomena
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] disabled:opacity-50"
                >
                  {creating ? "Kreiranje..." : "Kreiraj"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
