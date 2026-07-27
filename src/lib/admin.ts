import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile, error } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .single<{ id: string }>();

  if (error || !profile) {
    redirect("/admin/login");
  }

  return { supabase, user };
}

