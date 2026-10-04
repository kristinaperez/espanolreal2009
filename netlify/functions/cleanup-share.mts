import { getStore, listStores } from "@netlify/blobs";
// Published production snapshots remain indefinitely. Preview snapshots expire after 30 days.
// Partial-write cleanup is immediate; this also reclaims media orphaned by a process crash after 24h.
export default async function cleanupShare() {
 let deleted=0;
 for await (const page of listStores({paginate:true})) for(const name of page.stores){
  if(!/^teacher-share-(production|preview-[a-f0-9]{16})$/.test(name))continue;
  const store=getStore({name,consistency:"strong"});
  for await(const entries of store.list({prefix:"posts/",paginate:true}))for(const entry of entries.blobs){
   if(!name.startsWith("teacher-share-preview-"))continue;
   const record=await store.get(entry.key,{type:"json"}) as {createdAt?:string}|null;
   if(record?.createdAt&&Date.now()-Date.parse(record.createdAt)>30*86400000){const id=entry.key.slice(6);await store.delete(entry.key);await store.delete(`media/${id}/og.jpg`);await store.delete(`media/${id}/pin.jpg`);deleted++;}
  }
  for await(const entries of store.list({prefix:"media/",paginate:true}))for(const entry of entries.blobs){
   const id=entry.key.split("/")[1];const info=await store.getMetadata(entry.key);const created=info?.metadata?.createdAt;
   if(typeof created==="string"&&Date.now()-Date.parse(created)>86400000&&!await store.get(`posts/${id}`,{type:"json"})){await store.delete(entry.key);deleted++;}
  }
 }
 return new Response(JSON.stringify({deleted}),{headers:{"content-type":"application/json"}});
}
export const config={schedule:"@daily"};
