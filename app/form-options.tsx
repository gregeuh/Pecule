"use client";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import AnimatedDetails from "./animated-details";

/** Optional controls stay mounted and remain part of FormData while folded. */
export default function FormOptions({title,children,initialOpen=false,variant="optional"}:{title:string;children:ReactNode;initialOpen?:boolean;variant?:"optional"|"merchant"}){
  return <AnimatedDetails className={variant==="merchant"?"merchant-options":"form-options"} open={initialOpen}><summary>{title}<ChevronDown size={17} aria-hidden="true"/></summary><div className="form-options-body">{children}</div></AnimatedDetails>;
}
