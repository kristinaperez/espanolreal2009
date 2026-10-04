import "server-only";
import { getStore } from "@netlify/blobs";
import { randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
import { previewFixture } from "./preview-fixture";
import type { GeneratedPost } from "@/lib/teacher-posts/model";
export interface PublicSnapshot extends GeneratedPost { id: string; title: string; description: string; authorName: string; origin: string; createdAt: string; imageUrl: string; pinterestImageUrl: string }
export const validSnapshotId=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
export function shareStore(){const context=process.env.CONTEXT||"production";const scope=context==="production"?"production":`preview-${createHash("sha256").update(process.env.DEPLOY_PRIME_URL||process.env.DEPLOY_ID||context).digest("hex").slice(0,16)}`;return getStore({name:`teacher-share-${scope}`,consistency:"strong"});}
export function deploymentOrigin(fallback?:string){const origin=process.env.CONTEXT&&process.env.CONTEXT!=="production"?process.env.DEPLOY_PRIME_URL:process.env.NEXT_PUBLIC_SITE_URL;return new URL(fallback||origin||"https://espanolreal.netlify.app").origin;}
export async function saveSnapshot(generated:GeneratedPost,authorName:string,origin:string,dataUrl:string){
 if(!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl)||dataUrl.length>2_800_000)throw Error("invalid image");
 const bytes=Buffer.from(dataUrl.split(",")[1],"base64");const image=sharp(bytes,{limitInputPixels:20_000_000}).rotate();const metadata=await image.metadata();if(!["jpeg","png"].includes(metadata.format||""))throw Error("invalid raster");
 const og=await image.clone().resize(1200,630,{fit:"contain",background:"#FAF8F5"}).jpeg({quality:90}).toBuffer();
 const pin=await image.clone().resize(1000,1500,{fit:"contain",background:"#FAF8F5"}).jpeg({quality:90}).toBuffer();
 const id=randomUUID();const createdAt=new Date().toISOString();const immutablePost=generated.post.visual && generated.post.visual.enabled!==false ? {...generated.post,visual:{...generated.post.visual,mediaUrl:`${origin}/media/posts/${id}/og.jpg`,uploadedImage:""}} : generated.post;const record:PublicSnapshot={...generated,post:immutablePost,id,title:generated.post.title,description:[generated.post.hook,generated.post.explanation].join(" ").replace(/\s+/g," ").slice(0,280),authorName,origin,createdAt,imageUrl:`${origin}/media/posts/${id}/og.jpg`,pinterestImageUrl:`${origin}/media/posts/${id}/pin.jpg`};
 const store=shareStore();const keys=[`media/${id}/og.jpg`,`media/${id}/pin.jpg`,`posts/${id}`];
 try {await store.set(keys[0],new Uint8Array(og).buffer,{onlyIfNew:true,metadata:{createdAt}});await store.set(keys[1],new Uint8Array(pin).buffer,{onlyIfNew:true,metadata:{createdAt}});await store.setJSON(keys[2],record,{onlyIfNew:true});}
 catch(e){await Promise.allSettled(keys.map(k=>store.delete(k)));throw e;}
 return {id,url:`${origin}/p/${id}`,imageUrl:record.imageUrl,pinterestImageUrl:record.pinterestImageUrl};
}
export async function readSnapshot(id:string){if(!validSnapshotId(id))return null;const fixture=previewFixture(id,deploymentOrigin());if(fixture)return fixture;const record=await shareStore().get(`posts/${id}`,{type:"json"}) as PublicSnapshot|null;if(record&&process.env.CONTEXT!=="production"&&process.env.CONTEXT&&Date.now()-Date.parse(record.createdAt)>30*86400000)return null;return record;}
