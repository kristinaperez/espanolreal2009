import type { NextRequest } from "next/server";
import { currentUser,errorResponse,jsonResponse,rateLimit,readJsonBody } from "@/server/http";
import { samePostOrigin } from "@/server/teacher-posts/origin";
import { parseDraft,parsePost,resolveCta } from "@/lib/teacher-posts/model";
import { deploymentOrigin,saveSnapshot } from "@/server/share/store";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 if(!samePostOrigin(request))return errorResponse("Недопустимый источник запроса",403);
 const limited=rateLimit(request,"teacher-share",10,60_000);if(limited)return limited;
 const user=await currentUser(request);if(!user)return errorResponse("Войдите через Telegram",401);
 const body=await readJsonBody<{draft?:unknown;post?:unknown;mode?:unknown;image?:unknown}>(request,4*1024*1024);
 const draft=parseDraft(body?.draft),post=parsePost(body?.post);if(!draft||!post||typeof body?.image!=="string"||!["ai","mock"].includes(String(body?.mode)))return errorResponse("Проверьте пост и картинку");
 try{const origin=deploymentOrigin(request.headers.get("origin")!);const snapshot=await saveSnapshot({post,mode:body.mode==="ai"?"ai":"mock",cta:resolveCta(draft,user.username,origin)},[user.firstName,user.lastName].filter(Boolean).join(" ")||"Преподаватель",origin,body.image);return jsonResponse(snapshot,201);}
 catch{return errorResponse("Публичная публикация недоступна; сохраните картинку и текст отдельно",503);}
}
