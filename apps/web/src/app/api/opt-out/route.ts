import { NextResponse } from 'next/server';
import { SuppressionList } from '@gcrp/compliance';
const list=new SuppressionList(process.env.SUPPRESSION_SALT||'dev-salt');
export async function POST(req: Request){ const {value}=await req.json();
const type=value&&value.includes('@')?'email':'phone'; list.add(value,type,'user request');
return NextResponse.json({ok:true,type}); }
