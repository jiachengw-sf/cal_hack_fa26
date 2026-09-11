import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Select } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import type { ApplicationStatus, Track } from "@/lib/database.types";

const TRACK_LABEL: Record<Track, string> = { hacker: "Hacker", judge: "Judge" };

interface Row {
  id: string;
  track: Track;
  status: ApplicationStatus;
  ai_score: number | null;
  organizer_score: number | null;
  submitted_at: string | null;
  profiles: { email: string; full_name: string | null } | null;
}

export default async function OrganizerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; status?: string; q?: string }>;
}) {
  const { track, status, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select(
      "id, track, status, ai_score, organizer_score, submitted_at, profiles!applications_user_id_fkey(email, full_name)"
    )
    .neq("status", "draft")
    .order("submitted_at", { ascending: false });

  if (track) query = query.eq("track", track as Track);
  if (status) query = query.eq("status", status as ApplicationStatus);

  const { data } = await query;
  const applications = (data ?? []) as unknown as Row[];

  const filtered = q
    ? applications.filter((app) => {
        const haystack = `${app.profiles?.full_name ?? ""} ${app.profiles?.email ?? ""}`.toLowerCase();
        return haystack.includes(q.toLowerCase());
      })
    : applications;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-white">Applications</h1>
        <p className="mt-1 text-sm text-slate-400">
          {filtered.length} application{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or email…"
          className="w-64 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
        />
        <Select name="track" defaultValue={track ?? ""} className="w-40">
          <option value="">All tracks</option>
          <option value="hacker">Hacker</option>
          <option value="judge">Judge</option>
        </Select>
        <Select name="status" defaultValue={status ?? ""} className="w-40">
          <option value="">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="accepted">Accepted</option>
          <option value="waitlisted">Waitlisted</option>
          <option value="rejected">Rejected</option>
        </Select>
        <button
          type="submit"
          className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400"
        >
          Filter
        </button>
      </form>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Track</th>
              <th className="px-4 py-3">AI score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => (
              <tr key={app.id} className="border-b border-slate-800/60 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/organizer/applications/${app.id}`}
                    className="font-medium text-white hover:text-teal-400"
                  >
                    {app.profiles?.full_name || app.profiles?.email || "Unknown"}
                  </Link>
                  <div className="text-xs text-slate-500">{app.profiles?.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-300">{TRACK_LABEL[app.track]}</td>
                <td className="px-4 py-3 text-slate-300">
                  {app.ai_score ? `${app.ai_score}/10` : "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={app.status} />
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No applications match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
