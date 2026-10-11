import { NextResponse } from 'next/server';
import { validateBrief } from '@gcrp/compliance';
export async function POST(req: Request){ const b=await req.json();
const out=validateBrief({projectId:b.projectId||'demo',rawText:b.rawText||'',country:b.country||'NG',city:b.city,sector:b.sector,descriptor:b.descriptor,purpose:b.purpose||'',actor:'web'});
return NextResponse.json(out); }
