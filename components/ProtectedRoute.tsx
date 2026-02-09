"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      console.log("token", token);
      console.log("user", user);
      if (!token || !user) {
        // Store the intended destination
        const returnUrl = pathname || "/dashboard";
        console.log("returnUrl", returnUrl);
        // router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // Check role if required
      if (requiredRole && requiredRole.length > 0) {
        if (!user.role || !requiredRole.includes(user.role)) {
          // Redirect to appropriate dashboard based on role
          const dashboardPath = getDashboardPath(user.role);
          router.push(dashboardPath);
        }
      }
    }
  }, [user, loading, router, pathname, requiredRole]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#2C6975] text-xl">Učitavanje...</div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  // Check role access
  if (requiredRole && requiredRole.length > 0) {
    if (!requiredRole.includes(user.role)) {
      return null;
    }
  }

  return <>{children}</>;
}

function getDashboardPath(role: string): string {
  switch (role) {
    case "patient":
      return "/dashboard/patient";
    case "doctor":
    case "nurse":
      return "/dashboard/doctor";
    case "admin":
      return "/dashboard/admin";
    case "receptionist":
      return "/dashboard/receptionist";
    default:
      return "/dashboard";
  }
}
