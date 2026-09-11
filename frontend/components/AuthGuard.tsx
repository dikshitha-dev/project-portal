"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth";
import { Role } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { getRoleRedirectUrl } from "@/constants/roles";
import LoadingSpinner from "./LoadingSpinner";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: Role | null;
}

export default function AuthGuard({
  children,
  requiredRole = null,
}: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      try {
        const user = await fetchCurrentUser();

        if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
          router.replace(getRoleRedirectUrl(user.role));
          return;
        }

        setAuthorized(true);
      } catch {
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    };

    verify();
  }, [router, requiredRole]);

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(248,247,255,0.8) 0%, rgba(240,238,255,0.6) 50%, rgba(245,243,255,0.8) 100%)",
        }}
      >
        <LoadingSpinner size="lg" text="Verifying authentication..." />
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
