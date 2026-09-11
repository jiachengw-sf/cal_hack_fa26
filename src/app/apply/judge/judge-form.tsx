"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { saveApplicationDraft, submitApplication } from "@/lib/actions/applications";
import { Button, Field, Input, Textarea } from "@/components/ui";
import type { JudgeFormData } from "@/lib/database.types";

const schema = z.object({
  organization: z.string().min(1, "Required"),
  role: z.string().min(1, "Required"),
  expertiseAreas: z.string().min(1, "Required"),
  priorJudgingExperience: z.string().min(1, "Required"),
  availability: z.string().min(1, "Required"),
  whyJudge: z.string().min(10, "Tell us a bit more (10+ characters)"),
});

export function JudgeForm({ defaultValues }: { defaultValues?: Partial<JudgeFormData> }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<JudgeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization: "",
      role: "",
      expertiseAreas: "",
      priorJudgingExperience: "",
      availability: "",
      whyJudge: "",
      ...defaultValues,
    },
  });

  function onSaveDraft() {
    setError(null);
    startTransition(async () => {
      const result = await saveApplicationDraft("judge", getValues());
      if (result.error) setError(result.error);
      else setSavedAt(new Date().toLocaleTimeString());
    });
  }

  function onSubmitApplication(data: JudgeFormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitApplication("judge", data);
      if (result.error) setError(result.error);
      else router.push("/status");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmitApplication)} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Organization / company" htmlFor="organization" error={errors.organization?.message}>
          <Input id="organization" {...register("organization")} />
        </Field>
        <Field label="Your role" htmlFor="role" error={errors.role?.message}>
          <Input id="role" placeholder="e.g. Senior Engineer" {...register("role")} />
        </Field>
      </div>

      <Field
        label="Areas of expertise"
        htmlFor="expertiseAreas"
        error={errors.expertiseAreas?.message}
        hint="e.g. AI/ML, mobile, design, hardware, security"
      >
        <Input id="expertiseAreas" {...register("expertiseAreas")} />
      </Field>

      <Field
        label="Prior judging experience"
        htmlFor="priorJudgingExperience"
        error={errors.priorJudgingExperience?.message}
      >
        <Textarea id="priorJudgingExperience" rows={3} {...register("priorJudgingExperience")} />
      </Field>

      <Field label="Availability for the event" htmlFor="availability" error={errors.availability?.message}>
        <Input
          id="availability"
          placeholder="e.g. Saturday afternoon only, full weekend, etc."
          {...register("availability")}
        />
      </Field>

      <Field label="Why do you want to judge?" htmlFor="whyJudge" error={errors.whyJudge?.message}>
        <Textarea id="whyJudge" rows={3} {...register("whyJudge")} />
      </Field>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit application"}
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={onSaveDraft}>
          Save draft
        </Button>
        {savedAt && <span className="text-xs text-slate-500">Saved at {savedAt}</span>}
      </div>
    </form>
  );
}
