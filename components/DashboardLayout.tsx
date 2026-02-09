"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // No redirect logic - just check if user exists

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (error) {
      // Silently fail - don't log errors
    }
  };

  // If no user, try to load from localStorage
  if (!user) {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (storedUser && token) {
        try {
          const parsed = JSON.parse(storedUser);
          // User will be set by AuthContext, just show loading
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-[#2C6975] text-xl">Učitavanje...</div>
            </div>
          );
        } catch (e) {
          // Invalid stored user
        }
      }
    }
    // No user and no stored data - redirect to login
    router.push("/login");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#2C6975] text-xl">Učitavanje...</div>
      </div>
    );
  }

  const getNavItems = () => {
    switch (user.role) {
      case "patient":
        return [
          { href: "/dashboard/patient", label: "Dashboard", icon: "📊" },
          {
            href: "/dashboard/patient/appointments",
            label: "Pregledi",
            icon: "📅",
          },
          {
            href: "/dashboard/patient/medical-records",
            label: "Medicinski zapisi",
            icon: "📋",
          },
          {
            href: "/dashboard/patient/prescriptions",
            label: "Recepti",
            icon: "💊",
          },
          {
            href: "/dashboard/patient/lab-results",
            label: "Lab rezultati",
            icon: "🔬",
          },
          {
            href: "/dashboard/patient/messages",
            label: "Poruke",
            icon: "💬",
            badge: unreadCount,
          },
          {
            href: "/dashboard/patient/telemedicine",
            label: "Telemedicina",
            icon: "📹",
          },
        ];
      case "doctor":
      case "nurse":
        return [
          { href: "/dashboard/doctor", label: "Dashboard", icon: "📊" },
          {
            href: "/dashboard/doctor/appointments",
            label: "Pregledi",
            icon: "📅",
          },
          {
            href: "/dashboard/doctor/patients",
            label: "Pacijenti",
            icon: "👥",
          },
          {
            href: "/dashboard/doctor/prescriptions",
            label: "Recepti",
            icon: "💊",
          },
          {
            href: "/dashboard/doctor/lab-results",
            label: "Lab rezultati",
            icon: "🔬",
          },
          {
            href: "/dashboard/doctor/messages",
            label: "Poruke",
            icon: "💬",
            badge: unreadCount,
          },
          {
            href: "/dashboard/doctor/telemedicine",
            label: "Telemedicina",
            icon: "📹",
          },
        ];
      case "admin":
        return [
          { href: "/dashboard/admin", label: "Dashboard", icon: "📊" },
          { href: "/dashboard/admin/users", label: "Korisnici", icon: "👥" },
          {
            href: "/dashboard/admin/appointments",
            label: "Pregledi",
            icon: "📅",
          },
          { href: "/dashboard/admin/reports", label: "Izveštaji", icon: "📈" },
          {
            href: "/dashboard/admin/audit-logs",
            label: "Audit logovi",
            icon: "📝",
          },
          {
            href: "/dashboard/admin/messages",
            label: "Poruke",
            icon: "💬",
            badge: unreadCount,
          },
        ];
      case "receptionist":
        return [
          { href: "/dashboard/receptionist", label: "Dashboard", icon: "📊" },
          {
            href: "/dashboard/receptionist/appointments",
            label: "Pregledi",
            icon: "📅",
          },
          {
            href: "/dashboard/receptionist/patients",
            label: "Pacijenti",
            icon: "👥",
          },
          {
            href: "/dashboard/receptionist/messages",
            label: "Poruke",
            icon: "💬",
            badge: unreadCount,
          },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#E0ECDE]">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <Link
                href={`/dashboard/${user.role}`}
                className="ml-4 lg:ml-0 flex items-center"
              >
                <span className="text-2xl font-bold text-[#2C6975]">
                  BodyHel
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-700">
                <span className="font-semibold">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-gray-500 ml-2">({user.role})</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-white bg-[#2C6975] rounded-lg hover:bg-[#1f4d57] transition-colors"
              >
                Odjavi se
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:transition-none pt-16 lg:pt-0`}
        >
          <div className="h-full overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#6BB2A0] text-white"
                        : "text-gray-700 hover:bg-[#CDE0C9]"
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
