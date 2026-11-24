import type { FormEvent } from "react";
import type { Budget } from "../lib/budget";
import type { Modal } from "./budget-modal";

/** Financial editors emit the existing validated submit; only BudgetApp commits. */
export type BudgetEditorProps = {
  b: Budget;
  today: string;
  draftKey: string;
  busy: boolean;
  error: string;
  onReset: () => void;
  onClose: () => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
  open: (value: Modal) => void;
  remove: (type: "transaction" | "account", id: string) => void;
};
