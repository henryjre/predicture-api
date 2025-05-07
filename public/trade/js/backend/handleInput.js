import {
  sellSharesToToken,
  sellTokensToShares,
  buySharesToToken,
  buyTokenToShares,
  calculateMarketPrices,
} from "./calculations.js";

import { startAutoRefresh } from "../main.js";

function fillSummary(averagePrice, fee, inputAmount, mode) {
  const fromBtn = document.getElementById("fromAssetBtn");
  const toBtn = document.getElementById("toAssetBtn");

  const summary = document.getElementById("swapSummary");
  const summaryAmt = document.getElementById("summaryAmount");
  const summaryFee = document.getElementById("summaryFee");

  if (!fromBtn || !toBtn || !summary || !summaryAmt || !summaryFee) return;

  const fromSymbol =
    fromBtn.querySelector(".swap-symbol")?.textContent || "Token";
  const toSymbol = toBtn.querySelector(".swap-symbol")?.textContent || "Token";

  const summaryLeft = `${
    mode === "buy" ? "Avg." : ""
  } 1 <span>${toSymbol}</span>`;
  const summaryRight = `${averagePrice} <span>${fromSymbol}</span>`;

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

  summaryFee.textContent = `Fee ${fee}`;

  if (inputAmount <= 0) {
    summary.classList.remove("visible");
    updatePlaceholder(document.getElementById("fromAmount"));
    updatePlaceholder(document.getElementById("toAmount"));
  } else {
    summary.classList.add("visible");

    const refreshBtn = document.getElementById("refreshBtn");
    refreshBtn.addEventListener("click", async () => {
      console.log("Refreshing");
      await startAutoRefresh();
    });
  }
}

function calculateTokenToSharesBuyInput() {
  const spendInput = document.getElementById("fromAmount");
  const getInput = document.getElementById("toAmount");

  const tokenAmount = spendInput.value || 0;
  const { fee, shares, averagePrice } = buyTokenToShares(tokenAmount);

  getInput.value = shares;
  fillSummary(averagePrice, fee, tokenAmount, "buy");
}

function calculateSharesToTokenBuyInput() {
  const spendInput = document.getElementById("fromAmount");
  const getInput = document.getElementById("toAmount");

  const sharesToReceive = parseInt(getInput.value);
  const { totalCost, fee, averagePrice } = buySharesToToken(sharesToReceive);

  spendInput.value = totalCost;
  fillSummary(averagePrice, fee, sharesToReceive, "buy");
}

function calculateSharesToTokenSellInput() {
  const spendInput = document.getElementById("fromAmount");
  const getInput = document.getElementById("toAmount");

  const sharesToReceive = parseInt(spendInput.value);
  const { fee, netRefund } = sellSharesToToken(sharesToReceive);

  getInput.value = netRefund;

  const defaultChoice = window.defaultChoice;
  const currentPrices = calculateMarketPrices(defaultChoice, -sharesToReceive);
  const currentPrice = currentPrices[defaultChoice];

  fillSummary(currentPrice, fee, sharesToReceive, "sell");
}

function calculateTokenToSharesSellInput() {
  const spendInput = document.getElementById("fromAmount");
  const getInput = document.getElementById("toAmount");

  const tokenAmount = getInput.value;
  const { fee, shares } = sellTokensToShares(tokenAmount);

  spendInput.value = shares;

  const defaultChoice = window.defaultChoice;
  const currentPrices = calculateMarketPrices(defaultChoice, -shares);
  const currentPrice = currentPrices[defaultChoice];

  fillSummary(currentPrice, fee, tokenAmount, "sell");
}

export function handleInput(event) {
  handleSyntax(event);

  let btn, otherInput;
  if (event.target.id === "fromAmount") {
    btn = document.getElementById("fromAssetBtn");
    otherInput = document.getElementById("toAmount");
    window.lastModifiedInput = "from";
  } else if (event.target.id === "toAmount") {
    btn = document.getElementById("toAssetBtn");
    otherInput = document.getElementById("fromAmount");
    window.lastModifiedInput = "to";
  }

  const summary = document.getElementById("swapSummary");
  const toggle = document.getElementById("buySellToggle");
  const isBuy = toggle && toggle.classList.contains("buy");

  const label = btn.querySelector(".swap-symbol").textContent;

  if (!event.target.value) {
    otherInput.value = "";
    summary.classList.remove("visible");
    updatePlaceholder(document.getElementById("fromAmount"));
    updatePlaceholder(document.getElementById("toAmount"));
    return;
  }

  if (isBuy) {
    if (label === "Token") {
      calculateTokenToSharesBuyInput();
    } else {
      calculateSharesToTokenBuyInput();
    }
  } else {
    if (label === "Token") {
      calculateTokenToSharesSellInput();
    } else {
      calculateSharesToTokenSellInput();
    }
  }
}

function handleSyntax(e) {
  let value = e.target.value;

  // Strip all characters except digits and "."
  value = value.replace(/[^\d.]/g, "");

  // Prevent multiple dots
  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts[1]; // Keep only the first decimal
  }

  // Remove leading zeros unless it's "0" or "0.xxx"
  if (/^0\d/.test(value)) {
    value = value.replace(/^0+/, "");
    if (value === "") value = "0";
  }

  // Get the associated button
  const section = e.target.closest(".swap-section");
  const button = section.querySelector(".swap-asset-btn");
  const isButtonDisabled = button && button.classList.contains("disabled");

  if (isButtonDisabled) {
    // Allow up to 2 decimals
    if (value.includes(".")) {
      const [intPart, decPart] = value.split(".");
      value = intPart + "." + decPart.slice(0, 2);
    }
  } else {
    // Whole numbers only
    if (value.includes(".")) {
      value = value.split(".")[0];
    }
  }

  e.target.value = value;
}

function updatePlaceholder(input) {
  const section = input.closest(".swap-section");
  const button = section.querySelector(".swap-asset-btn");
  const isDisabled = button && button.classList.contains("disabled");
  input.placeholder = isDisabled ? "0.00" : "0";
}

export function handleCalculationOfInput(mode) {
  const spendInput = document.getElementById("fromAmount");
  const getInput = document.getElementById("toAmount");

  if (spendInput.value <= 0 || getInput.value <= 0) {
    spendInput.value = "";
    getInput.value = "";

    updatePlaceholder(document.getElementById("fromAmount"));
    updatePlaceholder(document.getElementById("toAmount"));
    return;
  }

  if (mode === "buy") {
    if (window.lastModifiedInput === "from") {
      calculateTokenToSharesBuyInput();
    } else if (window.lastModifiedInput === "to") {
      calculateSharesToTokenBuyInput();
    }
  } else if (mode === "sell") {
    if (window.lastModifiedInput === "from") {
      calculateSharesToTokenSellInput();
    } else if (window.lastModifiedInput === "to") {
      calculateTokenToSharesSellInput();
    }
  }

  updatePlaceholder(document.getElementById("fromAmount"));
  updatePlaceholder(document.getElementById("toAmount"));
}
