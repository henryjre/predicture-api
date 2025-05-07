import { setupBuySellToggle } from "./frontend/ui.js";
import { initModal } from "./frontend/modal.js";
import { createChoiceSlide } from "./frontend/swiper.js";
import { fetchCurrentMarket, updateUrlChoice } from "./backend/api.js";
import {
  handleInput,
  handleCalculationOfInput,
} from "./backend/handleInput.js";
import { displayUserMarketData } from "./backend/user.js";

async function loadEventTitle() {
  const { ok, title, shares_data } = await fetchCurrentMarket();
  if (!ok) {
    console.error("Failed to fetch market");
    document.getElementById("eventTitle").textContent = "Failed to load event.";
    return;
  }

  document.getElementById("eventTitle").textContent = title;

  // Initialize carousel
  const carousel = document.getElementById("cardCarousel");
  if (!carousel) return;

  carousel.innerHTML = "";

  Object.entries(shares_data).forEach(([choice, price]) => {
    const slide = createChoiceSlide(choice, price, (selectedChoice) => {
      // Update URL and UI when choice is selected
      updateUrlChoice(selectedChoice);

      // Update the appropriate asset button based on buy/sell mode
      const toggle = document.getElementById("buySellToggle");
      if (!toggle) return;

      const isBuy = toggle.classList.contains("buy");

      const symbolElement = document.getElementById(
        isBuy ? "toSwapSymbol" : "fromSwapSymbol"
      );
      if (!symbolElement) return;

      symbolElement.textContent = selectedChoice;

      window.currentPrice = window.marketPrices[selectedChoice];
      window.defaultChoice = selectedChoice;

      handleCalculationOfInput(isBuy ? "buy" : "sell");

      // Close the modal after selection
      const tokenModal = document.getElementById("tokenModal");
      if (tokenModal) {
        tokenModal.classList.remove("open");
      }
    });

    carousel.append(slide);
  });
}

export async function startAutoRefresh() {
  // Animate refresh icon
  const refreshLoader = document.getElementById("receive-balance-loading");

  refreshLoader.style.display = "block";

  const result = await fetchCurrentMarket(true); // pass true to skip URL update

  if (!result?.ok) return;

  handleCalculationOfInput(window.toggleMode);

  setTimeout(() => {
    refreshLoader.style.display = "none";
  }, 500);
}
// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize modal first
  initModal();

  await loadEventTitle();

  setupBuySellToggle();
  displayUserMarketData();

  // setInterval(async () => {
  //   await startAutoRefresh();
  // }, 10000);

  const fromInput = document.getElementById("fromAmount");
  const toInput = document.getElementById("toAmount");

  fromInput.addEventListener("input", handleInput);
  toInput.addEventListener("input", handleInput);
});
