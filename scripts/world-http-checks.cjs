const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3112'],{stdio:['ignore','pipe','pipe']});
(async()=>{
  await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(new Error('Server start timeout')),20000);
    server.stdout.on('data',d=>{output+=d;if(output.includes('Ready')){clearTimeout(timer);resolve()}});
    server.once('exit',code=>{clearTimeout(timer);reject(new Error('Server exited '+code))});
  });
  for(const p of ['/ru/world','/','/learn','/lesson/1','/ar','/sitemap.xml']){
    const r=await fetch('http://127.0.0.1:3112'+p),s=await r.text();assert.equal(r.status,200,p);
    if(p==='/ru/world'){assert(s.includes('noindex'));assert(s.includes('https://espanolreal.es/ru/world'))}
    if(p==='/sitemap.xml')assert(!s.includes('/ru/world'));
    console.log('HTTP 200',p);
  }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.kill('SIGTERM'));
