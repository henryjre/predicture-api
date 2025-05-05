import { formatAmount } from "../frontend/ui.js";

// Calculation functionality
const FEE_RATE = 0.02;

export function calculateToFromAmount(fromAmount, price) {
  if (!price || isNaN(price)) return null;
  const inputVal = parseFloat(fromAmount);
  const shares = inputVal / price;
  return shares;
}

export function calculateFromToAmount(toAmount, price) {
  if (!price || isNaN(price)) return null;
  const shares = parseFloat(toAmount);
  const amount = (shares * price).toFixed(4);
  return amount;
}

export function calculateFee(amount) {
  return (amount * FEE_RATE).toFixed(2);
}

// Track which input was last modified by the user (persistently)
window.lastModifiedInput = window.lastModifiedInput || "from";

export function setupSwapForm(isButtonClick) {
  const fromAmt = document.getElementById("fromAmount");
  const toAmt = document.getElementById("toAmount");
  const summary = document.getElementById("swapSummary");
  const summaryAmt = document.getElementById("summaryAmount");
  const summaryFee = document.getElementById("summaryFee");
  const fromBtn = document.getElementById("fromAssetBtn");
  const toBtn = document.getElementById("toAssetBtn");

  function updateToFromAmount() {
    window.lastModifiedInput = "to";
    const price = window.currentPrice;
    if (!price || isNaN(price)) return;
    const fromSymbol = fromBtn.querySelector(".swap-symbol").textContent;
    const toSymbol = toBtn.querySelector(".swap-symbol").textContent;
    if (!toAmt.value) {
      fromAmt.value = "";
      summary.classList.remove("visible");
      return;
    }
    const shares = parseFloat(toAmt.value);
    const amount = calculateFromToAmount(shares, price);
    fromAmt.value = amount;
    // --- SUMMARY PRICE DISPLAY ---
    const toggle = document.getElementById("buySellToggle");
    const isBuy = toggle && toggle.classList.contains("buy");
    let summaryLeft = "";
    let summaryRight = "";
    if (isBuy) {
      summaryLeft = `1 <span>${
        toBtn.querySelector(".swap-symbol").textContent
      }</span>`;
      summaryRight = `${parseFloat(window.currentPrice).toFixed(4)} <span>${
        fromBtn.querySelector(".swap-symbol").textContent
      }</span>`;
    } else {
      summaryLeft = `1 <span>${
        fromBtn.querySelector(".swap-symbol").textContent
      }</span>`;
      summaryRight = `${(1 / parseFloat(window.currentPrice)).toFixed(
        2
      )} <span>${toBtn.querySelector(".swap-symbol").textContent}</span>`;
    }
    summaryAmt.innerHTML = `
      <button class="summary-btn" id="refreshBtn" type="button" aria-label="Refresh prices">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path fill="var(--regular-blue)" fill-rule="evenodd" clip-rule="evenodd" d="M12 2.181a.75.75 0 0 1 1.177-.616l4.432 3.068a.75.75 0 0 1 0 1.234l-4.432 3.068A.75.75 0 0 1 12 8.32V6a7 7 0 1 0 7 7 1 1 0 1 1 2 0 9 9 0 1 1-9-9V2.181z"/>
        </svg>
      </button>
      ${summaryLeft}
      <button class="summary-btn" id="swapPrices" type="button" aria-label="Swap prices">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path fill="var(--regular-blue)" fill-rule="evenodd" clip-rule="evenodd" d="M16 3.93a.75.75 0 0 1 1.177-.617l4.432 3.069a.75.75 0 0 1 0 1.233l-4.432 3.069A.75.75 0 0 1 16 10.067V8H4a1 1 0 0 1 0-2h12V3.93zm-9.177 9.383A.75.75 0 0 1 8 13.93V16h12a1 1 0 1 1 0 2H8v2.067a.75.75 0 0 1-1.177.617l-4.432-3.069a.75.75 0 0 1 0-1.233l4.432-3.069z"/>
        </svg>
      </button>
      ${summaryRight}
    `;
    const fee = calculateFee(amount);
    summaryFee.textContent = `Fee ${fee} Token`;
    summary.classList.add("visible");

    // Add event listener to the refresh button
    setTimeout(() => {
      const refreshBtn = document.querySelector("#summaryAmount .refresh-btn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
          setupSwapForm(true);
        });
      }
    }, 0);
  }

  function updateFromToAmount() {
    window.lastModifiedInput = "from";
    const price = window.currentPrice;
    if (!price || isNaN(price)) return;
    const toggle = document.getElementById("buySellToggle");
    const isBuy = toggle && toggle.classList.contains("buy");
    if (!fromAmt.value) {
      toAmt.value = "";
      summary.classList.remove("visible");
      return;
    }
    const inputVal = parseFloat(fromAmt.value);
    const shares = calculateToFromAmount(inputVal, price);
    // Set toAmount formatting based on mode
    if (isBuy) {
      toAmt.value = shares.toFixed(0); // shares as whole number
    } else {
      toAmt.value = parseFloat(shares).toFixed(2); // token as 2 decimals
    }
    const amount = fromAmt.value;
    // --- SUMMARY PRICE DISPLAY ---
    let summaryLeft = "";
    let summaryRight = "";
    if (isBuy) {
      summaryLeft = `1 <span>${
        toBtn.querySelector(".swap-symbol").textContent
      }</span>`;
      summaryRight = `${parseFloat(window.currentPrice).toFixed(4)} <span>${
        fromBtn.querySelector(".swap-symbol").textContent
      }</span>`;
    } else {
      summaryLeft = `1 <span>${
        fromBtn.querySelector(".swap-symbol").textContent
      }</span>`;
      summaryRight = `${(1 / parseFloat(window.currentPrice)).toFixed(
        2
      )} <span>${toBtn.querySelector(".swap-symbol").textContent}</span>`;
    }
    summaryAmt.innerHTML = `
      <button class="summary-btn" id="refreshBtn" type="button" aria-label="Refresh prices">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path fill="var(--regular-blue)" fill-rule="evenodd" clip-rule="evenodd" d="M12 2.181a.75.75 0 0 1 1.177-.616l4.432 3.068a.75.75 0 0 1 0 1.234l-4.432 3.068A.75.75 0 0 1 12 8.32V6a7 7 0 1 0 7 7 1 1 0 1 1 2 0 9 9 0 1 1-9-9V2.181z"/>
        </svg>
      </button>
      ${summaryLeft}
      <button class="summary-btn" id="swapPrices" type="button" aria-label="Swap prices">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path fill="var(--regular-blue)" fill-rule="evenodd" clip-rule="evenodd" d="M16 3.93a.75.75 0 0 1 1.177-.617l4.432 3.069a.75.75 0 0 1 0 1.233l-4.432 3.069A.75.75 0 0 1 16 10.067V8H4a1 1 0 0 1 0-2h12V3.93zm-9.177 9.383A.75.75 0 0 1 8 13.93V16h12a1 1 0 1 1 0 2H8v2.067a.75.75 0 0 1-1.177.617l-4.432-3.069a.75.75 0 0 1 0-1.233l4.432-3.069z"/>
        </svg>
      </button>
      ${summaryRight}
    `;
    const fee = calculateFee(amount);
    summaryFee.textContent = `Fee ${fee} Token`;
    summary.classList.add("visible");

    // Add event listener to the refresh button
    setTimeout(() => {
      const refreshBtn = document.querySelector("#summaryAmount .refresh-btn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
          setupSwapForm(true);
        });
      }
    }, 0);
  }

  // Add event listeners to the input fields only once
  if (!fromAmt.hasListener) {
    fromAmt.addEventListener("input", updateFromToAmount);
    fromAmt.hasListener = true;
  }
  if (!toAmt.hasListener) {
    toAmt.addEventListener("input", updateToFromAmount);
    toAmt.hasListener = true;
  }

  // Initialize the form
  if (isButtonClick) {
    if (window.lastModifiedInput === "from") {
      updateFromToAmount();
    } else {
      updateToFromAmount();
    }
  }
}
