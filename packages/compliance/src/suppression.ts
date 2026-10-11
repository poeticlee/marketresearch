import { hashContact } from '@gcrp/db';
export class SuppressionList {
  private set = new Map<string,{type:'email'|'phone',date:string,reason?:string}>();
  constructor(private salt='dev-salt'){}
  add(value:string,type:'email'|'phone',reason?:string){ this.set.set(hashContact(value,this.salt),{type,date:new Date().toISOString(),reason}); }
  addHash(hash:string,type:'email'|'phone'){ this.set.set(hash,{type,date:new Date().toISOString()}); }
  isSuppressed(value:string){ return this.set.has(hashContact(value,this.salt)); }
  filterRecord(emails:string[],phones:string[]){ return [...emails,...phones].some(v=>this.isSuppressed(v)); }
  get size(){ return this.set.size; }
}
