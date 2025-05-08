import { handleCalculationOfInput } from "../backend/handleInput.js";
import { handleWalletBalance } from "../backend/user.js";

// UI State Management
export function setupBuySellToggle() {
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
        executeBtn.style.backgroundColor = "#28a745";
        executeBtn.textContent = "Buy";
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
        executeBtn.style.backgroundColor = "#dc3545";
        executeBtn.textContent = "Sell";
      }
    }

    try {
      handleCalculationOfInput(mode);
    } catch (err) {
      console.error("💥 handleCalculationOfInput crashed:", err);
    }
  }

  buyBtn.addEventListener("click", () => setMode("buy"));
  sellBtn.addEventListener("click", () => setMode("sell"));

  // Default to buy
  setMode("buy");
}
