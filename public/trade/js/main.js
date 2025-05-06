import { setupBuySellToggle } from "./frontend/ui.js";
import { initModal } from "./frontend/modal.js";
import { createChoiceSlide } from "./frontend/swiper.js";
import {
  fetchCurrentMarket,
  getEventIdFromQuery,
  updateUrlChoice,
} from "./backend/api.js";
import { handleInput } from "./backend/handleInput.js";

async function loadEventTitle() {
  const eventId = getEventIdFromQuery();
  if (!eventId) {
    document.getElementById("eventTitle").textContent = "No event ID provided.";
    return;
  }

  const { ok, title, shares_data } = await fetchCurrentMarket(eventId);
  if (!ok) {
    console.error("Failed to fetch market");
    document.getElementById("eventTitle").textContent = "Failed to load event.";
    return;
  }

  document.getElementById("eventTitle").textContent = title;
  setupBuySellToggle();

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

      setupBuySellToggle();

      // Close the modal after selection
      const tokenModal = document.getElementById("tokenModal");
      if (tokenModal) {
        tokenModal.classList.remove("open");
      }
    });

    carousel.append(slide);
  });
}

// Initialize everything when DOM is loaded
window.addEventListener("DOMContentLoaded", async () => {
  const fromInput = document.getElementById("fromAmount");
  const toInput = document.getElementById("toAmount");

  fromInput.addEventListener("input", handleInput);
  toInput.addEventListener("input", handleInput);

  // Initialize modal first
  initModal();
  // initInputElements();
  // Then load event data and setup UI
  await loadEventTitle();
});
