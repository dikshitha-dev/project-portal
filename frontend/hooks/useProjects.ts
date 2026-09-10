"use client";

import { useCallback, useEffect, useState } from "react";
import { Project } from "@/types";
import { projectsAPI } from "@/lib/api";

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refresh: (search?: string) => Promise<void>;
}

/**
 * Hook for fetching projects the current user is a member of.
 *
 * @example
 * const { projects, loading, error, refresh } = useProjects();
 */
export function useProjects(initialSearch?: string): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectsAPI.getAll(search ?? initialSearch);
      setProjects(res.data.projects || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to load projects.";
      setError(msg);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [initialSearch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { projects, loading, error, refresh };
}

// ─── Discover variant ─────────────────────────────────────────────────────────

/**
 * Hook for fetching publicly discoverable projects (for candidates to join).
 *
 * @example
 * const { projects: discoverProjects, loading } = useDiscoverProjects();
 */
export function useDiscoverProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectsAPI.getDiscover(search);
      setProjects(res.data.projects || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to load projects.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { projects, loading, error, refresh };
}
