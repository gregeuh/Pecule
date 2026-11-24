import type { ReactNode } from "react";
import { Wallet, Repeat2, ArrowDownLeft, type LucideIcon } from "lucide-react";
import EmptyState from "./empty-state";
export default function Empty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <EmptyState
      icon={Icon}
      illustrated={Icon === Wallet || Icon === Repeat2 || Icon === ArrowDownLeft}
      title={title}
      description={description}
      action={action}
    />
  );
}
