import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-20 px-6 py-20">
      <section className="flex flex-col items-start gap-6">
        <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-300">
          Applications open
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Apply to hack, or apply to judge — in one portal.
        </h1>
        <p className="max-w-xl text-slate-400">
          HackPortal is a lightweight application portal for our next hackathon. Sign up, tell
          us about yourself, and track your status. Organizers review every application with
          AI-assisted triage to keep decisions fast and fair.
        </p>
        <div className="flex gap-3">
          <Link href="/signup">
            <Button>Start an application</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">I already have an account</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-white">Apply as a Hacker</h2>
          <p className="mt-2 text-sm text-slate-400">
            Tell us about your background, skills, and what you want to build. Takes about five
            minutes.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-white">Apply as a Judge</h2>
          <p className="mt-2 text-sm text-slate-400">
            Bring your expertise to evaluate demos. Tell us your background and availability for
            the event.
          </p>
        </Card>
      </section>
    </div>
  );
}
