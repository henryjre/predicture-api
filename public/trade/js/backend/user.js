import { showNotificationModal } from "../frontend/modal.js";
import { handleCalculationOfInput } from "./handleInput.js";

export async function displayUserMarketData() {
  const userMarketData = await fetchUserMarketData(window.user_id);
  const { ok, balance, openPositions } = userMarketData;

  console.log(window.marketPrices);

  if (!ok || Object.keys(openPositions).length === 0) {
    console.error("Error fetching user market data or no open positions");
    window.userBalance = "0.00";
    window.openPositions = Object.fromEntries(
      Object.entries(window.marketPrices).map(([key, value]) => [key, 0])
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
  const user_id = params.get("uid");

  // if (!user_id) {
  //   console.error("No user ID found in URL");
  //   return (window.location.href = "/html/error?id=5");
  // }

  const res = await fetch(`/api/users/market_data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: user_id,
      event_id: event_id,
    }),
  });
  const result = await res.json();
  return result;
}

export function handleWalletBalance(toggle = window.toggleMode) {
  const shareBalance = document.getElementById("shareBalance");
  const tokenBalance = document.getElementById("tokenBalance");
  const choice = window.defaultChoice || "Select Choice";

  tokenBalance.textContent = window.userBalance || "0.00";
  shareBalance.textContent = window.openPositions[choice] || "0";
}

async function postTrade() {
  const params = new URLSearchParams(window.location.search);
  const event_id = params.get("event_id");
  const user_id = params.get("uid");

  const action = window.toggleMode;
  const sharesAmount = window.sharesAmount;
  const choice = window.defaultChoice;
  const b_const = window.bConstant;

  const res = await fetch(`/api/private/trade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: user_id,
      event_id: event_id,
      action: action,
      shares: sharesAmount,
      choice: choice,
      b_const: b_const,
    }),
  });

  const result = await res.json();
  return result;
}

export async function handleTrade(e) {
  const button = e.target;
  if (button.classList.contains("loading")) return;

  button.classList.add("loading");

  try {
    const tradeEvent = await postTrade();

    if (!tradeEvent.ok) {
      throw new Error(tradeEvent.message);
    }

    await showNotificationModal(tradeEvent);
    handleCalculationOfInput(window.toggleMode);
  } catch (error) {
    const tradeEvent = {
      ok: false,
      message: error.message,
    };
    console.error("Error in handleTrade:", error);
    await showNotificationModal(tradeEvent);
  } finally {
    button.classList.remove("loading");
  }
}
