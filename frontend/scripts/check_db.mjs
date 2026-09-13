import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hwquhsopaceqbfczfnyi.supabase.co";
const supabaseAnonKey = "sb_publishable_Lnyl1zL2_L4RhtBVmP1yog_LdjvEfhG";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from("profiles").select("*").limit(5);
  console.log("Profiles check:", { data, error });
}

check();
