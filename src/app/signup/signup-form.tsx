"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "@/lib/actions/auth";
import { Button, Field, Input } from "@/components/ui";

const initialState: AuthState = {};

export function SignupForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      <Field label="Full name" htmlFor="fullName">
        <Input id="fullName" name="fullName" required autoComplete="name" />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      {state.error && <p className="text-sm text-rose-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
