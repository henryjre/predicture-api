// API functionality
export async function fetchCurrentMarket(id) {
  const res = await fetch(`/api/events/${id}/current_market`);
  const result = await res.json();

  window.marketPrices = result.ok ? result.data : {};

  const params = new URLSearchParams(window.location.search);
  const urlChoice = params.get("choice");
  const firstChoice = Object.keys(result.data)[0];
  const defaultChoice =
    urlChoice && result.data[urlChoice] ? urlChoice : firstChoice;

  window.currentPrice = result.data[defaultChoice] || 0;
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
