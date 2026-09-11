import type { ApplicationStatus } from "@/lib/database.types";

const STYLES: Record<ApplicationStatus, string> = {
  draft: "bg-slate-800 text-slate-300",
  submitted: "bg-amber-500/15 text-amber-300",
  accepted: "bg-emerald-500/15 text-emerald-300",
  waitlisted: "bg-sky-500/15 text-sky-300",
  rejected: "bg-rose-500/15 text-rose-300",
};

const LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
