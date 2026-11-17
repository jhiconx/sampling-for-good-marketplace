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

const escapeHtml=(s: string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
function confirmationEmail(fullName: string) {
 const firstName=fullName.trim().split(/\s+/)[0]||"there";
 const subject="🎉 We Got Your Application. You're In the Mix!";
 const text=[
  "Hey "+firstName+"! 👋",
  "",
  "YOU DID IT. YOUR APPLICATION IS IN! 🚀",
  "",
  "Your application to become an Iconx Campus Brand Ambassador has officially landed!",
  "",
  "We're building something exciting with Sampling for Good, connecting college students, amazing brands, and campus communities.",
  "",
  "And you just took the first step toward being part of it.",
  "",
  "🔥 SO, WHAT HAPPENS NEXT?",
  "",
  "✅ Application Received — You're officially in our system!",
  "",
  "👀 We're Checking You Out — Our team will review your application.",
  "",
  "📲 Stay Tuned — If you're selected to move forward, we'll reach out with next steps.",
  "",
  "Big brands. Real opportunities. Your campus.",
  "",
  "Thanks for stepping up. We love the energy!",
  "",
  "See you on campus! ✌️",
  "",
  "The Iconx Ambassador Team",
  "Sampling for Good",
  "Connect. Earn. Make an Impact."
 ].join("\n");
 const name=escapeHtml(firstName);
 const html=[
  '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
  '<body style="margin:0;background:#f8f5ff;font:16px/1.6 Arial,Helvetica,sans-serif;color:#251834">',
  '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f8f5ff;padding:30px 12px"><tr><td align="center">',
  '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border-radius:24px;overflow:hidden">',
  '<tr><td style="background:linear-gradient(110deg,#e65acb,#9862f7,#448bff);padding:23px 30px;color:#fff;font-size:15px;font-weight:800;letter-spacing:.5px">✦ SAMPLING FOR GOOD <span style="font-weight:400">· Powered by Iconx.io</span></td></tr>',
  '<tr><td style="padding:36px 30px">',
  '<p style="margin:0 0 18px;font-size:18px">Hey '+name+'! 👋</p>',
  '<h1 style="font-size:29px;line-height:1.2;color:#4f2582;margin:0 0 23px">YOU DID IT.<br>YOUR APPLICATION IS IN! 🚀</h1>',
  '<p>Your application to become an <strong>Iconx Campus Brand Ambassador</strong> has officially landed!</p>',
  "<p>We're building something exciting with <strong>Sampling for Good</strong>, connecting college students, amazing brands, and campus communities.</p>",
  '<p>And you just took the first step toward being part of it.</p>',
  '<h2 style="font-size:20px;color:#6d3ab5;margin:28px 0 13px">🔥 SO, WHAT HAPPENS NEXT?</h2>',
  "<p>✅ <strong>Application Received</strong> — You're officially in our system!</p>",
  "<p>👀 <strong>We're Checking You Out</strong> — Our team will review your application.</p>",
  "<p>📲 <strong>Stay Tuned</strong> — If you're selected to move forward, we'll reach out with next steps.</p>",
  '<p style="font-size:19px;font-weight:800;color:#4c2482;margin-top:28px">Big brands. Real opportunities. Your campus.</p>',
  '<p>Thanks for stepping up. We love the energy!</p>',
  '<p>See you on campus! ✌️</p>',
  '<p style="margin:28px 0 0"><strong>The Iconx Ambassador Team</strong><br><em>Sampling for Good</em><br><strong>Connect. Earn. Make an Impact.</strong></p>',
  '</td></tr></table></td></tr></table></body></html>'
 ].join("");
 return {subject,text,html};
}
async function sendConfirmation(id: string, fullName: string, recipient: string) {
 const key=Deno.env.get("RESEND_API_KEY");
 const from=Deno.env.get("AMBASSADOR_FROM_EMAIL")||Deno.env.get("SAMPLE_FROM_EMAIL");
 if(!key||!from){console.error("Ambassador email credentials missing.");return false}
 try {
  const response=await fetch("https://api.resend.com/emails",{
   method:"POST",
   headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json","Idempotency-Key":"sfg-ambassador-application/"+id},
   body:JSON.stringify({from,to:[recipient],...confirmationEmail(fullName)}),
   signal:AbortSignal.timeout(7000)
  });
  if(!response.ok)console.error("Ambassador confirmation email rejected",response.status);
  return response.ok;
 }catch(error){
  console.error("Ambassador email transport failed",error instanceof Error?error.name:"unexpected");
  return false;
 }
}

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
      headers: { ...authHeaders, "Prefer": "return=representation" },
      body: JSON.stringify({ full_name, instagram_handle: instagram_handle ? "@" + instagram_handle : null, email, mobile, school, experience: experience || null, source: "marketplace" }),
      signal: AbortSignal.timeout(10000)
    });
    if (!saved.ok) {
      console.error("Ambassador application storage rejected", saved.status);
      return json({ error: "Could not save your application. Please try again." }, 503);
    }
    const savedRows=await saved.json().catch(()=>[]);
    const applicationId=savedRows?.[0]?.id;
    const emailed=typeof applicationId==="string"&&/^[0-9a-f-]{36}$/i.test(applicationId)
      ? await sendConfirmation(applicationId,full_name,email) : false;
    return json({ ok: true, received: true, emailed });
  } catch (err) {
    console.error("Ambassador application unavailable", err instanceof Error ? err.name : "unexpected");
    return json({ error: "Unable to submit right now. Please try again." }, 503);
  }
});