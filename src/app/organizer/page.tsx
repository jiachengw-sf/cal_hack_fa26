import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Input, Select } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { ApplicationsToggle } from "@/components/applications-toggle";
import { getApplicationsOpen } from "@/lib/actions/settings";
import type { ApplicationStatus, Track } from "@/lib/database.types";

const TRACK_LABEL: Record<Track, string> = { hacker: "Hacker", judge: "Judge" };

interface Row {
  id: string;
  track: Track;
  status: ApplicationStatus;
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
  const applicationsOpen = await getApplicationsOpen();

  let query = supabase
    .from("applications")
    .select(
      "id, track, status, organizer_score, submitted_at, profiles!applications_user_id_fkey(email, full_name)"
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="pixel-heading text-xl text-stone-900">Applications</h1>
          <p className="mt-2 text-sm text-stone-600">
            {filtered.length} application{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <ApplicationsToggle initialOpen={applicationsOpen} />
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <Input name="q" defaultValue={q} placeholder="Search name or email…" className="w-64" />
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
        <Button type="submit">Filter</Button>
      </form>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b-2 border-panda-black text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Track</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => (
              <tr key={app.id} className="border-b border-stone-200 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/organizer/applications/${app.id}`}
                    className="font-medium text-stone-900 hover:text-bamboo-700"
                  >
                    {app.profiles?.full_name || app.profiles?.email || "Unknown"}
                  </Link>
                  <div className="text-xs text-stone-500">{app.profiles?.email}</div>
                </td>
                <td className="px-4 py-3 text-stone-700">{TRACK_LABEL[app.track]}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={app.status} />
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
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
