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
  const baseCost = b * Math.log(sumExp);
  const numOptions = Object.keys(shareMap).length;
  return baseCost * numOptions;
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

  const costBefore = lmsrCost(qBefore, b);
  const costAfter = lmsrCost(qAfter, b);
  const rawCost = new Decimal(costAfter - costBefore); //base cost

  const adjustedCost = rawCost
    .times(new Decimal(1).plus(new Decimal(0.03)))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const fee = adjustedCost
    .times(new Decimal(feeRate))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const totalCost = adjustedCost
    .plus(fee)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const averagePrice =
    totalCost
      .div(new Decimal(amountToBuy))
      .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
      .toNumber() || 0;

  return {
    ok: true,
    rawCost: Number(adjustedCost),
    fee: Number(fee),
    cost: Number(totalCost),
    newShares: qAfter,
    averagePrice: averagePrice,
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
    console.log(`Selling more shares than are in the pool for ${choice}`);
  }

  // Decrease shares for the chosen option
  qAfter[choice] -= amountToSell;

  const costBefore = lmsrCost(qBefore, b);
  const costAfter = lmsrCost(qAfter, b);
  const rawPayout = new Decimal(costBefore - costAfter);

  const rewardsPoolAfter = new Decimal(rewards_pool).minus(rawPayout);

  const epsMap = {};

  for (const [option, shares] of Object.entries(qAfter)) {
    epsMap[option] =
      shares > 0
        ? Number(
            rewardsPoolAfter
              .div(new Decimal(shares))
              .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
          )
        : 0; // or `null` if you want to avoid division by 0
  }

  const marketPricesWithFee = calculateMarketPricesWithFee(qAfter, b);

  const excludedChoice = choice;

  for (const option of Object.keys(qAfter)) {
    console.log(option === excludedChoice);
    if (option === excludedChoice) continue;

    const price = marketPricesWithFee[option];
    const eps = epsMap[option];

    if (price >= eps) {
      return {
        ok: false,
        fee: 0,
        payout: "No liquidy to sell",
        averagePrice: 0,
        message: "No liquidy to sell",
      };
    }
  }

  let adjustedPayout = rawPayout
    .times(new Decimal(1).plus(new Decimal(0.03)))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  if (adjustedPayout.isNegative()) {
    adjustedPayout = new Decimal(0);
  }

  const fee = adjustedPayout
    .times(new Decimal(feeRate))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const totalPayout = adjustedPayout
    .minus(fee)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const averagePrice =
    totalPayout
      .div(new Decimal(amountToSell))
      .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
      .toNumber() || 0;

  return {
    ok: true,
    rawPayout: Number(adjustedPayout),
    fee: Number(fee),
    payout: Number(totalPayout), // Final amount user receives
    newShares: qAfter,
    averagePrice: averagePrice,
  };
}

export function calculatePercentages(shares, b) {
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

// Getting the actual price of shares
export function calculateMarketPrices(shares, b) {
  const expShares = {};
  let sumExp = 0;

  // Step 1: Compute exp(qi / b) for each outcome
  for (const [key, q] of Object.entries(shares)) {
    const expVal = Math.exp(q / b);
    expShares[key] = expVal;
    sumExp += expVal;
  }

  // Step 2: Compute marginal prices
  const marginalPrices = {};
  for (const [key, expVal] of Object.entries(expShares)) {
    marginalPrices[key] = expVal / sumExp;
  }

  // Step 3: Multiply by number of shares (adjusted price)
  const adjustedPrices = {};
  for (const [key, price] of Object.entries(marginalPrices)) {
    adjustedPrices[key] = price * shares[key];
  }

  // Step 4: Normalize so they start at 1 if all shares were equal
  const firstPrice = Object.values(adjustedPrices)[0]; // baseline
  for (const key in adjustedPrices) {
    adjustedPrices[key] = Number(
      new Decimal(adjustedPrices[key] / firstPrice).toDecimalPlaces(
        4,
        Decimal.ROUND_HALF_UP
      )
    );
  }

  return adjustedPrices;
}

export function calculateMarketPricesWithFee(shares, b, feeRate = 0.05) {
  const expShares = {};
  let sumExp = 0;

  // Step 1: Compute exp(qi / b) for each outcome
  for (const [key, q] of Object.entries(shares)) {
    const expVal = Math.exp(q / b);
    expShares[key] = expVal;
    sumExp += expVal;
  }

  // Step 2: Compute marginal prices
  const marginalPrices = {};
  for (const [key, expVal] of Object.entries(expShares)) {
    marginalPrices[key] = expVal / sumExp;
  }

  // Step 3: Multiply by number of options (not shares)
  const adjustedPrices = {};
  const numOptions = Object.keys(shares).length;
  for (const [key, price] of Object.entries(marginalPrices)) {
    const base = price * numOptions;
    const withFee = base * (1 + feeRate);
    adjustedPrices[key] = Number(
      new Decimal(withFee).toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
    );
  }

  return adjustedPrices;
}

// Calculate buy multiplier based on EPS
function calculateBuyMultiplier(eps, price) {
  const epsDecimal = new Decimal(eps);
  const priceDecimal = new Decimal(price);

  if (epsDecimal.lt(1.05)) {
    if (priceDecimal.lt(epsDecimal)) {
      const dynamicFee = new Decimal(1.05)
        .minus(epsDecimal)
        .div(1.05)
        .times(0.5);
      const fee = new Decimal(0.03).plus(dynamicFee);
      return Number(fee.toDecimalPlaces(4, Decimal.ROUND_HALF_UP));
    } else {
      return 0.03;
    }
  } else {
    return 0.03;
  }
}

function calculateSellMultiplier(eps) {
  const epsDecimal = new Decimal(eps);

  if (epsDecimal.lt(1.05)) {
    const diff = epsDecimal.minus(1);
    const fee = Decimal.min(diff, new Decimal(-0.03));
    return Number(fee.toDecimalPlaces(4, Decimal.ROUND_HALF_UP));
  } else {
    const dynamicFee = new Decimal(1.05).minus(epsDecimal).div(1.05).times(0.5);
    const fee = new Decimal(0.03).plus(dynamicFee);
    return Number(fee.toDecimalPlaces(4, Decimal.ROUND_HALF_UP));
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
  const buyShares = Math.floor(amount);

  const cost = (q) => {
    let sumExp = new Decimal(0);
    for (const qj of Object.values(q))
      sumExp = sumExp.plus(Decimal.exp(new Decimal(qj).div(b)));
    return b.times(Decimal.ln(sumExp));
  };

  const originalCost = cost(shares);

  const updatedShares = { ...shares };
  updatedShares[choice] = (updatedShares[choice] || 0) + buyShares;

  const newCost = cost(updatedShares);

  const eps =
    updatedShares[choice] > 0
      ? Number(
          new Decimal(rewards_pool)
            .div(updatedShares[choice])
            .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
        )
      : 0;

  const multiplier = calculateBuyMultiplier(eps);

  const rawTokens = newCost.minus(originalCost);
  const adjustedCost = rawTokens.div(multiplier);

  const fee = adjustedCost
    .times(feeRate)
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  const totalCost = adjustedCost.plus(fee);

  const averagePrice =
    buyShares > 0
      ? totalCost
          .div(buyShares)
          .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
          .toNumber()
      : 0;

  return {
    fee: fee.toNumber(),
    amountEquivalent: totalCost.toNumber(),
    averagePrice: averagePrice,
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
  // First calculate the raw cost without any adjustments
  const cost = (q) => {
    let sumExp = new Decimal(0);
    for (const qj of Object.values(q))
      sumExp = sumExp.plus(Decimal.exp(new Decimal(qj).div(b)));
    return b.times(Decimal.ln(sumExp));
  };

  // Binary search to find the number of shares
  let low = 0;
  let high = 1000000;
  let result = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testShares = { ...shares };
    testShares[choice] = (testShares[choice] || 0) + mid;

    const originalCost = cost(shares);
    const newCost = cost(testShares);
    const rawTokens = newCost.minus(originalCost);

    // Calculate EPS and multiplier for this number of shares
    const eps =
      testShares[choice] > 0
        ? Number(
            new Decimal(rewards_pool)
              .div(testShares[choice])
              .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
          )
        : 0;

    const multiplier = calculateBuyMultiplier(eps);
    const adjustedCost = rawTokens.div(multiplier);
    const fee = adjustedCost
      .times(feeRate)
      .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
    const totalCost = adjustedCost.plus(fee);

    if (totalCost.lte(amount)) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const finalShares = result;
  const averagePrice =
    finalShares > 0
      ? new Decimal(amount)
          .div(finalShares)
          .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
          .toNumber()
      : 0;

  return {
    amountEquivalent: finalShares,
    fee: new Decimal(amount)
      .times(feeRate)
      .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
      .toNumber(),
    averagePrice: averagePrice,
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
  const sellShares = Math.floor(shareAmount);

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
            .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
        )
      : 0;

  const multiplier = calculateSellMultiplier(eps);

  const newCost = cost(updatedShares);

  const rawRefund = originalCost.minus(newCost);
  const fee = rawRefund
    .times(feeRate)
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  const netRefund = rawRefund
    .minus(fee)
    .div(multiplier)
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);

  const averagePrice =
    sellShares > 0 ? netRefund.div(sellShares).toNumber() : 0;

  return {
    fee: fee.toNumber(),
    amountEquivalent: netRefund.toNumber(),
    averagePrice: averagePrice,
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
            .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
        )
      : 0;

  const multiplier = calculateSellMultiplier(eps);

  const refundDecimal = new Decimal(refundAmount);
  const adjustedRefund = refundDecimal.times(multiplier);

  const fee = adjustedRefund
    .times(feeRate)
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  const netRefund = adjustedRefund
    .minus(fee)
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);

  const qk = new Decimal(shares[choice] || 0);
  const expQk = Decimal.exp(qk.div(b));

  let sumExpOthers = new Decimal(0);
  for (const [key, qj] of Object.entries(shares)) {
    if (key !== choice) {
      sumExpOthers = sumExpOthers.plus(Decimal.exp(new Decimal(qj).div(b)));
    }
  }

  const numerator = expQk.plus(sumExpOthers);
  const denominator = Decimal.exp(netRefund.div(b));
  const inner = numerator.div(denominator).minus(sumExpOthers);

  const N = qk.minus(b.times(Decimal.ln(inner)));
  const sellShares = N.floor();

  const averagePrice = sellShares.gt(0)
    ? netRefund.div(sellShares).toNumber()
    : 0;

  return {
    amountEquivalent: sellShares.toNumber(),
    fee: fee.toNumber(),
    averagePrice: averagePrice,
  };
}
