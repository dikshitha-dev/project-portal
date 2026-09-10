"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout, AuthGuard, LoadingSpinner } from "@/components";

export default function AdminWeekPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/projects");
  }, [router]);

  return (
    <AuthGuard requiredRole="admin">
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-4 text-sm font-medium">
            Redirecting to Projects Dashboard...
          </p>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
