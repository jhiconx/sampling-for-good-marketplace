import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Authenticated Organization submissions; persists a request before attempting email.
// The Resend key is a server-side optional secret. Never place it in the browser.
const ORIGIN = "https://sampling-for-good-marketplace.vercel.app";
const brandIds = new Set([
  "liquid-death","reeds-coffee","revive","brand-request","celsius","alani",
  "pibb","mighty","redbull","olipop","claude","dove","bumblebee",
  "martie","poppi","elf","starface"
]);
const allowedHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Cache-Control": "no-store",
  "Content-Type": "application/json"
};
const response = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: allowedHeaders });
const clean = (v: unknown, max = 500) => String(v ?? "").trim().slice(0, max);
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validPhone = (v: string) => { const digits=v.replace(/\D/g,""); return digits.length>=7&&digits.length<=15; };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:allowedHeaders});
  if (req.method !== "POST") return response({error:"Method not allowed"},405);
  const base = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!base || !service || !anon) return response({error:"Request service not configured"},503);
  const authorization=req.headers.get("Authorization")||"";
  if (!authorization.startsWith("Bearer ")) return response({error:"Please sign in before requesting samples"},401);
  const adminHeaders={
    "apikey":service,
    "Authorization":"Bearer "+service,
    "Content-Type":"application/json"
  };
  try {
    const account=await fetch(base+"/auth/v1/user",{
      headers:{"apikey":anon,"Authorization":authorization},
      signal:AbortSignal.timeout(8000)
    });
    if (!account.ok) return response({error:"Your sign-in has expired. Please sign in again."},401);
    const user=await account.json();
    if (!user?.id) return response({error:"Authentication required"},401);
    const profileUrl=new URL("/rest/v1/sfg_marketplace_profiles",base);
    profileUrl.searchParams.set("select","account_type");
    profileUrl.searchParams.set("user_id","eq."+user.id);
    const profileRes=await fetch(profileUrl,{headers:adminHeaders,signal:AbortSignal.timeout(8000)});
    if (!profileRes.ok) return response({error:"Could not confirm organization account"},503);
    const profiles=await profileRes.json();
    if (profiles?.[0]?.account_type!=="org") return response({error:"Sample requests require an Organization account"},403);

    const raw=await req.text();
    if (raw.length>12000) return response({error:"Request too large"},413);
    let body: Record<string,unknown>;
    try{body=JSON.parse(raw)}catch{return response({error:"Invalid request body"},400)}
    const organization=clean(body.organization,180),
      university=clean(body.university,180),
      contactName=clean(body.contactName,180),
      email=clean(body.email,254),phone=clean(body.phone,40),
      charity=clean(body.charity,160),
      note=clean(body.note,3000);
    const brands=Array.isArray(body.brands)
      ?body.brands.filter((b: any)=>b&&brandIds.has(b.id))
       .slice(0,15).map((b:any)=>({id:clean(b.id,40),name:clean(b.name,120)}))
      :[];
    const n=body.totalMembers===null||body.totalMembers===undefined||body.totalMembers===""?null:Number(body.totalMembers);
    const totalMembers=n===0?null:n;
    if(organization.length<2||!brands.length||!(email||phone)||
       (email&&!validEmail(email))||(phone&&!validPhone(phone))||
       (totalMembers!==null&&(!Number.isInteger(totalMembers)||totalMembers<1||totalMembers>100000))||
       brands.some((b)=>!b.name||(b.id==="brand-request"&&b.name==="Brand Request")))
       return response({error:"Complete your organization name, brand selection and valid email or phone"},400);

    // Basic signed-in submission limit by contact, without exposing the table publicly.
    const since=new Date(Date.now()-15*60*1000).toISOString();
    const historyUrl=new URL("/rest/v1/sfg_distribution_requests",base);
    historyUrl.searchParams.set("select","id");
    historyUrl.searchParams.set(email?"email":"phone","eq."+(email||phone));
    historyUrl.searchParams.set("created_at","gte."+since);
    historyUrl.searchParams.set("limit","5");
    const recentRes=await fetch(historyUrl,{headers:adminHeaders,signal:AbortSignal.timeout(8000)});
    if(!recentRes.ok)return response({error:"Request limit check unavailable"},503);
    const recent=await recentRes.json();
    if(Array.isArray(recent)&&recent.length>=5)
      return response({error:"Too many requests. Please try again later."},429);

    const save=await fetch(base+"/rest/v1/sfg_distribution_requests",{
      method:"POST",
      headers:{...adminHeaders,"Prefer":"return=representation"},
      body:JSON.stringify({
        organization_name:organization,university,contact_name:contactName,
        email,phone,brands,total_members:totalMembers,charity_name:charity,
        notes:note,status:"received"
      }),
      signal:AbortSignal.timeout(10000)
    });
    if(!save.ok){console.error("Sample request persistence failed",save.status);
      return response({error:"Could not save your request. Please retry."},503)}
    const inserted=await save.json();
    const requestId=inserted?.[0]?.id;
    if(!requestId)return response({error:"Request confirmation unavailable"},503);

    let emailed=false;
    const resend=Deno.env.get("RESEND_API_KEY"), sender=Deno.env.get("SAMPLE_FROM_EMAIL");
    if(resend&&sender){
      const lines=[
        "New Sampling For Good sample request", "Request ID: "+requestId,
        "Organization: "+organization, "University: "+university,
        "Contact: "+contactName, "Phone: "+(phone||"Not provided"),
        "Email: "+(email||"Not provided"),
        "Members: "+(totalMembers??"Not specified"),
        "Charity: "+(charity||"Not specified"),
        "Brands: "+brands.map((b)=>b.name).join(", "),
        "Notes: "+(note||"None")
      ];
      try {
        const mail=await fetch("https://api.resend.com/emails",{
          method:"POST",headers:{"Authorization":"Bearer "+resend,"Content-Type":"application/json"},
          body:JSON.stringify({from:sender,to:["samples@iconx.io"],subject:"Sampling For Good sample request",text:lines.join("\n")}),
          signal:AbortSignal.timeout(12000)
        });
        emailed=mail.ok;
        if(!mail.ok)console.error("Sample notification failed",mail.status);
      }catch{console.error("Sample notification network failure")}
    }
    return response({ok:true,stored:true,emailed,requestId});
  } catch(error) {
    console.error("Sample request processing failed", error instanceof Error?error.name:"unexpected");
    return response({error:"The request service is temporarily unavailable. Please retry."},503);
  }
});
