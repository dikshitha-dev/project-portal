"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser, Role } from "@/lib/auth";
import LoadingSpinner from "./LoadingSpinner";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: Role | Role[] | null;
  allowAdminOverride?: boolean;
}

export default function AuthGuard({
  children,
  requiredRole = null,
  allowAdminOverride = false,
}: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const user = await fetchCurrentUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        if (requiredRole) {
          const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          const hasRole =
            roles.includes(user.role) || (allowAdminOverride && user.role === "admin");

          if (!hasRole) {
            const redirectUrl = user.role === "admin" ? "/admin/dashboard" : "/candidate/dashboard";
            router.replace(redirectUrl);
            return;
          }
        }

        setAuthorized(true);
      } catch {
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    };

    verify();
  }, [router, requiredRole, allowAdminOverride]);

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(248,247,255,0.8) 0%, rgba(240,238,255,0.6) 50%, rgba(245,243,255,0.8) 100%)",
        }}
      >
        <LoadingSpinner size="lg" text="Verifying authorization..." />
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
