'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

export default function PatientEHRPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [ehr, setEhr] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnoses' | 'vitals' | 'prescriptions' | 'lab'>('overview');
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [showAddVitals, setShowAddVitals] = useState(false);
  const [icd10Codes, setIcd10Codes] = useState<any[]>([]);
  const [searchIcd10, setSearchIcd10] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [labLoading, setLabLoading] = useState(false);
  const [prescriptionsLoaded, setPrescriptionsLoaded] = useState(false);
  const [labLoaded, setLabLoaded] = useState(false);

  // Form states
  const [diagnosisForm, setDiagnosisForm] = useState({
    code: '',
    description: '',
    isPrimary: false,
    status: 'active',
  });
  const [vitalsForm, setVitalsForm] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
  });

  useEffect(() => {
    if (patientId) {
      fetchEHR();
    }
  }, [patientId]);

  useEffect(() => {
    if (searchIcd10) {
      fetchICD10Codes();
    }
  }, [searchIcd10]);

  useEffect(() => {
    if (activeTab === 'prescriptions' && patientId && !prescriptionsLoaded) {
      fetchPrescriptions();
    }
    if (activeTab === 'lab' && patientId && !labLoaded) {
      fetchLabResults();
    }
  }, [activeTab, patientId, prescriptionsLoaded, labLoaded]);

  const fetchEHR = async () => {
    try {
      const response = await api.getEHR(patientId);
      setEhr(response.ehr);
    } catch (error) {
      console.error('Failed to fetch EHR:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    try {
      const response = await api.getPrescriptions({ patient: patientId });
      setPrescriptions(response.prescriptions || []);
      setPrescriptionsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const fetchLabResults = async () => {
    setLabLoading(true);
    try {
      const response = await api.getLabResults({ patient: patientId });
      setLabResults(response.labResults || []);
      setLabLoaded(true);
    } catch (error) {
      console.error('Failed to fetch lab results:', error);
    } finally {
      setLabLoading(false);
    }
  };

  const fetchICD10Codes = async () => {
    try {
      const response = await api.getICD10Codes(searchIcd10);
      setIcd10Codes(response.codes || []);
    } catch (error) {
      console.error('Failed to fetch ICD-10 codes:', error);
    }
  };

  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addDiagnosis(patientId, diagnosisForm);
      setShowAddDiagnosis(false);
      setDiagnosisForm({ code: '', description: '', isPrimary: false, status: 'active' });
      fetchEHR();
    } catch (error: any) {
      alert(error.message || 'Failed to add diagnosis');
    }
  };

  const handleAddVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vitalData: any = {};
      if (vitalsForm.bloodPressureSystolic && vitalsForm.bloodPressureDiastolic) {
        vitalData.bloodPressure = {
          systolic: parseInt(vitalsForm.bloodPressureSystolic),
          diastolic: parseInt(vitalsForm.bloodPressureDiastolic),
        };
      }
      if (vitalsForm.heartRate) vitalData.heartRate = parseInt(vitalsForm.heartRate);
      if (vitalsForm.temperature) vitalData.temperature = parseFloat(vitalsForm.temperature);
      if (vitalsForm.oxygenSaturation) vitalData.oxygenSaturation = parseInt(vitalsForm.oxygenSaturation);
      if (vitalsForm.weight) vitalData.weight = parseFloat(vitalsForm.weight);
      if (vitalsForm.height) vitalData.height = parseFloat(vitalsForm.height);

      await api.addVitalSigns(patientId, vitalData);
      setShowAddVitals(false);
      setVitalsForm({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        temperature: '',
        oxygenSaturation: '',
        weight: '',
        height: '',
      });
      fetchEHR();
    } catch (error: any) {
      alert(error.message || 'Failed to add vital signs');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Učitavanje...</div>
      </DashboardLayout>
    );
  }

  if (!ehr) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">EHR not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C6975]">
            EHR - {ehr.patient?.firstName} {ehr.patient?.lastName}
          </h1>
          <p className="text-gray-600 mt-1">Elektronski zdravstveni karton</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Pregled' },
              { id: 'diagnoses', label: 'Dijagnoze' },
              { id: 'vitals', label: 'Vitalni znaci' },
              { id: 'prescriptions', label: 'Recepti' },
              { id: 'lab', label: 'Lab rezultati' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#6BB2A0] text-[#6BB2A0]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Aktivne dijagnoze</h3>
                  <p className="text-2xl font-bold text-[#2C6975]">
                    {ehr.diagnoses?.filter((d: any) => d.status === 'active').length || 0}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Medicinska upozorenja</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {ehr.medicalAlerts?.filter((a: any) => a.active).length || 0}
                  </p>
                </div>
              </div>

              {ehr.medicalAlerts?.filter((a: any) => a.active).length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Aktivna upozorenja</h3>
                  <ul className="space-y-1">
                    {ehr.medicalAlerts
                      .filter((a: any) => a.active)
                      .map((alert: any, idx: number) => (
                        <li key={idx} className="text-sm text-yellow-700">
                          • {alert.description}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {ehr.vitalSigns && ehr.vitalSigns.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Poslednji vitalni znaci</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {(() => {
                      const latest = ehr.vitalSigns[ehr.vitalSigns.length - 1];
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {latest.bloodPressure && (
                            <div>
                              <p className="text-sm text-gray-600">Krvni pritisak</p>
                              <p className="font-semibold">
                                {latest.bloodPressure.systolic}/{latest.bloodPressure.diastolic} mmHg
                              </p>
                            </div>
                          )}
                          {latest.heartRate && (
                            <div>
                              <p className="text-sm text-gray-600">Puls</p>
                              <p className="font-semibold">{latest.heartRate} bpm</p>
                            </div>
                          )}
                          {latest.temperature && (
                            <div>
                              <p className="text-sm text-gray-600">Temperatura</p>
                              <p className="font-semibold">{latest.temperature} °C</p>
                            </div>
                          )}
                          {latest.weight && (
                            <div>
                              <p className="text-sm text-gray-600">Težina</p>
                              <p className="font-semibold">{latest.weight} kg</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'diagnoses' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#2C6975]">Dijagnoze</h2>
                <button
                  onClick={() => setShowAddDiagnosis(true)}
                  className="px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
                >
                  + Dodaj dijagnozu
                </button>
              </div>
              {ehr.diagnoses?.length > 0 ? (
                <div className="space-y-4">
                  {ehr.diagnoses.map((diagnosis: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {diagnosis.code}
                        </span>
                        {diagnosis.isPrimary && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            Primarna
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            diagnosis.status === 'active'
                              ? 'bg-red-100 text-red-800'
                              : diagnosis.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {diagnosis.status}
                        </span>
                      </div>
                      <p className="font-medium">{diagnosis.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(diagnosis.date).toLocaleDateString('sr-RS')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nema dijagnoza</p>
              )}
            </div>
          )}

          {activeTab === 'vitals' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#2C6975]">Vitalni znaci</h2>
                <button
                  onClick={() => setShowAddVitals(true)}
                  className="px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
                >
                  + Dodaj vitalne znake
                </button>
              </div>
              {ehr.vitalSigns?.length > 0 ? (
                <div className="space-y-4">
                  {ehr.vitalSigns.slice().reverse().map((vital: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {vital.bloodPressure && (
                          <div>
                            <p className="text-sm text-gray-600">Krvni pritisak</p>
                            <p className="font-semibold">
                              {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg
                            </p>
                          </div>
                        )}
                        {vital.heartRate && (
                          <div>
                            <p className="text-sm text-gray-600">Puls</p>
                            <p className="font-semibold">{vital.heartRate} bpm</p>
                          </div>
                        )}
                        {vital.temperature && (
                          <div>
                            <p className="text-sm text-gray-600">Temperatura</p>
                            <p className="font-semibold">{vital.temperature} °C</p>
                          </div>
                        )}
                        {vital.weight && (
                          <div>
                            <p className="text-sm text-gray-600">Težina</p>
                            <p className="font-semibold">{vital.weight} kg</p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(vital.date).toLocaleDateString('sr-RS')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nema unetih vitalnih znakova</p>
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div>
              <h2 className="text-xl font-semibold text-[#2C6975] mb-4">Recepti</h2>
              {prescriptionsLoading ? (
                <p className="text-gray-500">Učitavanje...</p>
              ) : prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.map((presc) => (
                    <div key={presc._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Izdato: {new Date(presc.issueDate).toLocaleDateString('sr-RS')}
                          </p>
                          {presc.diagnosis && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Dijagnoza:</span> {presc.diagnosis.description}
                            </p>
                          )}
                          {presc.ePrescriptionId && (
                            <p className="text-xs text-gray-500 mt-1">e-Recept ID: {presc.ePrescriptionId}</p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            presc.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : presc.status === 'completed'
                              ? 'bg-gray-100 text-gray-800'
                              : presc.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {presc.status === 'active' && 'Aktivan'}
                          {presc.status === 'completed' && 'Završen'}
                          {presc.status === 'cancelled' && 'Otkazan'}
                          {presc.status === 'expired' && 'Istekao'}
                        </span>
                      </div>

                      {presc.medications && presc.medications.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Terapija:</p>
                          <div className="space-y-2">
                            {presc.medications.map((med: any, idx: number) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                                <p className="text-sm text-gray-600">
                                  {med.dosage?.amount} {med.dosage?.unit} • {med.frequency} • {med.duration}
                                </p>
                                {med.instructions && (
                                  <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {presc.notes && (
                        <p className="text-sm text-gray-600 mt-3">
                          <span className="font-medium">Napomena:</span> {presc.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nema recepata za prikaz</p>
              )}
            </div>
          )}

          {activeTab === 'lab' && (
            <div>
              <h2 className="text-xl font-semibold text-[#2C6975] mb-4">Lab rezultati</h2>
              {labLoading ? (
                <p className="text-gray-500">Učitavanje...</p>
              ) : labResults.length > 0 ? (
                <div className="space-y-4">
                  {labResults.map((result) => (
                    <div key={result._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{result.testName}</p>
                          <p className="text-sm text-gray-600 capitalize">{result.testType}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Naručeno: {new Date(result.orderedDate).toLocaleDateString('sr-RS')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Broj naloga: {result.orderNumber}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            result.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : result.status === 'in-progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : result.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {result.status === 'completed' && 'Završeno'}
                          {result.status === 'in-progress' && 'U toku'}
                          {result.status === 'ordered' && 'Naručeno'}
                          {result.status === 'collected' && 'Uzeto'}
                          {result.status === 'cancelled' && 'Otkazano'}
                        </span>
                      </div>

                      {result.results && result.results.length > 0 && (
                        <div className="mt-4">
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
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{res.parameter}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {res.value} {res.unit}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{res.referenceRange || '-'}</td>
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
                        <div className="mt-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Interpretacija:</span> {result.interpretation}
                          </p>
                        </div>
                      )}

                      {result.findings && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Nalaz:</span> {result.findings}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nema laboratorijskih rezultata</p>
              )}
            </div>
          )}
        </div>

        {/* Add Diagnosis Modal */}
        {showAddDiagnosis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-[#2C6975]">Dodaj dijagnozu</h2>
                <button
                  onClick={() => setShowAddDiagnosis(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddDiagnosis} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pretraži ICD-10 kodove
                  </label>
                  <input
                    type="text"
                    value={searchIcd10}
                    onChange={(e) => setSearchIcd10(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Pretraži..."
                  />
                  {icd10Codes.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {icd10Codes.map((code, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDiagnosisForm({
                              ...diagnosisForm,
                              code: code.code,
                              description: code.description,
                            });
                            setSearchIcd10('');
                            setIcd10Codes([]);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
                        >
                          <span className="font-mono text-sm">{code.code}</span> - {code.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ICD-10 kod *
                  </label>
                  <input
                    type="text"
                    value={diagnosisForm.code}
                    onChange={(e) => setDiagnosisForm({ ...diagnosisForm, code: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opis *
                  </label>
                  <textarea
                    value={diagnosisForm.description}
                    onChange={(e) =>
                      setDiagnosisForm({ ...diagnosisForm, description: e.target.value })
                    }
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={diagnosisForm.isPrimary}
                      onChange={(e) =>
                        setDiagnosisForm({ ...diagnosisForm, isPrimary: e.target.checked })
                      }
                      className="mr-2"
                    />
                    Primarna dijagnoza
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={diagnosisForm.status}
                    onChange={(e) => setDiagnosisForm({ ...diagnosisForm, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="active">Aktivna</option>
                    <option value="resolved">Rešena</option>
                    <option value="chronic">Hronična</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddDiagnosis(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
                  >
                    Dodaj
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Vitals Modal */}
        {showAddVitals && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-[#2C6975]">Dodaj vitalne znake</h2>
                <button
                  onClick={() => setShowAddVitals(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddVitals} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sistolni pritisak
                    </label>
                    <input
                      type="number"
                      value={vitalsForm.bloodPressureSystolic}
                      onChange={(e) =>
                        setVitalsForm({ ...vitalsForm, bloodPressureSystolic: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dijastolni pritisak
                    </label>
                    <input
                      type="number"
                      value={vitalsForm.bloodPressureDiastolic}
                      onChange={(e) =>
                        setVitalsForm({ ...vitalsForm, bloodPressureDiastolic: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Puls (bpm)</label>
                    <input
                      type="number"
                      value={vitalsForm.heartRate}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperatura (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalsForm.temperature}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saturacija kisika (%)
                    </label>
                    <input
                      type="number"
                      value={vitalsForm.oxygenSaturation}
                      onChange={(e) =>
                        setVitalsForm({ ...vitalsForm, oxygenSaturation: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Težina (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalsForm.weight}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Visina (cm)</label>
                    <input
                      type="number"
                      value={vitalsForm.height}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddVitals(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
                  >
                    Dodaj
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
