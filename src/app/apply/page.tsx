import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import type { Track } from "@/lib/database.types";

const TRACKS: { track: Track; title: string; description: string }[] = [
  {
    track: "hacker",
    title: "Hacker",
    description: "Join the event and build a project with a team over the weekend.",
  },
  {
    track: "judge",
    title: "Judge",
    description: "Evaluate final project demos and help decide the winners.",
  },
];

export default async function ApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: applications } = await supabase
    .from("applications")
    .select("track, status")
    .eq("user_id", user!.id);

  const byTrack = new Map(applications?.map((a) => [a.track, a.status]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-white">Choose an application</h1>
        <p className="mt-1 text-sm text-slate-400">
          You can apply to more than one track. Each has its own short form.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {TRACKS.map(({ track, title, description }) => {
          const status = byTrack.get(track);
          const isLocked = status && status !== "draft";

          return (
            <Card key={track} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                {status && <StatusBadge status={status} />}
              </div>
              <p className="flex-1 text-sm text-slate-400">{description}</p>
              {isLocked ? (
                <Link href="/status">
                  <Button variant="secondary" className="w-full">
                    View status
                  </Button>
                </Link>
              ) : (
                <Link href={`/apply/${track}`}>
                  <Button className="w-full">
                    {status === "draft" ? "Continue application" : "Start application"}
                  </Button>
                </Link>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
