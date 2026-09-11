import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { BambooIcon, PandaIcon } from "@/components/pixel-icons";
import { createClient } from "@/lib/supabase/server";
import { getApplicationsOpen } from "@/lib/actions/settings";

export default async function Home() {
  const supabase = await createClient();
  const applicationsOpen = await getApplicationsOpen();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "applicant" | "organizer" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "applicant";
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-20 px-6 py-20">
      <section className="flex flex-col items-start gap-6">
        <span
          className={`border-2 border-panda-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
            applicationsOpen ? "bg-gold-400 text-panda-black" : "bg-redstone-500 text-white"
          }`}
        >
          Applications {applicationsOpen ? "Open" : "Closed"}
        </span>
        <h1 className="pixel-heading max-w-2xl text-2xl text-stone-900 sm:text-3xl">
          Your next build grows here.
        </h1>
        <p className="max-w-xl text-stone-600">
          Whether you&apos;re a lazy panda or a playful one, there&apos;s room in the grove.
          Apply as a hacker or a judge, track your status, and let organizers handle the rest.
        </p>
        <div className="flex gap-3">
          {!user && applicationsOpen && (
            <>
              <Link href="/signup">
                <Button>▶ Start Building</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary">I already have an account</Button>
              </Link>
            </>
          )}
          {!user && !applicationsOpen && (
            <Link href="/login">
              <Button variant="secondary">I already have an account</Button>
            </Link>
          )}
          {user && role === "organizer" && (
            <Link href="/organizer">
              <Button>Go to organizer dashboard</Button>
            </Link>
          )}
          {user && role === "applicant" && (
            <>
              <Link href="/apply">
                <Button>Go to my applications</Button>
              </Link>
              <Link href="/status">
                <Button variant="secondary">Check my status</Button>
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <Card>
          <BambooIcon className="mb-3.5 h-9 w-9" />
          <h2 className="pixel-heading text-sm text-stone-900">Apply as a Hacker</h2>
          <p className="mt-3 text-sm text-stone-600">
            Tell us about your background, skills, and what you want to build. Takes about five
            minutes.
          </p>
        </Card>
        <Card>
          <PandaIcon className="mb-3.5 h-9 w-9" />
          <h2 className="pixel-heading text-sm text-stone-900">Apply as a Judge</h2>
          <p className="mt-3 text-sm text-stone-600">
            Bring your expertise to evaluate demos. Tell us your background and availability for
            the event.
          </p>
        </Card>
      </section>
    </div>
  );
}
