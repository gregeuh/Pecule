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
  constructor(request: typeof fetch = (...args) => fetch(...args)) {
    // Never invoke Window.fetch as a method of this class (illegal receiver).
    this.request = (...args) => request(...args);
  }

  invalidateReads(): void { this.generation++; }

  async load(): Promise<{ budget: Budget | null } | null> {
    if (this.writing) return null;
    const generation = this.generation, sequence = ++this.readSequence;
    const current = () => generation === this.generation && sequence === this.readSequence && !this.writing;
    try {
      const response = await this.request("/api/budget", { cache: "no-store" });
      const result = await response.json();
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
      const response = await this.request("/api/budget", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget, revision: this.revision }),
      });
      const result = await response.json();
      if (!response.ok) throw new BudgetRequestError(result.error || "Impossible d’enregistrer votre budget.", response.status);
      this.revision = result.revision;
      this.baseline = structuredClone(budget);
    } finally { this.writing = false; }
  }
}
