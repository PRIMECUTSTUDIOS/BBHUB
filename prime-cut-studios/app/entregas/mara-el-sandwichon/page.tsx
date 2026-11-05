import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Entrega privada para Mara',
  description: 'Entrega privada de fotografías originales por Prime Cut Studios.',
  robots: { index: false, follow: false, noarchive: true },
};
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COOKIE = 'pc_mara_delivery';
const FILE = 'https://drive.google.com/file/d/15TawAgo_QM1Wg3BnxdJNwEOQvRfxUd82/view?usp=drivesdk';
const TTL = 60 * 60 * 24 * 7;

function sign(exp: string, secret: string) {
  return createHmac('sha256', secret).update('mara-el-sandwichon:' + exp).digest('hex');
}
function same(a: string, b: string) {
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
async function unlock(formData: FormData) {
  'use server';
  const expected = process.env.MARA_DELIVERY_PASSWORD;
  const secret = process.env.MARA_DELIVERY_SESSION_SECRET;
  const submitted = String(formData.get('password') || '');
  if (!expected || !secret || !same(submitted, expected)) {
    redirect('/entregas/mara-el-sandwichon?error=1');
  }
  const exp = String(Math.floor(Date.now() / 1000) + TTL);
  (await cookies()).set(COOKIE, exp + '.' + sign(exp, secret), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/entregas/mara-el-sandwichon', maxAge: TTL,
  });
  redirect('/entregas/mara-el-sandwichon');
}

export default async function MaraDelivery({
  searchParams,
}: {
  searchParams: Promise<{error?: string}>;
}) {
  const params = await searchParams;
  const raw = (await cookies()).get(COOKIE)?.value || '';
  const secret = process.env.MARA_DELIVERY_SESSION_SECRET;
  const [exp, signature] = raw.split('.');
  const granted = !!(secret && exp && signature && /^\\d+$/.test(exp)
    && Number(exp) > Math.floor(Date.now() / 1000)
    && same(signature, sign(exp, secret)));
  return <>
    <SiteHeader/>
    <main style={{minHeight:'70vh'}}>
      <section className="shell" style={{paddingTop:90,paddingBottom:90,maxWidth:880}}>
        <div className="eyebrow">PRIME CUT STUDIOS · PRIVATE DELIVERY</div>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(42px,7vw,72px)',lineHeight:1.05,margin:'18px 0'}}>Mara, your photos are ready.</h1>
        <p style={{fontSize:19,color:'#c7c0b5',maxWidth:680}}>El Sandwich-on TX · Original high-resolution images. Delivered in the same quality as the original files, without resizing or additional image compression.</p>
        <div className="panel" style={{marginTop:35,padding:32}}>
        {granted ? <>
          <div className="eyebrow">Your private download</div>
          <h2 style={{fontSize:28,margin:'10px 0'}}>Three original photographs</h2>
          <p className="muted">El Sandwichon TX1.jpg · El Sandwichon TX2.jpg · El Sandwichon TX3.jpg</p>
          <p className="muted">34.71 MB total · One ZIP archive · Password-protected archive</p>
          <a className="btn" href={FILE} target="_blank" rel="noopener noreferrer" style={{marginTop:18}}>Download original photos ↗</a>
          <p className="muted" style={{fontSize:13,marginTop:22}}>The ZIP file itself is encrypted. Use the delivery password again when extracting the files. Downloading from Google Drive may require access to the file owner’s Drive sharing permissions.</p>
        </> : <>
          <div className="eyebrow">Password required</div>
          <h2 style={{fontSize:26,margin:'10px 0'}}>Access your photo delivery</h2>
          <p className="muted">Enter the password shared by Prime Cut Studios to unlock the download.</p>
          <form action={unlock} className="form" style={{marginTop:22}}>
            <div className="field"><label htmlFor="password">Delivery password</label><input id="password" name="password" type="password" autoComplete="off" required minLength={8}/></div>
            {params.error==='1' && <p role="alert" style={{color:'#efa5a5'}}>Incorrect password. Please try again.</p>}
            <button className="btn" type="submit">Unlock delivery</button>
          </form>
        </>}
        </div>
        <p className="muted" style={{marginTop:32,fontSize:14}}>Exclusively prepared for Mara · Photography by Prime Cut Studios.</p>
      </section>
    </main>
    <Footer/>
  </>;
}
