// Optional integration QA: install @electric-sql/pglite in a test workspace, never production.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const client = new PGlite();
const db = drizzle(client);
function load(path, aliases) {
 const { outputText } = ts.transpileModule(fs.readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const exports={};vm.runInNewContext(outputText,{exports,require:n=>Object.hasOwn(aliases,n)?aliases[n]:require(n)});return exports;
}
try {
 const migration=fs.readFileSync("scripts/teacher/posts-schema.sql","utf8");
 await client.exec(migration);await client.exec(migration);
 const schema=load("src/db/teacher-posts-schema.ts",{});
 const repository=load("src/server/teacher-posts/repository.ts",{"server-only":{},"@/db":{db},"@/db/teacher-posts-schema":schema});
 const post={title:"Кофе",hook:"Попробуем",example:"Un café",explanation:"Заметка преподавателя",interactiveQuestion:{question:"Что закажем?",options:["Кофе","Чай"],correctIndex:0,feedback:"Un café — кофе"}};
 const draft={teacherLessonsUrl:"https://example.com/lessons"};
 const user={telegramId:123,firstName:"QA",lastName:null,username:"qa",email:"private@example.invalid"};
 const created=await repository.publishPost(user,draft,{post,cta:{label:"Уроки преподавателя",url:draft.teacherLessonsUrl},mode:"mock"});
 assert.match(created.slug,/^post-[0-9a-f-]{36}$/);
 assert.equal(created.status,"published");
 const read=await repository.publicPost(created.slug);
 assert.deepEqual(JSON.parse(JSON.stringify(read.post)),post);assert.equal(read.authorName,"QA");
 assert.equal(JSON.stringify(read).includes("private@example.invalid"),false);
 assert.equal(Object.hasOwn(read,"telegramId"),false);
 assert.equal(await repository.publicPost("missing"),null);
 const second=await repository.publishPost(user,draft,{post,cta:null,mode:"mock"});
 assert.notEqual(second.slug,created.slug);
 assert.equal((await client.query('SELECT count(*)::int AS count FROM teacher_post_authors')).rows[0].count,1);
 await assert.rejects(repository.publishPost({...user,telegramId:999},draft,{post,cta:null,mode:"invalid"}));
 assert.equal((await client.query('SELECT count(*)::int AS count FROM teacher_post_authors')).rows[0].count,1,'failed transaction leaked author');
 const author=(await client.query('SELECT id FROM teacher_post_authors')).rows[0].id;
 await assert.rejects(client.query("INSERT INTO teacher_posts(author_id,slug,post,mode) VALUES ($1,$2,'{}','mock')",[author,created.slug]));
 await assert.rejects(client.query("INSERT INTO teacher_posts(author_id,slug,post,mode) VALUES ('00000000-0000-0000-0000-000000000000','foreign','{}','mock')"));
 const model=load("src/lib/teacher-posts/model.ts",{});
 const templates=load("src/server/teacher-posts/templates.ts",{});
 const examples=load("src/lib/teacher-posts/examples.ts",{}).wowExamples;
 const v2=templates.templatePost({topic:"",sourceText:examples[1].sourceText,tone:"humor",level:"A1-A2"});
 for (const visual of [ {...v2.visual,enabled:false,variant:"deadpan"}, {...v2.visual,enabled:true,variant:"expectation",uploadedImage:"data:image/jpeg;base64,/9j/AAAA"} ]) {
   const content=model.parsePost({...v2,visual});assert.ok(content);
   const saved=await repository.publishPost(user,draft,{post:content,cta:null,mode:"mock"});
   const loaded=await repository.publicPost(saved.slug);
   assert.deepEqual(JSON.parse(JSON.stringify(loaded.post)),JSON.parse(JSON.stringify(content)));
 }
 console.log('V2 meme choice, no-meme and bounded uploaded raster survive actual repository publish/read.');
 console.log('Real Drizzle/PGlite repository: publish/read, unique slug/identity, public projection, author ownership FK and transaction rollback passed.');
} finally { await client.close(); }
