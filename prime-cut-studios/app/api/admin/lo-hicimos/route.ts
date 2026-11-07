import {randomBytes} from 'node:crypto';
import {adminAuthenticated,requestIsSameOrigin} from '@/lib/auth';
import {checkInvite,listBlocks,rest,sha,PROJECT_ID,type Block} from '@/lib/lo-hicimos-workspace';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!requestIsSameOrigin(req))return Response.json({error:'Invalid origin'},{status:403});
 const payload=await req.text();if(payload.length>30000)return Response.json({error:'Too large'},{status:413});
 let data:Record<string,unknown>;try{data=JSON.parse(payload);}catch{return Response.json({error:'Invalid JSON'},{status:400});}
 const admin=await adminAuthenticated();
 if(data.action==='invite'){
  if(!admin)return Response.json({error:'Forbidden'},{status:403});
  const email=String(data.email||'').trim().toLowerCase(),role=String(data.role||'editor');
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||email.length>254||!['editor','viewer'].includes(role))return Response.json({error:'Invalid email or role'},{status:400});
  const token=randomBytes(32).toString('base64url');
  const expires=new Date(Date.now()+60*86400000).toISOString();
  await rest('pc_lh_invites',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({token_hash:sha(token),email,role,expires_at:expires})});
  return Response.json({path:'/collab/lo-hicimos/'+token,email,expires});
 }
 const token=String(data.token||'');
 const invite=admin?null:await checkInvite(token);
 if(!admin&&(!invite||invite.role!=='editor'))return Response.json({error:'No edit access'},{status:403});
 if(data.action==='list'){return Response.json({blocks:await listBlocks()});}
 if(data.action!=='save')return Response.json({error:'Unknown action'},{status:400});
 const id=String(data.id||''),title=String(data.title||'').trim(),body=String(data.body||'');
 const revision=Number(data.revision),colors=data.colors;
 if(!/^[0-9a-f-]{36}$/i.test(id)||title.length<2||title.length>160||body.length>20000||!Number.isSafeInteger(revision)||revision<1)return Response.json({error:'Invalid fields'},{status:400});
 if(!Array.isArray(colors)||colors.length>12||colors.some((c:unknown)=>typeof c!=='object'||!c||!('hex'in c)||!('name'in c)||!/^#[0-9A-Fa-f]{6}$/.test(String((c as {hex:string}).hex))||String((c as {name:string}).name).length>50))return Response.json({error:'Invalid colors'},{status:400});
 const current=await rest<Block[]>('pc_project_book_blocks?project_id=eq.'+PROJECT_ID+'&id=eq.'+id+'&select=id,kind,title,body,metadata,revision,position,project_id&limit=1');
 const block=current[0];if(!block)return Response.json({error:'Not found'},{status:404});
 if(block.revision!==revision)return Response.json({error:'Alguien actualizó esta sección. Recarga antes de guardar.'},{status:409});
 const links=data.links;
 if(!Array.isArray(links)||links.length>24||links.some((x:unknown)=>typeof x!=='object'||!x||!('url' in x)||!('label' in x)||!/^pc-image:lo-hicimos\\/[0-9a-f-]{36}\\/[0-9a-f-]{36}\\.(jpg|png|webp)$/i.test(String((x as {url:string}).url))||String((x as {label:string}).label).length>100))return Response.json({error:'Invalid image references'},{status:400});
 const meta={...(block.metadata||{}),links:links.map((x:{url:string;label:string})=>({url:x.url,label:x.label})),colors:colors.map((c:{name:string;hex:string})=>({name:String(c.name).slice(0,50),hex:c.hex}))};
 const result=await rest<boolean>('rpc/pc_save_project_book',{method:'POST',body:JSON.stringify({p_block_id:id,p_project_id:PROJECT_ID,p_expected_revision:revision,p_input:{kind:block.kind,title,body,metadata:meta,client_visible:false,requires_approval:false},p_actor_id:null})});
 if(!result)return Response.json({error:'La sección cambió. Recarga antes de guardar.'},{status:409});
 return Response.json({ok:true,revision:revision+1});
}
