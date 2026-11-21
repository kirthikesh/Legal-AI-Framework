import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPrompt, containsCardNumber, containsPpsNumber } from "../lib/guardrails.ts";

test("blocks valid card numbers, with or without spaces", () => {
  assert.equal(containsCardNumber("pay 4111 1111 1111 1111 now"), true);
  assert.equal(containsCardNumber("4111-1111-1111-1111"), true);
  assert.equal(containsCardNumber("5500005555555559"), true);
});

test("ignores digit runs that fail the Luhn check", () => {
  assert.equal(containsCardNumber("invoice 1234 5678 9012 3456"), false);
  assert.equal(containsCardNumber("order 20261121"), false);
});

test("blocks Irish PPS numbers", () => {
  assert.equal(containsPpsNumber("my PPS is 1234567T"), true);
  assert.equal(containsPpsNumber("1234567TW"), true);
  assert.equal(containsPpsNumber("room 1234567"), false);
});

test("checkPrompt", () => {
  assert.deepEqual(checkPrompt("Summarise the Q3 vendor contracts"), { allowed: true });
  assert.equal(checkPrompt("   ").allowed, false);
  assert.equal(checkPrompt("x".repeat(4001)).allowed, false);
  assert.match(checkPrompt("card 4111111111111111").reason ?? "", /card/i);
});
