'use client';
import {useState} from 'react';
import type {Block} from '@/lib/lo-hicimos-workspace';
type Props={initial:Block[];token?:string;admin?:boolean;role?:string};
export function LoHicimosEditor({initial,token='',admin=false,role='editor'}:Props){
 const [blocks,setBlocks]=useState(initial),[active,setActive]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[inviteEmail,setInviteEmail]=useState(''),[inviteRole,setInviteRole]=useState('editor'),[inviteLink,setInviteLink]=useState('');
 const edit=role==='editor'||admin,b=blocks[active];
 const update=(delta:Partial<Block>)=>setBlocks(prev=>prev.map((x,i)=>i===active?{...x,...delta}:x));
 const save=async()=>{
  if(!b||!edit)return;setBusy(true);setMessage('');
  try{const r=await fetch('/api/admin/lo-hicimos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',token,id:b.id,title:b.title,body:b.body,colors:b.metadata?.colors||[],links:b.metadata?.links||[],revision:b.revision})});const j=await r.json();
  if(!r.ok)throw Error(j.error||'Error al guardar');
  update({revision:j.revision});setMessage('Cambios guardados y compartidos con el equipo.');}catch(e){setMessage(e instanceof Error?e.message:'Error');}finally{setBusy(false);}
 };
 const upload=async(file:File)=>{
  if(!b||!edit)return;setBusy(true);setMessage('');
  try{const form=new FormData();form.set('file',file);form.set('token',token);form.set('blockId',b.id);form.set('revision',String(b.revision));
   const r=await fetch('/api/admin/lo-hicimos/image',{method:'POST',body:form});const j=await r.json();
   if(!r.ok)throw Error(j.error||'Error al subir la imagen');
   update({revision:j.revision,metadata:{...b.metadata,links:[...(b.metadata?.links||[]),j.link]}});
   setMessage('Referencia visual subida y guardada en el proyecto.');
  }catch(e){setMessage(e instanceof Error?e.message:'Error al subir');}finally{setBusy(false);}
 };
 const invite=async()=>{
  setBusy(true);setMessage('');try{const r=await fetch('/api/admin/lo-hicimos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'invite',email:inviteEmail,role:inviteRole})});const j=await r.json();if(!r.ok)throw Error(j.error||'Error');setInviteLink(location.origin+j.path);setMessage('Invitación creada. Copia este enlace y envíalo de forma privada al colaborador.');}catch(e){setMessage(e instanceof Error?e.message:'Error');}finally{setBusy(false);}
 };
 const box:React.CSSProperties={border:'1px solid #33404a',borderRadius:12,background:'#151c24',padding:18};
 const field:React.CSSProperties={width:'100%',padding:11,background:'#0a1119',color:'#fff',border:'1px solid #52606c',borderRadius:8,boxSizing:'border-box'};
 return <main style={{background:'#0b1016',color:'#f4f5f6',minHeight:'100vh',padding:'24px min(4vw,52px)',fontFamily:'system-ui,sans-serif'}}>
 <div style={{color:'#f0a34b',fontSize:12,letterSpacing:2}}>PRIME CUT STUDIOS · GOOD DEMON · PROYECTO APROBADO</div><h1 style={{fontSize:'clamp(28px,4vw,45px)',margin:'10px 0'}}>Lo Hicimos — Baby Johnny</h1>
 <p style={{color:'#b7c3cc'}}>Editor de producción en la web · 17 tomas · Storyboard · Vestuario · Paleta · Notas · Fecha de rodaje pendiente</p>
 <div style={{display:'flex',gap:9,flexWrap:'wrap',margin:'18px 0 26px'}}>
 <a style={{color:'#ffd39a'}} href="/admin/projects/lo-hicimos">Storyboard visual de referencia</a>
 {admin&&<a style={{color:'#ffd39a'}} href="/admin#projects">Volver al panel</a>}
 </div>
 {admin&&<section style={{...box,marginBottom:20}}><h2 style={{marginTop:0}}>Invitar colaboradores</h2><p style={{color:'#b7c3cc'}}>Crea accesos exclusivos a Lo Hicimos. No tendrán acceso al panel general ni a otros proyectos.</p>
 <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
 <input type="email" aria-label="Correo del colaborador" placeholder="Correo del colaborador" style={{...field,maxWidth:330}} value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}/>
 <select aria-label="Permiso" style={{...field,maxWidth:160}} value={inviteRole} onChange={e=>setInviteRole(e.target.value)}><option value="editor">Editor</option><option value="viewer">Solo lectura</option></select>
 <button disabled={busy||!inviteEmail.trim()} onClick={invite} style={{padding:'10px 18px',borderRadius:8,background:'#e3993e',color:'#101010',fontWeight:700,cursor:'pointer'}}>Generar invitación</button></div>
 {inviteLink&&<div style={{marginTop:12}}><label>Enlace privado de acceso</label><input readOnly style={{...field,marginTop:7}} value={inviteLink} onFocus={e=>e.target.select()}/><button style={{marginTop:9,padding:9}} onClick={()=>navigator.clipboard.writeText(inviteLink)}>Copiar enlace</button></div>}
 </section>}
 <div style={{display:'grid',gridTemplateColumns:'minmax(190px,270px) minmax(0,1fr)',gap:18,alignItems:'start'}}>
 <aside style={{...box,maxHeight:'75vh',overflowY:'auto'}}><h2 style={{marginTop:0,fontSize:17}}>Escenas y producción</h2>{blocks.map((x,i)=><button key={x.id} onClick={()=>{setActive(i);setMessage('');}} style={{display:'block',width:'100%',background:active===i?'#5b391f':'transparent',color:'#fff',border:'1px solid '+(active===i?'#e3993e':'transparent'),borderRadius:8,textAlign:'left',padding:10,marginBottom:5,cursor:'pointer',fontWeight:active===i?700:400}}>{x.title}<span style={{display:'block',fontSize:11,color:'#b9c1cc'}}>{x.kind.replace('_',' ')} · v{x.revision}</span></button>)}</aside>
 <section style={box}>{b&&<><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h2 style={{margin:0}}>Editar sección {active+1} / {blocks.length}</h2><span style={{fontSize:12,color:'#c7ad86'}}>{edit?'Permiso editor':'Solo lectura'}</span></div>
 <div style={{height:155,margin:'16px 0',borderRadius:10,background:'linear-gradient(145deg,#14202c,#3d3328)',position:'relative',overflow:'hidden',border:'1px solid #35434a'}}>
 <svg viewBox="0 0 600 155" width="100%" height="155" role="img" aria-label="Panel ilustrativo de encuadre"><path d="M0 140L130 67 255 130 400 49 600 126V155H0" fill="#091016"/><circle cx="395" cy="40" r="27" fill="#cc873a" opacity=".27"/><circle cx="260" cy="65" r="18" fill="#0a1016" stroke="#e3993e"/><path d="M224 130 Q227 84 260 86 Q300 87 300 130" fill="#101216" stroke="#e3993e"/><path d="M35 130L200 40" stroke="#df8e37" opacity=".35"/></svg>
 <span style={{position:'absolute',bottom:10,left:14,color:'#f1c087',fontSize:12}}>REFERENCE FRAME · {b.kind.toUpperCase()}</span></div>
 <label style={{display:'block',marginBottom:7}}>Título</label><input style={field} disabled={!edit} maxLength={160} value={b.title} onChange={e=>update({title:e.target.value})}/>
 <label style={{display:'block',margin:'17px 0 7px'}}>Descripción, tomas, vestuario y notas</label><textarea style={{...field,minHeight:235,resize:'vertical',lineHeight:1.6}} disabled={!edit} maxLength={20000} value={b.body} onChange={e=>update({body:e.target.value})}/>
 <div style={{marginTop:20,borderTop:'1px solid #34414d',paddingTop:12}}>
 <h3>Imágenes y referencias de esta escena</h3>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:12}}>
 {(b.metadata?.links||[]).filter(x=>x.url.startsWith('pc-image:')).map((x,i)=><div key={x.url} style={{border:'1px solid #465360',borderRadius:9,padding:8}}>
 <img src={'/api/admin/lo-hicimos/image?path='+encodeURIComponent(x.url.slice(9))+'&token='+encodeURIComponent(token)} alt={x.label} style={{width:'100%',height:125,objectFit:'cover',borderRadius:6}} referrerPolicy="no-referrer"/>
 <p style={{fontSize:12,overflowWrap:'anywhere'}}>{x.label}</p>
 {edit&&<button type="button" onClick={()=>update({metadata:{...b.metadata,links:(b.metadata?.links||[]).filter(z=>z.url!==x.url)}})} style={{fontSize:12}}>Quitar referencia (guardar para aplicar)</button>}</div>)}
 </div>
 {edit&&<label style={{display:'block',marginTop:14,color:'#f0c184'}}>Adjuntar foto desde tu computadora (JPG, PNG o WebP; hasta 6 MB)
 <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} style={{display:'block',marginTop:8}} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value='';}}/></label>}
 </div>
 {b.kind==='palette'&&<div style={{marginTop:15}}><h3>Paleta de colores</h3>{(b.metadata?.colors||[]).map((c,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
 <input type="color" value={c.hex} disabled={!edit} onChange={e=>{const colors=[...(b.metadata?.colors||[])];colors[i]={...c,hex:e.target.value};update({metadata:{...b.metadata,colors}});}}/>
 <input aria-label="Nombre del color" style={{...field,maxWidth:260}} value={c.name} disabled={!edit} onChange={e=>{const colors=[...(b.metadata?.colors||[])];colors[i]={...c,name:e.target.value};update({metadata:{...b.metadata,colors}});}}/>
 <span>{c.hex}</span></div>)}
 {edit&&(b.metadata?.colors||[]).length<12&&<button onClick={()=>update({metadata:{...b.metadata,colors:[...(b.metadata?.colors||[]),{name:'Nuevo color',hex:'#222222'}]}})}>Añadir color</button>}</div>}
 <div style={{display:'flex',alignItems:'center',gap:12,marginTop:20,flexWrap:'wrap'}}>{edit&&<button onClick={save} disabled={busy} style={{background:'#e99b3b',color:'#131313',border:0,borderRadius:8,padding:'13px 22px',fontWeight:700,cursor:'pointer'}}>{busy?'Guardando...':'Guardar cambios'}</button>}<span role="status" style={{color:'#f0cc90',fontSize:13}}>{message}</span></div>
 <p style={{color:'#aab3c0',fontSize:12,marginTop:15}}>Los cambios se guardan en la base privada del sitio y quedan disponibles para los demás colaboradores. Si otra persona guarda primero, se te pedirá recargar para evitar sobrescribir su trabajo.</p>
 </>}</section></div></main>;
}
