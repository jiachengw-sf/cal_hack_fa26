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

  let resumeUrl: string | null = null;
  let resumeIsUpload = false;
  if (app.track === "hacker" && formData.resumeFilePath) {
    const { data: signed } = await supabase.storage
      .from("resumes")
      .createSignedUrl(formData.resumeFilePath, 3600);
    resumeUrl = signed?.signedUrl ?? null;
    resumeIsUpload = true;
  } else if (app.track === "hacker" && formData.resumeUrl) {
    resumeUrl = formData.resumeUrl;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <Link href="/organizer" className="text-sm text-stone-600 hover:text-stone-900">
        ← Back to all applications
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="pixel-heading text-lg text-stone-900">
            {profile?.full_name || profile?.email}
          </h1>
          <p className="text-sm text-stone-600">
            {profile?.email} · {TRACK_LABEL[app.track as Track]} track
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-stone-700">Application answers</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map(([key, label]) => (
            <div key={String(key)}>
              <dt className="text-xs uppercase tracking-wide text-stone-500">{label}</dt>
              <dd className="mt-1 text-sm text-stone-800 whitespace-pre-wrap">
                {formData[key as string] || "—"}
              </dd>
            </div>
          ))}
          {app.track === "hacker" && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Resume</dt>
              <dd className="mt-1 text-sm text-stone-800">
                {resumeUrl ? (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bamboo-700 hover:underline"
                  >
                    {resumeIsUpload ? "Download uploaded resume" : "Open resume link"}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-stone-700">Grade this application</h2>
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
