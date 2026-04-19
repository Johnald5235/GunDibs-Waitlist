"use client";

import Image from "next/image";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

const GIVEAWAY_OPTIONS = [
  "Glock 19 Gen 6",
  "HK VP9CC",
  "Walther PDP",
  "Smith & Wesson M&P9 M2.0 Compact OR",
  "Other",
];

function HomeContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("Seller");
  const [giveawayChoice, setGiveawayChoice] = useState("");
  const [giveawayOtherText, setGiveawayOtherText] = useState("");
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

    const trimmedOther = giveawayOtherText.trim();

    if (!giveawayChoice) {
      setError("Please choose a giveaway option.");
      return;
    }

    if (giveawayChoice === "Other" && !trimmedOther) {
      setError("Please enter your choice.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userType,
          giveawayChoice,
          giveawayOtherText: giveawayChoice === "Other" ? trimmedOther : "",
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
    <main className="min-h-screen bg-[#191d23] text-white antialiased">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-12 pt-8 lg:justify-center">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="text-center lg:text-left">
            <div className="mx-auto mb-6 flex w-full max-w-[510px] flex-col items-center lg:mx-0 lg:items-start">
              <Image
                src="/logo.png"
                alt="GunDibs logo"
                width={1200}
                height={400}
                priority
                className="h-auto w-[310px] object-contain sm:w-[400px] lg:w-[510px]"
              />

              <p className="-mt-16 w-full text-center text-base leading-7 text-white/80 sm:-mt-20 sm:text-lg lg:-mt-24">
                The marketplace for firearms, parts, gear, and accessories.
              </p>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d0ae78] sm:text-sm">
              Founding Seller Program
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Be one of the first sellers on GunDibs
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/78 sm:text-lg lg:mx-0">
              Be part of GunDibs before day one.
            </p>

            <div className="mx-auto mt-8 max-w-xl space-y-3 text-left lg:mx-0">
              <div className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3">
                <p className="text-sm font-semibold text-white">
                  Reserve your username
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3">
                <p className="text-sm font-semibold text-white">
                  Get early seller priority access
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3">
                <p className="text-sm font-semibold text-white">
                  Help shape what launches first
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#242a32] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-8">
            {renderVerifyBanner()}

            {submitted ? (
              <div className="py-8 text-center">
                <p className="text-2xl font-semibold">Check your email</p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Confirm your spot to secure early access.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-semibold">Claim your spot</h2>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Sellers are the priority right now, but buyers can join for
                    early access too.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-white/85"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-14 w-full rounded-lg border border-white/12 bg-[#2d343d] px-4 text-white outline-none transition focus:border-[#d0ae78] focus:ring-1 focus:ring-[#d0ae78] placeholder:text-white/40"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="userType"
                      className="mb-2 block text-sm font-medium text-white/85"
                    >
                      I am joining as
                    </label>
                    <select
                      id="userType"
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      className="h-14 w-full cursor-pointer rounded-lg border border-white/12 bg-[#2d343d] px-4 text-white outline-none transition hover:border-white/20 focus:border-[#d0ae78] focus:ring-1 focus:ring-[#d0ae78]"
                    >
                      <option>Seller</option>
                      <option>Buyer</option>
                      <option>Dealer</option>
                      <option>Creator</option>
                      <option>Just interested</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="giveawayChoice"
                      className="mb-2 block text-sm font-medium leading-6 text-white/85"
                    >
                      What handgun should GunDibs give away to a lucky founding
                      member?
                    </label>
                    <select
                      id="giveawayChoice"
                      required
                      value={giveawayChoice}
                      onChange={(e) => setGiveawayChoice(e.target.value)}
                      className="h-14 w-full cursor-pointer rounded-lg border border-white/12 bg-[#2d343d] px-4 text-white outline-none transition hover:border-white/20 focus:border-[#d0ae78] focus:ring-1 focus:ring-[#d0ae78]"
                    >
                      <option value="">Select one</option>
                      {GIVEAWAY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    {giveawayChoice === "Other" ? (
                      <input
                        type="text"
                        value={giveawayOtherText}
                        onChange={(e) => setGiveawayOtherText(e.target.value)}
                        placeholder="Enter your choice"
                        className="mt-3 h-14 w-full rounded-lg border border-white/12 bg-[#2d343d] px-4 text-white outline-none transition focus:border-[#d0ae78] focus:ring-1 focus:ring-[#d0ae78] placeholder:text-white/40"
                      />
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-14 w-full cursor-pointer rounded-lg bg-[#d0ae78] font-bold text-[#161a20] transition hover:bg-[#ddb989] disabled:cursor-not-allowed disabled:opacity-70"
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
      </div>
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