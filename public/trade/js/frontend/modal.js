import { initSwiper } from "./swiper.js";
import { startAutoRefresh } from "../main.js";
import { handleTrade } from "../backend/user.js";

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
    modalOverlay.removeEventListener("click", closeTokenModal);
    modalOverlay.addEventListener("click", closeTokenModal);
  }

  if (modalCloseBtn) {
    modalCloseBtn.removeEventListener("click", closeTokenModal);
    modalCloseBtn.addEventListener("click", closeTokenModal);
  }

  const tokenBtn = document.getElementById("tokenBtn");
  const sharesBtn = document.getElementById("sharesBtn");

  if (tokenBtn) {
    tokenBtn.removeEventListener("click", openTokenModal);
    tokenBtn.addEventListener("click", openTokenModal);
  }

  if (sharesBtn) {
    sharesBtn.removeEventListener("click", openTokenModal);
    sharesBtn.addEventListener("click", openTokenModal);
  }

  // Notification modal close logic
  const notificationModal = document.getElementById("notificationModal");
  if (notificationModal) {
    notificationModal.querySelectorAll("[data-close]").forEach((el) => {
      el.removeEventListener("click", hideNotificationModal);
      el.addEventListener("click", hideNotificationModal);
    });
  }

  // Confirmation modal close logic
  const confirmationModal = document.getElementById("confirmationModal");
  if (confirmationModal) {
    confirmationModal.querySelectorAll("[data-close]").forEach((el) => {
      el.removeEventListener("click", hideConfirmationModal);
      el.addEventListener("click", hideConfirmationModal);
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

    if (tradeEvent.ok) {
      const { priceImpact, averagePricePerShare } =
        calculatePriceImpactAndAverage(tradeEvent);

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

      modalHeader.textContent = "Transaction Successful";
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

async function hideNotificationModal() {
  const notificationModal = document.getElementById("notificationModal");
  const executeBtn = document.getElementById("executeBtn");

  if (!notificationModal) return;
  notificationModal.style.display = "none";
  executeBtn.classList.remove("loading");
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

export function showConfirmationModal() {
  const confirmationModal = document.getElementById("confirmationModal");
  const confirmationMessage = confirmationModal.querySelector(
    ".confirmation-message"
  );
  const confirmBtn = document.getElementById("confirmBtn");
  const modalHeader = confirmationModal.querySelector(".modal-header");

  const action = window.toggleMode;
  const sharesAmount = window.sharesAmount;
  const choice = window.defaultChoice;

  modalHeader.classList.add(
    action === "buy" ? "buy-confirmation" : "sell-confirmation"
  );
  modalHeader.textContent =
    action === "buy" ? "Buy Confirmation" : "Sell Confirmation";

  if (action === "buy") {
    confirmationMessage.innerHTML = `<br />You are about to buy ${sharesAmount} Shares of the choice,<br/><b>${choice}</b>.`;
  } else {
    confirmationMessage.innerHTML = `<br />You are about to sell ${sharesAmount} Shares of the choice,<br/><b>${choice}</b>.`;
  }

  confirmationModal.style.display = "flex";

  // Remove any existing event listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  // Add new event listener
  newConfirmBtn.addEventListener("click", () => hideConfirmationModal(true));
}

function hideConfirmationModal(isTrade = false) {
  const confirmationModal = document.getElementById("confirmationModal");
  if (!confirmationModal) return;
  confirmationModal.style.display = "none";

  if (isTrade) {
    setTimeout(async () => {
      await handleTrade();
      await startAutoRefresh(); // Move startAutoRefresh here after handleTrade completes
    }, 1000);
  }
}
