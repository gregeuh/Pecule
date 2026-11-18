import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBudget} from '../lib/budget.ts';
import {markDailyReview} from '../lib/capture.ts';
import {dailyReminderSuppressed} from '../lib/reminders.ts';
const day='2026-11-10';
const transaction=(extra={})=>({id:'manual',label:'QA',amount:-250,date:day,accountId:'qa',category:'Autres',note:'',...extra});
test('a persisted capture today suppresses reminders regardless of its bank date',()=>{
 for(const date of ['2026-11-09',day,'2026-11-15']){const b=emptyBudget();b.transactions=[transaction({date})];assert(dailyReminderSuppressed(b,day,new Date('2026-11-10T12:00:00Z')));}
});
test('Paris midnight re-enables reminders the next day, including summer time',()=>{
 const b=emptyBudget();
 assert(dailyReminderSuppressed(b,day,'2026-11-09T23:00:00Z'));
 assert(!dailyReminderSuppressed(b,day,'2026-11-09T22:59:59Z'));
 assert(!dailyReminderSuppressed(b,day,'2026-11-10T23:00:00Z'));
 assert(dailyReminderSuppressed(b,'2026-07-10','2026-07-09T22:00:00Z'));
 assert(!dailyReminderSuppressed(b,'2026-07-10','2026-07-09T21:59:59Z'));
});
test('a completed review still suppresses a reminder without an operation',()=>{
 const b=markDailyReview(emptyBudget(),day,'nothing',day);
 assert(dailyReminderSuppressed(b,day,null));assert(dailyReminderSuppressed(b,day,'2026-11-08T12:00:00Z'));
});
test('legacy budgets use explicit current-day transactions, never recurrences or included history',()=>{
 for(const extra of [{ruleId:'automatic'},{balanceIncluded:true},{date:'2026-11-09'}]){const b=emptyBudget();b.transactions=[transaction(extra)];assert(!dailyReminderSuppressed(b,day,null));}
 const b=emptyBudget();b.transactions=[transaction()];assert(dailyReminderSuppressed(b,day,null));
 assert(!dailyReminderSuppressed(b,day,'2026-11-09T12:00:00Z'),'a pre-scheduled transaction is not a new capture today');
});
test('empty budgets, settings-only activity and invalid timestamps do not suppress a reminder',()=>{
 const b=emptyBudget();b.settings.capture={lastAccountId:'qa',favorites:[]};
 assert(!dailyReminderSuppressed(b,day,null));assert(!dailyReminderSuppressed(b,day,'invalid'));
});
