import type { Budget } from "./budget";

export class BudgetRequestError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

// Each browser keeps its own revision; the server arbitrates competing devices.
export class BudgetSync {
  private revision = 0;
  private baseline: Budget | null = null;
  getBaseline(): Budget | null { return this.baseline ? structuredClone(this.baseline) : null; }
  private generation = 0;
  private readSequence = 0;
  private writing = false;
  private request: typeof fetch;
  private readonly timeoutMs:number;
  constructor(request: typeof fetch = (...args) => fetch(...args), timeoutMs = 20_000) {
    this.timeoutMs=timeoutMs;
    // Never invoke Window.fetch as a method of this class (illegal receiver).
    this.request = (...args) => request(...args);
  }

  private async exchange(options:RequestInit){
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
    const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{reject(new BudgetRequestError("La connexion prend trop de temps. Votre saisie est conservée ; vérifiez la synchronisation avant de réessayer.",504));controller.abort();},this.timeoutMs);});
    try{return await Promise.race([(async()=>{const response=await this.request("/api/budget",{...options,signal:controller.signal});const result=await response.json();return {response,result};})(),timeout]);}
    finally{clearTimeout(timer);}
  }

  invalidateReads(): void { this.generation++; }

  async load(): Promise<{ budget: Budget | null } | null> {
    if (this.writing) return null;
    const generation = this.generation, sequence = ++this.readSequence;
    const current = () => generation === this.generation && sequence === this.readSequence && !this.writing;
    try {
      const {response,result} = await this.exchange({ cache: "no-store" });
      if (!current()) return null;
      if (!response.ok) throw new BudgetRequestError(result.error || "Impossible de charger votre budget.", response.status);
      this.revision = result.revision;
      this.baseline = result.budget ? structuredClone(result.budget) : null;
      return { budget: result.budget };
    } catch (error) {
      if (!current()) return null;
      throw error;
    }
  }

  async save(budget: Budget): Promise<void> {
    if (this.writing) throw new Error("Un enregistrement est déjà en cours.");
    this.writing = true;
    this.generation++;
    try {
      const {response,result} = await this.exchange({
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget, revision: this.revision }),
      });
      if (!response.ok) throw new BudgetRequestError(result.error || "Impossible d’enregistrer votre budget.", response.status);
      this.revision = result.revision;
      this.baseline = structuredClone(budget);
    } finally { this.writing = false; }
  }
}
