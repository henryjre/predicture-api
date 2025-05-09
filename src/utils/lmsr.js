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
  rewards_pool,
  feeRate = 0.02
) {
  const qBefore = { ...shares };
  const qAfter = { ...shares };

  // Increase shares for the chosen option
  qAfter[choice] = (qAfter[choice] || 0) + amountToBuy;

  const eps =
    qAfter[choice] > 0
      ? Number(
          new Decimal(rewards_pool)
            .div(qAfter[choice])
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        )
      : 0;

  const multiplier = calculateBuyMultiplier(eps);

  const costBefore = lmsrCost(qBefore, b);
  const costAfter = lmsrCost(qAfter, b);
  const rawCost = new Decimal(costAfter - costBefore);

  const adjustedCost = rawCost
    .times(multiplier)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const fee = rawCost.times(feeRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalCost = adjustedCost
    .plus(fee)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

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
  rewards_pool,
  feeRate = 0.02
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

  const eps =
    qAfter[choice] > 0
      ? Number(
          new Decimal(rewards_pool)
            .div(qAfter[choice])
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        )
      : 0;

  const multiplier = calculateSellMultiplier(eps);

  const costBefore = lmsrCost(qBefore, b);
  const costAfter = lmsrCost(qAfter, b);
  const rawPayout = new Decimal(costBefore - costAfter);

  const adjustedPayout = rawPayout
    .times(multiplier)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const fee = rawPayout
    .times(feeRate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalPayout = adjustedPayout
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

// Calculate buy multiplier based on EPS
export function calculateBuyMultiplier(eps) {
  const epsDecimal = new Decimal(eps);
  if (epsDecimal.lt(1.05)) {
    // multiplier = 1 + [0.05 + ((1.03 - eps) / 1.03) * 0.5]
    const part = new Decimal(1.03).minus(epsDecimal).div(1.03).times(0.5);
    const multiplier = new Decimal(1).plus(new Decimal(0.05).plus(part));
    return Number(multiplier.toDecimalPlaces(4, Decimal.ROUND_HALF_UP));
  } else {
    return 1.05;
  }
}

export function calculateSellMultiplier(eps) {
  const epsDecimal = new Decimal(eps);
  if (epsDecimal.lt(1.05)) {
    // multiplier = 1 - [0.05 + ((1.05 - eps) / 1.05) * 0.5]
    const part = new Decimal(1.05).minus(epsDecimal).div(1.05).times(0.5);
    const deduction = new Decimal(0.05).plus(part);
    const multiplier = new Decimal(1).minus(deduction);
    return Number(multiplier.toDecimalPlaces(4, Decimal.ROUND_HALF_UP));
  } else {
    return 0.9;
  }
}

/////////////////
//////////////////
///////////////////// WEBSITE UTILS //////////////////
/////////////////
//////////////////

export function buySharesToToken(
  amount,
  choice,
  shares,
  b,
  rewards_pool,
  feeRate = 0.02
) {
  // Round down the number of shares to buy
  const buyShares = Math.floor(amount);

  // Cost function using Decimal
  const cost = (q) => {
    let sumExp = new Decimal(0);
    for (const qj of Object.values(q)) {
      const qDecimal = new Decimal(qj);
      const expTerm = Decimal.exp(qDecimal.div(b));
      sumExp = sumExp.plus(expTerm);
    }
    return b.times(Decimal.ln(sumExp));
  };

  // Cost before purchase
  const originalCost = cost(shares);

  // Update shares
  const updatedShares = { ...shares };
  updatedShares[choice] = (updatedShares[choice] || 0) + buyShares;

  // Cost after purchase
  const newCost = cost(updatedShares);

  const eps =
    updatedShares[choice] > 0
      ? Number(
          new Decimal(rewards_pool)
            .div(updatedShares[choice])
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        )
      : 0;

  const multiplier = calculateBuyMultiplier(eps);

  // Raw token cost
  const rawTokens = newCost.minus(originalCost);

  const adjustedCost = rawTokens
    .times(multiplier)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // Round to 2 decimal places
  const fee = rawTokens
    .times(feeRate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalCost = adjustedCost
    .plus(fee)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // Average price per share (4 decimals)
  const averagePrice =
    buyShares > 0
      ? totalCost.div(buyShares).toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
      : new Decimal(0);

  return {
    fee: Number(fee),
    amountEquivalent: Number(totalCost),
    averagePrice: Number(averagePrice),
  };
}

export function buyTokenToShares(
  amount,
  choice,
  shares,
  b,
  rewards_pool,
  feeRate = 0.02
) {
  const eps =
    shares[choice] > 0
      ? Number(
          new Decimal(rewards_pool)
            .div(shares[choice])
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        )
      : 0;

  const multiplier = calculateBuyMultiplier(eps);

  // Parse input amount and apply fee deduction (to get net usable tokens)
  const amountDecimal = new Decimal(amount);

  const fee = amountDecimal
    .times(feeRate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const adjustedAmount = amountDecimal
    .div(multiplier)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const netAmount = adjustedAmount.div(new Decimal(1).plus(feeRate));

  // Precompute exponentials
  const expOthers = [];
  let sumExpOthers = new Decimal(0);

  for (const [key, qj] of Object.entries(shares)) {
    const expQj = Decimal.exp(new Decimal(qj).div(b));
    if (key !== choice) {
      expOthers.push(expQj);
      sumExpOthers = sumExpOthers.plus(expQj);
    }
  }

  const qk = new Decimal(shares[choice] || 0);
  const expQk = Decimal.exp(qk.div(b));

  // Core formula:
  // Δqk = b * ln( ( (e^(qk/b) + ∑e^(qj/b)) * e^(amount/b) ) - ∑e^(qj/b) ) - qk
  const part1 = expQk.plus(sumExpOthers);
  const part2 = Decimal.exp(netAmount.div(b));
  const inner = part1.times(part2).minus(sumExpOthers);
  const deltaQk = b.times(Decimal.ln(inner)).minus(qk);

  // Round down to whole number of shares
  const buyShares = deltaQk.floor().toNumber();

  return {
    amountEquivalent: buyShares,
    fee: fee,
    averagePrice:
      buyShares > 0
        ? Number(
            netAmount.div(buyShares).toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
          )
        : 0,
  };
}

export function sellSharesToToken(
  shareAmount,
  choice,
  shares,
  b,
  rewards_pool,
  feeRate = 0.02
) {
  const sellShares = Math.floor(shareAmount); // round down to whole shares

  const cost = (q) => {
    let sumExp = new Decimal(0);
    for (const qj of Object.values(q)) {
      sumExp = sumExp.plus(Decimal.exp(new Decimal(qj).div(b)));
    }
    return b.times(Decimal.ln(sumExp));
  };

  const originalCost = cost(shares);

  const updatedShares = { ...shares };
  updatedShares[choice] = (updatedShares[choice] || 0) - sellShares;

  const eps =
    updatedShares[choice] > 0
      ? Number(
          new Decimal(rewards_pool)
            .div(updatedShares[choice])
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        )
      : 0;

  const multiplier = calculateSellMultiplier(eps);

  const newCost = cost(updatedShares);

  const rawRefund = originalCost.minus(newCost);

  const adjustedRefund = rawRefund
    .times(multiplier)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const fee = rawRefund
    .times(feeRate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const netRefund = adjustedRefund
    .minus(fee)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const averagePrice =
    sellShares > 0
      ? netRefund.div(sellShares).toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
      : new Decimal(0);

  return {
    fee: Number(fee),
    amountEquivalent: Number(netRefund),
    averagePrice: Number(averagePrice),
  };
}

export function sellTokensToShares(
  refundAmount,
  choice,
  shares,
  b,
  rewards_pool,
  feeRate = 0.02
) {
  const eps =
    shares[choice] > 0
      ? Number(
          new Decimal(rewards_pool)
            .div(shares[choice])
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        )
      : 0;

  const multiplier = calculateSellMultiplier(eps);

  const refundDecimal = new Decimal(refundAmount);

  const fee = refundDecimal
    .times(feeRate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const adjustedRefund = refundDecimal
    .div(multiplier)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const netRefund = adjustedRefund.div(new Decimal(1).minus(feeRate));
  // Precompute exponentials
  const qk = new Decimal(shares[choice] || 0);
  const expQk = Decimal.exp(qk.div(b));
  const expOthers = [];
  let sumExpOthers = new Decimal(0);

  for (const [key, qj] of Object.entries(shares)) {
    if (key !== choice) {
      const exp = Decimal.exp(new Decimal(qj).div(b));
      expOthers.push(exp);
      sumExpOthers = sumExpOthers.plus(exp);
    }
  }

  const numerator = expQk.plus(sumExpOthers);
  const denominator = Decimal.exp(netRefund.div(b));
  const inner = numerator.div(denominator).minus(sumExpOthers);

  const N = qk.minus(b.times(Decimal.ln(inner)));

  const sellShares = N.floor();

  const averagePrice = sellShares.gt(0)
    ? netRefund.div(sellShares).toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
    : new Decimal(0);

  return {
    amountEquivalent: sellShares.toNumber(),
    fee: fee,
    averagePrice: Number(averagePrice),
  };
}
