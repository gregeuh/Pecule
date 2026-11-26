import test from "node:test";
import assert from "node:assert/strict";
import {
  bankLabelOf,
  labelKey,
  looksLikeBankLabel,
  nameFor,
  readableLabel,
  rememberLabelName,
} from "../lib/readable-label.ts";

test("bank labels become readable names", () => {
  assert.equal(readableLabel("PRLV SEPA ASSURANCE LCL"), "Assurance LCL");
  assert.equal(readableLabel("ECHEANCE PRET PERSONNEL 271026"), "Échéance prêt personnel");
  assert.equal(readableLabel("CB EUROPCAR INTERNATIO 16/11"), "Europcar");
  assert.equal(readableLabel("VIR SEPA M DUPONT PAPA"), "Virement Dupont Papa");
  assert.equal(readableLabel("PRLV SEPA EDF CLIENTS PARTICULIERS"), "EDF clients particuliers");
  assert.equal(readableLabel("CB COIFFURE L ATELIER 25/11"), "Coiffure l atelier");
  assert.equal(readableLabel("PAIEMENT PAR CARTE X1234 BOULANGERIE DUPAIN 12/11"), "Boulangerie dupain");
});

test("labels written by hand are left alone", () => {
  assert.equal(readableLabel("Cotisation mensuelle carte bleue"), "Cotisation mensuelle carte bleue");
  assert.equal(readableLabel("Salaire"), "Salaire");
  assert.equal(readableLabel("  Loyer   novembre "), "Loyer novembre");
  assert.equal(looksLikeBankLabel("EDF"), true);
  assert.equal(looksLikeBankLabel("Edf"), false);
  assert.equal(looksLikeBankLabel("12/11"), false);
});

test("a label made only of a prefix and numbers keeps its bank form", () => {
  assert.equal(readableLabel("CB 1234 12/11"), "CB 1234 12/11");
  assert.equal(readableLabel("VIR SEPA 000123"), "VIR SEPA 000123");
});

test("the key ignores dates and references so next month's label matches", () => {
  assert.equal(labelKey("ECHEANCE PRET PERSONNEL 271026"), labelKey("ECHEANCE PRET PERSONNEL 271126"));
  assert.equal(labelKey("CB CARREFOUR CITY 2611"), "cb carrefour city");
});

test("a remembered name wins over the automatic one, and can be replaced", () => {
  let names = rememberLabelName(undefined, "VIR SEPA M DUPONT PAPA", "Virement de Papa");
  assert.equal(nameFor(names, "VIR SEPA M DUPONT PAPA"), "Virement de Papa");
  assert.equal(nameFor(names, "PRLV SEPA ASSURANCE LCL"), "Assurance LCL");
  names = rememberLabelName(names, "VIR SEPA M DUPONT PAPA", "Papa");
  assert.deepEqual(names, [{ key: "vir sepa m dupont papa", name: "Papa" }]);
  assert.deepEqual(rememberLabelName(names, "VIR SEPA M DUPONT PAPA", "  "), []);
});

test("the bank label behind an operation", () => {
  assert.equal(
    bankLabelOf({ label: "Assurance LCL", bankLabel: "PRLV SEPA ASSURANCE LCL" }),
    "PRLV SEPA ASSURANCE LCL",
  );
  assert.equal(bankLabelOf({ label: "PRLV SEPA ASSURANCE LCL", importBatch: "b1" }), "PRLV SEPA ASSURANCE LCL");
  assert.equal(bankLabelOf({ label: "Café" }), undefined);
});
