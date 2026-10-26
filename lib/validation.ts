import { z } from "zod";
const id=z.string().min(1).max(120);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>s>="2000-01-01" && s<="2100-12-31" && !Number.isNaN(new Date(s+"T12:00:00Z").getTime()) && new Date(s+"T12:00:00Z").toISOString().slice(0,10)===s,"Date invalide");
const cents=z.number().int().min(-1e11).max(1e11);
const color=z.string().regex(/^#[0-9a-fA-F]{6}$/);
const text=z.string().trim().min(1).max(120);
const account=z.object({id,name:text,bank:z.string().max(120),type:z.enum(["current","savings","cash"]),openingBalance:cents,openingDate:date,color});
const merchantId=z.string().regex(/^[a-z0-9][a-z0-9-]{0,119}$/).optional();
const transaction=z.object({id,merchantId,label:text,amount:cents,date,accountId:id,category:text,note:z.string().max(1000),ruleId:id.optional(),transferId:id.optional(),goalId:id.optional()});
const rule=z.object({id,merchantId,label:text,amount:cents.refine(n=>n!==0),accountId:id,category:text,startDate:date,endDate:z.union([date,z.literal("")]),frequency:z.enum(["monthly","weekly","yearly"]),timing:z.enum(["date","last-business-day"]),day:z.number().int().min(1).max(31),active:z.boolean(),holidays:z.enum(["FR","none"]),excludedDates:z.array(date).max(1000)}).refine(r=>!r.endDate || r.endDate>=r.startDate,"La fin précède le début");
const goal=z.object({id,name:text,target:cents.refine(n=>n>0),saved:cents.refine(n=>n>=0),monthly:cents.refine(n=>n>=0),color,icon:z.enum(["sun","shield","home","plane","sparkles"]),deadline:z.union([date,z.literal("")])});
export const budgetSchema=z.object({version:z.literal(1),name:z.string().trim().max(60),accounts:z.array(account).max(50),transactions:z.array(transaction).max(20000),rules:z.array(rule).max(200),goals:z.array(goal).max(100),settings:z.object({horizon:z.enum(["salary","month"]),reserve:cents.refine(n=>n>=0),holidayCalendar:z.enum(["FR","none"]),spendingPlan:z.object({monthlyIncome:cents.refine(n=>n>=0).nullable(),groups:z.record(z.enum(["needs","wants","savings","unassigned"])).refine(g=>Object.keys(g).length<=100 && Object.keys(g).every(k=>k.length<=120 && !["__proto__","constructor","prototype"].includes(k)))}).optional()})}).superRefine((b,ctx)=>{
  for(const rows of [b.accounts,b.transactions,b.rules,b.goals]) if(new Set(rows.map(r=>r.id)).size!==rows.length) ctx.addIssue({code:z.ZodIssueCode.custom,message:"Identifiant en double"});
  const ids=new Set(b.accounts.map(a=>a.id));
  for(const row of [...b.transactions,...b.rules]) if(!ids.has(row.accountId)) ctx.addIssue({code:z.ZodIssueCode.custom,message:"Compte introuvable"});
});
export const saveSchema=z.object({revision:z.number().int().min(0),budget:budgetSchema});
