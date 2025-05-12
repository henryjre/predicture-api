export function initButtons() {
  initCopyBtn();
  initMultiStateBox();
  setupRowDetailsToggle();
}

function initCopyBtn() {
  const copyBtn = document.querySelector(".copy-btn");

  copyBtn.addEventListener("click", async function () {
    const uidText = document.querySelector(".uid").textContent;
    try {
      await navigator.clipboard.writeText(uidText);
      this.classList.add("copied");
      this.querySelector(".tooltip").textContent = "Copied!";

      setTimeout(() => {
        this.classList.remove("copied");
        this.querySelector(".tooltip").textContent = "Copy to clipboard";
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  });
}

function initMultiStateBox() {
  const rowButtons = document.getElementById("rowButtons");
  const buttons = rowButtons.querySelectorAll(".row-btn");
  const underline = rowButtons.querySelector(".row-btn-underline");

  // 1. Reset all buttons and set default
  buttons.forEach((b) => b.classList.remove("active"));
  const defaultBtn = document.getElementById("positionsBtn");
  if (defaultBtn) defaultBtn.classList.add("active");

  // 2. Reset content
  const positionsContent = document.getElementById("positionsContent");
  const activityContent = document.getElementById("activityContent");
  if (positionsContent) positionsContent.style.display = "block";
  if (activityContent) activityContent.style.display = "none";

  // 3. Move underline to default
  function moveUnderline() {
    const activeBtn = rowButtons.querySelector(".row-btn.active");
    if (activeBtn) {
      const btnRect = activeBtn.getBoundingClientRect();
      const containerRect = rowButtons.getBoundingClientRect();
      underline.style.width = btnRect.width + "px";
      underline.style.left = btnRect.left - containerRect.left + "px";
    }
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", function () {
      buttons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      moveUnderline();

      let content, otherContent;
      if (this.id === "positionsBtn") {
        content = positionsContent;
        otherContent = activityContent;
      } else if (this.id === "activityBtn") {
        content = activityContent;
        otherContent = positionsContent;
      }
      if (content) content.style.display = "block";
      if (otherContent) otherContent.style.display = "none";
    });
  });

  // Initial position
  moveUnderline();
  window.addEventListener("resize", moveUnderline);
}

function setupRowDetailsToggle(rowContentSelector = ".row-content") {
  const rowContent = document.querySelector(rowContentSelector);
  if (!rowContent) return;

  rowContent.querySelectorAll(".row-item").forEach((item, idx) => {
    item.addEventListener("click", function (e) {
      // Close all other details and remove .active/.details-open from other items
      rowContent.querySelectorAll(".row-details").forEach((d, i) => {
        if (i !== idx) d.classList.remove("open");
      });
      rowContent.querySelectorAll(".row-item").forEach((itm, i) => {
        if (i !== idx) {
          itm.classList.remove("active", "details-open");
          itm.classList.add("details-closed");
        }
      });

      // Toggle this one
      const details = item.nextElementSibling;
      if (details && details.classList.contains("row-details")) {
        const isOpen = details.classList.toggle("open");
        if (isOpen) {
          item.classList.add("active", "details-open");
          item.classList.remove("details-closed");
        } else {
          item.classList.remove("active", "details-open");
          setTimeout(() => {
            item.classList.add("details-closed");
          }, 400); // match your transition duration
        }
      }
    });
  });
}
