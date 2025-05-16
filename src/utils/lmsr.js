import Decimal from "decimal.js";

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

  const marketPricesWithFee = calculateMarketPrices(qAfter, b, {
    mode: "withFee",
  });

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
        payout: "Insufficient liquidity",
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

export function calculateMarketPrices(
  shares,
  b,
  options = { mode: "withFee", feeRate: 0.05 }
) {
  const expShares = {};
  let sumExp = 0;

  Number(b);

  // Step 1: Compute exp(qi / b) for each outcome
  for (const [key, q] of Object.entries(shares)) {
    const expVal = Math.exp(q / b);
    expShares[key] = expVal;
    sumExp += expVal;
  }

  // Step 2: Compute marginal prices (probabilities)
  const marginalPrices = {};
  for (const [key, expVal] of Object.entries(expShares)) {
    marginalPrices[key] = expVal / sumExp;
  }

  const mode = options.mode || "withFee";

  if (mode === "percentages") {
    const percentages = {};
    for (const [key, prob] of Object.entries(marginalPrices)) {
      percentages[key] = Number(
        new Decimal(prob * 100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      );
    }
    return percentages;
  }

  // For both market price modes
  const adjustedPrices = {};
  const numOptions = Object.keys(shares).length;

  for (const [key, price] of Object.entries(marginalPrices)) {
    let adjusted = price * numOptions;

    if (mode === "withFee") {
      adjusted *= 1 + (options.feeRate || 0.05);
    }

    adjustedPrices[key] = Number(
      new Decimal(adjusted).toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
    );
  }

  return adjustedPrices;
}
