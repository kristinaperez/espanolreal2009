import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
function load(path,aliases={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,require:n=>aliases[n]});return exports}
const model=load('src/lib/teacher-socials.ts',{'./teacher-posts/share':{socialPlatforms:['Telegram','Instagram','Threads','Facebook','Max','Вконтакте','WhatsApp','Pinterest']}});
const links={Telegram:'https://t.me/example',Instagram:'https://www.instagram.com/example/',Threads:'https://threads.com/@example',Facebook:'https://facebook.com/example',Max:'https://max.ru/example','Вконтакте':'https://vk.com/example',WhatsApp:'https://chat.whatsapp.com/example',Pinterest:'https://pinterest.es/example'};
assert.equal(Object.keys(model.parseTeacherSocialLinks(links)).length,8);
for(const invalid of [{Telegram:'javascript:alert(1)'},{Telegram:'http://t.me/a'},{Telegram:'https://t.me.evil.test/a'},{Telegram:'https://evil.test/?t.me'},{Telegram:'https://user:pass@t.me/a'},{Telegram:'https://t.me:99/a'},{Instagram:'https://t.me/a'},{Telegram:3},{telegramId:123},{Telegram:'https://t.me/'}])assert.equal(model.parseTeacherSocialLinks(invalid),null);
assert.equal(Object.keys(model.parseTeacherSocialLinks({Telegram:''})).length,0);
let user=null,saved=null;const aliases={'@/lib/teacher-socials':model,'@/server/teacher-posts/origin':{samePostOrigin:r=>r.same},'@/server/http':{currentUser:async()=>user,rateLimit:()=>null,errorResponse:(error,status=400)=>({error,status}),jsonResponse:value=>({value,status:200}),readJsonBody:async r=>r.body},'@/server/teacher-settings/store':{readTeacherSocials:async id=>id===42?links:{},saveTeacherSocials:async(id,links)=>{saved={id,links}}}};
const route=load('src/app/api/teacher/settings/route.ts',aliases);
assert.equal((await route.GET({})).status,401);assert.equal((await route.PUT({same:true,body:{links}})).status,401);
user={telegramId:42};assert.equal((await route.PUT({same:false,body:{links}})).status,403);assert.equal(saved,null);
assert.equal((await route.PUT({same:true,body:{telegramId:999,links}})).status,200);assert.equal(saved.id,42);
assert.equal((await route.PUT({same:true,body:{links:{Telegram:'https://evil.test/'}}})).status,400);
assert.equal(Object.keys((await route.GET({})).value.links).length,8);
user={telegramId:99};assert.equal(Object.keys((await route.GET({})).value.links).length,0);
console.log('8 network URL validation, no external fetch, guest auth gate, CSRF, forged owner ignored and account isolation passed.');
