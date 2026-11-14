"use client";
import {balanceOutlook} from "../lib/balance-outlook";
import {roundedAxis} from "../lib/budget-presentation";
import AnimatedDetails from "./animated-details";
import {ChevronDown} from "lucide-react";
import { useId, useState } from "react";
import { money, shortDate, type Budget } from "../lib/budget";

/** Read-only projection. Selection never changes a transaction or account. */
export default function ProjectionChart({budget,today,hidden,accountId,days=30}:{budget:Budget;today:string;hidden:boolean;accountId?:string;days?:number}){
  const [selected,setSelected]=useState(0);
  const fillId=useId();
  const {points,low,current:total}=balanceOutlook(budget,today,days,accountId);
  const {max,min,ticks}=roundedAxis(Math.min(0,...points.map(p=>p.value))*1.15,Math.max(10000,...points.map(p=>p.value))*1.15);
  const references=[...new Set([0,Math.round(days/4),Math.round(days/2),Math.round(days*3/4),days,points.indexOf(low)])].sort((a,b)=>a-b);
  const width=640,height=176,pad=8;
  const y=(value:number)=>12+(max-value)/(max-min)*(height-28);
  const xy=points.map((p,i)=>({x:pad+i*(width-2*pad)/Math.max(1,days),y:y(p.value)}));
  const path=xy.map((p,i)=>`${i?"L":"M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const m=(value:number)=>hidden?"•••• €":money(value,false);
  const at=points[Math.min(selected,days)];
  return <div className="projection">
    <dl className="projection-outlook" aria-label="Repères de la projection">
      <div><dt>Aujourd’hui</dt><dd>{m(total)}</dd></div>
      <div><dt>{days===0?"Aujourd’hui":`Dans ${days} jours`}</dt><dd>{m(points[days].value)}</dd></div>
      <div><dt>Point le plus bas · {shortDate(low.date)}</dt><dd>{m(low.value)}</dd></div>
    </dl>
    <div className="chart-summary"><strong>{m(at.value)}</strong><span>{selected===0?"sur la sélection aujourd’hui":`solde prévu le ${shortDate(at.date)}`}</span></div>
    <div className="chart-container"><div className="chart-axis">{ticks.map((v,i)=><span key={i}>{hidden?"•••":money(Math.round(v),false)}</span>)}</div>
      <svg className="projection-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Projection sur ${days} jours : solde actuel ${hidden?"masqué":money(total)}, solde prévu ${hidden?"masqué":money(points[days].value)}.`}
        onPointerDown={e=>{const rect=e.currentTarget.getBoundingClientRect();setSelected(Math.max(0,Math.min(days,Math.round(((e.clientX-rect.left)/rect.width*width-pad)/(width-2*pad)*days))));}}
        onPointerMove={e=>{if(e.pointerType!=="mouse")return;const rect=e.currentTarget.getBoundingClientRect();setSelected(Math.max(0,Math.min(days,Math.round(((e.clientX-rect.left)/rect.width*width-pad)/(width-2*pad)*days))));}}>
        <defs><linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--blue)" stopOpacity=".14"/><stop offset="100%" stopColor="var(--blue)" stopOpacity="0"/></linearGradient></defs>
        {ticks.map((v,i)=><line key={i} x1="0" x2={width} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray="3 5"/>)}
        <path d={`${path} L${xy[days].x},${height} L${xy[0].x},${height} Z`} fill={`url(#${fillId})`}/>
        <path className="projection-line" pathLength={1} d={path} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        <g className="projection-cursor" style={{transform:`translateX(${xy[selected].x}px)`}}><line x1="0" x2="0" y1="8" y2={height-10} stroke="var(--muted)" strokeDasharray="3 4"/><circle className="projection-dot" cx="0" cy="0" style={{transform:`translateY(${xy[selected].y}px)`}} r="4.5" fill="var(--blue)" stroke="var(--card)" strokeWidth="3"/></g>
      </svg>
    </div>
    <div className="chart-dates">{[...new Set([0,Math.round(days/4),Math.round(days/2),Math.round(days*3/4),days])].map(i=><span key={i} data-compact-skip={i!==0&&i!==Math.round(days/2)&&i!==days}>{i===0?"Aujourd’hui":shortDate(points[i].date)}</span>)}</div>
    {days>0&&<label className="projection-control"><span>Explorer jour par jour <strong>{shortDate(at.date)}</strong></span><input type="range" min="0" max={days} step="1" value={selected} aria-label="Jour de la projection" aria-valuetext={`${shortDate(at.date)}, ${hidden?"montant masqué":money(at.value)}`} onChange={e=>setSelected(Number(e.target.value))}/></label>}
    <p className="field-hint projection-note">Cette projection montre les soldes de la sélection. La réserve d’épargne n’est pas déduite : elle ne réalise aucun mouvement bancaire.</p><AnimatedDetails className="projection-table"><summary>Repères de dates et minimum<ChevronDown size={16}/></summary><table><caption>Soldes prévus et point le plus bas</caption><tbody>{references.map(i=><tr key={i}><th scope="row">{shortDate(points[i].date)}{points[i]===low?" · Minimum":""}</th><td>{hidden?"Masqué":money(points[i].value)}</td></tr>)}</tbody></table></AnimatedDetails>
  </div>;
}
