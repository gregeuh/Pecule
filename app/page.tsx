import BudgetApp from "./budget-app";
import { getChatGPTUser } from "./chatgpt-auth";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  return <BudgetApp user={user ? { name: user.fullName, email: user.email } : null} />;
}
