"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { gradeApplication } from "@/lib/actions/applications";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { ApplicationStatus } from "@/lib/database.types";

export function GradeForm({
  applicationId,
  initialStatus,
  initialScore,
  initialNotes,
}: {
  applicationId: string;
  initialStatus: ApplicationStatus;
  initialScore: number | null;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [score, setScore] = useState(initialScore?.toString() ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await gradeApplication(applicationId, {
        status,
        organizerScore: score ? Number(score) : null,
        organizerNotes: notes,
      });
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Decision" htmlFor="status">
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
          >
            <option value="submitted">Submitted (no decision yet)</option>
            <option value="accepted">Accept</option>
            <option value="waitlisted">Waitlist</option>
            <option value="rejected">Reject</option>
          </Select>
        </Field>
        <Field label="Your score (1-10)" htmlFor="score">
          <Input
            id="score"
            type="number"
            min={1}
            max={10}
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Notes (internal, other organizers can see this)" htmlFor="notes">
        <Textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-redstone-500">{error}</p>}
      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save decision"}
        </Button>
        {saved && !isPending && <span className="text-xs text-bamboo-700">Saved</span>}
      </div>
    </div>
  );
}
