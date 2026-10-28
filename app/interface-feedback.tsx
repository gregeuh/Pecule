"use client";
import type { ReactNode } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";

export function ErrorMessage({children}:{children:ReactNode}){
  return <div className="form-error feedback-error" role="alert"><CircleAlert size={18} aria-hidden="true"/><div>{children}</div></div>;
}
export function LoadingState({title,description}:{title:string;description:string}){
  return <div className="loading-state" role="status"><LoaderCircle size={22} className="spin" aria-hidden="true"/><div><h1>{title}</h1><p>{description}</p></div></div>;
}
