import { NextResponse } from 'next/server';
import { store } from '@gcrp/db';
import { randomUUID } from 'crypto';
// Data subject requests: access/correction/deletion/objection. Opt-outs actioned within 48h.
export async function POST(req: Request){ const b=await req.json();
const r={ id: randomUUID(), type: b.type, contact: b.contact, detail: b.detail||'', status:'open', slaDue: new Date(Date.now()+48*3600e3).toISOString(), createdAt: new Date().toISOString() };
store.dsr.push(r); store.log('dsr','dsr.open',r.id); return NextResponse.json(r); }
export async function GET(){ return NextResponse.json(store.dsr); }
