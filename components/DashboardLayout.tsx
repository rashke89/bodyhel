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
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [organizationInfo, setOrganizationInfo] = useState<any>(null);

  // No redirect logic - just check if user exists

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      fetchNotificationsSummary();
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchOrganization = async () => {
      if (!user || user.role !== "admin" || !user.organization) {
        setOrganizationInfo(null);
        return;
      }

      try {
        const response = await api.getMyOrganization();
        if (isMounted) {
          setOrganizationInfo(response.organization || null);
        }
      } catch (error) {
        if (isMounted) {
          setOrganizationInfo(null);
        }
      }
    };

    fetchOrganization();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (error) {
      // Silently fail - don't log errors
    }
  };

  const fetchNotificationsSummary = async () => {
    try {
      const [countRes] = await Promise.all([api.getNotificationsUnreadCount()]);
      setNotificationCount(countRes.unreadCount);
    } catch (error) {
      // Silent fail
    }
  };

  const fetchNotifications = async () => {
    if (notificationsLoading) return;
    setNotificationsLoading(true);
    try {
      const res = await api.getNotifications({ limit: 10 });
      setNotifications(res.notifications || []);
      setNotificationsLoaded(true);
      // We don't force mark-as-read here; only when user clicks
    } catch (error) {
      // Silent
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleToggleNotifications = () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (nextOpen && !notificationsLoaded) {
      fetchNotifications();
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchPanel(false);
      setSearchError("");
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    try {
      const res = await api.globalSearch(searchQuery.trim());
      setSearchResults(res.results);
      setShowSearchPanel(true);
    } catch (error: any) {
      setSearchError(error.message || "Pretraga nije uspela");
      setSearchResults(null);
      setShowSearchPanel(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchNavigate = (href: string) => {
    setShowSearchPanel(false);
    setSearchResults(null);
    setSearchQuery("");
    router.push(href);
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
      setNotificationCount((prev) => (prev > 0 ? prev - 1 : 0));
      api.markNotificationAsRead(notification._id).catch(() => undefined);
    }
    handleSearchNavigate(notification.link || pathname);
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
          // {
          //   href: "/dashboard/patient/messages",
          //   label: "Poruke",
          //   icon: "💬",
          //   badge: unreadCount,
          // },
          // {
          //   href: "/dashboard/patient/telemedicine",
          //   label: "Telemedicina",
          //   icon: "📹",
          // },
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
          // {
          //   href: "/dashboard/doctor/messages",
          //   label: "Poruke",
          //   icon: "💬",
          //   badge: unreadCount,
          // },
          // {
          //   href: "/dashboard/doctor/telemedicine",
          //   label: "Telemedicina",
          //   icon: "📹",
          // },
        ];
      case "admin": {
        const items = [
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
          // {
          //   href: "/dashboard/admin/messages",
          //   label: "Poruke",
          //   icon: "💬",
          //   badge: unreadCount,
          // },
        ];

        if (user.organization) {
          items.push({
            href: "/dashboard/admin/settings",
            label: "Podešavanja",
            icon: "⚙️",
          });
        } else {
          items.push({
            href: "/dashboard/admin/organizations",
            label: "Organizacije",
            icon: "🏥",
          });
        }

        return items;
      }
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
  const dashboardHref = `/dashboard/${user.role}`;
  const isNavItemActive = (href: string) => {
    if (!pathname) return false;
    if (href === dashboardHref) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const userOrg = (user as any)?.organization;
  const organizationName =
    organizationInfo?.name ||
    (typeof userOrg === "object" ? userOrg?.name : "") ||
    "";
  const organizationLogo =
    organizationInfo?.logoUrl ||
    (typeof userOrg === "object" ? userOrg?.logoUrl : "") ||
    "";

  return (
    <div className="min-h-screen bg-[#E0ECDE]">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md relative z-40">
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
              {/* Global search */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden md:flex items-center bg-gray-100 rounded-full px-3 py-1 mr-2"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pretraga..."
                  className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 w-40"
                />
                <button
                  type="submit"
                  className="text-gray-500 hover:text-[#2C6975]"
                >
                  🔍
                </button>
              </form>
              <div className="hidden md:block text-sm text-gray-700">
                <span className="font-semibold">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-gray-500 ml-2">({user.role})</span>
              </div>
              {/* Notifications bell */}
              <button
                onClick={handleToggleNotifications}
                className="relative p-2 rounded-full hover:bg-gray-100"
                aria-label="Notifikacije"
              >
                <span className="text-xl">🔔</span>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
              <button
                onClick={logout}
                className="hidden lg:inline-flex px-4 py-2 text-sm text-white bg-[#2C6975] rounded-lg hover:bg-[#1f4d57] transition-colors"
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
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:transition-none lg:pt-0`}
        >
          <div className="h-full flex flex-col pt-2 pb-4">
            <div className="flex-1 overflow-y-auto">
              <div className="px-2 pb-2 lg:hidden flex justify-end">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8 rounded-md text-gray-600 hover:bg-[#E0ECDE]"
                  aria-label="Zatvori meni"
                >
                  ✕
                </button>
              </div>
              <nav className="space-y-1 px-2">
                {navItems.map((item) => {
                  const isActive = isNavItemActive(item.href);
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

            <div className="mt-4 px-2 space-y-3">
              {(organizationName || organizationLogo) && (
                <div className="rounded-lg border border-[#CDE0C9] bg-[#F5FAF4] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">
                    Organizacija
                  </p>
                  <div className="mt-2 flex items-center gap-3 min-w-0">
                    {organizationLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={organizationLogo}
                        alt={organizationName || "Logo organizacije"}
                        className="h-9 w-9 rounded-md object-cover border border-[#CDE0C9]"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-md bg-[#CDE0C9] text-[#2C6975] text-xs font-bold flex items-center justify-center">
                        ORG
                      </div>
                    )}
                    <p className="text-sm font-semibold text-[#2C6975] truncate">
                      {organizationName || "Vaša organizacija"}
                    </p>
                  </div>
                </div>
              )}

              <div className="lg:hidden">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-[#2C6975] rounded-lg hover:bg-[#1f4d57] transition-colors"
                >
                  Odjavi se
                </button>
              </div>
            </div>
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
        <main className="flex-1 min-w-0 lg:ml-0 relative">
          {/* Search panel */}
          {showSearchPanel && (
            <div className="absolute inset-x-0 top-0 z-30 px-4 pt-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-2xl mx-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Rezultati pretrage
                    </p>
                    {searchLoading && (
                      <p className="text-xs text-gray-500">
                        Pretraga u toku...
                      </p>
                    )}
                    {searchError && (
                      <p className="text-xs text-red-500">{searchError}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowSearchPanel(false);
                      setSearchResults(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto p-4 space-y-4">
                  {!searchLoading &&
                    searchResults &&
                    Object.keys(searchResults).length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nema rezultata za zadatu pretragu.
                      </p>
                    )}
                  {searchResults &&
                    Object.entries(searchResults).map(([group, items]) => {
                      const list = items as any[];
                      if (!list || list.length === 0) return null;
                      const labelMap: Record<string, string> = {
                        patients: "Pacijenti",
                        users: "Korisnici",
                        appointments: "Pregledi",
                        messages: "Poruke",
                        labResults: "Lab rezultati",
                        prescriptions: "Recepti",
                      };
                      return (
                        <div key={group}>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            {labelMap[group] || group}
                          </h4>
                          <ul className="space-y-1">
                            {list.map((item) => (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSearchNavigate(item.href || "/")
                                  }
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
                                >
                                  <p className="text-sm font-medium text-gray-900">
                                    {item.title}
                                  </p>
                                  {item.subtitle && (
                                    <p className="text-xs text-gray-500">
                                      {item.subtitle}
                                    </p>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Notifications dropdown */}
          {notificationsOpen && (
            <div className="absolute right-4 top-4 z-30 w-80">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    Notifikacije
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-4 text-sm text-gray-500">
                      Učitavanje...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">
                      Trenutno nema notifikacija.
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {notifications.map((n) => (
                        <li key={n._id}>
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(n)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50"
                          >
                            <div className="flex items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {n.title}
                                </p>
                                {n.body && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {n.body}
                                  </p>
                                )}
                                <p className="text-[11px] text-gray-400 mt-1">
                                  {new Date(n.createdAt).toLocaleString(
                                    "sr-RS"
                                  )}
                                </p>
                              </div>
                              {!n.read && (
                                <span className="ml-2 mt-1 w-2 h-2 rounded-full bg-[#6BB2A0]" />
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
