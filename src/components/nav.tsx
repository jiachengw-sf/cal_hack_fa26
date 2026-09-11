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
    <header className="border-b border-slate-800">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          Hack<span className="text-teal-400">Portal</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {!user && (
            <>
              <Link href="/login" className="text-slate-300 hover:text-white">
                Log in
              </Link>
              <Link href="/signup">
                <Button>Apply now</Button>
              </Link>
            </>
          )}

          {user && role === "organizer" && (
            <>
              <Link href="/organizer" className="text-slate-300 hover:text-white">
                Organizer dashboard
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
              <Link href="/status" className="text-slate-300 hover:text-white">
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
