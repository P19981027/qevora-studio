/**
 * Cloudflare Pages Function: POST /api/admin/upload
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  // Demo mode: accept any upload (auth handled by localStorage on client)
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file || typeof file === "string") return json({success:false,message:"没有上传文件"},400);
    if (!file.type.startsWith("image/")) return json({success:false,message:"仅支持图片文件"},400);
    const buf = await file.arrayBuffer();
    if (buf.byteLength > 5242880) return json({success:false,message:"图片不能超过5MB"},400);
    const ext = file.name.split(".").pop() || "png";
    const key = "uploads/" + Date.now() + "-" + Math.random().toString(36).substring(2,8) + "." + ext;
    const bytes = new Uint8Array(buf);
    let b64 = "";
    for (let i=0;i<bytes.length;i++) b64 += String.fromCharCode(bytes[i]);
    await env.UPLOADS_KV.put(key, JSON.stringify({type:file.type,data:btoa(b64),size:buf.byteLength,uploadedAt:new Date().toISOString()}));
    return json({success:true,url:"/uploads/"+key.replace("uploads/",""),size:buf.byteLength},200);
  } catch(e) {
    return json({success:false,message:"上传失败: "+e.message},500);
  }
}
function json(d,s) {
  return new Response(JSON.stringify(d),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS"}});
}
export async function onRequestOptions() {
  return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS"}});
}
