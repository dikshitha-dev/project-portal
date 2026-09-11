import { supabase } from "../supabase/client";
import type { LoginPayload, RegisterPayload, User } from "@/types";

export const authService = {
  async login({ email, username, password }: LoginPayload) {
    const userEmail = email || (username ? `${username}@candidate.portal` : "");
    if (!userEmail) {
      throw new Error("Email or username is required");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    });

    if (error || !data.user) {
      throw new Error(error?.message || "Invalid credentials");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    const user: User = {
      id: data.user.id,
      name: profile?.name || data.user.email?.split("@")[0] || "User",
      email: data.user.email || "",
      role: profile?.role || "candidate",
      profile_image: profile?.profile_image || null,
      created_at: profile?.created_at || new Date().toISOString(),
    };

    return {
      message: "Login successful",
      token: data.session?.access_token || "",
      user,
    };
  },

  async register({ name, username, email, password }: RegisterPayload) {
    const userName = name || username || "User";
    const userEmail = email || `${userName.toLowerCase().replace(/[^a-z0-9]/g, "")}@candidate.portal`;

    const { data, error } = await supabase.auth.signUp({
      email: userEmail,
      password,
      options: {
        data: {
          name: userName,
          role: "candidate", // Strictly default public registration to candidate
        },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || "Registration failed");
    }

    // Explicit upsert to ensure profile is initialized
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        name: userName,
        email: userEmail,
        role: "candidate",
      },
      { onConflict: "id" }
    );

    const user: User = {
      id: data.user.id,
      name: userName,
      email: userEmail,
      role: "candidate",
      created_at: new Date().toISOString(),
    };

    return {
      message: "User registered successfully",
      token: data.session?.access_token || "",
      user,
    };
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getMe(): Promise<{ user: User }> {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      throw new Error("Unauthenticated");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    const user: User = {
      id: authUser.id,
      name: profile?.name || authUser.email?.split("@")[0] || "User",
      email: authUser.email || "",
      role: profile?.role || "candidate",
      profile_image: profile?.profile_image || null,
      created_at: profile?.created_at || new Date().toISOString(),
    };

    return { user };
  },

  async getCandidates(): Promise<{ candidates: User[] }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "candidate");

    if (error) throw error;
    return { candidates: (data || []) as User[] };
  },

  async getCandidate(id: string): Promise<{ candidate: User }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) throw new Error("Candidate not found");
    return { candidate: data as User };
  },
};
