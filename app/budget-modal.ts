import type { Account, Goal, Rule, Transaction } from "../lib/budget";
import type { Favorite } from "../lib/capture";

export type Modal =
  | { type: "operation-actions"; transactionId: string }
  | { type: "account-actions"; accountId: string }
  | { type: "wallet-account"; accountId: string }
  | { type: "account-forecast"; accountId: string }
  | { type: "review"; date?: string }
  | { type: "favorites" }
  | { type: "favorite"; item?: Favorite }
  | { type: "balance"; accountId: string }
  | { type: "filters" }
  | { type: "navigation" }
  | { type: "search" }
  | { type: "actions" }
  | {
      type: "transaction";
      favoriteId?: string;
      returnReviewDate?: string;
      sequence?: number;
      initialLabel?: string;
      initialCategory?: string;
      initialMerchantId?: string;
      initialCustomIconUrl?: string;
      item?: Transaction;
      direction?: "income" | "expense";
      accountId?: string;
      initialDate?: string;
      initialAmount?: number;
      initialNote?: string;
      returnAccountId?: string;
      returnToBalance?: boolean;
    }
  | { type: "account"; item?: Account; returnAccountId?: string }
  | { type: "rule"; item?: Rule; proposal?: Omit<Rule, "id">; sourceTransactionId?: string }
  | { type: "goal"; item?: Goal }
  | { type: "transfer"; goal?: Goal; accountId?: string }
  | { type: "contribution"; goal: Goal }
  | { type: "reconcile"; accountId: string }
  | { type: "bulk"; ids: string[] }
  | { type: "match-transfers"; initialDebit?: string; returnAccountId?: string }
  | { type: "imports" }
  | { type: "import"; accountId?: string; returnTo?: "balance" | "reconcile" }
  | { type: "start" }
  | { type: "calculation" }
  | { type: "install" }
  | {
      type: "confirm";
      title: string;
      message: string;
      action: () => Promise<boolean>;
      onDone?: () => void;
      /** "restore" for actions that replace data without deleting it (neutral button). Defaults to destructive. */
      tone?: "restore";
    };
