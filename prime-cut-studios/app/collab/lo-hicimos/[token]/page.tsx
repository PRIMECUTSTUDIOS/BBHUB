import {notFound} from 'next/navigation';
import {checkInvite,listBlocks} from '@/lib/lo-hicimos-workspace';
import {LoHicimosEditor} from '@/components/LoHicimosEditor';
export const runtime='nodejs';export const dynamic='force-dynamic';
export const metadata={title:'Equipo Lo Hicimos | Prime Cut Studios',robots:{index:false,follow:false}};
export default async function Collaborate({params}:{params:Promise<{token:string}>}){const {token}=await params;const invite=await checkInvite(token);if(!invite)notFound();const initial=await listBlocks();return <LoHicimosEditor initial={initial} token={token} role={invite.role}/>;}
