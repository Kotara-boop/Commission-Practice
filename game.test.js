"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { SMALL_BET_MAX, parseBetRange, randomBet, parseMoney, calculateAmounts, chipBreakdown, chipTotal, DENOMINATIONS, recordResult, formatStats, recordTime, formatTimeStats, formatElapsed } = require("./game.js");

test("bets use a 40/40/20 split across the three ranges", () => {
  assert.equal(randomBet(() => 0), 5);
  assert.equal(randomBet(() => 0.4 - Number.EPSILON), 995);
  assert.equal(randomBet(() => 0.4), 1000);
  assert.equal(randomBet(() => 0.8 - Number.EPSILON), 2495);
  assert.equal(randomBet(() => 0.8), 2500);
  assert.equal(randomBet(() => 0.999999), 15000);
  let under1000 = 0;
  let under2500 = 0;
  for (let i = 0; i < 10000; i++) {
    const bet = randomBet(() => (i + 0.5) / 10000);
    assert.ok(bet >= 5 && bet <= 15000 && bet % 5 === 0);
    if (bet < 1000) under1000++;
    if (bet < 2500) under2500++;
  }
  assert.equal(under1000, 4000);
  assert.equal(under2500, 8000);
  const ranges = [
    { min: 5, count: 199, start: 0, width: 0.4 },
    { min: 1000, count: 300, start: 0.4, width: 0.4 },
    { min: 2500, count: 2501, start: 0.8, width: 0.2 },
  ];
  for (const { min, count, start, width } of ranges) {
    for (let i = 0; i < count; i++) {
      assert.equal(randomBet(() => start + width * (i + 0.5) / count), min + i * 5);
    }
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

test("timing statistics exclude missing answers and average elapsed times", () => {
  assert.equal(formatElapsed(null), "—");
  assert.equal(formatElapsed(0), "0.0s");
  assert.equal(formatElapsed(3450), "3.5s");
  const timing = { last: null, total: 0, count: 0 };
  assert.equal(formatTimeStats(timing), "Last: — · Average: —");
  recordTime(timing, null);
  assert.deepEqual(timing, { last: null, total: 0, count: 0 });
  recordTime(timing, 5000, false);
  assert.deepEqual(timing, { last: 5000, total: 0, count: 0 });
  assert.equal(formatTimeStats(timing), "Last: 5.0s · Average: —");
  recordTime(timing, 1200);
  recordTime(timing, 3450);
  assert.deepEqual(timing, { last: 3450, total: 4650, count: 2 });
  assert.equal(formatTimeStats(timing), "Last: 3.5s · Average: 2.3s");
  recordTime(timing, 9000, false);
  assert.equal(formatTimeStats(timing), "Last: 9.0s · Average: 2.3s");
  recordTime(timing, 0);
  assert.equal(formatTimeStats(timing), "Last: 0.0s · Average: 1.6s");
});

test("small bets are $5 to $200 in $5 steps", () => {
  assert.equal(randomBet(() => 0, SMALL_BET_MAX), 5);
  assert.equal(randomBet(() => 0.999999, SMALL_BET_MAX), 200);
  for (let i = 0; i < 40; i++) assert.equal(randomBet(() => (i + 0.5) / 40, SMALL_BET_MAX), 5 + i * 5);
});

test("custom ranges round to $5 steps and stay within limits", () => {
  assert.deepEqual(parseBetRange("50", "500"), { min: 50, max: 500 });
  assert.deepEqual(parseBetRange("$52", "498"), { min: 55, max: 495 });
  assert.deepEqual(parseBetRange("1", "99999"), { min: 5, max: 15000 });
  assert.equal(parseBetRange("500", "50"), null);
  assert.equal(parseBetRange("6", "9"), null);
  assert.equal(parseBetRange("abc", "50"), null);
  assert.equal(randomBet(() => 0, 500, 50), 50);
  assert.equal(randomBet(() => 0.999999, 500, 50), 500);
});
