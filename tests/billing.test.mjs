import assert from "node:assert/strict";
import { test } from "node:test";
import {
  affordability,
  generationCost,
  isOwnerEmail,
  outputCount,
  parseCreditAmount,
  parseOwnerEmails,
  parsePriceInput,
} from "../generation/billing.ts";

test("owner emails are matched without caring about case or spaces", () => {
  const owners = parseOwnerEmails(" Yosh@Example.com , otro@x.com,, ");
  assert.deepEqual(owners, ["yosh@example.com", "otro@x.com"]);
  assert.equal(isOwnerEmail("YOSH@example.com", owners), true);
  assert.equal(isOwnerEmail(" otro@x.com ", owners), true);
  assert.equal(isOwnerEmail("cliente@x.com", owners), false);
  assert.equal(isOwnerEmail("", owners), false);
  assert.equal(isOwnerEmail(null, owners), false);
  assert.equal(isOwnerEmail("yosh@example.com", parseOwnerEmails(undefined)), false);
});

test("the number of outputs comes from the batch setting and never goes below one", () => {
  assert.equal(outputCount({}), 1);
  assert.equal(outputCount({ batchSize: "4" }), 4);
  assert.equal(outputCount({ batchSize: 2 }), 2);
  for (const bad of ["0", "-1", "abc", "2.5", "99", null, undefined])
    assert.equal(outputCount({ batchSize: bad }), 1, String(bad));
});

test("a generation costs the model price times the outputs, and an unpriced model costs nothing to quote", () => {
  assert.equal(generationCost(10, {}), 10);
  assert.equal(generationCost(10, { batchSize: "4" }), 40);
  assert.equal(generationCost(2.5, { batchSize: "4" }), 10);
  assert.equal(generationCost(0, {}), 0);
  assert.equal(generationCost(null, {}), null);
  assert.equal(generationCost(undefined, {}), null);
  assert.equal(generationCost(-1, {}), null);
  assert.equal(generationCost(Number.NaN, {}), null);
});

test("customers need a price and enough credits; the owner generates free", () => {
  const base = { settings: {}, credits: 30 };
  assert.deepEqual(affordability({ ...base, isOwner: true, price: undefined }), { state: "free" });
  assert.deepEqual(affordability({ ...base, isOwner: false, price: undefined }), { state: "unpriced" });
  assert.deepEqual(affordability({ ...base, isOwner: false, price: 30 }), { state: "ok", cost: 30 });
  assert.deepEqual(affordability({ ...base, isOwner: false, price: 12.5, settings: { batchSize: "4" } }), {
    state: "short",
    cost: 50,
    missing: 20,
  });
});

test("owner-typed credit amounts are validated", () => {
  assert.equal(parseCreditAmount("50"), 50);
  assert.equal(parseCreditAmount("12,5"), 12.5);
  assert.equal(parseCreditAmount(-5, { allowNegative: true }), -5);
  assert.throws(() => parseCreditAmount(-5), /mayor que cero/);
  assert.throws(() => parseCreditAmount("0"), /cero/);
  assert.throws(() => parseCreditAmount("abc"), /número/);
  assert.throws(() => parseCreditAmount(""), /número/);
  assert.throws(() => parseCreditAmount("1e9"), /máximo/);
});

test("prices can be set, cleared and are bounded", () => {
  assert.equal(parsePriceInput("12"), 12);
  assert.equal(parsePriceInput("0"), 0);
  assert.equal(parsePriceInput(""), null);
  assert.equal(parsePriceInput("  "), null);
  assert.equal(parsePriceInput(null), null);
  assert.throws(() => parsePriceInput("-1"), /negativo/);
  assert.throws(() => parsePriceInput("x"), /válido/);
  assert.throws(() => parsePriceInput("20000"), /máximo/);
});
