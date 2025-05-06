import { calculateMarketPrices } from "./calculations.js";
// API functionality
export async function fetchCurrentMarket(id, isRefresh, amountToBuy) {
  const res = await fetch(`/api/events/${id}/current_market`);
  const result = await res.json();

  window.sharesData = result.ok ? result.shares_data : {};
  window.bConstant = result.ok ? result.b_constant : 0;

  const params = new URLSearchParams(window.location.search);
  const urlChoice = params.get("choice");
  const firstChoice = Object.keys(result.shares_data)[0];
  const defaultChoice =
    urlChoice && result.shares_data[urlChoice] ? urlChoice : firstChoice;

  if (!isRefresh) {
    params.set("choice", defaultChoice);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  }

  const currentPrices = calculateMarketPrices(defaultChoice, amountToBuy);

  window.marketPrices = currentPrices;

  window.currentPrice = currentPrices[defaultChoice] || 0;
  window.defaultChoice = defaultChoice;

  return result;
}

export function getEventIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("event_id");
}

export function updateUrlChoice(choice) {
  const params = new URLSearchParams(window.location.search);
  params.set("choice", choice);
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${params.toString()}`
  );
}

export async function fetchUserMarketData(userId) {
  const res = await fetch(
    `/api/users/market_data?user_id=${userId}&event_id=${eventId}`
  );
  const result = await res.json();
  return result;
}
