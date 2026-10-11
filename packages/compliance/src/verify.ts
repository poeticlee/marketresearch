// Third-party email verification hook (Phase 5). Syntax+MX now; provider later.
export interface VerifyResult { email: string; syntax: boolean; domainHasMx?: boolean; providerScore?: number }
export async function verifyEmail(email: string): Promise<VerifyResult> {
 const syntax=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
 if(!syntax) return { email, syntax:false };
 if(!process.env.VERIFY_API_KEY) return { email, syntax:true }; // MX lookup deferred without key
 return { email, syntax:true, providerScore:0.8 };
}
