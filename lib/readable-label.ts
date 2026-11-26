import { normalize, recognizeBrand } from "./merchants.ts";

/** A remembered name: operations whose bank label has this key are named `name` at import. */
export type LabelName = { key: string; name: string };

/** Bank prefixes that say how money moved, not who it went to. Longest first. */
const prefixes: [RegExp, "card" | "transfer" | "debit" | "other"][] = [
  [/^(paiement|achat) (par )?carte( bancaire)?( x?\d+)?( \d{2}\/\d{2}(\/\d{2,4})?)? /, "card"],
  [/^carte( x?\d+)?( \d{2}\/\d{2}(\/\d{2,4})?)? /, "card"],
  [/^cb\*? ?(x?\d{4} )?(\d{2}\/\d{2}(\/\d{2,4})? )?/, "card"],
  [/^(prlv|prel|prelevement|prelev)( sepa)?( europeen)? /, "debit"],
  [
    /^(vir|virement)( sepa)?( (recu|emis|inst|instantane|permanent))?( de| a| vers| en faveur de| de la part de)? /,
    "transfer",
  ],
  [/^(retrait|ret) (dab|gab)( x?\d+)?/, "other"],
];
/** Words written in capitals in everyday French. */
const acronyms = new Set(
  "lcl edf gdf sncf sfr ratp bnp cic caf cpam urssaf dgfip sg hsbc bpce rib iban tva tv cb dab gab pel cel ldd ldds lep pea ag ehpad apl rsa mgen maif macif maaf gmf axa ikea h&m".split(
    " ",
  ),
);
/** Common banking words, back with their accents. */
const accents: Record<string, string> = {
  echeance: "échéance",
  echeances: "échéances",
  pret: "prêt",
  prets: "prêts",
  electricite: "électricité",
  energie: "énergie",
  reglement: "règlement",
  credit: "crédit",
  debit: "débit",
  interets: "intérêts",
  prelevement: "prélèvement",
  cheque: "chèque",
  depot: "dépôt",
  telephone: "téléphone",
  societe: "société",
  generale: "générale",
  general: "général",
  especes: "espèces",
  sante: "santé",
  impot: "impôt",
  impots: "impôts",
  tresor: "trésor",
  remuneration: "rémunération",
  epargne: "épargne",
  operation: "opération",
  frais: "frais",
  remboursement: "remboursement",
  mutualiste: "mutualiste",
  regie: "régie",
  eleve: "élève",
  ecole: "école",
  creche: "crèche",
  medecin: "médecin",
  pharmacie: "pharmacie",
  securite: "sécurité",
  sociale: "sociale",
  retraite: "retraite",
  numero: "numéro",
  periode: "période",
  cotisation: "cotisation",
  echeancier: "échéancier",
};
const civility = new Set(["m", "mr", "mme", "mlle", "melle", "monsieur", "madame"]);

/** True when a label is written the way banks write it: capitals only. */
export function looksLikeBankLabel(label: string) {
  const letters = label.replace(/[^\p{L}]/gu, "");
  return letters.length >= 3 && letters === letters.toLocaleUpperCase("fr");
}

/** A token that is a date, an amount, a card number or a reference: never part of a name. */
const isNoise = (token: string) => /\d/.test(token) || /^x+$/i.test(token);

function word(token: string, first: boolean, names: boolean) {
  const lower = token.toLocaleLowerCase("fr");
  const plain = normalize(token);
  if (acronyms.has(lower) || acronyms.has(plain)) return token.toLocaleUpperCase("fr");
  const accented = accents[plain] ?? lower;
  return first || names ? accented.charAt(0).toLocaleUpperCase("fr") + accented.slice(1) : accented;
}

/**
 * A readable name for a bank label: « PRLV SEPA ASSURANCE LCL » → « Assurance LCL »,
 * « CB EUROPCAR INTERNATIO 16/11 » → « Europcar ». Labels already written by hand (with lower case) stay as they are.
 */
export function readableLabel(raw: string): string {
  const label = raw.replace(/\s+/g, " ").trim();
  if (!looksLikeBankLabel(label)) return label;
  let text = normalize(label);
  let kind: (typeof prefixes)[number][1] | undefined;
  for (const [pattern, k] of prefixes)
    if (pattern.test(text + " ")) {
      text = (text + " ").replace(pattern, "").trim();
      kind = k;
      break;
    }
  if (kind === "card") {
    const brand = recognizeBrand(text);
    if (brand) return brand.name;
  }
  // Work on the original tokens (they keep their accents): drop as many as the prefix took.
  const original = label.split(" ");
  let start = 0;
  while (start < original.length && normalize(original.slice(start).join(" ")) !== text) start++;
  const tokens = original.slice(start).filter((t) => !isNoise(t));
  // A trailing reference never names anything; a leading civility only before a person's name.
  const clean = kind === "transfer" ? tokens.filter((t) => !civility.has(normalize(t))) : tokens;
  if (!clean.length) return label;
  const name = clean.map((t, i) => word(t.replace(/[*_]+/g, ""), i === 0, kind === "transfer")).join(" ");
  if (kind === "transfer") return `Virement ${name}`;
  if (kind === "other") return `Retrait ${name}`.trim();
  return name;
}

/** The key that ties the next operations with the same bank label to a remembered name (dates and numbers aside). */
export function labelKey(raw: string) {
  return normalize(raw)
    .split(" ")
    .filter((t) => t && !isNoise(t))
    .join(" ");
}

/** The name to give an operation imported with this bank label: a remembered one, else the readable one. */
export function nameFor(names: LabelName[] | undefined, raw: string) {
  const key = labelKey(raw);
  return (key && names?.find((n) => n.key === key)?.name) || readableLabel(raw);
}

/** Remembers `name` for the next operations with this bank label. */
export function rememberLabelName(names: LabelName[] | undefined, raw: string, name: string): LabelName[] {
  const key = labelKey(raw);
  const rest = (names ?? []).filter((n) => n.key !== key);
  if (!key || !name.trim()) return rest;
  if (rest.length >= 200) throw new Error("Vous pouvez mémoriser jusqu’à 200 noms.");
  return [...rest, { key, name: name.trim() }];
}

/** The bank label behind an operation: kept when it was renamed, else its label when it came from an import. */
export function bankLabelOf(t: { label: string; bankLabel?: string; importBatch?: string }) {
  return t.bankLabel ?? (t.importBatch ? t.label : undefined);
}
