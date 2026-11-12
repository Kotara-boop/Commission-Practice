# Commission Practice

Open `index.html` in a browser to practice calculating a 5% commission and the remaining 95% payout. Each random bet is between $5 and $15,000, in $5 increments. The payout is the bet minus the commission, not an additional return of the original bet.

Each bet has a 70% chance of being from $5 through $2,500, and a 30% chance of being from $2,505 through $15,000. Values within each range are equally likely.

- **Numbers:** Enter both amounts in dollars; answers are checked to the cent.
- **Poker chips:** Count the displayed bet chips, arranged in rows from lowest denomination at the top to highest at the bottom. Enter the commission in dollars, then click or tap each payout chip to add one to its count, or edit the counts directly. White, red, green, black, purple, orange, and grey chips are worth $1, $5, $25, $100, $500, $1,000, and $5,000 respectively. Use 25-cent US quarters for fractional dollars. Any combination totaling the exact payout is accepted.
- **Chips: payout only:** Count the bet chips and enter the payout in chips and quarters without entering the commission.

Changing modes starts a new bet. Each mode keeps separate commission and payout counts and accuracy percentages based on the first submission for each bet; payout-only mode tracks only payout. Blank or invalid answers on that submission count as incorrect, and retries do not change the recorded result. Statistics reset when the page is reloaded.

To run the calculation tests with Node.js:

```sh
node --test game.test.js
```
