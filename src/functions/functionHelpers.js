// Get the constant b dynamically
export function calculateDynamicB(shares, baseB = 100, k = 0.2) {
  const totalShares = Object.values(shares).reduce((sum, q) => sum + q, 0);
  return baseB + totalShares * k;
}

// Get the LMSR Cost
function lmsrCost(shareMap, b) {
  const exponentials = Object.values(shareMap).map((q) => Math.exp(q / b));
  const sumExp = exponentials.reduce((acc, val) => acc + val, 0);
  return b * Math.log(sumExp);
}

// Calculate the cost as well as the shares data after trade
export function calculatePurchaseCost(
  shares,
  baseB,
  choice,
  amountToBuy,
  feeRate = 0.02,
  k = 0.2
) {
  const b = calculateDynamicB(shares, baseB, k);

  const qBefore = { ...shares };
  const qAfter = { ...shares };

  // Increase shares for the chosen option
  qAfter[choice] = (qAfter[choice] || 0) + amountToBuy;

  const costBefore = lmsrCost(qBefore, b);
  const costAfter = lmsrCost(qAfter, b);
  const rawCost = costAfter - costBefore;

  const fee = rawCost * feeRate;
  const totalCost = rawCost + fee;

  return {
    rawCost: parseFloat(rawCost.toFixed(2)),
    fee: parseFloat(fee.toFixed(2)),
    cost: parseFloat(totalCost.toFixed(2)), // Final amount user pays
    newShares: qAfter,
  };
}

// Calculate the selling payout as well as the shares data after trade
export function calculateSellPayout(
  shares,
  baseB,
  choice,
  amountToSell,
  feeRate = 0.02,
  k = 0.2
) {
  const b = calculateDynamicB(shares, baseB, k);

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
  const rawPayout = costBefore - costAfter;

  const fee = rawPayout * feeRate;
  const totalPayout = rawPayout - fee;

  return {
    rawPayout: parseFloat(rawPayout.toFixed(2)),
    fee: parseFloat(fee.toFixed(2)),
    payout: parseFloat(totalPayout.toFixed(2)), // Final amount user receives
    newShares: qAfter,
  };
}

// Getting the actual price of shares
export function calculateMarketPrices(shares, baseB = 100, k = 0.2) {
  const b = calculateDynamicB(shares, baseB, k);

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
    prices[key] = parseFloat((expVal / sumExp).toFixed(4)); // Rounded to 4 decimals
  }

  return prices;
}
