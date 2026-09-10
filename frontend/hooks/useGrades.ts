"use client";

import { useCallback, useEffect, useState } from "react";
import { Grade } from "@/types";
import { gradesAPI } from "@/lib/api";

interface UseGradesReturn {
  grades: Grade[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching a specific candidate's grades.
 *
 * @param candidateId - The candidate user ID
 * @param projectId - Optional project filter
 *
 * @example
 * const { grades, loading } = useGrades(candidateId, projectId);
 */
export function useGrades(
  candidateId: string | null | undefined,
  projectId?: string
): UseGradesReturn {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!candidateId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await gradesAPI.getCandidateGrades(candidateId, projectId);
      setGrades(res.data.grades || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to load grades.";
      setError(msg);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }, [candidateId, projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { grades, loading, error, refresh };
}

// ─── Admin variant ─────────────────────────────────────────────────────────────

interface UseAllGradesReturn {
  grades: Grade[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for admins to fetch all grades across the system.
 *
 * @example
 * const { grades, loading } = useAllGrades();
 */
export function useAllGrades(): UseAllGradesReturn {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await gradesAPI.getAll();
      setGrades(res.data.grades || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to load grades.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { grades, loading, error, refresh };
}
