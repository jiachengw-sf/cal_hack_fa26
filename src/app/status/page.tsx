import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Button } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";

const TRACK_LABEL = { hacker: "Hacker", judge: "Judge" } as const;

export default async function StatusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, track, status, submitted_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-white">Your applications</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track the status of every application you&apos;ve started.
        </p>
      </div>

      {!applications || applications.length === 0 ? (
        <Card className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">You haven&apos;t started an application yet.</p>
          <Link href="/apply">
            <Button>Start an application</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((app) => (
            <Card key={app.id} className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-medium text-white">{TRACK_LABEL[app.track]}</h2>
                <p className="text-xs text-slate-500">
                  {app.status === "draft"
                    ? "Not yet submitted"
                    : `Submitted ${new Date(app.submitted_at!).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={app.status} />
                {app.status === "draft" && (
                  <Link href={`/apply/${app.track}`}>
                    <Button variant="secondary">Continue</Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
          <Link href="/apply" className="text-sm text-teal-400 hover:underline">
            Apply to another track →
          </Link>
        </div>
      )}
    </div>
  );
}
