'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';

type Match={id:string;home:string;away:string;league:string;finished:boolean};
type Prediction={match?:{home:string;away:string;league:string};result?:any};

const confidence=(p:Prediction)=>Math.max(0,Math.min(1,Number(p?.result?.confidence||0)));
const pickFor=(p:Prediction,market:string)=>{
 const r=p?.result||{};
 if(market==='1X2') return r.pick||'—';
 if(market==='BTTS') return r.btts?.pick||r.btts?.prediction||r.btts||'—';
 if(market==='TOTAL') return r.totalGoals?.pick||r.total?.pick||r.totalGoals?.prediction||'—';
 if(market==='DOUBLE') return r.doubleChance?.pick||r.doubleChance||'—';
 return r.pick||'—';
};

export default function Coupon(){
 const[matches,setMatches]=useState<Match[]>([]),[n,setN]=useState(5),[market,setMarket]=useState('1X2'),[rows,setRows]=useState<Prediction[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[img,setImg]=useState('');
 useEffect(()=>{fetch('/api/matches',{cache:'no-store'}).then(r=>r.json()).then(j=>setMatches(j.matches||[])).catch(()=>setError('Impossible de charger les matchs.'))},[]);
 const candidates=useMemo(()=>matches.filter(m=>!m.finished),[matches]);
 async function build(){
  setLoading(true);setError('');setImg('');
  try{
   const input=candidates.slice(0,100).map(m=>({id:m.id,home:m.home,away:m.away,league:m.league}));
   if(!input.length) throw new Error('Aucun match disponible.');
   const res=await fetch('/api/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({matches:input})});
   const j=await res.json();if(!res.ok||!j.predictions) throw new Error(j.error||'Le moteur de prédiction est indisponible.');
   const merged=j.predictions.map((raw:any,i:number)=>{const p=raw.prediction||raw;const id=String(raw.id||'');const source=candidates.find(m=>m.id===id)||candidates[i];return {...p,match:p.match||source};})
    .filter((p:any)=>p.match).sort((a:any,b:any)=>confidence(b)-confidence(a));
   setRows(merged.slice(0,n));
  }catch(e:any){setError(e.message||'Erreur inconnue.')}finally{setLoading(false)}
 }
 async function makeImage(){
  if(!rows.length)return;
  const text=rows.map(r=>`${r.match?.home} vs ${r.match?.away}: ${pickFor(r,market)} (${Math.round(confidence(r)*100)}%)`).join('; ');
  const j=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:`Professional football prediction coupon, SOLITAIRE HACK, market ${market}, ${text}, dark premium sports analytics design`})}).then(r=>r.json());if(j.url)setImg(j.url);
 }
 return <main className='shell'><header className='top'><div><div className='brand'>SOLITAIRE HACK 🇨🇮</div><div className='tag'>Il est temps de voir grand</div></div><nav className='nav'><Link href='/'>Matchs</Link><Link href='/coupon'>Coupon IA</Link><Link href='/suivi'>Suivi</Link><Link href='/ia'>IA</Link></nav></header>
 <section className='hero'><div className='eyebrow'>COUPON INTELLIGENT</div><h1>Le moteur analyse. Tu sélectionnes.</h1><p className='muted'>Le coupon est construit à partir des matchs disponibles et classé par confiance du moteur FIFA AI Trainer. Une probabilité reste une estimation, pas une garantie.</p></section>
 <div className='controls'><select className='select' value={n} onChange={e=>setN(Number(e.target.value))}>{[3,5,8,10,15].map(x=><option key={x} value={x}>{x} matchs</option>)}</select><select className='select' value={market} onChange={e=>setMarket(e.target.value)}><option value='1X2'>1X2</option><option value='DOUBLE'>Double chance</option><option value='BTTS'>BTTS</option><option value='TOTAL'>Total buts</option></select><button className='btn' onClick={build} disabled={loading}>{loading?'Analyse en cours…':'⚡ Générer le coupon'}</button><span className='tag'>{candidates.length} matchs candidats</span></div>
 {error&&<div className='card danger'>{error}</div>}
 <div className='grid'>{rows.map((r,i)=><article className='card' key={`${r.match?.home}-${r.match?.away}-${i}`}><div className='league'>{r.match?.league}</div><div className='teams'><span>{r.match?.home}</span><span className='score'>VS</span><span>{r.match?.away}</span></div><div className='prediction'><div className='row'><span className='muted'>{market}</span><strong>{pickFor(r,market)}</strong></div><div className='row'><span className='small'>Confiance du modèle</span><strong>{Math.round(confidence(r)*100)}%</strong></div><div className='bar'><i style={{width:`${confidence(r)*100}%`}}/></div></article>)}</div>
 {rows.length>0&&<div className='controls'><button className='btn' onClick={makeImage}>▣ Créer l'image du coupon</button><Link className='btn' href='/suivi'>Voir le suivi</Link></div>}{img&&<img src={img} alt='Coupon IA' style={{maxWidth:'720px',width:'100%',borderRadius:18}}/>}
 </main>
}