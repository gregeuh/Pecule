// Isolated embedded PostgreSQL; no network, credentials or personal budgets.
// Install @electric-sql/pglite in a temporary directory and pass its module path
// through PECULE_PGLITE_MODULE (see docs/daily-capture-validation.md).
import assert from 'node:assert/strict';
import {budgetSaveStatement,dailyReminderClaimStatement} from '../../lib/budget-storage.ts';
import {dailyReminderSuppressed} from '../../lib/reminders.ts';
import {emptyBudget} from '../../lib/budget.ts';
const {PGlite}=await import(process.env.PECULE_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
try{
 await db.exec(`CREATE TABLE budgets(user_id text PRIMARY KEY,payload text NOT NULL,revision integer NOT NULL,updated_at text NOT NULL);
 ALTER TABLE budgets ADD COLUMN IF NOT EXISTS last_operation_at timestamptz;
 ALTER TABLE budgets ADD COLUMN IF NOT EXISTS last_operation_at timestamptz;
 CREATE TABLE devices(id text PRIMARY KEY,user_id text,last_sent_date text,last_status text);`);
 const query=(initial,user,b,at,revision)=>db.query(budgetSaveStatement('budgets',initial),initial?[user,JSON.stringify(b),at]:[user,JSON.stringify(b),at,revision]);
 const stored=async user=>(await db.query('SELECT * FROM budgets WHERE user_id=$1',[user])).rows[0];
 const stamp=async user=>(await stored(user)).last_operation_at?.toISOString()??null;
 const row=(id,extra={})=>({id,label:'QA',amount:-250,date:'2026-11-09',accountId:'qa',category:'Autres',note:'',...extra});
 const b=emptyBudget(),morning='2026-11-10T08:00:00.000Z',noon='2026-11-10T12:00:00.000Z';
 assert.equal((await query(true,'alice',b,morning)).rows[0].revision,1);assert.equal(await stamp('alice'),null);
 b.name='Settings only';await query(false,'alice',b,morning,1);assert.equal(await stamp('alice'),null);
 b.transactions.push(row('recurrence',{ruleId:'automatic'}));await query(false,'alice',b,morning,2);assert.equal(await stamp('alice'),null);
 b.transactions.push(row('manual'));await query(false,'alice',b,noon,3);assert.equal(await stamp('alice'),noon);
 assert(dailyReminderSuppressed(JSON.parse((await stored('alice')).payload),'2026-11-10',(await stored('alice')).last_operation_at));
 const retry=structuredClone(b);retry.transactions.push(row('unsaved'));
 assert.equal((await query(false,'alice',retry,'2026-11-11T12:00:00Z',3)).rows.length,0);assert.equal(await stamp('alice'),noon);assert.equal((await stored('alice')).revision,4);
 assert.equal((await query(true,'alice',retry,'2026-11-11T12:00:00Z')).rows.length,0);assert.equal(await stamp('alice'),noon);
 b.transactions=b.transactions.filter(t=>t.id!=='manual');await query(false,'alice',b,'2026-11-10T13:00:00Z',4);assert.equal(await stamp('alice'),noon);
 b.transactions[0].note='Edit only';await query(false,'alice',b,'2026-11-10T14:00:00Z',5);assert.equal(await stamp('alice'),noon);
 const imported=emptyBudget();imported.transactions=[row('import',{importRef:'qa'})];await query(true,'bob',imported,morning);assert.equal(await stamp('bob'),morning);
 await query(true,'carol',emptyBudget(),morning);assert.equal(await stamp('carol'),null);
 await db.exec(`INSERT INTO devices(id,user_id) VALUES ('a1','alice'),('a2','alice'),('b1','bob'),('c1','carol')`);
 const claim=(id,date,revision)=>db.query(dailyReminderClaimStatement('devices','budgets'),[id,date,revision]);
 assert.equal((await claim('a1','2026-11-10',6)).rows.length,0);assert.equal((await claim('a2','2026-11-10',6)).rows.length,0);
 assert.equal((await claim('b1','2026-11-10',1)).rows.length,0);assert.equal((await claim('c1','2026-11-10',1)).rows.length,1);
 assert.equal((await claim('c1','2026-11-10',1)).rows.length,0);
 assert.equal((await claim('a1','2026-11-11',6)).rows.length,1);assert.equal((await claim('a1','2026-11-11',6)).rows.length,0);
 // A capture saved between cron selection and claiming cannot send a stale reminder.
 const carol=emptyBudget();carol.transactions=[row('late')];await query(false,'carol',carol,noon,1);
 assert.equal((await claim('c1','2026-11-11',1)).rows.length,0);
 assert.equal((await claim('c1','2026-11-11',2)).rows.length,1);
 // Full supported transaction count: a settings save must preserve activity and payload.
 const large=emptyBudget();large.transactions=Array.from({length:20000},(_,i)=>row(`large-${i}`));
 await query(true,'large',large,morning);large.name='Large settings change';
 await query(false,'large',large,noon,1);assert.equal(await stamp('large'),morning);
 assert.deepEqual(JSON.parse((await stored('large')).payload),large);
 // Older cached clients cannot strip metadata they do not understand.
 const guarded=emptyBudget();guarded.settings.importProfiles=[{accountId:'qa',header:['Date']}];
 await query(true,'metadata',guarded,morning);
 const rejected=await db.query(budgetSaveStatement('budgets',false,false),['metadata',JSON.stringify(emptyBudget()),noon,1]);
 assert.equal(rejected.rows.length,0);assert.equal((await stored('metadata')).revision,1);
 assert.equal((await query(false,'metadata',emptyBudget(),noon,1)).rows.length,1);
 const linked=emptyBudget();linked.transactions=[{...row('linked'),bankLinks:[{key:'qa',batchId:'qa'}]}];await query(true,'linked',linked,morning);
 assert.equal((await db.query(budgetSaveStatement('budgets',false,false),['linked',JSON.stringify(emptyBudget()),noon,1])).rows.length,0);
 console.log('PASS embedded PostgreSQL: additive migration, accepted saves, rules, imports, conflicts, deletes, isolation, all devices, next day, deduplication and stale selection.');
}finally{await db.close();}
