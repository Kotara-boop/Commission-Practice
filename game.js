"use strict";

const MIN_BET = 5;
const MAX_BET = 15000;
const LOWER_BET_MAX = 2500;
const BET_INCREMENT = 5;
const LOWER_BET_CHANCE = 0.7;
const DENOMINATIONS = [
  { cents: 500000, label: "$5,000", color: "grey" },
  { cents: 100000, label: "$1,000", color: "orange" },
  { cents: 50000, label: "$500", color: "purple" },
  { cents: 10000, label: "$100", color: "black" },
  { cents: 2500, label: "$25", color: "green" },
  { cents: 500, label: "$5", color: "red" },
  { cents: 100, label: "$1", color: "white" },
  { cents: 25, label: "25¢", color: "quarter" },
];

function randomBet(random = Math.random) {
  const value = random();
  const lower = value < LOWER_BET_CHANCE;
  const min = lower ? MIN_BET : LOWER_BET_MAX + BET_INCREMENT;
  const max = lower ? LOWER_BET_MAX : MAX_BET;
  const position = lower
    ? value / LOWER_BET_CHANCE
    : (value - LOWER_BET_CHANCE) / (1 - LOWER_BET_CHANCE);
  const choices = (max - min) / BET_INCREMENT + 1;
  return min + Math.floor(position * choices) * BET_INCREMENT;
}

function parseMoney(value) {
  const match = value.trim().match(/^\$?(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const dollars = Number(match[1]);
  const cents = Number((match[2] || "").padEnd(2, "0"));
  const total = dollars * 100 + cents;
  return Number.isSafeInteger(total) ? total : null;
}

function calculateAmounts(bet) {
  const commission = bet * 5;
  return { commission, payout: bet * 100 - commission };
}

function chipBreakdown(cents) {
  return DENOMINATIONS.map((denomination) => {
    const count = Math.floor(cents / denomination.cents);
    cents %= denomination.cents;
    return count;
  });
}

function chipTotal(values) {
  let total = 0;
  for (let i = 0; i < DENOMINATIONS.length; i++) {
    if (!/^\d+$/.test(values[i])) return null;
    const count = Number(values[i]);
    if (!Number.isSafeInteger(count)) return null;
    total += count * DENOMINATIONS[i].cents;
    if (!Number.isSafeInteger(total)) return null;
  }
  return total;
}

function recordResult(stats, correct) {
  if (correct) stats.correct++;
  else stats.incorrect++;
}

function formatStats(stats) {
  const total = stats.correct + stats.incorrect;
  const accuracy = total ? `${Math.round(stats.correct * 100 / total)}%` : "—";
  return `${stats.correct} correct · ${stats.incorrect} incorrect · ${accuracy} accuracy`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { randomBet, parseMoney, calculateAmounts, chipBreakdown, chipTotal, DENOMINATIONS, recordResult, formatStats };
}

if (typeof document !== "undefined") {
  const form = document.getElementById("answer-form");
  const betPanel = document.querySelector(".bet-panel");
  const betAmount = document.getElementById("bet-amount");
  const betChips = document.getElementById("bet-chips");
  const payoutGuess = document.getElementById("payout-guess");
  const payoutCounts = document.getElementById("payout-counts");
  const payoutEmpty = document.getElementById("payout-empty");
  const betQuestion = document.getElementById("bet-question");
  const chipTray = document.getElementById("chip-tray");
  const chipPayout = document.getElementById("chip-payout");
  const modeInputs = document.querySelectorAll('input[name="mode"]');
  const amountInputs = document.getElementById("amount-inputs");
  const numberPayout = document.getElementById("number-payout");
  const chipFeedback = document.getElementById("chip-feedback");
  const commissionInput = document.getElementById("commission");
  const payoutInput = document.getElementById("payout");
  const commissionFeedback = document.getElementById("commission-feedback");
  const payoutFeedback = document.getElementById("payout-feedback");
  const status = document.getElementById("status");
  const commissionStats = document.getElementById("commission-stats");
  const payoutStats = document.getElementById("payout-stats");
  const checkButton = document.getElementById("check-button");
  const nextButton = document.getElementById("next-button");
  let bet;
  const stats = {
    numbers: { commission: { correct: 0, incorrect: 0 }, payout: { correct: 0, incorrect: 0 } },
    chips: { commission: { correct: 0, incorrect: 0 }, payout: { correct: 0, incorrect: 0 } },
    "chips-payout": { commission: { correct: 0, incorrect: 0 }, payout: { correct: 0, incorrect: 0 } },
  };
  let complete = false;
  let scored = false;
  let mode = "numbers";

  function displayStats() {
    commissionStats.hidden = mode === "chips-payout";
    commissionStats.querySelector("span").textContent = formatStats(stats[mode].commission);
    payoutStats.querySelector("span").textContent = formatStats(stats[mode].payout);
  }

  function makeChip(denomination) {
    const chip = document.createElement("span");
    chip.className = `chip chip-${denomination.color}`;
    chip.textContent = denomination.label;
    chip.setAttribute("aria-hidden", "true");
    return chip;
  }

  const chipAddButtons = [];
  const guessEntries = [];
  const countInputs = DENOMINATIONS.map((denomination) => {
    const description = document.createElement("span");
    description.className = "chip-description";
    description.textContent = denomination.color === "quarter"
      ? "25¢ quarter"
      : `${denomination.label} ${denomination.color}`;
    const inputId = `chip-count-${denomination.color}`;
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "chip-add";
    addButton.setAttribute("aria-label", `Add one ${description.textContent}`);
    addButton.append(makeChip(denomination));
    const trayChoice = document.createElement("div");
    trayChoice.className = "chip-choice";
    trayChoice.append(addButton);

    const guessEntry = document.createElement("div");
    guessEntry.className = "payout-chip-choice";
    guessEntry.hidden = true;
    guessEntry.append(makeChip(denomination));
    const input = document.createElement("input");
    input.id = inputId;
    input.type = "number";
    input.inputMode = "numeric";
    input.min = "0";
    input.step = "1";
    input.value = "0";
    input.defaultValue = "0";
    input.setAttribute("aria-label", `Number of ${description.textContent}`);
    input.setAttribute("aria-describedby", "chip-payout-hint chip-feedback");
    guessEntry.append(input);
    input.addEventListener("input", () => {
      guessEntry.hidden = input.value === "0";
      payoutEmpty.hidden = !countInputs.every((countInput) => countInput.value === "0");
      input.removeAttribute("aria-invalid");
      chipFeedback.textContent = "";
      chipFeedback.classList.remove("correct");
    });
    addButton.addEventListener("click", () => {
      const current = input.value === "" ? 0 : Number(input.value);
      if (!Number.isSafeInteger(current) || current < 0 || current === Number.MAX_SAFE_INTEGER) return;
      input.value = String(current + 1);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    chipAddButtons.push(addButton);
    guessEntries.push(guessEntry);
    chipTray.append(trayChoice);
    payoutCounts.append(guessEntry);
    return input;
  });

  function displayBetChips() {
    betChips.replaceChildren();
    chipBreakdown(bet * 100).forEach((count, index) => {
      if (!count) return;
      const denomination = DENOMINATIONS[index];
      const group = document.createElement("div");
      group.className = "bet-chip-group";
      const description = denomination.color === "quarter"
        ? "quarter"
        : `${denomination.color} ${denomination.label} chip`;
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", `${count} ${description}${count === 1 ? "" : "s"}`);
      for (let i = 0; i < count; i++) {
        group.append(makeChip(denomination));
      }
      betChips.prepend(group);
    });
  }

  function clearFeedback(input, feedback) {
    input.removeAttribute("aria-invalid");
    feedback.textContent = "";
    feedback.classList.remove("correct");
  }

  function startRound() {
    bet = randomBet();
    complete = false;
    scored = false;
    displayStats();
    betAmount.textContent = `$${bet.toLocaleString("en-US")}`;
    displayBetChips();
    form.reset();
    clearFeedback(commissionInput, commissionFeedback);
    clearFeedback(payoutInput, payoutFeedback);
    chipFeedback.textContent = "";
    chipFeedback.classList.remove("correct");
    countInputs.forEach((input) => {
      input.disabled = false;
      input.removeAttribute("aria-invalid");
    });
    chipAddButtons.forEach((button) => { button.disabled = false; });
    commissionInput.disabled = false;
    payoutInput.disabled = false;
    const usesChips = mode !== "numbers";
    betPanel.classList.toggle("chip-mode", usesChips);
    betAmount.hidden = usesChips;
    betChips.hidden = !usesChips;
    payoutGuess.hidden = !usesChips;
    payoutEmpty.hidden = false;
    betQuestion.hidden = usesChips;
    amountInputs.hidden = mode === "chips-payout";
    numberPayout.hidden = usesChips;
    chipPayout.hidden = !usesChips;
    countInputs.forEach((input, index) => {
      input.value = "0";
      guessEntries[index].hidden = true;
    });
    checkButton.hidden = false;
    nextButton.hidden = true;
    status.textContent = mode === "numbers"
      ? "Enter both amounts to check your answer."
      : mode === "chips"
        ? "Enter the commission and select your payout chips."
        : "Select your payout chips.";
  }

  function checkChips(expected) {
    const total = chipTotal(countInputs.map((input) => input.value));
    const correct = total === expected;
    countInputs.forEach((input) => {
      const value = input.value;
      const valid = /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
      input.setAttribute("aria-invalid", String(!valid));
    });
    chipFeedback.classList.toggle("correct", correct);
    chipFeedback.textContent = total === null
      ? "Enter a nonnegative whole number for each denomination."
      : correct ? "That's correct." : "Not quite. Try again.";
    return correct;
  }

  function checkField(input, feedback, expected) {
    const amount = parseMoney(input.value);
    const correct = amount === expected;
    input.setAttribute("aria-invalid", String(!correct));
    feedback.classList.toggle("correct", correct);
    feedback.textContent = amount === null
      ? "Enter a dollar amount with up to two decimal places."
      : correct ? "That's correct." : "Not quite. Try again.";
    return correct;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (complete) return;

    const amounts = calculateAmounts(bet);
    const commissionCorrect = mode === "chips-payout"
      || checkField(commissionInput, commissionFeedback, amounts.commission);
    const payoutCorrect = mode !== "numbers"
      ? checkChips(amounts.payout)
      : checkField(payoutInput, payoutFeedback, amounts.payout);

    if (!scored) {
      if (mode !== "chips-payout") recordResult(stats[mode].commission, commissionCorrect);
      recordResult(stats[mode].payout, payoutCorrect);
      scored = true;
      displayStats();
    }

    if (commissionCorrect && payoutCorrect) {
      complete = true;
      status.textContent = "Nicely done! You're ready for the next bet.";
      commissionInput.disabled = true;
      payoutInput.disabled = true;
      countInputs.forEach((input) => { input.disabled = true; });
      chipAddButtons.forEach((button) => { button.disabled = true; });
      checkButton.hidden = true;
      nextButton.hidden = false;
      nextButton.focus();
    } else {
      status.textContent = mode === "chips-payout"
        ? "Check your payout and give it another try."
        : "Check each amount and give it another try.";
    }
  });

  modeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      mode = input.value;
      startRound();
    });
  });

  nextButton.addEventListener("click", () => {
    startRound();
    if (mode === "chips-payout") {
      chipAddButtons[0].focus();
    } else {
      commissionInput.focus();
    }
  });

  startRound();
}
