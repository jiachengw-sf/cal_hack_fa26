import Link from "next/link";
import { Card } from "@/components/ui";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="pixel-heading text-lg text-stone-900">Log in</h1>
        <p className="mt-1 text-sm text-stone-600">
          New here?{" "}
          <Link href="/signup" className="text-bamboo-700 hover:underline">
            Create an account
          </Link>
          .
        </p>
      </div>
      <Card>
        <LoginForm redirectTo={redirect ?? "/"} />
      </Card>
    </div>
  );
}
