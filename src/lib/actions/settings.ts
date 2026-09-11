"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getApplicationsOpen(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("applications_open")
    .eq("id", 1)
    .single();
  return data?.applications_open ?? true;
}

export interface ToggleState {
  error?: string;
}

export async function toggleApplicationsOpen(open: boolean): Promise<ToggleState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("settings")
    .update({ applications_open: open, updated_by: user.id })
    .eq("id", 1);

  if (error) return { error: error.message };

  // Revalidate every page that reads this flag so the change is visible
  // everywhere immediately, not just to the organizer who flipped it.
  revalidatePath("/", "layout");
  return {};
}
