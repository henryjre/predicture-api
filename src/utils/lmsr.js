import Decimal from "decimal.js";

// Get the constant b dynamically
// export function calculateDynamicB(shares, baseB = 100, k = 0.2) {
//   const totalShares = Object.values(shares).reduce((sum, q) => sum + q, 0);
//   return baseB + totalShares * k;
// }

// Get the LMSR Cost
function lmsrCost(shareMap, b) {
  const exponentials = Object.values(shareMap).map((q) => Math.exp(q / b));
  const sumExp = exponentials.reduce((acc, val) => acc + val, 0);
  return b * Math.log(sumExp);
}

// Calculate the cost as well as the shares data after trade
export function calculatePurchaseCost(
  shares,
  b,
  choice,
  amountToBuy,
  feeRate = 0.02
) {
  const qBefore = { ...shares };
  const qAfter = { ...shares };

  // Increase shares for the chosen option
  qAfter[choice] = (qAfter[choice] || 0) + amountToBuy;

  const costBefore = lmsrCost(qBefore, b);
  const costAfter = lmsrCost(qAfter, b);
  const rawCost = new Decimal(costAfter - costBefore);

  const fee = rawCost.times(feeRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalCost = rawCost.plus(fee).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    rawCost: Number(rawCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)),
    fee: Number(fee),
    cost: Number(totalCost), // Final amount user pays
    newShares: qAfter,
  };
}

// Calculate the selling payout as well as the shares data after trade
export function calculateSellPayout(
  shares,
  b,
  choice,
  amountToSell,
  feeRate = 0.02,
  k = 0.2
) {
  const qBefore = { ...shares };
  const qAfter = { ...shares };

  if ((qBefore[choice] || 0) < amountToSell) {
    throw new Error(
      `Cannot sell more shares than are in the pool for ${choice}`
    );
  }

  // Decrease shares for the chosen option
  qAfter[choice] -= amountToSell;

  const costBefore = lmsrCost(qBefore, b);
  const costAfter = lmsrCost(qAfter, b);
  const rawPayout = new Decimal(costBefore - costAfter);

  const fee = rawPayout
    .times(feeRate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalPayout = rawPayout
    .minus(fee)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    rawPayout: Number(rawPayout.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)),
    fee: Number(fee),
    payout: Number(totalPayout), // Final amount user receives
    newShares: qAfter,
  };
}

// Getting the actual price of shares
export function calculateMarketPrices(shares, b) {
  const expShares = {};
  let sumExp = 0;

  // Step 1: Calculate exp(qj / b) for each outcome
  for (const [key, q] of Object.entries(shares)) {
    const expVal = Math.exp(q / b);
    expShares[key] = expVal;
    sumExp += expVal;
  }

  // Step 2: Normalize to get probabilities
  const prices = {};
  for (const [key, expVal] of Object.entries(expShares)) {
    prices[key] = Number(
      new Decimal(expVal / sumExp).toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
    ); // Rounded to 4 decimals
  }

  return prices;
}
