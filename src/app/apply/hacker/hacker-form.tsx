"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { saveApplicationDraft, submitApplication } from "@/lib/actions/applications";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { HackerFormData } from "@/lib/database.types";

const schema = z.object({
  school: z.string().min(1, "Required"),
  graduationYear: z.string().min(1, "Required"),
  major: z.string().min(1, "Required"),
  experienceLevel: z.string().min(1, "Required"),
  skills: z.string().min(1, "Required"),
  whyAttend: z.string().min(10, "Tell us a bit more (10+ characters)"),
  builtSomethingCool: z.string().min(10, "Tell us a bit more (10+ characters)"),
  resumeUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export function HackerForm({ defaultValues }: { defaultValues?: Partial<HackerFormData> }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<HackerFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      school: "",
      graduationYear: "",
      major: "",
      experienceLevel: "",
      skills: "",
      whyAttend: "",
      builtSomethingCool: "",
      resumeUrl: "",
      ...defaultValues,
    },
  });

  function onSaveDraft() {
    setError(null);
    startTransition(async () => {
      const result = await saveApplicationDraft("hacker", getValues());
      if (result.error) setError(result.error);
      else setSavedAt(new Date().toLocaleTimeString());
    });
  }

  function onSubmitApplication(data: HackerFormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitApplication("hacker", data);
      if (result.error) setError(result.error);
      else router.push("/status");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmitApplication)} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="School" htmlFor="school" error={errors.school?.message}>
          <Input id="school" {...register("school")} />
        </Field>
        <Field
          label="Graduation year"
          htmlFor="graduationYear"
          error={errors.graduationYear?.message}
        >
          <Input id="graduationYear" {...register("graduationYear")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Major / field of study" htmlFor="major" error={errors.major?.message}>
          <Input id="major" {...register("major")} />
        </Field>
        <Field
          label="Experience level"
          htmlFor="experienceLevel"
          error={errors.experienceLevel?.message}
        >
          <Select id="experienceLevel" {...register("experienceLevel")}>
            <option value="">Select…</option>
            <option value="first-hackathon">This is my first hackathon</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </Field>
      </div>

      <Field
        label="Skills (languages, frameworks, tools)"
        htmlFor="skills"
        error={errors.skills?.message}
      >
        <Input id="skills" placeholder="e.g. Python, React, Figma" {...register("skills")} />
      </Field>

      <Field label="Why do you want to attend?" htmlFor="whyAttend" error={errors.whyAttend?.message}>
        <Textarea id="whyAttend" rows={3} {...register("whyAttend")} />
      </Field>

      <Field
        label="Tell us about something cool you've built"
        htmlFor="builtSomethingCool"
        error={errors.builtSomethingCool?.message}
      >
        <Textarea id="builtSomethingCool" rows={3} {...register("builtSomethingCool")} />
      </Field>

      <Field
        label="Resume link (optional)"
        htmlFor="resumeUrl"
        error={errors.resumeUrl?.message}
        hint="A link to a hosted PDF, Google Drive, or portfolio site."
      >
        <Input id="resumeUrl" placeholder="https://…" {...register("resumeUrl")} />
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
