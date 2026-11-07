import {createHash} from 'node:crypto';
export const PROJECT_ID='c85f7e5b-0042-498b-bb94-4332d6d69173';
export type Block={id:string;project_id:string;kind:string;title:string;body:string;metadata:{links?:{url:string;label:string}[];colors?:{name:string;hex:string}[]};position:number;revision:number};
export type Invite={token_hash:string;email:string;role:'editor'|'viewer';expires_at:string;revoked_at:string|null};
const cfg=()=>{
 const base=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_SECRET_KEY||'';
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base)||key.length<20)throw Error('Workspace storage not configured');
 return {base,key};
};
export async function rest<T>(table:string,init:RequestInit={}):Promise<T>{
 const {base,key}=cfg();const r=await fetch(base+'/rest/v1/'+table,{...init,cache:'no-store',headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+key}),'Content-Type':'application/json',...(init.headers as Record<string,string>||{})}});
 if(!r.ok)throw Error('Workspace database request failed ('+r.status+')');return r.status===204?([] as T):await r.json() as T;
}
export const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
export async function listBlocks(){return rest<Block[]>('pc_project_book_blocks?project_id=eq.'+PROJECT_ID+'&select=id,project_id,kind,title,body,metadata,position,revision&order=position.asc');}
export async function checkInvite(token:string):Promise<Invite|null>{
 if(!/^[A-Za-z0-9_-]{40,100}$/.test(token))return null;
 const h=sha(token),r=await rest<Invite[]>('pc_lh_invites?token_hash=eq.'+h+'&select=token_hash,email,role,expires_at,revoked_at&limit=1');
 const a=r[0];return a&&!a.revoked_at&&Date.parse(a.expires_at)>Date.now()?a:null;
}
