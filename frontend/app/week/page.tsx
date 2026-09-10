"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AppLayout,
  AuthGuard,
  WeekCard,
  LoadingSkeleton,
  ProjectSelector,
} from "@/components";
import { Week, Project, weeksAPI } from "@/lib/api";
import { Kanban, Calendar, Upload, ChevronRight, Lock } from "lucide-react";

function WeekContent() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/submit");
  }, [router]);

  return (
    <AuthGuard requiredRole="candidate">
      <AppLayout>
        <div className="py-20 text-center text-gray-500">
          <LoadingSkeleton rows={2} />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

export default function WeekPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050816] flex items-center justify-center text-white"><div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" /></div>}>
      <WeekContent />
    </Suspense>
  );
}
