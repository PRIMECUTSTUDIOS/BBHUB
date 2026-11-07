import {redirect} from 'next/navigation';
import {adminAuthenticated} from '@/lib/auth';
import {listBlocks} from '@/lib/lo-hicimos-workspace';
import {LoHicimosEditor} from '@/components/LoHicimosEditor';
export const runtime='nodejs';export const dynamic='force-dynamic';
export const metadata={title:'Editar Lo Hicimos | Prime Cut Studios',robots:{index:false,follow:false}};
export default async function EditLoHicimos(){if(!await adminAuthenticated())redirect('/admin/login');const initial=await listBlocks();return <LoHicimosEditor initial={initial} admin/>;}
