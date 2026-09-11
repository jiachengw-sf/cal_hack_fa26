import type { ApplicationStatus } from "@/lib/database.types";

const STYLES: Record<ApplicationStatus, string> = {
  draft: "bg-stone-300 text-stone-800",
  submitted: "bg-gold-400 text-panda-black",
  accepted: "bg-bamboo-500 text-panda-black",
  waitlisted: "bg-gold-400 text-panda-black",
  rejected: "bg-redstone-500 text-white",
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
      className={`inline-flex items-center border-2 border-panda-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
