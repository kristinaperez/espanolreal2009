import { templatePost } from "@/server/teacher-posts/templates";
import { wowExamples } from "@/lib/teacher-posts/examples";
import { emptyDraft } from "@/lib/teacher-posts/model";
export const previewFixtureId="bc92ec90-8897-43be-bd92-94419ffae82c";
/** Read-only fictional fixture for crawler QA, deploy previews only; never authorises writes. */
export function previewFixture(id:string,origin:string){
 if(process.env.CONTEXT!=="deploy-preview"||id!==previewFixtureId)return null;
 const post=templatePost({...emptyDraft,sourceText:wowExamples[1].sourceText});
 return {id,post,cta:null,mode:"mock" as const,title:post.title,description:post.hook,authorName:"QA · пример",origin,createdAt:"2026-10-04T00:00:00Z",imageUrl:`${origin}/media/posts/${id}/og.jpg`,pinterestImageUrl:`${origin}/media/posts/${id}/pin.jpg`};
}
export const fixtureSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#FAF8F5"/><rect width="1200" height="20" fill="#9E2A2B"/><text x="64" y="100" font-family="sans-serif" font-size="42" fill="#9E2A2B">Español Real · QA preview</text><path d="M360 300 330 200 430 240 Q510 210 580 240L680 200 650 300C710 530 300 530 360 300Z" fill="#fff" stroke="#292524" stroke-width="10"/><ellipse cx="450" cy="325" rx="20" ry="26"/><ellipse cx="570" cy="325" rx="20" ry="26"/><ellipse cx="510" cy="420" rx="25" ry="30" fill="none" stroke="#292524" stroke-width="8"/><text x="760" y="370" font-family="sans-serif" font-size="100" fill="#9E2A2B">€?!</text><text x="64" y="570" font-family="sans-serif" font-size="38">Estoy sin blanca. ¡Cuesta un ojo de la cara!</text></svg>`;
