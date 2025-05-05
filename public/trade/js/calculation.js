const fromAmt = document.getElementById("fromAmount");
const toAmt = document.getElementById("toAmount");
const summary = document.getElementById("swapSummary");
const summaryAmt = document.getElementById("summaryAmount");
const summaryFee = document.getElementById("summaryFee");
const fromBtn = document.getElementById("fromAssetBtn");
const toBtn = document.getElementById("toAssetBtn");

const feeRate = 0.02;

function setupSwapForm(isButtonClick) {
  function updateToFromAmount() {
    const price = window.currentPrice;
    if (!price || isNaN(price)) return; // guard against missing data

    const fromSymbol = fromBtn.querySelector(".swap-symbol").textContent;
    const toSymbol = toBtn.querySelector(".swap-symbol").textContent;
    if (!toAmt.value) {
      fromAmt.value = "";
      summary.classList.remove("visible");
      return;
    }
    const shares = parseFloat(toAmt.value);
    const usdOut = (shares * price).toFixed(2);
    fromAmt.value = usdOut;

    summaryAmt.textContent = `${usdOut} ${fromSymbol} ↔ ${shares} ${toSymbol}`;

    const fee = (shares * feeRate).toFixed(6);
    summaryFee.textContent = `Fee ${fee} ${fromSymbol}`;

    summary.classList.add("visible");
  }

  fromAmt.addEventListener("input", () => {
    formatAmount(fromAmt);
    updateFromToAmount();
    /* … */
  });
  toAmt.addEventListener("input", () => {
    formatAmount(toAmt);
    updateToFromAmount();
    /* … */
  });

  // Initialize estimate visibility and row state
  updateEstimateVisibility();
  updateSwapRowState();

  if (isButtonClick) {
    updateToFromAmount();
  }
}

function formatAmount(input) {
  // Remove non-numeric characters except decimal point
  input.value = input.value.replace(/[^\d.]/g, "");

  // Ensure only one decimal point
  if ((input.value.match(/\./g) || []).length > 1) {
    input.value = input.value.replace(/\.+$/, "");
  }
}

function updateEstimateVisibility() {
  // Show/hide USD estimates based on input values using visibility
  if (fromAmt.value === "") {
    fromUsd.classList.remove("visible");
  } else {
    fromUsd.classList.add("visible");
  }

  if (toAmt.value === "") {
    toUsd.classList.remove("visible");
  } else {
    toUsd.classList.add("visible");
  }
}

function updateSwapRowState() {
  if (fromAmt.value !== "") {
    fromAmt.closest(".swap-row").classList.add("has-value");
  } else {
    fromAmt.closest(".swap-row").classList.remove("has-value");
  }
  if (toAmount.value !== "") {
    toAmt.closest(".swap-row").classList.add("has-value");
  } else {
    toAmt.closest(".swap-row").classList.remove("has-value");
  }
}

function updateFromToAmount() {
  const price = window.currentPrice;
  if (!price || isNaN(price)) return; // guard against missing data

  const fromSymbol = fromBtn.querySelector(".swap-symbol").textContent;
  const toSymbol = toBtn.querySelector(".swap-symbol").textContent;
  if (!fromAmt.value) {
    toAmt.value = "";
    summary.classList.remove("visible");
    return;
  }
  const inputVal = parseFloat(fromAmt.value);
  const shares = (inputVal / price).toFixed(6);
  toAmt.value = shares;

  // dynamically show “Token” instead of USDT
  summaryAmt.textContent = `${inputVal} ${fromSymbol} ↔ ${shares} ${toSymbol}`;

  const fee = (inputVal * feeRate).toFixed(6);
  summaryFee.textContent = `Fee ${fee} ${fromSymbol}`;

  summary.classList.add("visible");
}
