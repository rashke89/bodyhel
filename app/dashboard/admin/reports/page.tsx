"use client";

import DashboardLayout from "@/components/DashboardLayout";
import ReportModal from "@/components/ReportModal";
import BarChartComponent from "@/components/charts/BarChartComponent";
import LineChartComponent from "@/components/charts/LineChartComponent";
import PieChartComponent from "@/components/charts/PieChartComponent";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedReportsLoading, setSavedReportsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [activeTab, setActiveTab] = useState<
    "appointments" | "prescriptions" | "lab-results" | "demographics" | "saved"
  >("appointments");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "appointments":
          const aptResponse = await api.getAppointmentReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          });
          setReports(aptResponse);
          break;
        case "prescriptions":
          const prescParams: any = {};
          if (dateRange.startDate) prescParams.startDate = dateRange.startDate;
          if (dateRange.endDate) prescParams.endDate = dateRange.endDate;
          const prescResponse = await api.getPrescriptions(prescParams);
          setReports({ prescriptions: prescResponse.prescriptions || [] });
          break;
        case "lab-results":
          const labParams: any = {};
          if (dateRange.startDate) labParams.startDate = dateRange.startDate;
          if (dateRange.endDate) labParams.endDate = dateRange.endDate;
          const labResponse = await api.getLabResults(labParams);
          setReports({ labResults: labResponse.labResults || [] });
          break;
        case "demographics":
          const demoResponse = await api.getDemographicsReport();
          setReports({ statistics: demoResponse.statistics });
          break;
        default:
          setReports(null);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, activeTab]);

  useEffect(() => {
    if (activeTab === "saved") {
      fetchSavedReports();
    } else {
      fetchReports();
    }
  }, [fetchReports, activeTab]);

  const fetchSavedReports = async () => {
    setSavedReportsLoading(true);
    try {
      const response = await api.getSavedReports();
      setSavedReports(response.reports || []);
    } catch (error) {
      console.error("Failed to fetch saved reports:", error);
    } finally {
      setSavedReportsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Da li ste sigurni da želite da obrišete ovaj izveštaj?")) {
      return;
    }
    try {
      await api.deleteSavedReport(id);
      fetchSavedReports();
    } catch (error: any) {
      alert(error.message || "Failed to delete report");
    }
  };

  const handleEdit = (report: any) => {
    setSelectedReport(report);
    setEditModalOpen(true);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blob = await api.downloadReportPDF({
        reportType: activeTab,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `izvestaj-${activeTab}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#2C6975]">Izveštaji</h1>
            <p className="text-gray-600 mt-1">Statistika i analiza sistema</p>
          </div>
          <div className="flex space-x-2">
            {activeTab !== "saved" && activeTab !== "demographics" && (
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="px-4 py-2 bg-[#2C6975] text-white rounded-lg hover:bg-[#245a64] disabled:opacity-50"
              >
                {exporting ? "Izvoz..." : "Izvezi PDF"}
              </button>
            )}
            {activeTab === "saved" && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c]"
              >
                + Kreiraj izveštaj
              </button>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Od:
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="ml-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Do:
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="ml-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
              />
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: "appointments", label: "Pregledi", icon: "📅" },
              { id: "prescriptions", label: "Recepti", icon: "💊" },
              { id: "lab-results", label: "Lab rezultati", icon: "🔬" },
              { id: "demographics", label: "Demografija", icon: "👥" },
              { id: "saved", label: "Sačuvani izveštaji", icon: "📋" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-[#6BB2A0] text-[#6BB2A0]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">Učitavanje...</div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === "appointments" && reports?.statistics && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#2C6975] mb-4">
                    Statistika pregleda
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Ukupno</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reports.statistics.total || 0}
                      </p>
                    </div>
                    {Object.entries(reports.statistics.byStatus || {}).map(
                      ([status, count]) => (
                        <div key={status} className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 capitalize">
                            {status}
                          </p>
                          <p className="text-2xl font-bold text-gray-700">
                            {count as number}
                          </p>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Po tipu pregleda
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(reports.statistics.byType || {}).map(
                          ([type, count]) => (
                            <div
                              key={type}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm text-gray-700 capitalize">
                                {type}
                              </span>
                              <span className="font-semibold">
                                {count as number}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Po doktoru
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {Object.entries(reports.statistics.byDoctor || {}).map(
                          ([doctor, count]) => (
                            <div
                              key={doctor}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm text-gray-700">
                                {doctor}
                              </span>
                              <span className="font-semibold">
                                {count as number}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {Object.keys(reports.statistics.byStatus || {}).length >
                      0 && (
                      <BarChartComponent
                        data={Object.entries(reports.statistics.byStatus).map(
                          ([name, value]) => ({ name, value }),
                        )}
                        title="Po statusu"
                        color="#2C6975"
                      />
                    )}
                    {Object.keys(reports.statistics.byType || {}).length >
                      0 && (
                      <PieChartComponent
                        data={Object.entries(reports.statistics.byType).map(
                          ([name, value]) => ({ name, value: value as number }),
                        )}
                        title="Po tipu pregleda"
                      />
                    )}
                  </div>
                  {Object.keys(reports.statistics.dailyCount || {}).length >
                    1 && (
                    <div className="mt-6">
                      <LineChartComponent
                        data={Object.entries(reports.statistics.dailyCount)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([date, count]) => ({ date, pregledi: count }))}
                        lines={[
                          {
                            dataKey: "pregledi",
                            color: "#6BB2A0",
                            name: "Pregledi",
                          },
                        ]}
                        xAxisKey="date"
                        title="Dnevni pregledi"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "prescriptions" && reports?.prescriptions && (
              <div>
                <h2 className="text-xl font-semibold text-[#2C6975] mb-4">
                  Statistika recepta
                </h2>
                <p className="text-gray-600 mb-4">
                  Ukupno recepta: {reports.prescriptions.length}
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Pacijent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Doktor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Datum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.prescriptions.slice(0, 20).map((presc: any) => (
                        <tr key={presc._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {presc.patient?.firstName} {presc.patient?.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {presc.doctor?.firstName} {presc.doctor?.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(presc.issueDate).toLocaleDateString(
                              "sr-RS",
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                presc.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {presc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "lab-results" && reports?.labResults && (
              <div>
                <h2 className="text-xl font-semibold text-[#2C6975] mb-4">
                  Statistika lab rezultata
                </h2>
                <p className="text-gray-600 mb-4">
                  Ukupno rezultata: {reports.labResults.length}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Završeni</p>
                    <p className="text-2xl font-bold text-green-600">
                      {
                        reports.labResults.filter(
                          (r: any) => r.status === "completed",
                        ).length
                      }
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Naručeni</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {
                        reports.labResults.filter(
                          (r: any) => r.status === "ordered",
                        ).length
                      }
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">U toku</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {
                        reports.labResults.filter(
                          (r: any) => r.status === "in-progress",
                        ).length
                      }
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Test
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Pacijent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Naručio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Datum
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.labResults.slice(0, 20).map((result: any) => (
                        <tr key={result._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {result.testName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {result.patient?.firstName}{" "}
                            {result.patient?.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {result.orderedBy?.firstName}{" "}
                            {result.orderedBy?.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                result.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : result.status === "ordered"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {result.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(result.orderedDate).toLocaleDateString(
                              "sr-RS",
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "demographics" && reports?.statistics && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#2C6975] mb-4">
                  Demografija pacijenata
                </h2>
                <div className="bg-blue-50 rounded-lg p-4 inline-block">
                  <p className="text-sm text-gray-600">Ukupno pacijenata</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reports.statistics.total || 0}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(reports.statistics.byGender || {}).length >
                    0 && (
                    <PieChartComponent
                      data={Object.entries(reports.statistics.byGender).map(
                        ([name, value]) => ({
                          name:
                            name === "male"
                              ? "Muški"
                              : name === "female"
                                ? "Ženski"
                                : name,
                          value: value as number,
                        }),
                      )}
                      title="Po polu"
                    />
                  )}
                  {reports.statistics.byAgeGroup && (
                    <PieChartComponent
                      data={Object.entries(reports.statistics.byAgeGroup)
                        .filter(([, value]) => (value as number) > 0)
                        .map(([name, value]) => ({
                          name,
                          value: value as number,
                        }))}
                      title="Po starosnoj grupi"
                    />
                  )}
                </div>
                {Object.keys(reports.statistics.byCity || {}).length > 0 && (
                  <BarChartComponent
                    data={Object.entries(reports.statistics.byCity).map(
                      ([name, value]) => ({ name, value }),
                    )}
                    title="Po gradu"
                    color="#6BB2A0"
                  />
                )}
              </div>
            )}

            {activeTab === "saved" && (
              <div>
                <h2 className="text-xl font-semibold text-[#2C6975] mb-4">
                  Sačuvani izveštaji
                </h2>
                {savedReportsLoading ? (
                  <div className="text-center py-12">Učitavanje...</div>
                ) : savedReports.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Naziv
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tip
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Period
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Kreiran
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Akcije
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <h1>aasdds</h1>
                        {savedReports.map((report: any) => (
                          <tr key={report._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/reports/${report._id}`,
                                  )
                                }
                                className="text-sm font-medium text-[#6BB2A0] hover:text-[#5a9d8c] hover:underline"
                              >
                                {report.title}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {report.reportType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  report.status === "draft"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : report.status === "generated"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {report.status === "draft" && "Nacrt"}
                                {report.status === "generated" && "Generisan"}
                                {report.status === "archived" && "Arhiviran"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {report.startDate && report.endDate
                                ? `${new Date(report.startDate).toLocaleDateString("sr-RS")} - ${new Date(report.endDate).toLocaleDateString("sr-RS")}`
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {report.createdAt
                                ? new Date(report.createdAt).toLocaleDateString(
                                    "sr-RS",
                                  )
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(report)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                  title="Izmeni"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(report._id)}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  title="Obriši"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Nema sačuvanih izveštaja
                  </div>
                )}
              </div>
            )}

            {!reports && activeTab !== "saved" && (
              <div className="text-center py-12 text-gray-500">
                Nema podataka za prikaz
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ReportModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={() => {
          fetchSavedReports();
          setCreateModalOpen(false);
        }}
      />
      <ReportModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedReport(null);
        }}
        onSave={() => {
          fetchSavedReports();
          setEditModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
      />
    </DashboardLayout>
  );
}
