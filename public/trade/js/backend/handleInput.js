import { startAutoRefresh } from "../main.js";

// Constants
const DEBOUNCE_DELAY = 1000;
const MAX_DECIMALS = 2;
const BUY_COLOR = "#28a745";
const SELL_COLOR = "#dc3545";

function fillSummary(averagePrice, fee, epsOfChoice, inputAmount, mode) {
  const elements = {
    fromBtn: document.getElementById("sharesBtn"),
    toBtn: document.getElementById("tokenBtn"),
    summary: document.getElementById("swapSummary"),
    summaryAmt: document.getElementById("summaryAmount"),
    summaryFee: document.getElementById("summaryFee"),
    summaryEps: document.getElementById("summaryEps"),
  };

  // Validate all required elements exist
  if (Object.values(elements).some((el) => !el)) {
    console.error("Required elements for summary not found");
    return;
  }

  const summaryLeft = `${
    mode === "buy" ? "Avg." : "Avg."
  } 1 <span> Share </span>`;
  const summaryRight = `${averagePrice} <span>Token</span>`;

  elements.summaryAmt.innerHTML = `
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

  elements.summaryFee.textContent = `Fee ${fee}`;
  elements.summaryEps.textContent = `EPS ${epsOfChoice} Tokens`;

  if (inputAmount <= 0) {
    elements.summary.classList.remove("visible");
    updatePlaceholder(document.getElementById("fromAmount"));
    updatePlaceholder(document.getElementById("toAmount"));
  } else {
    elements.summary.classList.add("visible");
    setupRefreshButton();
  }
}

function setupRefreshButton() {
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      try {
        await startAutoRefresh();
      } catch (error) {
        console.error("Failed to refresh:", error);
      }
    });
  }
}

function validateInput(value, allowDecimals = false) {
  // Remove any non-numeric characters except decimal point if allowed
  let cleaned = value.replace(/[^\d.]/g, "");

  // Handle decimal points
  if (allowDecimals) {
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts[1];
    }
    if (parts[1]?.length > MAX_DECIMALS) {
      cleaned = parts[0] + "." + parts[1].slice(0, MAX_DECIMALS);
    }
  } else {
    cleaned = cleaned.split(".")[0];
  }

  // Remove leading zeros unless it's "0" or "0.xxx"
  if (/^0\d/.test(cleaned)) {
    cleaned = cleaned.replace(/^0+/, "");
    if (cleaned === "") cleaned = "0";
  }

  return cleaned;
}

function handleSyntax(e) {
  const section = e.target.closest(".swap-section");
  const button = section?.querySelector(".swap-asset-btn");
  const allowDecimals = button && button.classList.contains("disabled");

  e.target.value = validateInput(e.target.value, allowDecimals);
}

async function calculateSwap(action) {
  const sharesInput = document.getElementById("fromAmount");
  const tokenInput = document.getElementById("toAmount");

  const sharesAmount = parseInt(sharesInput.value);
  if (isNaN(sharesAmount) || sharesAmount <= 0) return;

  const swapResult = await handleSwapPrices(sharesAmount, action);

  window.sharesAmount = sharesAmount;
  tokenInput.value = swapResult.amountEquivalent;
  fillSummary(
    swapResult.averagePrice,
    swapResult.fee,
    swapResult.epsOfChoice,
    sharesAmount,
    action
  );
}

let calculationTimeout;

export function handleInput(event) {
  handleSyntax(event);

  const toggle = document.getElementById("buySellToggle");
  const isBuy = toggle && toggle.classList.contains("buy");

  const toggleState = isBuy ? "buy" : "sell";

  handleCalculationOfInput(toggleState);
}

function updatePlaceholder(input) {
  const section = input.closest(".swap-section");
  const button = section.querySelector(".swap-asset-btn");
  const isDisabled = button && button.classList.contains("disabled");
  input.placeholder = isDisabled ? "0.00" : "0";
}

export function handleCalculationOfInput(mode) {
  const elements = {
    sharesInput: document.getElementById("fromAmount"),
    tokenInput: document.getElementById("toAmount"),
    loadingElement: document.querySelector(".balance-loading"),
    summary: document.getElementById("swapSummary"),
    executeBtn: document.getElementById("executeBtn"),
    bottomSpacer: document.querySelector(".bottom-spacer"),
    bottomInfoText: document.querySelector(".bottom-info-text"),
  };

  // Validate required elements
  if (Object.values(elements).some((el) => !el)) {
    console.error("Required elements for calculation not found");
    return;
  }

  elements.executeBtn.disabled = true;
  elements.summary.classList.remove("visible");

  const modifiedInput = elements.sharesInput;
  const otherInput = elements.tokenInput;

  if (!modifiedInput.value || modifiedInput.value === "0") {
    otherInput.value = "";
    updatePlaceholder(elements.sharesInput);
    updatePlaceholder(elements.tokenInput);
    elements.loadingElement.style.display = "none";
    clearTimeout(calculationTimeout);
    elements.bottomSpacer.style.display = "block";
    elements.bottomInfoText.style.display = "none";
    return;
  }

  elements.loadingElement.style.display = "block";

  if (calculationTimeout) {
    clearTimeout(calculationTimeout);
  }

  calculationTimeout = setTimeout(async () => {
    try {
      if (mode === "buy") {
        calculateSwap("buy");
      } else if (mode === "sell") {
        calculateSwap("sell");
      }
    } catch (error) {
      console.error("Error during calculation:", error);
      // Optionally show error to user
    } finally {
      elements.executeBtn.style.backgroundColor =
        mode === "buy" ? BUY_COLOR : SELL_COLOR;
      elements.loadingElement.style.display = "none";
      elements.executeBtn.disabled = false;
    }
  }, DEBOUNCE_DELAY);
}

export async function handleSwapPrices(amount, action) {
  const executeBtn = document.getElementById("executeBtn");
  const bottomSpacer = document.querySelector(".bottom-spacer");
  const bottomInfoText = document.querySelector(".bottom-info-text");
  try {
    const choice = window.defaultChoice;
    const sharesData = window.sharesData;
    const bConstant = window.bConstant;
    const rewardsPool = window.rewardsPool;

    if (!choice || !sharesData || !bConstant || !rewardsPool) {
      throw new Error("Required market data is missing");
    }

    const res = await fetch(
      `/api/users/calculateInputSwap?amount=${amount}&action=${action}&choice=${choice}&shares_data=${JSON.stringify(
        sharesData
      )}&b_constant=${bConstant}&rewards_pool=${rewardsPool}`
    );

    const data = await res.json();

    if (!data.ok) {
      executeBtn.disabled = true;
    } else {
      executeBtn.disabled = false;
    }

    if (data.amountEquivalent === "Insufficient Liquidity") {
      bottomSpacer.style.display = "none";
      bottomInfoText.style.display = "block";
    } else {
      bottomSpacer.style.display = "block";
      bottomInfoText.style.display = "none";
    }

    return data;
  } catch (error) {
    console.error("Error in handleSwapPrices:", error);
    throw error; // Re-throw to be handled by the caller
  }
}
