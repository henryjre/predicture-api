import { handleCalculationOfInput } from "../backend/handleInput.js";
import { handleWalletBalance } from "../backend/user.js";
import { showConfirmationModal } from "./modal.js";

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

  executeBtn.addEventListener("click", (event) => {
    if (executeBtn.classList.contains("loading")) return;
    executeBtn.classList.add("loading");
    showConfirmationModal();
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

    // Rotate the arrow 180 degrees for buy mode
    const swapArrow = document.querySelector(".swap-divider-arrow svg");
    if (swapArrow) {
      swapArrow.style.transform = "rotate(180deg)";
      swapArrow.style.transition = "transform 0.3s ease";
    }

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

    // Reset the arrow rotation for sell mode
    const swapArrow = document.querySelector(".swap-divider-arrow svg");
    if (swapArrow) {
      swapArrow.style.transform = "rotate(0deg)";
      swapArrow.style.transition = "transform 0.3s ease";
    }

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
