"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateAiReview } from "@/lib/ai-review";
import type { ApplicationStatus, FormData as AppFormData, Track } from "@/lib/database.types";

export interface FormState {
  error?: string;
}

async function upsertDraft(track: Track, data: AppFormData, userId: string) {
  const supabase = await createClient();
  return supabase
    .from("applications")
    .upsert(
      { user_id: userId, track, form_data: data, status: "draft" },
      { onConflict: "user_id,track", ignoreDuplicates: false }
    )
    .select("id")
    .single();
}

export async function saveApplicationDraft(
  track: Track,
  data: AppFormData
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await upsertDraft(track, data, user.id);
  if (error) return { error: error.message };
  return {};
}

export async function submitApplication(
  track: Track,
  data: AppFormData
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: row, error } = await upsertDraft(track, data, user.id);
  if (error || !row) return { error: error?.message ?? "Could not save application." };

  const { error: submitError } = await supabase
    .from("applications")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", row.id);
  if (submitError) return { error: submitError.message };

  // Best-effort AI triage; failures here should never block a submission.
  try {
    const review = await generateAiReview(track, data);
    if (review) {
      await supabase
        .from("applications")
        .update({ ai_score: review.score, ai_summary: review.summary })
        .eq("id", row.id);
    }
  } catch (err) {
    console.error("AI review failed", err);
  }

  redirect("/status");
}

export async function gradeApplication(
  applicationId: string,
  update: {
    status: ApplicationStatus;
    organizerScore: number | null;
    organizerNotes: string;
  }
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("applications")
    .update({
      status: update.status,
      organizer_score: update.organizerScore,
      organizer_notes: update.organizerNotes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  revalidatePath(`/organizer/applications/${applicationId}`);
  revalidatePath("/organizer");
  return {};
}
