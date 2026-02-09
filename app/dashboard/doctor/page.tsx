"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DoctorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followUpModal, setFollowUpModal] = useState<{
    open: boolean;
    appointmentId: string | null;
  }>({
    open: false,
    appointmentId: null,
  });
  const [followUpData, setFollowUpData] = useState({
    date: "",
    startTime: "09:00",
    endTime: "09:30",
    reason: "",
  });
  const [followUpLoading, setFollowUpLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [appointmentsRes] = await Promise.all([
        api.getAppointments({ date: today }),
      ]);

      setTodayAppointments(appointmentsRes.appointments || []);

      // Calculate stats
      const totalToday = appointmentsRes.appointments?.length || 0;
      const completed =
        appointmentsRes.appointments?.filter(
          (a: any) => a.status === "completed",
        ).length || 0;
      const pending =
        appointmentsRes.appointments?.filter(
          (a: any) => a.status === "scheduled" || a.status === "confirmed",
        ).length || 0;

      setStats({
        totalToday,
        completed,
        pending,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (
      !followUpModal.appointmentId ||
      !followUpData.date ||
      !followUpData.startTime ||
      !followUpData.endTime
    )
      return;
    setFollowUpLoading(true);
    try {
      await api.scheduleFollowUp(followUpModal.appointmentId, followUpData);
      setFollowUpModal({ open: false, appointmentId: null });
      setFollowUpData({
        date: "",
        startTime: "09:00",
        endTime: "09:30",
        reason: "",
      });
      fetchDashboard();
    } catch (error: any) {
      alert(error.message || "Greška pri zakazivanju kontrole");
    } finally {
      setFollowUpLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-[#2C6975]">Učitavanje...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C6975]">Dashboard</h1>
          <p className="text-gray-600">Dobrodošli, doktore</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Današnji pregledi</p>
                <p className="text-2xl font-bold text-[#2C6975]">
                  {stats?.totalToday || 0}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Završeni</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.completed || 0}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Na čekanju</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.pending || 0}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#2C6975]">
              Današnji pregledi
            </h2>
            <Link
              href="/dashboard/doctor/appointments"
              className="text-sm text-[#6BB2A0] hover:underline"
            >
              Vidi sve →
            </Link>
          </div>
          <div className="p-6">
            {todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {apt.patient?.firstName} {apt.patient?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {apt.startTime} - {apt.endTime}
                        </p>
                        {apt.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            Razlog: {apt.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            apt.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : apt.status === "in-progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {apt.status === "scheduled" && "Zakazan"}
                          {apt.status === "confirmed" && "Potvrđen"}
                          {apt.status === "in-progress" && "U toku"}
                          {apt.status === "completed" && "Završen"}
                        </span>
                        <Link
                          href={`/dashboard/doctor/patients/${apt.patient?._id}`}
                          className="px-4 py-2 text-sm bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] text-center"
                        >
                          Otvori EHR
                        </Link>
                        {apt.status === "completed" && (
                          <button
                            onClick={() =>
                              setFollowUpModal({
                                open: true,
                                appointmentId: apt._id,
                              })
                            }
                            className="px-4 py-2 text-sm bg-[#2C6975] text-white rounded-lg hover:bg-[#245a64] text-center"
                          >
                            Zakaži kontrolu
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nemate pregleda za danas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Modal */}
      {followUpModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[#2C6975] mb-4">
              Zakaži kontrolni pregled
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={followUpData.date}
                  onChange={(e) =>
                    setFollowUpData({ ...followUpData, date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Početak
                </label>
                <input
                  type="time"
                  value={followUpData.startTime}
                  onChange={(e) =>
                    setFollowUpData({
                      ...followUpData,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kraj
                </label>
                <input
                  type="time"
                  value={followUpData.endTime}
                  onChange={(e) =>
                    setFollowUpData({
                      ...followUpData,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razlog
                </label>
                <input
                  type="text"
                  value={followUpData.reason}
                  onChange={(e) =>
                    setFollowUpData({ ...followUpData, reason: e.target.value })
                  }
                  placeholder="Kontrolni pregled"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BB2A0]"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setFollowUpModal({ open: false, appointmentId: null });
                  setFollowUpData({
                    date: "",
                    startTime: "09:00",
                    endTime: "09:30",
                    reason: "",
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Otkaži
              </button>
              <button
                onClick={handleFollowUp}
                disabled={
                  followUpLoading || !followUpData.date || !followUpData.endTime
                }
                className="px-4 py-2 bg-[#6BB2A0] text-white rounded-lg hover:bg-[#5a9d8c] disabled:opacity-50"
              >
                {followUpLoading ? "Zakazivanje..." : "Zakaži"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
