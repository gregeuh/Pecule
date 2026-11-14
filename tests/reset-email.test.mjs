import test from 'node:test';
import assert from 'node:assert/strict';
import { passwordResetEnabled, sendPasswordResetEmail } from '../lib/reset-email.ts';
test('reset mail is disabled without both credentials; configured transport sends only to provider',async()=>{
 const oldKey=process.env.RESEND_API_KEY,oldFrom=process.env.AUTH_EMAIL_FROM,oldFetch=globalThis.fetch;
 try{
 delete process.env.RESEND_API_KEY;delete process.env.AUTH_EMAIL_FROM;assert.equal(passwordResetEnabled(),false);
 await assert.rejects(sendPasswordResetEmail('qa@example.invalid','https://example.invalid/reset'),/not configured/);
 process.env.RESEND_API_KEY='qa-placeholder';process.env.AUTH_EMAIL_FROM='Pécule <qa@example.invalid>';assert.equal(passwordResetEnabled(),true);
 let calls=0;globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.resend.com/emails');const body=JSON.parse(options.body);assert.deepEqual(body.to,['qa@example.invalid']);assert.match(body.text,/30 minutes/);assert.match(body.text,/https:\/\/example.invalid\/reset/);assert.equal(options.headers.Authorization,'Bearer qa-placeholder');return Response.json({id:'qa'});};
 await sendPasswordResetEmail('qa@example.invalid','https://example.invalid/reset');assert.equal(calls,1);
 globalThis.fetch=async()=>new Response('private provider detail',{status:503});await assert.rejects(sendPasswordResetEmail('qa@example.invalid','https://example.invalid/reset'),error=>error.message==='Password reset email delivery failed');
 }finally{globalThis.fetch=oldFetch;for(const [key,value] of [['RESEND_API_KEY',oldKey],['AUTH_EMAIL_FROM',oldFrom]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
