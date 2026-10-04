import type { WowPost } from "./teacher-posts/model";
function loadImage(src: string): Promise<HTMLImageElement> {
 return new Promise((resolve,reject) => { const image = new Image(); image.crossOrigin = "anonymous"; const timer=setTimeout(()=>reject(new Error("image timeout")),12000); image.onload=()=>{clearTimeout(timer);resolve(image)};image.onerror=()=>{clearTimeout(timer);reject(new Error("image unavailable or CORS blocked"))};image.src=src; });
}
export async function preparePostImage(post: WowPost): Promise<File> {
 const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=1200;const ctx=canvas.getContext("2d");if(!ctx)throw Error("canvas");
 ctx.fillStyle="#FAF8F5";ctx.fillRect(0,0,1200,1200);ctx.fillStyle="#9E2A2B";ctx.fillRect(0,0,1200,20);
 ctx.font="bold 32px Arial, sans-serif";ctx.fillText("Español Real · живой испанский",64,85);
 function wrap(value:string,y:number,size:number,maxLines:number){ctx!.font=`bold ${size}px Arial, sans-serif`;ctx!.fillStyle="#292524";let line="",n=0;for(const word of value.split(/\s+/)){const next=(line+" "+word).trim();if(ctx!.measureText(next).width>1060&&line){ctx!.fillText(line,64,y,1060);y+=size*1.25;line=word;if(++n>=maxLines-1)break}else line=next}ctx!.fillText(line,64,y,1060);}
 wrap(post.title,160,46,3);
 const plan=post.visual;const media=plan?.enabled!==false&&(plan?.uploadedImage||plan?.mediaUrl);
 if(media){const image=await loadImage(media);const scale=Math.min(1060/image.naturalWidth,640/image.naturalHeight);const w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,(1200-w)/2,330+(640-h)/2,w,h);}
 else if(plan&&plan.enabled!==false){
  function cat(x:number,surprised:boolean){ctx!.save();ctx!.translate(x,430);ctx!.scale(3,3);ctx!.strokeStyle="#292524";ctx!.fillStyle="#fffaf4";ctx!.lineWidth=4;ctx!.beginPath();ctx!.moveTo(22,46);ctx!.lineTo(15,12);ctx!.lineTo(43,28);ctx!.quadraticCurveTo(60,20,77,28);ctx!.lineTo(105,12);ctx!.lineTo(98,46);ctx!.bezierCurveTo(115,105,5,105,22,46);ctx!.fill();ctx!.stroke();ctx!.beginPath();if(surprised){for(const x of[42,78]){ctx!.moveTo(x+7,53);ctx!.ellipse(x,53,7,10,0,0,Math.PI*2)}ctx!.moveTo(70,80);ctx!.ellipse(60,80,10,12,0,0,Math.PI*2)}else{ctx!.moveTo(33,52);ctx!.quadraticCurveTo(42,42,51,52);ctx!.moveTo(69,52);ctx!.quadraticCurveTo(78,42,87,52);ctx!.moveTo(42,77);ctx!.quadraticCurveTo(60,97,78,77)}ctx!.stroke();ctx!.restore();}
  if(plan.variant==="expectation"){cat(120,false);cat(650,true);ctx.font="bold 32px Arial";ctx.fillText("ПЛАН",160,400);ctx.fillText("РЕАЛЬНОСТЬ",650,400);}else{cat(300,plan.variant!=="deadpan");ctx.font="bold 100px Arial";ctx.fillStyle="#9E2A2B";ctx.fillText(plan.variant==="deadpan"?"…":plan.template==="wallet"?"€?!":plan.template==="clock"?"20 min":plan.template==="memory"?"♪":"?!",700,630);}
  wrap(plan.caption,890,48,4);
 } else {wrap(post.hook,430,48,5);wrap(post.core?.[0]?.phrase||post.example,850,42,3);}
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("encode")),"image/jpeg",0.9));
 if(blob.size>2*1024*1024)throw Error("image too large");return new File([blob],"espanolreal-post.jpg",{type:"image/jpeg"});
}
export function fileDataUrl(file: File): Promise<string> { return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error("read"));reader.readAsDataURL(file);}); }
