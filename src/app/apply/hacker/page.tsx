import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { HackerForm } from "./hacker-form";
import type { HackerFormData } from "@/lib/database.types";

export default async function HackerApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: application } = await supabase
    .from("applications")
    .select("status, form_data")
    .eq("user_id", user!.id)
    .eq("track", "hacker")
    .maybeSingle();

  if (application && application.status !== "draft") {
    redirect("/status");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="pixel-heading text-lg text-stone-900">Hacker application</h1>
        <p className="mt-1 text-sm text-stone-600">
          You can save a draft and come back later, or submit when you&apos;re ready.
        </p>
      </div>
      <Card>
        <HackerForm
          userId={user!.id}
          defaultValues={application?.form_data as HackerFormData | undefined}
        />
      </Card>
    </div>
  );
}
