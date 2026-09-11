import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import type { ApplicationStatus, Track } from "@/lib/database.types";

const TRACKS: Track[] = ["hacker", "judge"];
const TRACK_LABEL: Record<Track, string> = { hacker: "Hacker", judge: "Judge" };

const STATUSES: ApplicationStatus[] = ["submitted", "accepted", "waitlisted", "rejected"];
const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Awaiting decision",
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
};
const STATUS_COLOR: Record<ApplicationStatus, string> = {
  draft: "bg-stone-400",
  submitted: "bg-gold-400",
  accepted: "bg-bamboo-500",
  waitlisted: "bg-gold-400",
  rejected: "bg-redstone-500",
};

function Bar({ label, count, total, colorClass }: { label: string; count: number; total: number; colorClass: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-32 shrink-0 text-stone-600">{label}</div>
      <div className="h-2.5 flex-1 overflow-hidden border-2 border-panda-black bg-stone-200">
        <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-16 shrink-0 text-right text-stone-700">
        {count} ({pct}%)
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("track, status, organizer_score")
    .neq("status", "draft");

  const applications = data ?? [];
  const total = applications.length;
  const reviewed = applications.filter((a) => a.status !== "submitted").length;
  const scored = applications.filter((a) => a.organizer_score !== null);
  const avgScore =
    scored.length > 0
      ? (scored.reduce((sum, a) => sum + Number(a.organizer_score), 0) / scored.length).toFixed(1)
      : "—";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="pixel-heading text-lg text-stone-900">Analytics</h1>
        <p className="mt-1 text-sm text-stone-600">
          A quick read on volume and grading progress across both tracks.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <div className="pixel-heading text-lg text-stone-900">{total}</div>
          <div className="mt-1 text-xs text-stone-500">Submitted</div>
        </Card>
        <Card className="text-center">
          <div className="pixel-heading text-lg text-stone-900">
            {total === 0 ? "—" : `${Math.round((reviewed / total) * 100)}%`}
          </div>
          <div className="mt-1 text-xs text-stone-500">Decided</div>
        </Card>
        <Card className="text-center">
          <div className="pixel-heading text-lg text-stone-900">{avgScore}</div>
          <div className="mt-1 text-xs text-stone-500">Avg organizer score</div>
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-stone-700">Status breakdown</h2>
        <div className="flex flex-col gap-3">
          {STATUSES.map((status) => (
            <Bar
              key={status}
              label={STATUS_LABEL[status]}
              count={applications.filter((a) => a.status === status).length}
              total={total}
              colorClass={STATUS_COLOR[status]}
            />
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-stone-700">Volume by track</h2>
        <div className="flex flex-col gap-3">
          {TRACKS.map((track) => (
            <Bar
              key={track}
              label={TRACK_LABEL[track]}
              count={applications.filter((a) => a.track === track).length}
              total={total}
              colorClass="bg-bamboo-500"
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
