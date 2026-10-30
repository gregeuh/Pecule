import type { ReactNode } from "react";
export default function FormSection({title,children}:{title:string;children:ReactNode}){return <fieldset className="form-section"><legend>{title}</legend>{children}</fieldset>;}
