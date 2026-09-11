import Link from "next/link";
import { Card } from "@/components/ui";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="pixel-heading text-lg text-stone-900">Create your account</h1>
        <p className="mt-1 text-sm text-stone-600">
          Already applying?{" "}
          <Link href="/login" className="text-bamboo-700 hover:underline">
            Log in instead
          </Link>
          .
        </p>
      </div>
      <Card>
        <SignupForm redirectTo={redirect ?? "/apply"} />
      </Card>
    </div>
  );
}
