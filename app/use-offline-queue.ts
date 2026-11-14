"use client";
import {useCallback,useEffect,useState,type MutableRefObject} from 'react';
import {BudgetRequestError,type BudgetSync} from '../lib/budget-sync';
import {materialize,type Budget} from '../lib/budget';
import {reconcilePending} from '../lib/offline-reconcile';
import {activateOfflineProfile,pendingOperations,removePendingOperations,deactivateOfflineProfile,offlinePreparationToken,type PendingOperation} from '../lib/offline-store';
export function useOfflineQueue({userId,enabled,online,today,sync,lockRef,canFlush,onSynced,onSessionError}:{userId?:string;enabled:boolean;online:boolean;today:string;sync:BudgetSync;lockRef:MutableRefObject<boolean>;canFlush:boolean;onSynced:(b:Budget)=>void;onSessionError:()=>void}){
 const [entries,setEntries]=useState<PendingOperation[]>([]),[errors,setErrors]=useState<Record<string,string>>({}),[error,setError]=useState(''),[working,setWorking]=useState(false),[retryable,setRetryable]=useState(false),[preparedFor,setPreparedFor]=useState<string>();
 const refresh=useCallback(async()=>{if(!userId)return;try{const next=await pendingOperations(userId);setEntries(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);}catch(cause){setError(cause instanceof Error?cause.message:'Stockage local indisponible.');}},[userId]);
 useEffect(()=>{let live=true;const update=()=>{if(live)void refresh();};update();window.addEventListener('pecule-offline-change',update);window.addEventListener('storage',update);return()=>{live=false;window.removeEventListener('pecule-offline-change',update);window.removeEventListener('storage',update);};},[refresh]);
 const prepare=useCallback(async(next:Budget,token:string|undefined)=>{if(!userId)return;try{const applied=await activateOfflineProfile({userId,name:next.name||'Mon espace',accounts:next.accounts.map(({id,name,openingDate})=>({id,name,openingDate})),updatedAt:new Date().toISOString()},token);if(applied&&'serviceWorker'in navigator&&'caches'in window){await navigator.serviceWorker.ready;if(token===offlinePreparationToken()&&await caches.match('/offline-capture.js'))setPreparedFor(userId);}}catch{setError('La saisie hors connexion ne peut pas être préparée sur cet appareil.');}},[userId]);

 const flush=useCallback(async()=>{
  if(!userId||!enabled||!online||!canFlush||lockRef.current||!entries.length)return;
  lockRef.current=true;setWorking(true);setError('');setRetryable(false);
  try{for(let attempt=0;attempt<2;attempt++){
    const queued=await pendingOperations(userId);if(!queued.length)break;
    const token=offlinePreparationToken(),latest=await sync.load();if(!latest?.budget){setError('Ouvrez votre budget personnel avant de synchroniser ces saisies.');break;}
    const plan=reconcilePending(latest.budget,queued,userId);setErrors(plan.errors);
    try{if(plan.changed)await sync.save(materialize(plan.budget,today));}
    catch(cause){if(cause instanceof BudgetRequestError&&cause.status===409&&attempt===0)continue;throw cause;}
    // A fresh GET confirms previously accepted IDs after a lost response.
    const saved=new Set([...plan.acknowledged,...queued.filter(e=>!plan.errors[e.id]).map(e=>e.id)]);
    const unchanged=await removePendingOperations(userId,[...saved],queued.filter(e=>saved.has(e.id)));if(!unchanged)setError('Une saisie a été modifiée pendant l’envoi. Réessayez pour vérifier sa dernière version.');void prepare(plan.budget,token);onSynced(materialize(plan.budget,today));break;
  }}catch(cause){if(cause instanceof BudgetRequestError&&cause.status===401){await deactivateOfflineProfile().catch(()=>{});onSessionError();}setRetryable(!(cause instanceof BudgetRequestError)||cause.status>=500);setError(cause instanceof Error?cause.message:'La synchronisation reprendra au retour de la connexion.');}
  finally{lockRef.current=false;setWorking(false);await refresh();}
 },[userId,enabled,online,canFlush,lockRef,entries,sync,today,onSynced,onSessionError,refresh,prepare]);
 useEffect(()=>{if(!enabled||!online||!canFlush||!entries.length)return;const frame=requestAnimationFrame(()=>void flush());const visible=()=>{if(document.visibilityState==='visible')void flush();};document.addEventListener('visibilitychange',visible);return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visible);};},[enabled,online,canFlush,entries,flush]);
 useEffect(()=>{if(!retryable||!enabled||!online||!canFlush)return;const timer=setTimeout(()=>void flush(),15000);return()=>clearTimeout(timer);},[retryable,enabled,online,canFlush,flush]);
 return {entries:entries.filter(e=>e.userId===userId),errors,error,working,prepared:!!userId&&enabled&&preparedFor===userId,prepare,connectionUnavailable:retryable,flush,refresh};
}
