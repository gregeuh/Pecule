/** Test-server preload only. Never import this into application code. */
if(process.env.VERCEL)throw new Error('The reference clock must not run in Vercel.');
const NativeDate=globalThis.Date,instant=new NativeDate('2026-11-06T12:00:00Z').getTime();
globalThis.Date=new Proxy(NativeDate,{
 apply(){return new NativeDate(instant).toString();},
 construct(target,args,newTarget){return Reflect.construct(target,args.length?args:[instant],newTarget);},
 get(target,key,receiver){return key==='now'?()=>instant:Reflect.get(target,key,receiver);},
});
