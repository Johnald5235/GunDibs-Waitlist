"use client";

import Image from "next/image";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

function HomeContent() {
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
    setVerifyStatus(verify);
  }, [searchParams]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
      "mb-4 rounded-lg border px-4 py-3 text-center text-sm font-medium";

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
          This link is no longer active. Submit again if needed.
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
    <main className="relative min-h-screen bg-[#2a2f22] text-white antialiased">
      <header className="flex justify-center pt-12 sm:pt-16">
        <Image
          src="/logo.png"
          alt="GunDibs logo"
          width={900}
          height={300}
          priority
          className="h-auto w-[260px] object-contain sm:w-[380px] lg:w-[520px]"
        />
      </header>

      <section className="px-6 pt-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#d8c19a] sm:text-base">
  GunDibs
</p>
        <h1 className="mx-auto max-w-3xl text-3xl font-bold sm:text-4xl lg:text-5xl">
         Its more than a gun marketplace. It’s an ecosystem.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
          GunDibs is built for people tired of getting shut down by major platforms — a place to buy, sell, and connect that isn’t going anywhere, built by gun people, for gun people.
Welcome home.
        </p>
      </section>

      <section className="px-6 pt-10">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-[#323828]/90 p-6">
            <h3 className="text-lg font-semibold">Marketplace</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              The core of the platform. Built to outperform everything you’ve used before.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#323828]/90 p-6">
            <h3 className="text-lg font-semibold">Community</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              The lifeblood of the platform. Where people connect, share knowledge, and actually help each other.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#323828]/90 p-6">
            <h3 className="text-lg font-semibold">Access</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Where businesses have a direct line to their customer base — from deals to new releases and everything in between.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 pt-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/5 bg-[#323828]/90 p-7 sm:p-8">
          {renderVerifyBanner()}

          {submitted ? (
            <div className="py-6 text-center">
              <p className="text-xl font-semibold">Check your email</p>
              <p className="mt-2 text-sm text-white/60">
                Confirm your spot to secure early access.
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
                {loading ? "Joining..." : "Get Early Access"}
              </button>

              {error ? (
                <p className="text-center text-sm text-red-400">{error}</p>
              ) : null}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}