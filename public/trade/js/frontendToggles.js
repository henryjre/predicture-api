function setupBuySellToggle() {
  const toggle = document.getElementById("buySellToggle");
  const buyBtn = document.getElementById("buyBtn");
  const sellBtn = document.getElementById("sellBtn");
  const fromAssetBtn = document.getElementById("fromAssetBtn");
  const toAssetBtn = document.getElementById("toAssetBtn");
  const fromAssetCaret = document.getElementById("toSwapCaret");
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
  }

  buyBtn.addEventListener("click", () => setMode("buy"));
  sellBtn.addEventListener("click", () => setMode("sell"));

  // Default to buy
  setMode("buy");
}
