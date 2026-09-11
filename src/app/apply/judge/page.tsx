import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { JudgeForm } from "./judge-form";
import type { JudgeFormData } from "@/lib/database.types";

export default async function JudgeApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: application } = await supabase
    .from("applications")
    .select("status, form_data")
    .eq("user_id", user!.id)
    .eq("track", "judge")
    .maybeSingle();

  if (application && application.status !== "draft") {
    redirect("/status");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-white">Judge application</h1>
        <p className="mt-1 text-sm text-slate-400">
          You can save a draft and come back later, or submit when you&apos;re ready.
        </p>
      </div>
      <Card>
        <JudgeForm defaultValues={application?.form_data as JudgeFormData | undefined} />
      </Card>
    </div>
  );
}
