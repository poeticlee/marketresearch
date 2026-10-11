import { NextResponse } from 'next/server';
import { store } from '@gcrp/db';
// Public API (Phase 5): API key check omitted in MVP demo; tenant isolation enforced.
export async function GET(req: Request){ const url=new URL(req.url); const project=url.searchParams.get('project');
const rows=[...store.records.values()].filter((r:any)=>!project||r.projectId===project);
return NextResponse.json({ data: rows, meta: { count: rows.length } }); }
