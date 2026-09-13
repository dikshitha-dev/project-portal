import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hwquhsopaceqbfczfnyi.supabase.co";
const supabaseAnonKey = "sb_publishable_Lnyl1zL2_L4RhtBVmP1yog_LdjvEfhG";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const email = "admin@portal.com";
  const password = "AdminPassword123!";
  const name = "System Admin";

  console.log(`Attempting to sign up or log in as ${email}...`);

  // Try logging in first
  let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    console.log("Login attempt failed:", loginError.message, "- Trying registration...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: "admin" }
      }
    });

    if (signUpError) {
      console.error("Sign up failed:", signUpError.message);
      return;
    }

    console.log("Sign up successful! User ID:", signUpData.user?.id);
    loginData = signUpData;

    // Login to get session token if needed
    const relogin = await supabase.auth.signInWithPassword({ email, password });
    if (relogin.data?.session) {
      loginData = relogin.data;
    }
  } else {
    console.log("Login successful! User ID:", loginData.user?.id);
  }

  const userId = loginData.user?.id;
  if (!userId) {
    console.error("No user ID found.");
    return;
  }

  // Update profile role to admin
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      name,
      email,
      role: "admin"
    }, { onConflict: "id" })
    .select();

  if (profileError) {
    console.error("Failed to update profile role to admin:", profileError.message);
  } else {
    console.log("Profile successfully updated/created with admin role:", profileData);
  }
}

main().catch(console.error);
