import { handleCalculationOfInput } from "../backend/handleInput.js";
import { handleWalletBalance } from "../backend/user.js";
import { showNotificationModal } from "./modal.js";
import { handleTrade } from "../backend/user.js";

const toggle = document.getElementById("buySellToggle");
const buyBtn = document.getElementById("buyBtn");
const sellBtn = document.getElementById("sellBtn");
const fromAssetBtn = document.getElementById("fromAssetBtn");
const toAssetBtn = document.getElementById("toAssetBtn");
const fromAssetCaret = document.getElementById("fromSwapCaret");
const toAssetCaret = document.getElementById("toSwapCaret");
const fromAssetSym = document.getElementById("fromSwapSymbol");
const toAssetSym = document.getElementById("toSwapSymbol");
const executeBtn = document.getElementById("executeBtn");

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

  window.toggleMode = mode;

  if (mode === "buy") {
    toggle.classList.add("buy");
    toggle.classList.remove("sell");
    buyBtn.classList.add("active");
    sellBtn.classList.remove("active");

    fromAssetBtn.classList.add("disabled");
    fromAssetCaret.classList.add("hidden");
    fromAssetSym.textContent = "Token";

    handleWalletBalance("buy");

    toAssetBtn.classList.remove("disabled");
    toAssetCaret.classList.remove("hidden");
    toAssetSym.textContent = choice;

    if (executeBtn) {
      const btnText = executeBtn.querySelector(".btn-text");
      if (btnText) btnText.textContent = "Buy";
    }
  } else {
    toggle.classList.add("sell");
    toggle.classList.remove("buy");
    sellBtn.classList.add("active");
    buyBtn.classList.remove("active");

    fromAssetBtn.classList.remove("disabled");
    fromAssetCaret.classList.remove("hidden");
    fromAssetSym.textContent = choice;

    handleWalletBalance("sell");

    toAssetBtn.classList.add("disabled");
    toAssetCaret.classList.add("hidden");
    toAssetSym.textContent = "Token";

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
