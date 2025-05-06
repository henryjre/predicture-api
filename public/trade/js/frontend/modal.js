import { initSwiper } from "./swiper.js";

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
}

export function openTokenModal() {
  const tokenModal = document.getElementById("tokenModal");
  if (!tokenModal) return;

  tokenModal.classList.add("open");
  initSwiper(); // Initialize swiper when modal opens
}
