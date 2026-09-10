"use client";

import { useEffect, useState, useCallback } from "react";
import { User } from "@/types";
import { getStoredUser, setStoredUser, isAuthenticated } from "@/lib/auth";
import { authAPI } from "@/lib/api";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  /** Re-fetch the current user from the server */
  refresh: () => Promise<void>;
}

/**
 * Hook that provides the currently authenticated user.
 *
 * - Starts as null on both server and client (avoids hydration mismatch)
 * - Hydrates from localStorage after mount, then verifies with the server
 * - Updates localStorage cache on success
 *
 * @example
 * const { user, loading } = useAuth();
 * if (loading) return <Spinner />;
 * if (!user) return null;
 */
export function useAuth(): UseAuthReturn {
  // Always start null so SSR and the first client render match.
  // Reading localStorage in useState causes hydration errors in Navbar/Sidebar.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getMe();
      const serverUser = res.data.user;
      setStoredUser(serverUser);
      setUser(serverUser);
    } catch {
      // Token invalid — clear user but don't redirect (AuthGuard handles that)
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getStoredUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }
    refresh();
  }, [refresh]);

  return { user, loading, refresh };
}
