import { z } from 'zod';
// Internal LLM wrapper. Strict JSON output. Deterministic fallback when no API key.
export const BriefClass = z.object({ status: z.enum(['accepted','rewritten','rejected']), rewritten_brief: z.string().optional(), reasons: z.array(z.string()) });
export const SYSTEM = 'You enforce approved framing: organisations/businesses with public contacts only. Never infer ethnicity/religion/gender/health/sexuality/politics/immigration. Rewrite examples: "Nigerians in Liverpool" -> "Organisations, businesses, and associations in Liverpool that publicly list contact details and serve or are described as part of the Nigerian community"; "female entrepreneurs in Iwo Road" -> "Businesses in Iwo Road, Ibadan that publicly describe themselves as women-owned or are listed in women-owned business directories."';
export async function classifyBrief(raw: string): Promise<z.infer<typeof BriefClass>> {
  if (!process.env.CLAUDE_API_KEY) return { status:'accepted', reasons:['no-llm-key: deterministic checks apply'] };
  const res = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{ 'x-api-key': process.env.CLAUDE_API_KEY!, 'anthropic-version':'2023-06-01','content-type':'application/json' }, body: JSON.stringify({ model:'claude-3-haiku-20240307', max_tokens:300, system: SYSTEM, messages:[{role:'user',content:'Classify: '+raw}] }) });
  const j = await res.json(); const text = j.content?.[0]?.text || '{}';
  try { return BriefClass.parse(JSON.parse(text)); } catch { return { status:'rejected', reasons:['llm-parse-fail: human review'] }; }
}
export const ExtractSchema = z.object({ name: z.string(), role: z.string().optional(), phones: z.array(z.string()), emails: z.array(z.string()), address: z.string().optional(), category: z.string().optional(), self_declared_tags: z.array(z.string()) });
