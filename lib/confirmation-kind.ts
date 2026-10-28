import type { Budget } from "./budget";

export type ConfirmationKind = "confirmation" | "operation" | "recurrence" | "import" | "savings" | "goal" | "settings";

type FeedbackBudget = Pick<Budget,"goals"> & Partial<Pick<Budget,"rules"|"transactions"|"accounts">>;
const changed = (before: unknown, after: unknown) => before !== after && JSON.stringify(before) !== JSON.stringify(after);

/** Visual feedback follows the action that actually saved, never the message wording. */
export function confirmationKind(context: string | undefined, before: FeedbackBudget, after: FeedbackBudget): ConfirmationKind {
  if (["goal", "contribution", "transfer"].includes(context ?? "")) {
    const reached = after.goals.some(goal => {
      const previous = before.goals.find(item => item.id === goal.id);
      return previous && previous.saved < previous.target && goal.saved >= goal.target;
    });
    if (reached) return "goal";
    if (context !== "transfer" || JSON.stringify(before.goals) !== JSON.stringify(after.goals)) return "savings";
  }
  if (context === "transaction" || context === "transfer") return "operation";
  if (context === "rule") return "recurrence";
  if (context === "import") return "import";
  if (!context) {
    if (changed(before.rules,after.rules)) return "recurrence";
    if (changed(before.goals,after.goals)) return "savings";
    if (changed(before.transactions,after.transactions)) return "operation";
    if (changed(before.accounts,after.accounts)) return "confirmation";
    return "settings";
  }
  return "confirmation";
}
