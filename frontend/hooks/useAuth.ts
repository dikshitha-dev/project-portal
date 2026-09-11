"use client";

import { useEffect, useState, useCallback } from "react";
import { User } from "@/types";
import { supabase } from "@/lib/supabase/client";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const currentUser: User = {
        id: userId,
        name: profile?.name || email?.split("@")[0] || "User",
        email: profile?.email || email || "",
        role: profile?.role || "candidate",
        profile_image: profile?.profile_image || null,
        created_at: profile?.created_at || new Date().toISOString(),
      };

      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    await fetchProfile(session.user.id, session.user.email);
  }, [fetchProfile]);

  useEffect(() => {
    refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh, fetchProfile]);

  return { user, loading, refresh };
}
