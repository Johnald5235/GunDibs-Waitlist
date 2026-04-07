import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${getAppUrl()}/?verify=invalid`);
    }

    const tokenHash = sha256(token);

    const { data: signup, error: lookupError } = await supabaseAdmin
      .from("waitlist_signups")
      .select("id, verified_at, verification_token_expires_at")
      .eq("verification_token_hash", tokenHash)
      .maybeSingle();

    if (lookupError) {
      console.error("Supabase verify lookup error:", lookupError);
      return NextResponse.redirect(`${getAppUrl()}/?verify=error`);
    }

    if (!signup) {
      return NextResponse.redirect(`${getAppUrl()}/?verify=invalid`);
    }

    if (signup.verified_at) {
      return NextResponse.redirect(`${getAppUrl()}/?verify=success`);
    }

    const expiresAt = signup.verification_token_expires_at
      ? new Date(signup.verification_token_expires_at)
      : null;

    if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      return NextResponse.redirect(`${getAppUrl()}/?verify=expired`);
    }

    const { error: updateError } = await supabaseAdmin
      .from("waitlist_signups")
      .update({
        verified_at: new Date().toISOString(),
        verification_token_hash: null,
        verification_token_expires_at: null,
      })
      .eq("id", signup.id);

    if (updateError) {
      console.error("Supabase verify update error:", updateError);
      return NextResponse.redirect(`${getAppUrl()}/?verify=error`);
    }

    return NextResponse.redirect(`${getAppUrl()}/?verify=success`);
  } catch (err) {
    console.error("Verification route error:", err);
    return NextResponse.redirect(`${process.env.APP_URL || "http://localhost:3000"}/?verify=error`);
  }
}
