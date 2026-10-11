'use client';
import { useState } from 'react';
interface Hit { id?: string; name: string; phones: string[]; emails: string[]; address?: string; sourceUrl: string }
export default function Home(){
  const [brief,setBrief]=useState('');
  const [msg,setMsg]=useState('');
  const [q,setQ]=useState('female jewellers in Manchester');
  const [city,setCity]=useState('Manchester');
  const [country,setCountry]=useState('GB');
  const [sector,setSector]=useState('jewellers');
  const [enrich,setEnrich]=useState(false);
  const [hits,setHits]=useState<Hit[]>([]);
  const [status,setStatus]=useState('');
  async function check(){
    const r=await fetch('/api/briefs/validate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawText:brief,purpose:'General business contact research',country})});
    setMsg(JSON.stringify(await r.json(),null,2));
  }
  async function search(){
    setStatus('Searching live sources…');
    setHits([]);
    const r=await fetch('/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawText:q,country,city,sector,enrich})});
    const j=await r.json();
    if(!r.ok){ setStatus('Blocked: '+JSON.stringify(j.brief?.reasons)); return; }
    setHits(j.records||[]);
    setStatus(`Found ${j.count} candidates (OSM contributors where sourced from OpenStreetMap)`);
  }
  return (<div>
    <h2>Search businesses</h2>
    <input value={q} onChange={e=>setQ(e.target.value)} size={50} placeholder='e.g. mechanics in Akinyele'/>
    <input value={city} onChange={e=>setCity(e.target.value)} size={14} placeholder='City'/>
    <input value={country} onChange={e=>setCountry(e.target.value)} size={4} placeholder='NG'/>
    <input value={sector} onChange={e=>setSector(e.target.value)} size={12} placeholder='Sector'/>
    <label><input type='checkbox' checked={enrich} onChange={e=>setEnrich(e.target.checked)}/> enrich websites</label>
    <button onClick={search}>Search</button>
    <p>{status}</p>
    {hits.length>0 && (<table border={1} cellPadding={4}><thead><tr><th>Name</th><th>Phones</th><th>Emails</th><th>Address</th><th>Source</th></tr></thead>
    <tbody>{hits.map((h,i)=>(<tr key={i}><td>{h.name}</td><td>{h.phones.join(', ')}</td><td>{h.emails.join(', ')}</td><td>{h.address}</td><td><a href={h.sourceUrl}>link</a></td></tr>))}</tbody></table>)}
    <h2>Brief check</h2>
    <textarea value={brief} onChange={e=>setBrief(e.target.value)} rows={3} cols={70} placeholder='Describe the target group'/><br/><button onClick={check}>Validate</button><pre>{msg}</pre>
    <p><a href='/review'>Review screen</a> | <a href='/admin'>Admin</a> | <a href='/opt-out'>Opt-out</a></p>
  </div>);
}
