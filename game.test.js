"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { randomBet, parseMoney, calculateAmounts, chipBreakdown, chipTotal, DENOMINATIONS, recordResult, formatStats } = require("./game.js");

test("bets span $5 to $15,000 in $5 increments", () => {
  assert.equal(randomBet(() => 0), 5);
  assert.equal(randomBet(() => 0.999999), 15000);
  for (let i = 0; i < 3000; i++) {
    assert.equal(randomBet(() => (i + 0.5) / 3000), (i + 1) * 5);
  }
});

test("commission and payout are calculated exactly in cents", () => {
  assert.deepEqual(calculateAmounts(5), { commission: 25, payout: 475 });
  assert.deepEqual(calculateAmounts(125), { commission: 625, payout: 11875 });
  assert.deepEqual(calculateAmounts(500), { commission: 2500, payout: 47500 });
  assert.deepEqual(calculateAmounts(15000), { commission: 75000, payout: 1425000 });
  for (let bet = 5; bet <= 15000; bet += 5) {
    const amounts = calculateAmounts(bet);
    assert.equal(amounts.commission + amounts.payout, bet * 100);
    assert.equal(amounts.commission * 100, bet * 100 * 5);
    assert.equal(amounts.payout * 100, bet * 100 * 95);
  }
});

test("chip breakdowns represent every bet and payout exactly", () => {
  for (let bet = 5; bet <= 15000; bet += 5) {
    for (const cents of [bet * 100, calculateAmounts(bet).payout]) {
      assert.equal(chipTotal(chipBreakdown(cents).map(String)), cents);
    }
  }
  assert.deepEqual(chipBreakdown(475), [0, 0, 0, 0, 0, 0, 4, 3]);
});

test("chip totals accept different combinations and reject invalid counts", () => {
  assert.equal(chipTotal(["0", "0", "0", "0", "0", "0", "4", "3"]), 475);
  assert.equal(chipTotal(["0", "0", "0", "0", "0", "0", "0", "19"]), 475);
  for (const invalid of ["", "-1", "1.5", "1e2", "9007199254740992"]) {
    const counts = DENOMINATIONS.map(() => "0");
    counts[0] = invalid;
    assert.equal(chipTotal(counts), null);
  }
});

test("money parsing accepts valid amounts and rejects invalid input", () => {
  for (const [input, expected] of [["5", 500], ["5.2", 520], ["5.25", 525], [" $0.25 ", 25], ["0", 0]]) {
    assert.equal(parseMoney(input), expected);
  }
  for (const input of ["", ".", "1.", "-1", "1.234", "1e2", "1,000", "abc", "9007199254740992"]) {
    assert.equal(parseMoney(input), null);
  }
});

test("statistics count correct and incorrect answers and round accuracy", () => {
  const stats = { correct: 0, incorrect: 0 };
  assert.equal(formatStats(stats), "0 correct · 0 incorrect · — accuracy");
  recordResult(stats, true);
  recordResult(stats, false);
  recordResult(stats, true);
  assert.deepEqual(stats, { correct: 2, incorrect: 1 });
  assert.equal(formatStats(stats), "2 correct · 1 incorrect · 67% accuracy");
});
