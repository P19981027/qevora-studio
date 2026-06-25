/**
 * Cloudflare Pages Function: GET /uploads/:filename
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const filename = new URL(request.url).pathname.replace(/^\/uploads\//, "");
  try {
    const raw = await env.UPLOADS_KV.get("uploads/" + filename);
    if (!raw) return new Response("Not Found",{status:404});
    const meta = JSON.parse(raw);
    const bin = atob(meta.data);
    const bytes = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    return new Response(bytes,{headers:{"Content-Type":meta.type,"Cache-Control":"public, max-age=31536000, immutable","Access-Control-Allow-Origin":"*"}});
  } catch(e) { return new Response("Error",{status:500}); }
}
export async function onRequestOptions() { return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, OPTIONS"}}); }
