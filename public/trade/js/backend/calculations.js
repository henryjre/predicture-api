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
