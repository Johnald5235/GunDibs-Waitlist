"use client";

import Image from "next/image";
import { useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("Buyer");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [website, setWebsite] = useState("");
  const [formStartedAt, setFormStartedAt] = useState(0);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  useEffect(() => {
    setFormStartedAt(Date.now());
  }, []);

  useEffect(() => {
    const verify = searchParams.get("verify");
    if (verify) {
      setVerifyStatus(verify);
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userType,
          website,
          formStartedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function renderVerifyBanner() {
    if (!verifyStatus) return null;

    const base =
      "mb-4 rounded-lg border px-4 py-3 text-sm text-center font-medium";

    if (verifyStatus === "success") {
      return (
        <div className={`${base} border-green-500/30 bg-green-500/10 text-green-300`}>
          Email verified successfully. Welcome!
        </div>
      );
    }

    if (verifyStatus === "expired") {
      return (
        <div className={`${base} border-yellow-500/30 bg-yellow-500/10 text-yellow-300`}>
          Verification link expired. Submit your email again.
        </div>
      );
    }

    if (verifyStatus === "invalid") {
      return (
        <div className={`${base} border-red-500/30 bg-red-500/10 text-red-300`}>
          This verification link is no longer active. If your email was already verified, you're all set. Otherwise, submit your email again for a new link.
        </div>
      );
    }

    if (verifyStatus === "error") {
      return (
        <div className={`${base} border-red-500/30 bg-red-500/10 text-red-300`}>
          Something went wrong. Please try again.
        </div>
      );
    }

    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#2a2f22] text-white antialiased">
      <header className="relative z-10 flex justify-center pt-12 sm:pt-16">
        <Image
          src="/logo.png"
          alt="GunDibs logo"
          width={900}
          height={300}
          priority
          className="h-auto w-[260px] object-contain sm:w-[380px] lg:w-[520px]"
        />
      </header>

      <section className="relative z-10 px-6 pb-28 pt-20 sm:pt-28">
        <div className="mx-auto max-w-xl">
          <div className="relative rounded-2xl border border-white/5 bg-[#323828]/90 p-7 sm:p-8">

            {renderVerifyBanner()}

            {submitted ? (
              <div className="py-6 text-center">
                <p className="text-xl font-semibold">Check your email</p>
                <p className="mt-2 text-sm text-white/60">
                  Click the link to confirm your spot.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="hidden"
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-14 flex-1 rounded-lg border border-white/10 bg-[#3d4431] px-4 text-white"
                  />
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="h-14 rounded-lg border border-white/10 bg-[#3d4431] px-4 text-white"
                  >
                    <option>Buyer</option>
                    <option>Seller</option>
                    <option>Dealer</option>
                    <option>Creator</option>
                    <option>Just interested</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full rounded-lg bg-[#b08a52] font-bold text-[#1c2016]"
                >
                  {loading ? "Joining..." : "Join Early Access"}
                </button>

                {error && (
                  <p className="text-center text-sm text-red-400">{error}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}