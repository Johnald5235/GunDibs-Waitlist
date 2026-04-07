import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveMx } from "node:dns/promises";
import { createHash, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWaitlistVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";

type WaitlistRequestBody = {
  email?: string;
  userType?: string;
  website?: string;
  formStartedAt?: number;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FORM_FILL_MS = 2500;
const MAX_REQUESTS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const VERIFICATION_EXPIRY_HOURS = 24;

const BLOCKED_DOMAINS = new Set([
  "yahoos.com",
  "yahood.com",
  "yahooo.com",
  "yahho.com",
  "yhoo.com",
  "gmial.com",
  "gmai.com",
  "gnail.com",
  "gmal.com",
  "hotnail.com",
  "hotmai.com",
  "outlok.com",
  "outloo.com",
  "iclouds.com",
  "iclod.com",
  "protonnmail.com",
  "protonmai.com",
]);

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __waitlistRateLimit__: Map<string, RateLimitEntry> | undefined;
}

const rateLimitStore =
  globalThis.__waitlistRateLimit__ ??
  (globalThis.__waitlistRateLimit__ = new Map<string, RateLimitEntry>());

function getClientIp(headerStore: Headers): string {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    headerStore.get("x-real-ip") ||
    headerStore.get("cf-connecting-ip") ||
    "unknown"
  );
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function getEmailDomain(email: string): string {
  const parts = email.split("@");
  return parts[1]?.trim().toLowerCase() || "";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (existing.count >= MAX_REQUESTS_PER_HOUR) {
    return true;
  }

  existing.count += 1;
  rateLimitStore.set(ip, existing);
  return false;
}

async function domainHasMx(domain: string): Promise<boolean> {
  try {
    const mx = await resolveMx(domain);
    return mx.length > 0;
  } catch {
    return false;
  }
}

async function isAcceptableEmailDomain(domain: string): Promise<boolean> {
  if (!domain) return false;
  if (BLOCKED_DOMAINS.has(domain)) return false;
  return domainHasMx(domain);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getAppUrl(): string {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("Missing APP_URL environment variable.");
  }

  return appUrl.replace(/\/+$/, "");
}

export async function POST(req: Request) {
  try {
    const headerStore = await headers();
    const ip = getClientIp(headerStore);

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as WaitlistRequestBody;
    const email = normalizeEmail(body.email || "");
    const userType = (body.userType || "Unknown").trim();
    const website = (body.website || "").trim();
    const formStartedAt = Number(body.formStartedAt || 0);
    const domain = getEmailDomain(email);

    if (website) {
      return NextResponse.json(
        { error: "Submission rejected." },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email." },
        { status: 400 }
      );
    }

    if (!formStartedAt || Date.now() - formStartedAt < MIN_FORM_FILL_MS) {
      return NextResponse.json(
        { error: "Submission rejected." },
        { status: 400 }
      );
    }

    const validDomain = await isAcceptableEmailDomain(domain);
    if (!validDomain) {
      return NextResponse.json(
        { error: "Please enter a real email address." },
        { status: 400 }
      );
    }

    const { data: existingSignup, error: existingLookupError } =
      await supabaseAdmin
        .from("waitlist_signups")
        .select("id, verified_at")
        .eq("email", email)
        .maybeSingle();

    if (existingLookupError) {
      console.error("Supabase lookup error:", existingLookupError);
      return NextResponse.json(
        { error: "Database error." },
        { status: 500 }
      );
    }

    if (existingSignup?.verified_at) {
      return NextResponse.json(
        { error: "That email is already verified on the waitlist." },
        { status: 409 }
      );
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(
      Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
    ).toISOString();

    if (existingSignup) {
      const { error: updateError } = await supabaseAdmin
        .from("waitlist_signups")
        .update({
          user_type: userType,
          verification_token_hash: tokenHash,
          verification_token_expires_at: expiresAt,
          verified_at: null,
        })
        .eq("id", existingSignup.id);

      if (updateError) {
        console.error("Supabase update error:", updateError);
        return NextResponse.json(
          { error: "Database error." },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("waitlist_signups")
        .insert([
          {
            email,
            user_type: userType,
            verified_at: null,
            verification_token_hash: tokenHash,
            verification_token_expires_at: expiresAt,
          },
        ]);

      if (insertError) {
        console.error("Supabase insert error:", insertError);

        if (insertError.code === "23505") {
          return NextResponse.json(
            { error: "That email is already on the waitlist." },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: "Database error." },
          { status: 500 }
        );
      }
    }

    const verifyUrl = `${getAppUrl()}/api/waitlist/verify?token=${rawToken}`;

    await sendWaitlistVerificationEmail({
      to: email,
      verifyUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Check your email to verify your signup.",
    });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}