import { setupSwapForm } from "../backend/calculations.js";

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
    if (mode === "buy") {
      toggle.classList.add("buy");
      toggle.classList.remove("sell");
      buyBtn.classList.add("active");
      sellBtn.classList.remove("active");

      // Disable fromAsset button and hide its symbol
      fromAssetBtn.classList.add("disabled");
      fromAssetCaret.classList.add("hidden");
      fromAssetSym.textContent = "Token";

      // Enable toAsset button and show its symbol
      toAssetBtn.classList.remove("disabled");
      toAssetCaret.classList.remove("hidden");
      toAssetSym.textContent = window.defaultChoice;

      executeBtn.style.backgroundColor = "#28a745";
      executeBtn.textContent = "Buy";
    } else {
      toggle.classList.add("sell");
      toggle.classList.remove("buy");
      sellBtn.classList.add("active");
      buyBtn.classList.remove("active");

      // Enable fromAsset button and show its symbol
      fromAssetBtn.classList.remove("disabled");
      fromAssetCaret.classList.remove("hidden");
      fromAssetSym.textContent = window.defaultChoice;

      // Disable toAsset button and hide its symbol
      toAssetBtn.classList.add("disabled");
      toAssetCaret.classList.add("hidden");
      toAssetSym.textContent = "Token";

      executeBtn.style.backgroundColor = "#dc3545";
      executeBtn.textContent = "Sell";
    }
    // Refresh the exchange values and summary
    setupSwapForm(true);
  }

  buyBtn.addEventListener("click", () => setMode("buy"));
  sellBtn.addEventListener("click", () => setMode("sell"));

  // Default to buy
  setMode("buy");
}

export function updateSwapRowState() {
  const fromAmt = document.getElementById("fromAmount");
  const toAmt = document.getElementById("toAmount");

  if (fromAmt.value !== "") {
    fromAmt.closest(".swap-row").classList.add("has-value");
  } else {
    fromAmt.closest(".swap-row").classList.remove("has-value");
  }
  if (toAmt.value !== "") {
    toAmt.closest(".swap-row").classList.add("has-value");
  } else {
    toAmt.closest(".swap-row").classList.remove("has-value");
  }
}

export function formatAmount(input) {
  // Remove any non-numeric characters except decimal point
  let value = input.value.replace(/[^\d.]/g, "");

  // Ensure only one decimal point
  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts.slice(1).join("");
  }

  // Limit to 6 decimal places
  if (parts.length > 1) {
    value = parts[0] + "." + parts[1].slice(0, 6);
  }

  input.value = value;
}
