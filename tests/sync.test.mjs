import test from 'node:test';
import assert from 'node:assert/strict';
import { BudgetSync, BudgetRequestError } from '../lib/budget-sync.ts';
import { googleErrorMessage } from '../lib/auth-feedback.ts';
import { emptyBudget } from '../lib/budget.ts';

const json=(body,status=200)=>Response.json(body,{status});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
test('the transport does not bind an injected fetch to its own instance',async()=>{
  const sync=new BudgetSync(function(){assert.equal(this,undefined);return Promise.resolve(json({budget:null,revision:0}));});
  assert.deepEqual(await sync.load(),{budget:null});
});
test('a delayed read cannot roll back a successful save or its revision',async()=>{
  const late=deferred(),writes=[];let reads=0;
  const sync=new BudgetSync(async(_url,options)=>{
    if(options.method==='PUT'){writes.push(JSON.parse(options.body));return json({revision:writes.length});}
    return ++reads===1?late.promise:json({budget:null,revision:0});
  });
  const loading=sync.load();await sync.save(emptyBudget());
  late.resolve(json({budget:{name:'Old'},revision:0}));
  assert.equal(await loading,null);await sync.save(emptyBudget());
  assert.deepEqual(writes.map(w=>w.revision),[0,1]);
});
test('out-of-order background refreshes keep only the most recent read',async()=>{
  const old=deferred();let calls=0;const sync=new BudgetSync(async()=>++calls===1?old.promise:json({budget:{name:'New'},revision:2}));
  const first=sync.load();assert.equal((await sync.load()).budget.name,'New');
  old.resolve(json({budget:{name:'Old'},revision:1}));assert.equal(await first,null);
});
test('obsolete failed requests do not put a saved budget into an error state',async()=>{
  const old=deferred();const sync=new BudgetSync(async(_url,options)=>options.method==='PUT'?json({revision:1}):old.promise);
  const loading=sync.load();await sync.save(emptyBudget());old.resolve(json({error:'Old failure'},503));assert.equal(await loading,null);
});
test('two devices detect a conflict and can reload before retrying',async()=>{
  let revision=0,budget=null;
  const server=async(_url,options)=>{
    if(options.method!=='PUT')return json({budget,revision});
    const incoming=JSON.parse(options.body);
    if(incoming.revision!==revision)return json({error:'Budget modifié sur un autre appareil.'},409);
    budget=incoming.budget;return json({revision:++revision});
  };
  const phone=new BudgetSync(server),desktop=new BudgetSync(server);
  await Promise.all([phone.load(),desktop.load()]);await phone.save({...emptyBudget(),name:'Phone'});
  await assert.rejects(desktop.save({...emptyBudget(),name:'Desktop'}),e=>e instanceof BudgetRequestError&&e.status===409);
  assert.equal(budget.name,'Phone');assert.equal((await desktop.load()).budget.name,'Phone');
  await desktop.save({...emptyBudget(),name:'Desktop'});assert.equal((await phone.load()).budget.name,'Desktop');
});
test('session expiry and unsuccessful saves never advance the saved revision',async()=>{
  let authorized=false;const revisions=[];
  const sync=new BudgetSync(async(_url,options)=>{revisions.push(JSON.parse(options.body).revision);return authorized?json({revision:1}):json({error:'Reconnectez-vous.'},401);});
  await assert.rejects(sync.save(emptyBudget()),e=>e.status===401);authorized=true;await sync.save(emptyBudget());assert.deepEqual(revisions,[0,0]);
});
test('duplicate saves and reads during a write cannot race a pending mutation',async()=>{
  const pending=deferred();let requests=0;const sync=new BudgetSync(async()=>{requests++;return pending.promise;});
  const saving=sync.save(emptyBudget());assert.equal(await sync.load(),null);
  await assert.rejects(sync.save(emptyBudget()),/en cours/);assert.equal(requests,1);
  pending.resolve(json({revision:1}));await saving;
});
test('Google failures have actionable French messages and never echo callback content',()=>{
  assert.match(googleErrorMessage('access_denied'),/annulée/);
  assert.match(googleErrorMessage('state_mismatch'),/Relancez/);
  assert.match(googleErrorMessage('account_not_linked'),/réglages/);
  assert.match(googleErrorMessage("email_doesn't_match"),/même adresse/);
  assert.equal(googleErrorMessage(null),'');
  assert.doesNotMatch(googleErrorMessage('<script>secret</script>'),/secret|script/);
});
