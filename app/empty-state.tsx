"use client";
import type { ReactNode } from "react";
import { Wallet, type LucideIcon } from "lucide-react";
import ConfirmationArt from "./confirmation-art";

/** An empty state guides the next action; never announce success or failure here. */
export default function EmptyState({title,description,action,icon:Icon=Wallet,illustrated=true}:{title:string;description:string;action?:ReactNode;icon?:LucideIcon;illustrated?:boolean}){
  return <div className="empty empty-state">{illustrated?<ConfirmationArt variant="wallet"/>:<span className="empty-icon" aria-hidden="true"><Icon size={26} strokeWidth={1.5}/></span>}<h3>{title}</h3><p>{description}</p>{action}</div>;
}
