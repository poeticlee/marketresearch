'use client';
import { useState } from 'react';
export default function Home(){ const [brief,setBrief]=useState(''); const [msg,setMsg]=useState('');
async function check(){ const r=await fetch('/api/briefs/validate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawText:brief,purpose:'Academic mapping of public business contacts',country:'NG'})}); setMsg(JSON.stringify(await r.json(),null,2)); }
return (<div><h2>Brief builder (Phase 2 validator demo)</h2><textarea value={brief} onChange={e=>setBrief(e.target.value)} rows={4} cols={70} placeholder='e.g. Businesses in Iwo Road, Ibadan that publicly describe themselves as women-owned'/><br/><button onClick={check}>Validate</button><pre>{msg}</pre><p><a href='/review'>Review screen</a> | <a href='/admin'>Admin</a> | <a href='/opt-out'>Opt-out</a></p></div>); }
