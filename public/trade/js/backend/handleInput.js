import { startAutoRefresh } from "../main.js";

function fillSummary(averagePrice, fee, inputAmount, mode) {
  const fromBtn = document.getElementById("fromAssetBtn");
  const toBtn = document.getElementById("toAssetBtn");

  const summary = document.getElementById("swapSummary");
  const summaryAmt = document.getElementById("summaryAmount");
  const summaryFee = document.getElementById("summaryFee");

  if (!fromBtn || !toBtn || !summary || !summaryAmt || !summaryFee) return;

  // const fromSymbol =
  //   fromBtn.querySelector(".swap-symbol")?.textContent || "Choice";
  // const toSymbol = toBtn.querySelector(".swap-symbol")?.textContent || "Choice";

  // const choiceSymbol = mode === "buy" ? toSymbol : fromSymbol;
  // const tokenSymbol = mode === "buy" ? fromSymbol : toSymbol;

  const summaryLeft = `${
    mode === "buy" ? "Avg." : "Avg."
  } 1 <span> Share </span>`;
  const summaryRight = `${averagePrice} <span>Token</span>`;

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

async function calculateTokenToSharesBuyInput() {
  const spendInput = document.getElementById("fromAmount");
  const getInput = document.getElementById("toAmount");

  const amount = spendInput.value;
  const action = "buy";
  const type = "tokens";

  const swapResult = await handleSwapPrices(amount, action, type);

  window.sharesAmount = swapResult.amountEquivalent;
  getInput.value = swapResult.amountEquivalent;
  fillSummary(swapResult.averagePrice, swapResult.fee, amount, "buy");
}

async function calculateSharesToTokenBuyInput() {
  const spendInput = document.getElementById("fromAmount");
  const getInput = document.getElementById("toAmount");

  const sharesToReceive = parseInt(getInput.value);
  const amount = sharesToReceive;
  const action = "buy";
  const type = "shares";

  const swapResult = await handleSwapPrices(amount, action, type);

  window.sharesAmount = swapResult.sharesToReceive;
  spendInput.value = swapResult.amountEquivalent;
  fillSummary(swapResult.averagePrice, swapResult.fee, sharesToReceive, "buy");
}

async function calculateSharesToTokenSellInput() {
  const spendInput = document.getElementById("fromAmount");
  const getInput = document.getElementById("toAmount");

  const sharesToReceive = parseInt(spendInput.value);
  const action = "sell";
  const type = "shares";

  const swapResult = await handleSwapPrices(sharesToReceive, action, type);

  window.sharesAmount = swapResult.sharesToReceive;
  getInput.value = swapResult.amountEquivalent;
  fillSummary(swapResult.averagePrice, swapResult.fee, sharesToReceive, "sell");
}

async function calculateTokenToSharesSellInput() {
  const spendInput = document.getElementById("fromAmount");
  const getInput = document.getElementById("toAmount");

  const tokenAmount = getInput.value;
  const action = "sell";
  const type = "tokens";

  const swapResult = await handleSwapPrices(tokenAmount, action, type);

  window.sharesAmount = swapResult.amountEquivalent;
  spendInput.value = swapResult.amountEquivalent;
  fillSummary(swapResult.averagePrice, swapResult.fee, tokenAmount, "sell");
}

let calculationTimeout;

export function handleInput(event) {
  handleSyntax(event);

  window.lastModifiedInput = event.target.id.replace("Amount", "");

  const toggle = document.getElementById("buySellToggle");
  const isBuy = toggle && toggle.classList.contains("buy");

  const toggleState = isBuy ? "buy" : "sell";

  handleCalculationOfInput(toggleState);
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
  const loadingElement = document.querySelector(".balance-loading");
  const summary = document.getElementById("swapSummary");
  const executeBtn = document.getElementById("executeBtn");

  executeBtn.disabled = true;
  summary.classList.remove("visible");

  // Only check the input that was modified
  const modifiedInput =
    window.lastModifiedInput === "from" ? spendInput : getInput;
  const otherInput =
    window.lastModifiedInput === "from" ? getInput : spendInput;

  if (!modifiedInput.value || modifiedInput.value === "0") {
    otherInput.value = "";
    updatePlaceholder(document.getElementById("fromAmount"));
    updatePlaceholder(document.getElementById("toAmount"));
    loadingElement.style.display = "none";
    clearTimeout(calculationTimeout);
    return;
  }

  // Show loading state
  loadingElement.style.display = "block";

  if (calculationTimeout) {
    clearTimeout(calculationTimeout);
  }

  calculationTimeout = setTimeout(async () => {
    try {
      if (mode === "buy") {
        if (window.lastModifiedInput === "from") {
          await calculateTokenToSharesBuyInput();
        } else if (window.lastModifiedInput === "to") {
          await calculateSharesToTokenBuyInput();
        }
      } else if (mode === "sell") {
        if (window.lastModifiedInput === "from") {
          await calculateSharesToTokenSellInput();
        } else if (window.lastModifiedInput === "to") {
          await calculateTokenToSharesSellInput();
        }
      }
    } catch (error) {
      console.error("Error during calculation:", error);
    } finally {
      mode === "buy"
        ? (executeBtn.style.backgroundColor = "#28a745")
        : (executeBtn.style.backgroundColor = "#dc3545");
      // Hide loading state after calculations are done
      loadingElement.style.display = "none";
      executeBtn.disabled = false;
    }
  }, 1000);
}

export async function handleSwapPrices(amount, action, type) {
  const choice = window.defaultChoice;
  const sharesData = window.sharesData;
  const bConstant = window.bConstant;
  const rewardsPool = window.rewardsPool;

  const res = await fetch(
    `/api/users/updateAmountInput?amount=${amount}&action=${action}&type=${type}&choice=${choice}&shares_data=${JSON.stringify(
      sharesData
    )}&b_constant=${bConstant}&rewards_pool=${rewardsPool}`
  );
  const data = await res.json();

  if (!data.ok) {
    console.log(data);
  }

  return data;
}
