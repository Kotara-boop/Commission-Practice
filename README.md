# Commission Practice

Open `index.html` in a browser to practice calculating a 5% commission and the remaining 95% payout. Each random bet is between $5 and $15,000, in $5 increments. The payout is the bet minus the commission, not an additional return of the original bet.

Each bet has a 40% chance of being from $5 through $995, a 40% chance of being from $1,000 through $2,495, and a 20% chance of being from $2,500 through $15,000. Values within each range are equally likely.

- **Numbers:** Enter both amounts in dollars; answers are checked to the cent.
- **Poker chips:** Count the bet chips on the left side of the green table. Enter the commission in dollars, then tap a denomination in the chip row to add it to your payout guess on the right. Tap a chip in your guess to remove one, or edit the displayed count. White, red, green, black, purple, orange, and grey chips are worth $1, $5, $25, $100, $500, $1,000, and $5,000 respectively. Use 25-cent US quarters for fractional dollars. Any combination totaling the exact payout is accepted.
- **Chips: payout only:** Count the bet chips and build your payout guess with the chip row; tap a chip in the guess to remove one. No commission entry is needed.

Changing modes starts a new bet. Each mode keeps separate commission and payout counts and accuracy percentages based on the first submission for each bet; payout-only mode tracks only payout. Blank or invalid answers on that submission count as incorrect, and retries do not change the recorded result. Statistics reset when the page is reloaded.

Each mode also shows the latest and average time for each answer. Timing starts when a new bet appears. You can press **Submit** beside the commission to record its time and lock it until you check the full answer. Otherwise, each time ends at that answer's last edit before the first check, so the two times can overlap. The initial bet and the first bet after changing modes are timed but excluded from the averages. Blank, untouched answers are excluded from the timing averages; retries and abandoned bets do not change the recorded times.

After checking, each answer's first-attempt time also appears beneath its feedback; a dash means no time was recorded for that answer.

To run the calculation tests with Node.js:

```sh
node --test game.test.js
```
