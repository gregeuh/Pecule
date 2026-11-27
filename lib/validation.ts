import { HOME_BLOCKS } from "./home-layout.ts";
import { z } from "zod";

// Zod probes `Function("")` to pick a faster validator; the Content Security Policy forbids eval, so skip the probe.
z.config({ jitless: true });
import { todayISO } from "./budget.ts";
import { normalizeIconUrl } from "./icon-url.ts";
const id = z.string().min(1).max(120);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      s >= "2000-01-01" &&
      s <= "2100-12-31" &&
      !Number.isNaN(new Date(s + "T12:00:00Z").getTime()) &&
      new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s,
    "Date invalide",
  );
const cents = z.number().int().min(-1e11).max(1e11);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const text = z.string().trim().min(1).max(120);
const reconciliation = z.object({
  date,
  bankBalance: cents,
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  confirmedAt: z.string().datetime(),
});
const account = z.object({
  reconciliations: z.array(reconciliation).max(50).optional(),
  id,
  name: text,
  bank: z.string().max(120),
  type: z.enum(["current", "savings", "cash"]),
  openingBalance: cents,
  openingDate: date,
  color,
});
const merchantId = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,119}$/)
  .optional();
const customIconUrl = z
  .string()
  .max(2048)
  .refine((value) => normalizeIconUrl(value) !== null, "Utilisez un lien HTTPS sans identifiants pour l’icône")
  .transform((value) => normalizeIconUrl(value)!)
  .optional();
const bankLink = z.object({
  key: z.string().min(1).max(400),
  batchId: id,
  label: text,
  date,
  note: z.string().max(1000),
  reference: z.string().max(120).optional(),
});
const column = z.number().int().min(-1).max(99);
const importColumns = z.object({
  date: column,
  label: column,
  amount: column,
  debit: column,
  credit: column,
  category: column,
  note: column,
  reference: column,
  currency: column,
});
const importProfile = z.object({
  accountId: id,
  header: z.array(z.string().max(160)).min(1).max(100),
  columns: importColumns,
  mode: z.enum(["signed", "split"]),
  dateOrder: z.enum(["dmy", "mdy"]),
  keepExtra: z.boolean(),
});
const transaction = z.object({
  bankLinks: z.array(bankLink).max(20).optional(),
  id,
  merchantId,
  customIconUrl,
  label: text,
  bankLabel: text.optional(),
  amount: cents,
  date,
  accountId: id,
  category: text,
  note: z.string().max(1000),
  ruleId: id.optional(),
  transferId: id.optional(),
  transferOriginalCategory: text.optional(),
  goalId: id.optional(),
  importRef: id.optional(),
  importBatch: id.optional(),
  balanceIncluded: z.boolean().optional(),
});
const rule = z
  .object({
    id,
    merchantId,
    customIconUrl,
    label: text,
    bankLabel: text.optional(),
    amount: cents.refine((n) => n !== 0),
    accountId: id,
    toAccountId: id.optional(),
    category: text,
    startDate: date,
    endDate: z.union([date, z.literal("")]),
    frequency: z.enum(["monthly", "weekly", "yearly"]),
    timing: z.enum(["date", "last-business-day"]),
    day: z.number().int().min(1).max(31),
    active: z.boolean(),
    holidays: z.enum(["FR", "none"]),
    excludedDates: z.array(date).max(1000),
  })
  .refine((r) => !r.endDate || r.endDate >= r.startDate, "La fin précède le début")
  .refine(
    (r) => !r.toAccountId || (r.toAccountId !== r.accountId && r.amount < 0),
    "Un virement récurrent part d’un compte vers un autre",
  );
const goal = z
  .object({
    accountId: id.optional(),
    id,
    name: text,
    target: cents.refine((n) => n >= 0),
    saved: cents.refine((n) => n >= 0),
    monthly: cents.refine((n) => n >= 0),
    color,
    icon: z.enum(["sun", "shield", "home", "plane", "sparkles"]),
    deadline: z.union([date, z.literal("")]),
  })
  .refine((g) => g.target > 0 || !!g.accountId, "Indiquez le montant à atteindre");
const favorite = z.object({
  id,
  label: text,
  amount: cents.refine((n) => n > 0).optional(),
  direction: z.enum(["expense", "income"]),
  category: text,
  accountId: id.optional(),
  merchantId,
  customIconUrl,
});
const capture = z.object({
  lastAccountId: id.optional(),
  favorites: z
    .array(favorite)
    .max(20)
    .refine((rows) => new Set(rows.map((r) => r.id)).size === rows.length, "Favori en double")
    .optional(),
  reviews: z
    .array(
      z.object({
        date: date.refine((value) => value <= todayISO(), "Une journée future ne peut pas être vérifiée"),
        kind: z.enum(["checked", "nothing"]),
        signature: z.string().regex(/^[a-f0-9]{16}$/),
        checkedAt: z.string().datetime(),
      }),
    )
    .max(90)
    .refine((rows) => new Set(rows.map((r) => r.date)).size === rows.length, "Journée en double")
    .optional(),
});
export const budgetSchema = z
  .object({
    version: z.literal(1),
    name: z.string().trim().max(60),
    accounts: z.array(account).max(50),
    transactions: z.array(transaction).max(20000),
    rules: z.array(rule).max(200),
    goals: z.array(goal).max(100),
    settings: z.object({
      importProfiles: z
        .array(importProfile)
        .max(50)
        .refine((rows) => new Set(rows.map((r) => r.accountId)).size === rows.length, "Format de compte en double")
        .optional(),
      capture: capture.optional(),
      categoryRules: z
        .array(
          z.object({
            key: z
              .string()
              .min(7)
              .max(200)
              .regex(/^(brand|label):.+$/),
            title: text,
            direction: z.enum(["income", "expense"]),
            category: text,
          }),
        )
        .max(100)
        .refine(
          (rows) => new Set(rows.map((r) => `${r.direction}:${r.key}`)).size === rows.length,
          "Règle de catégorie en double",
        )
        .optional(),
      labelNames: z
        .array(z.object({ key: z.string().trim().min(1).max(200), name: text }))
        .max(200)
        .refine((rows) => new Set(rows.map((r) => r.key)).size === rows.length, "Nom mémorisé en double")
        .optional(),
      dismissedChecks: z.array(z.string().trim().min(1).max(300)).max(200).optional(),
      pastRecurrences: z.enum(["date", "statement"]).optional(),
      homeLayout: z
        .object({ order: z.array(z.enum(HOME_BLOCKS)).max(20), hidden: z.array(z.enum(HOME_BLOCKS)).max(20) })
        .optional(),
      dailyComfortCents: z.number().int().min(1).max(100000000).optional(),
      categoryLimits: z
        .record(
          z.string(),
          cents.refine((n) => n > 0),
        )
        .refine(
          (g) =>
            Object.keys(g).length <= 100 &&
            Object.keys(g).every(
              (k) => k.length > 0 && k.length <= 120 && !["__proto__", "constructor", "prototype"].includes(k),
            ),
        )
        .optional(),
      horizon: z.enum(["salary", "month"]),
      reserve: cents.refine((n) => n >= 0),
      holidayCalendar: z.enum(["FR", "none"]),
      spendingPlan: z
        .object({
          monthlyIncome: cents.refine((n) => n >= 0).nullable(),
          groups: z
            .record(z.string(), z.enum(["needs", "wants", "savings", "unassigned"]))
            .refine(
              (g) =>
                Object.keys(g).length <= 100 &&
                Object.keys(g).every((k) => k.length <= 120 && !["__proto__", "constructor", "prototype"].includes(k)),
            ),
        })
        .optional(),
    }),
  })
  .superRefine((b, ctx) => {
    for (const rows of [b.accounts, b.transactions, b.rules, b.goals])
      if (new Set(rows.map((r) => r.id)).size !== rows.length)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Identifiant en double" });
    const transfers = new Map<string, typeof b.transactions>();
    for (const row of b.transactions) {
      if (row.transferId) transfers.set(row.transferId, [...(transfers.get(row.transferId) ?? []), row]);
      else if (row.transferOriginalCategory)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Une catégorie d’origine doit être liée à un virement" });
    }
    for (const pair of transfers.values())
      if (
        pair.length !== 2 ||
        pair[0].accountId === pair[1].accountId ||
        pair[0].amount === 0 ||
        pair[0].amount + pair[1].amount !== 0 ||
        pair.some((t) => t.ruleId) ||
        (pair.some((t) => t.transferOriginalCategory) && pair.some((t) => !t.transferOriginalCategory))
      )
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Un virement doit contenir deux montants opposés sur deux comptes distincts, sans récurrence associée",
        });
    const ids = new Set(b.accounts.map((a) => a.id));
    const importedRefs = new Set<string>();
    for (const row of b.transactions)
      if (row.importRef) {
        const key = JSON.stringify([row.accountId, row.importRef]);
        if (importedRefs.has(key))
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Référence bancaire déjà présente sur ce compte" });
        importedRefs.add(key);
      }
    for (const row of b.transactions)
      if (row.balanceIncluded && row.date > (b.accounts.find((a) => a.id === row.accountId)?.openingDate ?? ""))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Une opération historique doit être comprise dans la date du solde de référence",
        });
    for (const row of [...b.transactions, ...b.rules])
      if (!ids.has(row.accountId)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Compte introuvable" });
    for (const row of [...b.rules.map((r) => r.toAccountId), ...b.goals.map((g) => g.accountId)])
      if (row && b.accounts.find((a) => a.id === row)?.type !== "savings")
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choisissez un compte d’épargne" });
  });
export const saveSchema = z.object({ revision: z.number().int().min(0), budget: budgetSchema });
