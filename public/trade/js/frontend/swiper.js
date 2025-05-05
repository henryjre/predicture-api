// Swiper/Carousel functionality
let swiperInstance = null;

export function initSwiper() {
  const swiperContainer = document.querySelector(".mySwiper");
  if (!swiperContainer) return;

  // destroy old instance if re-opening
  if (swiperInstance) swiperInstance.destroy(true, true);

  swiperInstance = new Swiper(".mySwiper", {
    slidesPerView: "auto",
    centeredSlides: true,
    centerInsufficientSlides: true,
    spaceBetween: 16,
    initialSlide: 0,
    breakpoints: {
      769: { centeredSlides: false },
    },
  });
}

export function createChoiceSlide(choice, price, onSelect) {
  const slide = document.createElement("div");
  slide.classList.add("swiper-slide", "choice-card");
  slide.innerHTML = `
    <div style="text-align:center">
      <div class="choice-label">${choice}</div>
      <button class="choice-btn">Select</button>
    </div>`;

  // Add click handler
  const btn = slide.querySelector(".choice-btn");
  if (btn) {
    btn.addEventListener("click", () => onSelect(choice));
  }

  return slide;
}
