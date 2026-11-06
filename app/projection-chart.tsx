"use client";
import {roundedAxis} from "../lib/budget-presentation";
import AnimatedDetails from "./animated-details";
import {ChevronDown} from "lucide-react";
import { useId, useState } from "react";
import { accountBalance, futureTransactions, money, shiftDate, shortDate, type Budget } from "../lib/budget";

/** Read-only projection. Selection never changes a transaction or account. */
export default function ProjectionChart({budget,today,hidden}:{budget:Budget;today:string;hidden:boolean}){
  const [selected,setSelected]=useState(0);
  const fillId=useId();
  const accounts=budget.accounts.filter(a=>a.type!=="savings"),ids=new Set(accounts.map(a=>a.id));
  const total=accounts.reduce((sum,a)=>sum+accountBalance(budget,a.id,today),0);
  const future=futureTransactions(budget,shiftDate(today,1),shiftDate(today,30)).filter(t=>ids.has(t.accountId));
  const points=Array.from({length:31},(_,i)=>{const date=shiftDate(today,i);return {date,value:total+future.filter(t=>t.date<=date).reduce((sum,t)=>sum+t.amount,0)};});
  const low=points.reduce((min,p)=>p.value<min.value?p:min,points[0]);
  const {max,min,ticks}=roundedAxis(Math.min(0,...points.map(p=>p.value))*1.15,Math.max(10000,...points.map(p=>p.value))*1.15);
  const references=[...new Set([0,7,14,21,30,points.indexOf(low)])].sort((a,b)=>a-b);
  const width=640,height=176,pad=8;
  const y=(value:number)=>12+(max-value)/(max-min)*(height-28);
  const xy=points.map((p,i)=>({x:pad+i*(width-2*pad)/30,y:y(p.value)}));
  const path=xy.map((p,i)=>`${i?"L":"M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const m=(value:number)=>hidden?"•••• €":money(value,false);
  const at=points[selected];
  return <div className="projection">
    <dl className="projection-outlook" aria-label="Repères de la projection">
      <div><dt>Aujourd’hui</dt><dd>{m(total)}</dd></div>
      <div><dt>Dans 30 jours</dt><dd>{m(points[30].value)}</dd></div>
      <div><dt>Point le plus bas · {shortDate(low.date)}</dt><dd>{m(low.value)}</dd></div>
    </dl>
    <div className="chart-summary"><strong>{m(at.value)}</strong><span>{selected===0?"sur vos comptes courants aujourd’hui":`solde prévu le ${shortDate(at.date)}`}</span></div>
    <div className="chart-container"><div className="chart-axis">{ticks.map((v,i)=><span key={i}>{hidden?"•••":money(Math.round(v),false)}</span>)}</div>
      <svg className="projection-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Projection sur 30 jours : solde actuel ${hidden?"masqué":money(total)}, solde prévu ${hidden?"masqué":money(points[30].value)}.`}
        onPointerDown={e=>{const rect=e.currentTarget.getBoundingClientRect();setSelected(Math.max(0,Math.min(30,Math.round(((e.clientX-rect.left)/rect.width*width-pad)/(width-2*pad)*30))));}}
        onPointerMove={e=>{if(e.pointerType!=="mouse")return;const rect=e.currentTarget.getBoundingClientRect();setSelected(Math.max(0,Math.min(30,Math.round(((e.clientX-rect.left)/rect.width*width-pad)/(width-2*pad)*30))));}}>
        <defs><linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--blue)" stopOpacity=".14"/><stop offset="100%" stopColor="var(--blue)" stopOpacity="0"/></linearGradient></defs>
        {ticks.map((v,i)=><line key={i} x1="0" x2={width} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray="3 5"/>)}
        <path d={`${path} L${xy[30].x},${height} L${xy[0].x},${height} Z`} fill={`url(#${fillId})`}/>
        <path className="projection-line" pathLength={1} d={path} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        <g className="projection-cursor" style={{transform:`translateX(${xy[selected].x}px)`}}><line x1="0" x2="0" y1="8" y2={height-10} stroke="var(--muted)" strokeDasharray="3 4"/><circle className="projection-dot" cx="0" cy="0" style={{transform:`translateY(${xy[selected].y}px)`}} r="4.5" fill="var(--blue)" stroke="var(--card)" strokeWidth="3"/></g>
      </svg>
    </div>
    <div className="chart-dates">{[0,7,14,21,30].map(i=><span key={i}>{i===0?"Aujourd’hui":shortDate(points[i].date)}</span>)}</div>
    <label className="projection-control"><span>Explorer jour par jour <strong>{shortDate(at.date)}</strong></span><input type="range" min="0" max="30" step="1" value={selected} aria-label="Jour de la projection" aria-valuetext={`${shortDate(at.date)}, ${hidden?"montant masqué":money(at.value)}`} onChange={e=>setSelected(Number(e.target.value))}/></label>
    <p className="field-hint projection-note">Cette projection montre les soldes des comptes courants. La réserve d’épargne n’est pas déduite : elle ne réalise aucun mouvement bancaire.</p><AnimatedDetails className="projection-table"><summary>Repères hebdomadaires et minimum<ChevronDown size={16}/></summary><table><caption>Soldes prévus et point le plus bas</caption><tbody>{references.map(i=><tr key={i}><th scope="row">{shortDate(points[i].date)}{points[i]===low?" · Minimum":""}</th><td>{hidden?"Masqué":money(points[i].value)}</td></tr>)}</tbody></table></AnimatedDetails>
  </div>;
}
