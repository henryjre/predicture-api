export async function displayUserMarketData() {
  const userMarketData = await fetchUserMarketData(window.user_id);
  const { ok, balance, openPositions } = userMarketData;

  if (!ok || Object.keys(openPositions).length === 0) {
    console.error("Error fetching user market data or no open positions");
    window.userBalance = "0.00";
    window.openPositions = Object.fromEntries(
      Object.entries(window.marketPrices).map(([key]) => [key, 0])
    );
  } else {
    window.userBalance = balance;
    window.openPositions = openPositions;
  }

  handleWalletBalance();
}

async function fetchUserMarketData() {
  const params = new URLSearchParams(window.location.search);
  const event_id = params.get("event_id");
  const user_token = params.get("user_token");
  const user_id = params.get("uid");

  if (!user_token) {
    console.error("No user token found in URL");
    return { ok: false, error: "No user token provided" };
  }

  const res = await fetch(`/api/users/market_data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user_token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      event_id: event_id,
    }),
  });
  const result = await res.json();
  return result;
}

export function handleWalletBalance(toggle = window.toggleMode) {
  const balanceElement = document.getElementById("userBalance");
  const choice = window.defaultChoice || "Select Choice";

  if (toggle === "buy") {
    balanceElement.textContent = window.userBalance;
  } else {
    balanceElement.textContent = window.openPositions[choice] || "0";
  }
}
