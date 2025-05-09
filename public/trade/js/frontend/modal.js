import { initSwiper } from "./swiper.js";
import { startAutoRefresh } from "../main.js";

// Modal functionality
export function initModal() {
  const tokenModal = document.getElementById("tokenModal");
  if (!tokenModal) return;

  const modalOverlay = tokenModal.querySelector("[data-close]");
  const modalCloseBtn = tokenModal.querySelector(".modal-close");

  function closeTokenModal() {
    tokenModal.classList.remove("open");
  }

  if (modalOverlay) {
    modalOverlay.addEventListener("click", closeTokenModal);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeTokenModal);
  }

  const toAssetBtn = document.getElementById("toAssetBtn");
  const fromAssetBtn = document.getElementById("fromAssetBtn");

  if (toAssetBtn) {
    toAssetBtn.addEventListener("click", openTokenModal);
  }

  if (fromAssetBtn) {
    fromAssetBtn.addEventListener("click", openTokenModal);
  }

  // Notification modal close logic
  const notificationModal = document.getElementById("notificationModal");
  if (notificationModal) {
    notificationModal.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", hideNotificationModal);
    });
  }
}

export function openTokenModal() {
  const tokenModal = document.getElementById("tokenModal");
  if (!tokenModal) return;

  tokenModal.classList.add("open");
  initSwiper(); // Initialize swiper when modal opens
}

export function showNotificationModal(tradeEvent) {
  return new Promise((resolve) => {
    const notificationModal = document.getElementById("notificationModal");
    const modalHeader = notificationModal.querySelector(".modal-header");
    const notifMessage = notificationModal.querySelector(
      ".notification-message"
    );
    const notifSwapDetails = notificationModal.querySelector(
      ".notification-swap-details"
    );
    const priceLabel = document.getElementById("priceLabel");
    const priceValue = document.getElementById("priceValue");
    const receivedLabel = document.getElementById("receivedLabel");
    const receivedValue = document.getElementById("receivedValue");
    const priceImpactValue = document.getElementById("priceImpactValue");
    const feeValue = document.getElementById("feeValue");
    const dismissBtn = document.getElementById("dismissBtn");

    console.log(tradeEvent);

    if (tradeEvent.ok) {
      const { priceImpact, averagePricePerShare } =
        calculatePriceImpactAndAverage(tradeEvent);

      // priceLabel.textContent = "Tokens Received";
      // priceValue.innerHTML = `
      //     1 Share
      //     <button class="summary-btn" id="swapPrices" type="button" aria-label="Swap prices">
      //       <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      //         <path fill="var(--regular-blue)" fill-rule="evenodd" clip-rule="evenodd" d="M16 3.93a.75.75 0 0 1 1.177-.617l4.432 3.069a.75.75 0 0 1 0 1.233l-4.432 3.069A.75.75 0 0 1 16 10.067V8H4a1 1 0 0 1 0-2h12V3.93zm-9.177 9.383A.75.75 0 0 1 8 13.93V16h12a1 1 0 1 1 0 2H8v2.067a.75.75 0 0 1-1.177.617l-4.432-3.069a.75.75 0 0 1 0-1.233l4.432-3.069z"/>
      //       </svg>
      //     </button>
      //     ${averagePricePerShare} Tokens
      //   `;

      if (tradeEvent.action === "buy") {
        priceLabel.textContent = "Shares Bought";
        receivedLabel.textContent = "Actual Cost";
        receivedValue.textContent = tradeEvent.totalCost + " Tokens";
      } else {
        priceLabel.textContent = "Shares Sold";
        receivedLabel.textContent = "Tokens Received";
        receivedValue.textContent = tradeEvent.payout + " Tokens";
      }

      priceValue.textContent = tradeEvent.amountShares + " Shares";

      priceImpactValue.textContent = priceImpact;
      feeValue.textContent = tradeEvent.fees + " Tokens";

      notifMessage.innerHTML =
        "<b>TRANSACTION SUCCESSFUL</b><br />Your transaction has been successfully processed. Review the transaction details below.";
      setNotificationIcon("success");
      notifSwapDetails.style.display = "block";
    } else {
      modalHeader.textContent = "Transaction Failed";
      notifMessage.textContent = tradeEvent.message;
      notifSwapDetails.style.display = "none";

      setNotificationIcon("warning");
    }

    notificationModal.style.display = "flex";

    // Add one-time event listener for modal close
    const closeHandler = async () => {
      await hideNotificationModal();
      notificationModal.removeEventListener("click", closeHandler);
      resolve(); // Resolve the promise when closed
    };

    dismissBtn.addEventListener("click", closeHandler);
  });
}

export async function hideNotificationModal() {
  const notificationModal = document.getElementById("notificationModal");
  const executeBtn = document.getElementById("executeBtn");

  if (!notificationModal) return;
  notificationModal.style.display = "none";
  executeBtn.classList.remove("loading");

  await startAutoRefresh();
}

function setNotificationIcon(type) {
  const iconImg = document.getElementById("notificationIconImg");
  if (!iconImg) return;
  if (type === "success") {
    iconImg.src = "css/svgs/success.svg";
  } else if (type === "warning") {
    iconImg.src = "css/svgs/warning.svg";
  }
}

function calculatePriceImpactAndAverage(data) {
  const { marketBefore, marketAfter, choice, amountShares, action } = data;

  if (
    !marketBefore.hasOwnProperty(choice) ||
    !marketAfter.hasOwnProperty(choice)
  ) {
    throw new Error(`Choice '${choice}' is not valid.`);
  }

  const before = marketBefore[choice];
  const after = marketAfter[choice];

  // Calculate price impact
  const priceImpact = ((after - before) / before) * 100;
  const formattedImpact =
    Math.abs(priceImpact) < 0.01 ? `< 0.01%` : `${priceImpact.toFixed(2)}%`;

  let averagePricePerShare = "N/A";

  // Determine average price based on action type
  if (amountShares > 0) {
    if (action === "buy") {
      const { totalCost } = data;
      averagePricePerShare = (totalCost / amountShares).toFixed(4);
    } else if (action === "sell") {
      const { payout } = data;
      averagePricePerShare = (payout / amountShares).toFixed(4);
    }
  }

  return {
    priceImpact: formattedImpact,
    averagePricePerShare: averagePricePerShare,
  };
}
