import {randomUUID} from 'node:crypto';
import {adminAuthenticated,requestIsSameOrigin} from '@/lib/auth';
import {PROJECT_ID,checkInvite,rest,type Block} from '@/lib/lo-hicimos-workspace';
export const runtime='nodejs';
const bucket='primecuts-project-documents';
const validPath=(s:string)=>/^lo-hicimos\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(s);
async function allowed(token:string,write=false){if(await adminAuthenticated())return true;const i=await checkInvite(token);return Boolean(i&&(!write||i.role==='editor'));}
function storageHeaders(key:string,mime?:string){return {apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+key}),...(mime?{'Content-Type':mime}:{})};}
export async function GET(req:Request){
 const u=new URL(req.url),path=u.searchParams.get('path')||'',token=u.searchParams.get('token')||'';
 if(!validPath(path)||!await allowed(token))return new Response('Forbidden',{status:403});
 const base=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_SECRET_KEY||'';
 if(!base||!key)return new Response('Storage not configured',{status:503});
 const r=await fetch(base+'/storage/v1/object/'+bucket+'/'+path,{cache:'no-store',headers:storageHeaders(key)});
 if(!r.ok)return new Response('Image unavailable',{status:404});
 return new Response(r.body,{headers:{'Content-Type':r.headers.get('content-type')||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}
export async function POST(req:Request){
 if(!requestIsSameOrigin(req))return Response.json({error:'Invalid origin'},{status:403});
 const size=Number(req.headers.get('content-length')||0);if(size>8_000_000)return Response.json({error:'Maximum 6 MB per image'},{status:413});
 const f=await req.formData();const token=String(f.get('token')||''),id=String(f.get('blockId')||''),revision=Number(f.get('revision'));
 if(!await allowed(token,true))return Response.json({error:'Forbidden'},{status:403});
 if(!/^[0-9a-f-]{36}$/i.test(id)||!Number.isSafeInteger(revision)||revision<1)return Response.json({error:'Invalid scene'},{status:400});
 const file=f.get('file');if(!(file instanceof File)||file.size>6_000_000||file.size<32)return Response.json({error:'Image too large or invalid'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer()),t=file.type;
 const ext=t==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpg':t==='image/png'&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71?'png':t==='image/webp'&&new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'?'webp':null;
 if(!ext)return Response.json({error:'Only genuine JPG, PNG, WebP images are accepted'},{status:400});
 const blocks=await rest<Block[]>('pc_project_book_blocks?project_id=eq.'+PROJECT_ID+'&id=eq.'+id+'&select=*&limit=1'),b=blocks[0];
 if(!b)return Response.json({error:'Scene not found'},{status:404});
 if(b.revision!==revision)return Response.json({error:'Esta sección cambió. Recarga antes de subir.'},{status:409});
 const path='lo-hicimos/'+id+'/'+randomUUID()+'.'+ext;
 const base=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_SECRET_KEY||'';
 const result=await fetch(base+'/storage/v1/object/'+bucket+'/'+path,{method:'POST',headers:{...storageHeaders(key,t),'x-upsert':'false'},body:bytes});
 if(!result.ok)return Response.json({error:'Image upload failed'},{status:502});
 const links=[...(b.metadata?.links||[]),{url:'pc-image:'+path,label:file.name.slice(0,100)}];
 if(links.length>24)return Response.json({error:'Too many references in this scene'},{status:400});
 const saved=await rest<boolean>('rpc/pc_save_project_book',{method:'POST',body:JSON.stringify({p_block_id:id,p_project_id:PROJECT_ID,p_expected_revision:revision,p_input:{kind:b.kind,title:b.title,body:b.body,metadata:{...b.metadata,links},client_visible:false,requires_approval:false},p_actor_id:null})});
 if(!saved)return Response.json({error:'Image uploaded, but document changed; reload before retrying'},{status:409});
 return Response.json({path,link:{url:'pc-image:'+path,label:file.name.slice(0,100)},revision:revision+1});
}
