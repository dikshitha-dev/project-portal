"use client";

import { useCallback, useEffect, useState } from "react";
import { Submission } from "@/types";
import { submissionsAPI } from "@/lib/api";

interface UseSubmissionsReturn {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  refresh: (projectId?: string) => Promise<void>;
}

/**
 * Hook for fetching and managing the current user's submissions.
 *
 * @param projectId - If provided, filters submissions to this project
 *
 * @example
 * const { submissions, loading, error, refresh } = useSubmissions(projectId);
 */
export function useSubmissions(projectId?: string): UseSubmissionsReturn {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (pid?: string) => {
    const targetId = pid ?? projectId;
    setLoading(true);
    setError(null);
    try {
      const res = await submissionsAPI.getAll(targetId);
      setSubmissions(res.data.submissions || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to load submissions.";
      setError(msg);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { submissions, loading, error, refresh };
}

// ─── Admin variant ────────────────────────────────────────────────────────────

interface UseAllSubmissionsReturn {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for admins to fetch all submissions across the system.
 *
 * @example
 * const { submissions, loading } = useAllSubmissions();
 */
export function useAllSubmissions(): UseAllSubmissionsReturn {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await submissionsAPI.getAll();
      setSubmissions(res.data.submissions || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to load submissions.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { submissions, loading, error, refresh };
}
