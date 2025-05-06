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

  // Raw token cost
  const rawTokens = newCost.minus(originalCost);

  // Round to 2 decimal places
  const tokens = rawTokens.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const fee = tokens.times(feeRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalCost = tokens.plus(fee).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

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
  const choice = new URLSearchParams(window.location.search).get("choice");

  // Parse input amount and apply fee deduction (to get net usable tokens)
  const amountDecimal = new Decimal(amount);
  const netAmount = amountDecimal.div(new Decimal(1).plus(feeRate));

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
    fee: Number(amountDecimal.minus(netAmount).toDecimalPlaces(2)),
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

  const newCost = cost(updatedShares);

  const rawRefund = originalCost.minus(newCost);

  const tokens = rawRefund.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const fee = tokens.times(feeRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const netRefund = tokens.minus(fee).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

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
  const choice = new URLSearchParams(window.location.search).get("choice");

  const refundDecimal = new Decimal(refundAmount);
  const netRefund = refundDecimal.div(new Decimal(1).minus(feeRate));

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
    netRefund: Number(netRefund.toDecimalPlaces(2)),
    fee: Number(netRefund.minus(refundDecimal).toDecimalPlaces(2)),
    averagePrice: Number(averagePrice),
  };
}
