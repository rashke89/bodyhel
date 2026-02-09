"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type ViewMode = "month" | "week";

interface CalendarAppointment {
  _id: string;
  date: string; // ISO
  startTime: string;
  endTime: string;
  status: string;
  appointmentType: string;
  patient?: {
    firstName: string;
    lastName: string;
  };
  doctor?: {
    firstName: string;
    lastName: string;
    specialization?: string;
  };
}

export default function AdminAppointmentsCalendarPage() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    fetchAppointmentsForRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentDate]);

  const fetchAppointmentsForRange = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(currentDate, viewMode);
      const startDate = start.toISOString().split("T")[0];
      const endDate = end.toISOString().split("T")[0];

      const response = await api.getAppointments({ startDate, endDate });
      setAppointments((response.appointments || []) as CalendarAppointment[]);
    } catch (error) {
      console.error("Failed to fetch calendar appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const { weeks, weekDays, weekSlots } = useMemo(
    () => buildCalendar(currentDate, appointments, viewMode),
    [currentDate, appointments, viewMode]
  );

  const goPrevious = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const goNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  const title = useMemo(() => {
    const formatter =
      viewMode === "month"
        ? new Intl.DateTimeFormat("sr-RS", { month: "long", year: "numeric" })
        : new Intl.DateTimeFormat("sr-RS", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
    return formatter.format(currentDate);
  }, [currentDate, viewMode]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2C6975]">
              Kalendar pregleda
            </h1>
            <p className="text-gray-600 mt-1">
              Pregled svih zakazanih pregleda u mesečnom ili nedeljnom prikazu
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1 text-sm rounded-l-lg ${
                  viewMode === "month"
                    ? "bg-[#6BB2A0] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Mesec
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1 text-sm rounded-r-lg ${
                  viewMode === "week"
                    ? "bg-[#6BB2A0] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Nedelja
              </button>
            </div>

            <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
              <button
                onClick={goPrevious}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded-l-lg"
              >
                ←
              </button>
              <button
                onClick={goToday}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                Danas
              </button>
              <button
                onClick={goNext}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded-r-lg"
              >
                →
              </button>
            </div>

            <div className="text-sm text-gray-700 font-medium">{title}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Učitavanje...</div>
          ) : viewMode === "month" ? (
            <MonthView weeks={weeks} />
          ) : (
            <WeekView weekDays={weekDays} slots={weekSlots} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function getDateRange(date: Date, viewMode: ViewMode) {
  const start = new Date(date);
  const end = new Date(date);

  if (viewMode === "month") {
    // first day of month
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    // last day of month
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else {
    // week: Monday–Sunday around current date
    const day = date.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = (day + 6) % 7; // 0 for Mon
    start.setDate(date.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);

    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

function buildCalendar(
  currentDate: Date,
  appointments: CalendarAppointment[],
  viewMode: ViewMode
) {
  // Normalize appointments by date key
  const appointmentsByDay: Record<string, CalendarAppointment[]> = {};
  appointments.forEach((apt) => {
    const dateKey = new Date(apt.date).toISOString().split("T")[0];
    if (!appointmentsByDay[dateKey]) appointmentsByDay[dateKey] = [];
    appointmentsByDay[dateKey].push(apt);
  });

  if (viewMode === "month") {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Start from Monday of the first week
    const start = new Date(firstOfMonth);
    const startDay = (start.getDay() + 6) % 7; // 0=Mon
    start.setDate(start.getDate() - startDay);

    // End at Sunday of the last week
    const end = new Date(lastOfMonth);
    const endDay = (end.getDay() + 6) % 7;
    end.setDate(end.getDate() + (6 - endDay));

    const weeks: {
      days: {
        date: Date;
        isCurrentMonth: boolean;
        key: string;
        appointments: CalendarAppointment[];
      }[];
    }[] = [];

    const cursor = new Date(start);
    while (cursor <= end) {
      const weekDays: {
        date: Date;
        isCurrentMonth: boolean;
        key: string;
        appointments: CalendarAppointment[];
      }[] = [];
      for (let i = 0; i < 7; i++) {
        const key = cursor.toISOString().split("T")[0];
        weekDays.push({
          date: new Date(cursor),
          isCurrentMonth: cursor.getMonth() === month,
          key,
          appointments: appointmentsByDay[key] || [],
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push({ days: weekDays });
    }

    return { weeks, weekDays: [], weekSlots: [] };
  }

  // Week view
  const day = currentDate.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().split("T")[0];
    return {
      date: d,
      key,
      appointments: appointmentsByDay[key] || [],
    };
  });

  // Time slots from 08:00 to 18:00, every 60 min
  const slots: {
    time: string;
    items: { [dayKey: string]: CalendarAppointment[] };
  }[] = [];

  for (let hour = 8; hour <= 18; hour++) {
    const timeLabel = `${hour.toString().padStart(2, "0")}:00`;
    const slot: {
      time: string;
      items: { [dayKey: string]: CalendarAppointment[] };
    } = { time: timeLabel, items: {} };

    weekDays.forEach((d) => {
      const key = d.key;
      slot.items[key] = (appointmentsByDay[key] || []).filter((apt) => {
        // Rough match: appointment that starts within this hour
        const [h] = apt.startTime.split(":").map(Number);
        return h === hour;
      });
    });

    slots.push(slot);
  }

  return { weeks: [], weekDays, weekSlots: slots };
}

function MonthView({
  weeks,
}: {
  weeks: {
    days: {
      date: Date;
      isCurrentMonth: boolean;
      key: string;
      appointments: CalendarAppointment[];
    }[];
  }[];
}) {
  const dayNames = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-px bg-gray-200 text-xs font-medium text-gray-600 rounded-t-lg overflow-hidden">
        {dayNames.map((d) => (
          <div key={d} className="bg-gray-50 px-2 py-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-rows-6 gap-px bg-gray-200 rounded-b-lg overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-px">
            {week.days.map((day) => (
              <div
                key={day.key}
                className={`min-h-[90px] bg-white p-1.5 flex flex-col ${
                  day.isCurrentMonth ? "" : "bg-gray-50 text-gray-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">
                    {day.date.getDate()}
                  </span>
                  {day.appointments.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary-dark">
                      {day.appointments.length}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {day.appointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt._id}
                      className="text-[10px] px-1 py-0.5 rounded bg-primary-light/40 text-primary-dark truncate"
                    >
                      {apt.startTime} {apt.patient?.firstName}{" "}
                      {apt.patient?.lastName}
                    </div>
                  ))}
                  {day.appointments.length > 3 && (
                    <div className="text-[10px] text-gray-500">
                      +{day.appointments.length - 3} još
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({
  weekDays,
  slots,
}: {
  weekDays: {
    date: Date;
    key: string;
    appointments: CalendarAppointment[];
  }[];
  slots: {
    time: string;
    items: { [dayKey: string]: CalendarAppointment[] };
  }[];
}) {
  const dayNames = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

  return (
    <div className="w-full overflow-x-auto text-xs">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b border-gray-200">
          <div className="bg-gray-50" />
          {weekDays.map((d, idx) => (
            <div
              key={d.key}
              className="bg-gray-50 px-2 py-2 border-l border-gray-200 text-center"
            >
              <div className="font-semibold text-gray-700">{dayNames[idx]}</div>
              <div className="text-gray-500 text-[11px]">
                {d.date.getDate()}.{d.date.getMonth() + 1}.
              </div>
            </div>
          ))}
        </div>
        <div className="max-h-[520px] overflow-y-auto">
          {slots.map((slot) => (
            <div
              key={slot.time}
              className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b border-gray-100"
            >
              <div className="px-2 py-2 text-right text-gray-500">
                {slot.time}
              </div>
              {weekDays.map((d) => {
                const items = slot.items[d.key] || [];
                return (
                  <div
                    key={d.key}
                    className="border-l border-gray-100 px-1 py-1 min-h-[40px]"
                  >
                    <div className="space-y-1">
                      {items.map((apt) => (
                        <div
                          key={apt._id}
                          className="px-1 py-0.5 rounded bg-primary-light/60 text-primary-dark text-[10px] leading-tight"
                        >
                          <div className="font-semibold truncate">
                            {apt.patient?.firstName} {apt.patient?.lastName}
                          </div>
                          <div className="truncate">
                            {apt.doctor?.firstName} {apt.doctor?.lastName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
