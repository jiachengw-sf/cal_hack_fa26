import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { GradeForm } from "./grade-form";
import type { HackerFormData, JudgeFormData, Track } from "@/lib/database.types";

const TRACK_LABEL: Record<Track, string> = { hacker: "Hacker", judge: "Judge" };

const HACKER_FIELDS: [keyof HackerFormData, string][] = [
  ["school", "School"],
  ["graduationYear", "Graduation year"],
  ["major", "Major"],
  ["experienceLevel", "Experience level"],
  ["skills", "Skills"],
  ["whyAttend", "Why they want to attend"],
  ["builtSomethingCool", "Something cool they've built"],
  ["resumeUrl", "Resume"],
];

const JUDGE_FIELDS: [keyof JudgeFormData, string][] = [
  ["organization", "Organization"],
  ["role", "Role"],
  ["expertiseAreas", "Expertise areas"],
  ["priorJudgingExperience", "Prior judging experience"],
  ["availability", "Availability"],
  ["whyJudge", "Why they want to judge"],
];

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("*, profiles!applications_user_id_fkey(email, full_name)")
    .eq("id", id)
    .single();

  if (!app) notFound();

  const fields = app.track === "hacker" ? HACKER_FIELDS : JUDGE_FIELDS;
  const formData = app.form_data as unknown as Record<string, string>;
  const profile = app.profiles as unknown as { email: string; full_name: string | null } | null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <Link href="/organizer" className="text-sm text-slate-400 hover:text-white">
        ← Back to all applications
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {profile?.full_name || profile?.email}
          </h1>
          <p className="text-sm text-slate-400">
            {profile?.email} · {TRACK_LABEL[app.track as Track]} track
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {app.ai_summary && (
        <Card className="border-teal-500/30 bg-teal-500/5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-teal-300">AI triage summary</h2>
            {app.ai_score && (
              <span className="text-sm font-medium text-teal-300">{app.ai_score}/10</span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-300">{app.ai_summary}</p>
          <p className="mt-2 text-xs text-slate-500">
            Assistive only — not shown to the applicant, and not a decision.
          </p>
        </Card>
      )}

      <Card className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-300">Application answers</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map(([key, label]) => (
            <div key={String(key)}>
              <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">
                {formData[key as string] || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-300">Grade this application</h2>
        <GradeForm
          applicationId={app.id}
          initialStatus={app.status}
          initialScore={app.organizer_score}
          initialNotes={app.organizer_notes}
        />
      </Card>
    </div>
  );
}
