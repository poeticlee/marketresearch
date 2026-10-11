import { NextResponse } from 'next/server';
import * as fs from 'fs';
export async function GET(){ const dir='rule-profiles'; const files=fs.existsSync(dir)?fs.readdirSync(dir):[];
const profiles=files.filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(dir+'/'+f,'utf8')));
return NextResponse.json(profiles); }
