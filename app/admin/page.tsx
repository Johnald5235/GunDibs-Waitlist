import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ADMIN_COOKIE_NAME = "gundibs_admin_session";

type WaitlistSignupRow = {
  id: string;
  email: string;
  user_type: string;
  giveaway_choice: string | null;
  giveaway_other_text: string | null;
  created_at: string;
  verified_at: string | null;
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error("Missing ADMIN_PASSWORD environment variable.");
  }

  return password;
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}

function getExpectedSessionValue(): string {
  return sha256(getAdminPassword());
}

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return false;
  }

  return safeEqual(sessionCookie, getExpectedSessionValue());
}

async function loginAction(formData: FormData) {
  "use server";

  const enteredPassword = String(formData.get("password") ?? "");
  const adminPassword = getAdminPassword();

  if (!safeEqual(enteredPassword, adminPassword)) {
    redirect("/admin?error=invalid");
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, getExpectedSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin");
}

async function logoutAction() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);

  redirect("/admin");
}

function LoginCard({ showError }: { showError: boolean }) {
  return (
    <main className="min-h-screen bg-[#11150f] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Admin Access
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Enter the admin password to continue.
            </p>
          </div>

          {showError ? (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Incorrect password.
            </div>
          ) : null}

          <form action={loginAction} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-white/70"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-0 placeholder:text-white/30 focus:border-[#b08a52]"
                placeholder="Enter admin password"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#b08a52] px-4 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Enter Admin Dashboard
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function getDisplayedChoice(signup: WaitlistSignupRow): string {
  const choice = signup.giveaway_choice?.trim();

  if (!choice) {
    return "—";
  }

  if (choice === "Other") {
    const other = signup.giveaway_other_text?.trim();
    return other ? `Other — ${other}` : "Other";
  }

  return choice;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return <LoginCard showError={error === "invalid"} />;
  }

  const { data, error: supabaseError } = await supabaseAdmin
    .from("waitlist_signups")
    .select(
      "id, email, user_type, giveaway_choice, giveaway_other_text, created_at, verified_at"
    )
    .order("created_at", { ascending: false });

  const signups: WaitlistSignupRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    email: String(row.email ?? ""),
    user_type: String(row.user_type ?? ""),
    giveaway_choice:
      typeof row.giveaway_choice === "string" ? row.giveaway_choice : null,
    giveaway_other_text:
      typeof row.giveaway_other_text === "string"
        ? row.giveaway_other_text
        : null,
    created_at: String(row.created_at ?? ""),
    verified_at:
      typeof row.verified_at === "string" ? row.verified_at : null,
  }));

  return (
    <main className="min-h-screen bg-[#11150f] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Waitlist signups pulled directly from Supabase.
            </p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Log Out
            </button>
          </form>
        </div>

        {supabaseError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">
            Failed to load waitlist signups: {supabaseError.message}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.18em] text-white/55">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Email</th>
                    <th className="px-4 py-4 font-semibold">Joining As</th>
                    <th className="px-4 py-4 font-semibold">Handgun Choice</th>
                    <th className="px-4 py-4 font-semibold">Verified</th>
                    <th className="px-4 py-4 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-sm text-white/60"
                      >
                        No signups yet.
                      </td>
                    </tr>
                  ) : (
                    signups.map((signup) => (
                      <tr
                        key={signup.id}
                        className="border-t border-white/10 align-top"
                      >
                        <td className="px-4 py-4 text-sm text-white">
                          {signup.email}
                        </td>
                        <td className="px-4 py-4 text-sm text-white/80">
                          {signup.user_type}
                        </td>
                        <td className="px-4 py-4 text-sm text-white/90">
                          {getDisplayedChoice(signup)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {signup.verified_at ? (
                            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-300">
                              Verified
                            </span>
                          ) : (
                            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-white/70">
                          {formatDate(signup.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}