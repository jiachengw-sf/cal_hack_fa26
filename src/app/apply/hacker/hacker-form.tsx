"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { saveApplicationDraft, submitApplication } from "@/lib/actions/applications";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { HackerFormData } from "@/lib/database.types";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const schema = z
  .object({
    school: z.string().min(1, "Required"),
    graduationYear: z.string().min(1, "Required"),
    major: z.string().min(1, "Required"),
    experienceLevel: z.string().min(1, "Required"),
    skills: z.string().min(1, "Required"),
    whyAttend: z.string().min(10, "Tell us a bit more (10+ characters)"),
    builtSomethingCool: z.string().min(10, "Tell us a bit more (10+ characters)"),
    resumeType: z.enum(["link", "file"]),
    resumeUrl: z.string().optional(),
    resumeFilePath: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.resumeType === "link") {
      if (!data.resumeUrl || data.resumeUrl.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["resumeUrl"], message: "Resume link is required" });
      } else if (!z.string().url().safeParse(data.resumeUrl).success) {
        ctx.addIssue({ code: "custom", path: ["resumeUrl"], message: "Must be a valid URL" });
      }
    } else if (!data.resumeFilePath) {
      ctx.addIssue({
        code: "custom",
        path: ["resumeFilePath"],
        message: "Please upload a resume file",
      });
    }
  });

export function HackerForm({
  userId,
  defaultValues,
}: {
  userId: string;
  defaultValues?: Partial<HackerFormData>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    defaultValues?.resumeFilePath ? "Resume on file" : null
  );

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
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
      resumeType: defaultValues?.resumeFilePath ? "file" : "link",
      resumeUrl: "",
      resumeFilePath: "",
      ...defaultValues,
    },
  });

  const resumeType = watch("resumeType");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
      setError("Resume must be a PDF or Word document.");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setError("Resume must be under 5MB.");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/hacker-resume-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(path, file, { upsert: true, contentType: file.type });
    setIsUploading(false);

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      return;
    }
    setValue("resumeFilePath", path, { shouldValidate: true });
    setUploadedFileName(file.name);
  }

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

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-200">Resume</label>
        <div className="flex gap-4 text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input type="radio" value="link" {...register("resumeType")} />
            Paste a link
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="file" {...register("resumeType")} />
            Upload a file
          </label>
        </div>

        {resumeType === "link" ? (
          <Field htmlFor="resumeUrl" error={errors.resumeUrl?.message}>
            <Input
              id="resumeUrl"
              placeholder="https://…"
              {...register("resumeUrl")}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">
              A link to a hosted PDF, Google Drive, or portfolio site.
            </p>
          </Field>
        ) : (
          <Field htmlFor="resumeFile" error={errors.resumeFilePath?.message}>
            <input
              id="resumeFile"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:text-slate-100 hover:file:bg-slate-700"
            />
            <p className="mt-1 text-xs text-slate-500">
              PDF or Word document, up to 5MB.
              {isUploading && " Uploading…"}
              {!isUploading && uploadedFileName && ` Uploaded: ${uploadedFileName}`}
            </p>
          </Field>
        )}
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || isUploading}>
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
