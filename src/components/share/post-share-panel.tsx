"use client";
import { useEffect,useRef,useState } from "react";
import { Share2 } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { formatPost,parsePost,type GeneratedPost,type LessonDraft } from "@/lib/teacher-posts/model";
import { preparePostImage,fileDataUrl } from "@/lib/post-image";
import { desktopShareUrl,downloadShareFile,sharePreparedFile,supportsFileShare,type ShareSnapshot } from "@/lib/share";
import { shareTranslations } from "@/lib/share-translations";
import type { SocialPlatform } from "@/lib/teacher-posts/share";
import { ShareButton,shareNetworks } from "./share-button";
const button="min-h-11 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold disabled:opacity-40";
export function PostSharePanel({generated,draft,onNotice}:{generated:GeneratedPost;draft:LessonDraft;onNotice:(message:string)=>void}){
 const {language}=useLanguage(),{user}=useAuth();const t=shareTranslations[language];
 const [prepared,setPrepared]=useState<{key:string;file:File}|null>(null),[failure,setFailure]=useState(""),[snapshot,setSnapshot]=useState<{key:string;data:ShareSnapshot}|null>(null),[publishing,setPublishing]=useState(false),[manual,setManual]=useState("");
 const key=JSON.stringify({generated,draft,owner:user?.telegramId??"guest"});const latest=useRef(key);useEffect(()=>{latest.current=key},[key]);
 useEffect(()=>{let active=true;void preparePostImage(generated.post).then(file=>{if(active){setPrepared({key,file});setFailure("")}},()=>{if(active)setFailure(key)});return()=>{active=false}},[key,generated.post]);
 const file=prepared?.key===key?prepared.file:null;const data=snapshot?.key===key?snapshot.data:null;const text=formatPost(generated.post,generated.cta);const valid=!!parsePost(generated.post);
 async function copy(value:string,message:string){try{if(!navigator.clipboard?.writeText)throw Error("clipboard");await navigator.clipboard.writeText(value);onNotice(message)}catch{setManual(value);onNotice(t.manual)}}
 async function publish(){if(!user){onNotice(t.login);return}if(!file||publishing)return;const version=key;setPublishing(true);try{const image=await fileDataUrl(file);const response=await fetch("/api/teacher/posts/share",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({draft,post:generated.post,mode:generated.mode,image})});const result=await response.json();if(!response.ok)throw Error(result.error);if(latest.current!==version)return;setSnapshot({key:version,data:result});onNotice(t.published);return result as ShareSnapshot}catch{onNotice(t.error)}finally{setPublishing(false)}}
 function click(platform?:SocialPlatform){
  const mobile=window.matchMedia("(max-width: 767px)").matches||navigator.maxTouchPoints>0;
  if(mobile&&supportsFileShare(file)){
   void sharePreparedFile(file!,generated.post.title,text,()=>onNotice(t.copied),()=>{setManual(text);onNotice(t.manual)}).catch(e=>{if(e?.name!=="AbortError")onNotice(t.error)});return;
  }
  if(platform==="Instagram"){if(file)downloadShareFile(file);void copy(text,t.instagram);return}
  if(mobile){onNotice(t.unsupported);return}
  if(!data){
   if(!user){onNotice(t.login);return}
   // Reserve the window before any asynchronous upload so popup blockers keep the gesture.
   const popup=platform ? window.open("about:blank","_blank","popup,width=720,height=720") : null;
   if(popup){popup.opener=null;popup.document.title=t.publishing;popup.document.body.textContent=t.publishing;}
   void publish().then(result=>{if(!result){popup?.close();return}const target=platform?desktopShareUrl(platform,result,generated.post.title,text):null;if(target&&popup)popup.location.replace(target);else if(target)onNotice(t.blocked);else void copy(result.url,t.linkCopied)});return;
  }
  const target=platform?desktopShareUrl(platform,data,generated.post.title,text):null;
  if(target){const popup=window.open(target,"_blank","popup,width=720,height=720");if(popup)popup.opener=null;else onNotice(t.blocked)}else void copy(data.url,t.linkCopied);
 }
 return <section aria-label={t.share} className="mt-6 space-y-4">
  <h3 className="text-sm font-extrabold">{t.share}</h3>
  <button type="button" disabled={!file||!valid||publishing} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#9E2A2B] px-5 py-3 font-bold text-white disabled:opacity-40 md:hidden" onClick={()=>click()}><Share2 size={20}/>{t.share}</button>
  <div className="flex flex-wrap gap-2">{shareNetworks.map(network=><ShareButton key={network.name} network={network} disabled={!valid||!file||publishing} onClick={click}/>)}</div>
  {!file&&<p role="status" className="text-sm">{failure===key?t.unavailable:t.preparing}</p>}
  <p className="text-xs leading-5 text-stone-500 md:hidden">{t.fileHint}</p><p className="hidden text-xs leading-5 text-stone-500 md:block">{t.publicHint}</p>
  {publishing&&<p role="status">{t.publishing}</p>}
  <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={publishing||!file||!valid} onClick={()=>{if(data)void copy(data.url,t.linkCopied);else void publish()}}>{t.copyLink}</button><button type="button" className={button} disabled={!valid} onClick={()=>void copy(text,t.copied)}>{t.copyText}</button><button type="button" className={button} disabled={!file} onClick={()=>{if(file)downloadShareFile(file)}}>{t.download}</button></div>
  {data&&<a className="block break-all text-sm font-bold text-[#9E2A2B]" href={data.url} target="_blank" rel="noopener noreferrer">{data.url}</a>}
  {manual&&<label className="block text-sm">{t.manual}<textarea readOnly value={manual} onFocus={e=>e.target.select()} className="mt-2 w-full rounded-xl border p-3" rows={5}/></label>}
 </section>;
}
