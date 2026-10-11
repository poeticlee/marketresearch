'use client';
import { useState } from 'react';
export default function OptOut(){ const [v,setV]=useState(''); const [m,setM]=useState('');
async function go(){ const r=await fetch('/api/opt-out',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({value:v})}); setM(JSON.stringify(await r.json())); }
return (<div><h2>Opt out</h2><input value={v} onChange={e=>setV(e.target.value)} placeholder='email or phone'/><button onClick={go}>Suppress</button><pre>{m}</pre></div>); }
