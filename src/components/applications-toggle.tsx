"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleApplicationsOpen } from "@/lib/actions/settings";
import { Button } from "@/components/ui";

export function ApplicationsToggle({ initialOpen }: { initialOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !open;
    setError(null);
    startTransition(async () => {
      const result = await toggleApplicationsOpen(next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(next);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={`border-2 border-panda-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
          open ? "bg-bamboo-500 text-panda-black" : "bg-redstone-500 text-white"
        }`}
      >
        Applications {open ? "Open" : "Closed"}
      </span>
      <Button variant="secondary" onClick={handleClick} disabled={isPending}>
        {isPending ? "Updating…" : open ? "Close applications" : "Reopen applications"}
      </Button>
      {error && <span className="text-xs text-redstone-500">{error}</span>}
    </div>
  );
}
