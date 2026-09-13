import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hwquhsopaceqbfczfnyi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Lnyl1zL2_L4RhtBVmP1yog_LdjvEfhG";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createAdminAccount(
  email = "admin@portal.com",
  password = "AdminPassword123!",
  name = "System Admin"
) {
  console.log(`\n======================================================`);
  console.log(`Setting up Admin account for: ${email}`);
  console.log(`======================================================\n`);

  // 1. Attempt Sign in
  let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    console.log(`Notice: Login with existing credentials failed (${loginError.message}). Registering user...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: "admin" }
      }
    });

    if (signUpError) {
      console.error(`❌ Registration failed: ${signUpError.message}`);
      return { success: false, error: signUpError.message };
    }

    console.log(`✅ Auth user registered successfully! User ID: ${signUpData.user?.id}`);
    
    // Retry login to ensure authenticated session
    const relogin = await supabase.auth.signInWithPassword({ email, password });
    if (relogin.data?.session) {
      loginData = relogin.data;
    } else {
      loginData = signUpData;
    }
  } else {
    console.log(`✅ Login successful for existing auth user. User ID: ${loginData.user?.id}`);
  }

  const userId = loginData.user?.id;
  if (!userId) {
    return { success: false, error: "Could not retrieve user ID" };
  }

  // 2. Ensure profile table has admin role
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        name,
        email,
        role: "admin",
      },
      { onConflict: "id" }
    )
    .select();

  if (profileError) {
    if (profileError.code === "PGRST205" || profileError.message?.includes("schema cache")) {
      console.error(`\n⚠️ DATABASE SCHEMA MISSING!`);
      console.error(`The table 'public.profiles' does not exist in your Supabase project yet.`);
      console.error(`Please run the SQL schema migration in Supabase SQL Editor:`);
      console.error(`File path: supabase/migrations/001_complete_schema.sql\n`);
      return { success: false, error: "Schema missing. Execute migrations in Supabase SQL Editor." };
    }
    console.error(`❌ Profile update failed: ${profileError.message}`);
    return { success: false, error: profileError.message };
  }

  console.log(`🎉 Success! Admin profile active with role 'admin'.`);
  return { success: true, user: loginData.user, profile: profileData };
}

createAdminAccount().catch(console.error);
