"use client";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import AnimatedDetails from "./animated-details";

/** Optional controls stay mounted and remain part of FormData while folded. */
export default function FormOptions({title,children,initialOpen=false}:{title:string;children:ReactNode;initialOpen?:boolean}){
  return <AnimatedDetails className="form-options" open={initialOpen}><summary>{title}<ChevronDown size={17} aria-hidden="true"/></summary><div className="form-options-body">{children}</div></AnimatedDetails>;
}
