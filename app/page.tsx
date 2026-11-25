import BudgetApp from "./budget-app";
import { getSessionUser } from "./session-user";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getSessionUser();
  return <BudgetApp user={user ? { id: user.userId, name: user.fullName, email: user.email } : null} />;
}
