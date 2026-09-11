import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function syncUserToSupabase(user: { id: string; name: string; email: string; role: string }) {
  try {
    const { data, error } = await supabase.from("users").upsert(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) {
      console.warn("Supabase user sync error:", error.message);
    } else {
      console.log("User synchronized to Supabase:", user.id);
    }
    return { data, error };
  } catch (err) {
    console.error("Failed to sync user to Supabase:", err);
    return { data: null, error: err };
  }
}
