import Decimal from "https://cdn.jsdelivr.net/npm/decimal.js@10.4.3/+esm";

export function calculateMarketPrices(choice, amountToBuy = 0) {
  const originalShares = window.sharesData;
  const b = window.bConstant;

  const shares = { ...originalShares };
  shares[choice] += amountToBuy;

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

///////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////

export function buySharesToToken(amount, feeRate = 0.02) {
  const shares = window.sharesData;
  const b = new Decimal(window.bConstant);
  const rewards_pool = new Decimal(window.rewardsPool);
  const choice = new URLSearchParams(window.location.search).get("choice");

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
    totalCost: Number(totalCost),
    averagePrice: Number(averagePrice),
  };
}

export function buyTokenToShares(amount, feeRate = 0.02) {
  const shares = window.sharesData;
  const b = new Decimal(window.bConstant);
  const rewards_pool = new Decimal(window.rewardsPool);
  const choice = new URLSearchParams(window.location.search).get("choice");

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
    shares: buyShares,
    fee: fee,
    averagePrice:
      buyShares > 0
        ? Number(
            netAmount.div(buyShares).toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
          )
        : 0,
  };
}

export function sellSharesToToken(shareAmount, feeRate = 0.02) {
  const shares = window.sharesData;
  const b = new Decimal(window.bConstant);
  const choice = new URLSearchParams(window.location.search).get("choice");

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
    netRefund: Number(netRefund),
    averagePrice: Number(averagePrice),
  };
}

export function sellTokensToShares(refundAmount, feeRate = 0.02) {
  const shares = window.sharesData;
  const b = new Decimal(window.bConstant);
  const rewards_pool = new Decimal(window.rewardsPool);
  const choice = new URLSearchParams(window.location.search).get("choice");

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
    shares: sellShares.toNumber(),
    netRefund: Number(netRefund),
    fee: fee,
    averagePrice: Number(averagePrice),
  };
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
