import { handleCalculationOfInput } from "../backend/handleInput.js";
import { handleWalletBalance } from "../backend/user.js";
import { showNotificationModal } from "./modal.js";
import { handleTrade } from "../backend/user.js";

const toggle = document.getElementById("buySellToggle");
const buyBtn = document.getElementById("buyBtn");
const sellBtn = document.getElementById("sellBtn");
const executeBtn = document.getElementById("executeBtn");
const swapLabelFrom = document.getElementById("swapLabelFrom");
const swapLabelTo = document.getElementById("swapLabelTo");
const fromAssetSym = document.getElementById("fromSwapSymbol");

// UI State Management
export function setupButtons() {
  buyBtn.addEventListener("click", () => setMode("buy"));
  sellBtn.addEventListener("click", () => setMode("sell"));

  executeBtn.addEventListener("click", async (event) => {
    await handleTrade(event);
  });

  // Default to buy
  setMode("buy");
}

function setMode(mode) {
  const choice = window.defaultChoice || "Select Choice";
  fromAssetSym.textContent = choice;

  window.toggleMode = mode;

  if (mode === "buy") {
    toggle.classList.add("buy");
    toggle.classList.remove("sell");
    buyBtn.classList.add("active");
    sellBtn.classList.remove("active");

    swapLabelFrom.textContent = "You will receive";
    swapLabelTo.textContent = "You will spend";

    handleWalletBalance("buy");

    if (executeBtn) {
      const btnText = executeBtn.querySelector(".btn-text");
      if (btnText) btnText.textContent = "Buy";
    }
  } else {
    toggle.classList.add("sell");
    toggle.classList.remove("buy");
    sellBtn.classList.add("active");
    buyBtn.classList.remove("active");

    swapLabelFrom.textContent = "You will spend";
    swapLabelTo.textContent = "You will receive";

    handleWalletBalance("sell");

    if (executeBtn) {
      const btnText = executeBtn.querySelector(".btn-text");
      if (btnText) btnText.textContent = "Sell";
    }
  }

  try {
    handleCalculationOfInput(mode);
  } catch (err) {
    console.error("💥 handleCalculationOfInput crashed:", err);
  }
}
