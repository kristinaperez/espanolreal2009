import { readSnapshot,shareStore } from "@/server/share/store";
import { previewFixture,fixtureSvg } from "@/server/share/preview-fixture";
import sharp from "sharp";
import { deploymentOrigin } from "@/server/share/store";
export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{id:string;kind:string}>}){const {id,kind}=await params;if(!["og.jpg","pin.jpg"].includes(kind)||!await readSnapshot(id))return new Response("Not found",{status:404});if(previewFixture(id,deploymentOrigin())){const bytes=await sharp(Buffer.from(fixtureSvg)).resize(kind==="og.jpg"?1200:1000,kind==="og.jpg"?630:1500,{fit:"contain",background:"#FAF8F5"}).jpeg().toBuffer();return new Response(new Uint8Array(bytes),{headers:{"content-type":"image/jpeg","cache-control":"public, max-age=3600"}})}const bytes=await shareStore().get(`media/${id}/${kind}`,{type:"arrayBuffer"});if(!bytes)return new Response("Not found",{status:404});return new Response(bytes,{headers:{"content-type":"image/jpeg","cache-control":"public, max-age=31536000, immutable","x-content-type-options":"nosniff"}});}
