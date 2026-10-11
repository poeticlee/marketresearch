import { NextResponse } from 'next/server';
import { store } from '@gcrp/db';
export async function GET(){ return NextResponse.json([...store.records.values()]); }
export async function PATCH(req: Request){ const {id,status,actor}=await req.json();
return NextResponse.json(store.setRecordStatus(id,status,actor||'reviewer')); }
