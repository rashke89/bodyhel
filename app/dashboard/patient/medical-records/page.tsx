'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import LineChartComponent from '@/components/charts/LineChartComponent';

export default function PatientMedicalRecordsPage() {
  const { user } = useAuth();
  const [ehr, setEhr] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'diagnoses' | 'vitals' | 'documents' | 'history'>('diagnoses');

  useEffect(() => {
    if (user) {
      fetchMedicalRecords();
    }
  }, [user]);

  const fetchMedicalRecords = async () => {
    try {
      const response = await api.getPatientMedicalRecords();
      setEhr(response.ehr);
    } catch (error) {
      console.error('Failed to fetch medical records:', error);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C6975]">Medicinski zapisi</h1>
          <p className="text-gray-600 mt-1">Pregled vaših medicinskih podataka</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'diagnoses', label: 'Dijagnoze', count: ehr?.diagnoses?.length || 0 },
              { id: 'vitals', label: 'Vitalni znaci', count: ehr?.recentVitalSigns?.length || 0 },
              { id: 'documents', label: 'Dokumenta', count: ehr?.documents?.length || 0 },
              { id: 'history', label: 'Anamneza', count: 1 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#6BB2A0] text-[#6BB2A0]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'diagnoses' && (
            <div>
              <h2 className="text-xl font-semibold text-[#2C6975] mb-4">Dijagnoze (ICD-10)</h2>
              {ehr?.diagnoses?.length > 0 ? (
                <div className="space-y-4">
                  {ehr.diagnoses.map((diagnosis: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
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
                              {diagnosis.status === 'active' && 'Aktivna'}
                              {diagnosis.status === 'resolved' && 'Rešena'}
                              {diagnosis.status === 'chronic' && 'Hronična'}
                            </span>
                          </div>
                          <p className="mt-2 font-medium text-gray-900">{diagnosis.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Dijagnostikovao: {diagnosis.doctor?.firstName} {diagnosis.doctor?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Datum: {new Date(diagnosis.date).toLocaleDateString('sr-RS')}
                          </p>
                        </div>
                      </div>
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
              <h2 className="text-xl font-semibold text-[#2C6975] mb-4">Vitalni znaci</h2>
              {ehr?.recentVitalSigns?.length > 1 && (
                <div className="mb-6">
                  <LineChartComponent
                    data={[...ehr.recentVitalSigns]
                      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((v: any) => ({
                        date: new Date(v.date).toLocaleDateString('sr-RS'),
                        sistolni: v.bloodPressure?.systolic,
                        dijastolni: v.bloodPressure?.diastolic,
                        puls: v.heartRate,
                      }))}
                    lines={[
                      { dataKey: 'sistolni', color: '#2C6975', name: 'Sistolni' },
                      { dataKey: 'dijastolni', color: '#6BB2A0', name: 'Dijastolni' },
                      { dataKey: 'puls', color: '#E57373', name: 'Puls' },
                    ]}
                    xAxisKey="date"
                    title="Trend vitalnih znakova"
                    height={250}
                  />
                </div>
              )}
              {ehr?.recentVitalSigns?.length > 0 ? (
                <div className="space-y-4">
                  {ehr.recentVitalSigns.map((vital: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {vital.bloodPressure && (
                          <div>
                            <p className="text-sm text-gray-500">Krvni pritisak</p>
                            <p className="font-semibold">
                              {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg
                            </p>
                          </div>
                        )}
                        {vital.heartRate && (
                          <div>
                            <p className="text-sm text-gray-500">Puls</p>
                            <p className="font-semibold">{vital.heartRate} bpm</p>
                          </div>
                        )}
                        {vital.temperature && (
                          <div>
                            <p className="text-sm text-gray-500">Temperatura</p>
                            <p className="font-semibold">{vital.temperature} °C</p>
                          </div>
                        )}
                        {vital.weight && (
                          <div>
                            <p className="text-sm text-gray-500">Težina</p>
                            <p className="font-semibold">{vital.weight} kg</p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(vital.date).toLocaleDateString('sr-RS', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nema unetih vitalnih znakova</p>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h2 className="text-xl font-semibold text-[#2C6975] mb-4">Dokumenta</h2>
              {ehr?.documents?.length > 0 ? (
                <div className="space-y-4">
                  {ehr.documents.map((doc: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Tip: {doc.type} • {new Date(doc.uploadedAt).toLocaleDateString('sr-RS')}
                        </p>
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {doc.tags.map((tag: string, tagIdx: number) => (
                              <span
                                key={tagIdx}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] text-sm"
                      >
                        Pregledaj
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nema dokumenta</p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-semibold text-[#2C6975] mb-4">Anamneza</h2>
              {ehr?.medicalHistory ? (
                <div className="space-y-6">
                  {ehr.medicalHistory.pastIllnesses && ehr.medicalHistory.pastIllnesses.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Prethodne bolesti</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {ehr.medicalHistory.pastIllnesses.map((illness: string, idx: number) => (
                          <li key={idx}>{illness}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ehr.medicalHistory.surgeries && ehr.medicalHistory.surgeries.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Operacije</h3>
                      <div className="space-y-2">
                        {ehr.medicalHistory.surgeries.map((surgery: any, idx: number) => (
                          <div key={idx} className="border-l-4 border-[#6BB2A0] pl-4">
                            <p className="font-medium">{surgery.name}</p>
                            {surgery.date && (
                              <p className="text-sm text-gray-600">
                                {new Date(surgery.date).toLocaleDateString('sr-RS')}
                              </p>
                            )}
                            {surgery.hospital && (
                              <p className="text-sm text-gray-600">{surgery.hospital}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ehr.medicalHistory.familyHistory && ehr.medicalHistory.familyHistory.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Porodična anamneza</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {ehr.medicalHistory.familyHistory.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ehr.medicalHistory.socialHistory && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Socijalna anamneza</h3>
                      <div className="space-y-2 text-gray-700">
                        {ehr.medicalHistory.socialHistory.smoking && (
                          <p>
                            <span className="font-medium">Pušenje:</span>{' '}
                            {ehr.medicalHistory.socialHistory.smoking.status}
                          </p>
                        )}
                        {ehr.medicalHistory.socialHistory.alcohol && (
                          <p>
                            <span className="font-medium">Alkohol:</span>{' '}
                            {ehr.medicalHistory.socialHistory.alcohol.status}
                          </p>
                        )}
                        {ehr.medicalHistory.socialHistory.exercise && (
                          <p>
                            <span className="font-medium">Vežbanje:</span>{' '}
                            {ehr.medicalHistory.socialHistory.exercise}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nema unetih podataka o anamnezi</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}