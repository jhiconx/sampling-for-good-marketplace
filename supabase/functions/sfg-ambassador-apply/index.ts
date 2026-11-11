import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const ORIGIN = "https://sampling-for-good-marketplace.vercel.app";
const headers = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "content-type, apikey, x-client-info, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};
const json = (data: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(data), { status, headers });
const trim = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
const emailOK = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const phoneOK = (value: string) => value.replace(/\D/g, "").length >= 10 && value.replace(/\D/g, "").length <= 15;
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (req.headers.get("origin") !== ORIGIN) return json({ error: "Invalid submission origin." }, 403);
  const supabase = Deno.env.get("SUPABASE_URL");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabase || !secret) return json({ error: "Application service unavailable." }, 503);
  try {
    const raw = await req.text();
    if (raw.length > 5000) return json({ error: "Application is too large." }, 413);
    let data: Record<string, unknown>;
    try { data = JSON.parse(raw); } catch { return json({ error: "Invalid application." }, 400); }
    if (trim(data.website, 200)) return json({ ok: true, received: true });
    const full_name = trim(data.full_name, 150);
    const instagram_handle = trim(data.instagram_handle, 100).replace(/^@/, "");
    const email = trim(data.email, 254).toLowerCase();
    const mobile = trim(data.mobile, 40);
    const school = trim(data.school, 200);
    const experience = trim(data.experience, 1500);
    if (full_name.length < 2 || school.length < 2 || !emailOK(email) || !phoneOK(mobile)) {
      return json({ error: "Enter your name, school, valid email and mobile number." }, 400);
    }
    if (instagram_handle && !/^[A-Za-z0-9._]{1,30}$/.test(instagram_handle))
      return json({ error: "Please check your Instagram handle." }, 400);
    if (data.consent !== true) return json({ error: "Please agree to be contacted about the ambassador opportunity." }, 400);
    const authHeaders = { "apikey": secret, "Authorization": "Bearer " + secret, "Content-Type": "application/json" };
    const existing = new URL("/rest/v1/sfg_ambassador_applications", supabase);
    existing.searchParams.set("select", "id");
    existing.searchParams.set("email", "eq." + email);
    existing.searchParams.set("created_at", "gte." + new Date(Date.now() - 60 * 60 * 1000).toISOString());
    existing.searchParams.set("limit", "1");
    const check = await fetch(existing, { headers: authHeaders, signal: AbortSignal.timeout(8000) });
    if (!check.ok) return json({ error: "Application service temporarily unavailable." }, 503);
    const recent = await check.json();
    if (recent?.length) return json({ ok: true, received: true });
    const saved = await fetch(supabase + "/rest/v1/sfg_ambassador_applications", {
      method: "POST",
      headers: { ...authHeaders, "Prefer": "return=minimal" },
      body: JSON.stringify({ full_name, instagram_handle: instagram_handle ? "@" + instagram_handle : null, email, mobile, school, experience: experience || null, source: "marketplace" }),
      signal: AbortSignal.timeout(10000)
    });
    if (!saved.ok) {
      console.error("Ambassador application storage rejected", saved.status);
      return json({ error: "Could not save your application. Please try again." }, 503);
    }
    return json({ ok: true, received: true });
  } catch (err) {
    console.error("Ambassador application unavailable", err instanceof Error ? err.name : "unexpected");
    return json({ error: "Unable to submit right now. Please try again." }, 503);
  }
});