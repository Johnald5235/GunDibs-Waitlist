"use client";

import Image from "next/image";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

function HomeContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("Seller");
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
        <div
          className={`${base} border-green-500/30 bg-green-500/10 text-green-300`}
        >
          Email verified successfully. Welcome!
        </div>
      );
    }

    if (verifyStatus === "expired") {
      return (
        <div
          className={`${base} border-yellow-500/30 bg-yellow-500/10 text-yellow-300`}
        >
          Verification link expired. Submit your email again.
        </div>
      );
    }

    if (verifyStatus === "invalid") {
      return (
        <div
          className={`${base} border-red-500/30 bg-red-500/10 text-red-300`}
        >
          This link is no longer active. Submit again if needed.
        </div>
      );
    }

    if (verifyStatus === "error") {
      return (
        <div
          className={`${base} border-red-500/30 bg-red-500/10 text-red-300`}
        >
          Something went wrong. Please try again.
        </div>
      );
    }

    return null;
  }

  function scrollToForm(selectedType: string) {
    setUserType(selectedType);
    requestAnimationFrame(() => {
      document.getElementById("signup")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function getSubmitLabel() {
    if (loading) return "Joining...";

    if (userType === "Seller" || userType === "Dealer") {
      return "Reserve My Seller Spot";
    }

    if (userType === "Buyer") {
      return "Get Buyer Early Access";
    }

    return "Get Early Access";
  }

  return (
    <main className="relative min-h-screen bg-[#2a2f22] text-white antialiased">
      <header className="flex justify-center pt-4 sm:pt-1">
        <Image
          src="/logo.png"
          alt="GunDibs logo"
          width={900}
          height={300}
          priority
          className="h-auto w-[220px] object-contain sm:w-[300px] lg:w-[420px]"
        />
      </header>

      <section className="px-6 pt-6 text-center">
        <p className="mt-2 text-3xl font-bold tracking-[0.08em] text-[#d8c19a] sm:text-4xl">
          G
          <span className="text-[0.82em]">UN</span>
          D
          <span className="text-[0.82em]">IBS</span>
        </p>

        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-[#d8c19a]">
          Founding Seller Program
        </p>

        <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-bold sm:text-4xl lg:text-5xl">
          Be one of the first sellers on GunDibs
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
          Reserve your username, get early seller access, and help shape the
          marketplace before public launch.
        </p>

        <div className="mx-auto mt-8 flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => scrollToForm("Seller")}
            className="h-14 w-full rounded-lg bg-[#b08a52] px-6 font-bold text-[#1c2016] sm:w-auto"
          >
            Reserve My Seller Spot
          </button>

          <button
            type="button"
            onClick={() => scrollToForm("Buyer")}
            className="h-14 w-full rounded-lg border border-white/10 bg-[#3d4431] px-6 font-semibold text-white sm:w-auto"
          >
            Just here to buy? Get early access
          </button>
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60">
          Built for gun people. Early members help shape what launches first.
        </p>
      </section>

      <section className="px-6 pt-10">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#7a5832] bg-[#86613a] px-6 py-7 text-[#140f0a] shadow-[0_10px_26px_rgba(0,0,0,0.24)]">
            <h3 className="text-center text-2xl font-semibold text-white">
              Reserve your username
            </h3>
            <p className="mt-4 text-center text-base leading-7 text-white">
              Claim your place early and establish your presence before the
              public launch.
            </p>
          </div>

          <div className="rounded-2xl border border-[#7a5832] bg-[#86613a] px-6 py-7 text-[#140f0a] shadow-[0_10px_26px_rgba(0,0,0,0.24)]">
            <h3 className="text-center text-2xl font-semibold text-white">
              Founding Seller status
            </h3>
            <p className="mt-4 text-center text-base leading-7 text-white">
              Join the first wave of sellers and help define how GunDibs launches.
            </p>
          </div>

          <div className="rounded-2xl border border-[#7a5832] bg-[#86613a] px-6 py-7 text-[#140f0a] shadow-[0_10px_26px_rgba(0,0,0,0.24)]">
            <h3 className="text-center text-2xl font-semibold text-white">
              Early listing access
            </h3>
            <p className="mt-4 text-center text-base leading-7 text-white">
              Get in before the crowd arrives and be ready when buyers start
              showing up.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pt-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/5 bg-[#323828]/90 p-7 sm:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Built to fix what current platforms get wrong
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
              GunDibs is being built around trust, speed, clarity, and a better
              experience for people who actually use these marketplaces.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-[#3a4130] px-5 py-5">
              <h3 className="text-lg font-semibold text-white">
                Better trust signals
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                More clarity around who you are dealing with and less guesswork
                when it is time to buy or list.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#3a4130] px-5 py-5">
              <h3 className="text-lg font-semibold text-white">
                Faster, clearer claiming
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                A buying and selling experience built to reduce confusion and
                cut through the usual chaos.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#3a4130] px-5 py-5">
              <h3 className="text-lg font-semibold text-white">
                Built specifically for gun people
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Not a watered-down general marketplace. A platform designed for
                this community from the start.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#3a4130] px-5 py-5">
              <h3 className="text-lg font-semibold text-white">
                More than listings over time
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Marketplace first, with room to grow into a broader ecosystem as
                the platform matures.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="signup" className="px-6 pb-20 pt-8">
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
            <>
              <div className="mb-5 text-center">
                <h2 className="text-2xl font-semibold">Claim your spot</h2>
                <p className="mt-2 text-sm text-white/65">
                  Sellers are the priority right now, but buyers can join for
                  early access too.
                </p>
              </div>

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
                    <option>Seller</option>
                    <option>Buyer</option>
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
                  {getSubmitLabel()}
                </button>

                <p className="text-center text-xs text-white/50">
                  No spam. Just launch updates and early access.
                </p>

                {error ? (
                  <p className="text-center text-sm text-red-400">{error}</p>
                ) : null}
              </form>
            </>
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