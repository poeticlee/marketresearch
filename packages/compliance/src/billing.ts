// Billing stubs with local rails (Paystack/Flutterwave/Stripe). Prices in NGN/GBP/USD/EUR.
export const PLANS={ free:{searches:5,exportMax:50}, researcher:{price:{NGN:5000,GBP:15,USD:19,EUR:17},searches:100,exportMax:2000}, business:{price:{NGN:25000,GBP:79,USD:99,EUR:89},searches:1000,exportMax:20000}, ngo:{price:{NGN:15000,GBP:49,USD:59,EUR:55},searches:500,exportMax:10000} } as const;
export function canExport(plan:keyof typeof PLANS,count:number){ return count<=PLANS[plan].exportMax; }
