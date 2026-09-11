import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "applicant" | "organizer" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "applicant";
  }

  return (
    <header className="border-b-2 border-panda-black bg-stone-100">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="pixel-heading flex items-center gap-2 text-sm text-stone-900">
          <span
            className="h-4 w-4 border-2 border-panda-black"
            style={{
              background:
                "linear-gradient(135deg, var(--color-panda-black) 50%, var(--color-bamboo-500) 50%)",
            }}
          />
          Panda<span className="text-bamboo-700">Hacks</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {!user && (
            <>
              <Link href="/login" className="text-stone-700 hover:text-stone-900">
                Log in
              </Link>
              <Link href="/signup">
                <Button>Apply now</Button>
              </Link>
            </>
          )}

          {user && role === "organizer" && (
            <>
              <Link href="/organizer" className="text-stone-700 hover:text-stone-900">
                Organizer dashboard
              </Link>
              <Link href="/organizer/analytics" className="text-stone-700 hover:text-stone-900">
                Analytics
              </Link>
              <form action={logOut}>
                <Button variant="secondary" type="submit">
                  Log out
                </Button>
              </form>
            </>
          )}

          {user && role === "applicant" && (
            <>
              <Link href="/status" className="text-stone-700 hover:text-stone-900">
                My application
              </Link>
              <form action={logOut}>
                <Button variant="secondary" type="submit">
                  Log out
                </Button>
              </form>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
