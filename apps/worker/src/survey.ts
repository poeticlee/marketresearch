// Survey module stub (Phase 3+). Opt-in respondents only.
export interface SurveyResponse { id:string; projectId:string; contact:string; answers:Record<string,string>; at:string }
const rows:SurveyResponse[]=[];
export function saveResponse(r:SurveyResponse){ rows.push(r); return r; }
export function listResponses(projectId:string){ return rows.filter(r=>r.projectId===projectId); }
