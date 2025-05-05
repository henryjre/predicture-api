// ──────────────────────────────────────────────────────────────────────────────
// 1. Formatter & Chart.js Setup
// ──────────────────────────────────────────────────────────────────────────────
const formatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
Chart.register(ChartDataLabels);

// ──────────────────────────────────────────────────────────────────────────────
// 2. State & Utilities
// ──────────────────────────────────────────────────────────────────────────────
let originalData = [];
let chart = null;
let eventId = null;

const rangeMap = {
  "5M": 5 * 60 * 1000,
  "15M": 15 * 60 * 1000,
  "30M": 30 * 60 * 1000,
  "1H": 60 * 60 * 1000,
  "2H": 2 * 60 * 60 * 1000,
  "4H": 4 * 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
};

async function fetchData(id) {
  const res = await fetch(`/api/events/${id}/prices`);
  return res.json();
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Chart & Legend Rendering
// ──────────────────────────────────────────────────────────────────────────────
function updateLatestPriceMarkers(latest, colors) {
  const container = document.getElementById("customLegend");
  container.innerHTML = "";
  if (!latest?.prices) return;

  Object.entries(latest.prices).forEach(([key, val], i) => {
    const item = document.createElement("div");
    item.classList.add("legend-item");
    const dot = document.createElement("span");
    dot.classList.add("legend-dot");
    dot.style.backgroundColor = colors[i % colors.length];
    const label = document.createElement("span");
    label.textContent = `${key} ${(val * 100).toFixed(1)}%`;
    item.append(dot, label);
    container.append(item);
  });
}

function updateTimestamp() {
  document.getElementById("lastUpdated").textContent =
    "Last updated: " + new Date().toLocaleTimeString();
}

function renderChart(title, data) {
  document.getElementById("chartTitle").textContent = title || "Untitled";
  const colors = ["#007bff", "#dc3545", "#6f42c1", "#28a745", "#ffc107"];
  if (!Array.isArray(data) || data.length === 0) {
    document.getElementById("noDataMessage").style.display = "block";
    data = [{ snapshot_time: new Date(), prices: { A: 0, B: 0, C: 0 } }];
  } else {
    document.getElementById("noDataMessage").style.display = "none";
  }

  updateLatestPriceMarkers(data[data.length - 1], colors);

  const allValues = data.flatMap((d) => Object.values(d.prices));

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal;

  const padding = range * 0.1;
  const suggestedMin = minVal - padding;
  const suggestedMax = maxVal + padding;

  const labels = data.map((d) => new Date(d.snapshot_time));
  const keys = Object.keys(data[0].prices);
  const datasets = keys.map((k, i) => ({
    label: k,
    data: data.map((d) => d.prices[k]),
    borderColor: colors[i % colors.length],
    fill: false,
    tension: 0.2,
    pointRadius: 0,
    pointHoverRadius: 0,
  }));

  Chart.Tooltip.positioners.top = function (elements, eventPosition) {
    return {
      x: eventPosition.x, // follow the crosshair X
      y: 0, // lock to the very top of the canvas
    };
  };

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("priceChart"), {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 30, right: 50 } },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true },
        labels: {
          usePointStyle: true,
        },
        onClick: (e, legendItem, legend) => {
          const ci = legend.chart;
          const i = legendItem.datasetIndex;
          // toggle visibility:
          const currentlyVisible = ci.isDatasetVisible(i);
          ci.setDatasetVisibility(i, !currentlyVisible);
          // fade the line rather than remove:
          ci.options.datasets.line.borderColor[i] = currentlyVisible
            ? ci.data.datasets[i].borderColor.replace(
                /(rgb\(.+?\))/,
                "rgba($1,0.2)"
              )
            : ci.data.datasets[i].borderColor.replace(/,0\.2\)/, ")");
          ci.update();
        },
        tooltip: {
          enabled: false,
          external(context) {
            const { chart, tooltip } = context;
            let root = document.getElementById("chartjs-tooltip");
            if (!root) {
              root = document.createElement("div");
              root.id = "chartjs-tooltip";
              document.body.appendChild(root);
            }
            if (tooltip.opacity === 0) {
              root.innerHTML = "";
              root.style.opacity = 0;
              return;
            }
            root.innerHTML = "";
            root.style.opacity = 1;

            const canvasRect = chart.canvas.getBoundingClientRect();
            const caretX = tooltip.caretX;

            // ——— Time pill at bottom, above X-axis ———
            const timeDiv = document.createElement("div");
            timeDiv.className = "tooltip-time";
            timeDiv.textContent = tooltip.title[0];
            root.appendChild(timeDiv);

            // compute Y just above the axis line:
            // canvasRect.bottom = very bottom of drawing area
            // subtract a bit to clear labels (e.g. 20px)
            const yPos = canvasRect.bottom + window.pageYOffset - 20;

            timeDiv.style.left = `${
              canvasRect.left + window.pageXOffset + caretX
            }px`;
            timeDiv.style.top = `${yPos}px`;

            // ——— Data pills (“riding the lines”) ———
            tooltip.dataPoints.forEach((dp, idx) => {
              const meta = chart.getDatasetMeta(dp.datasetIndex);
              const { x, y } = meta.data[dp.dataIndex].tooltipPosition();

              const pill = document.createElement("div");
              pill.className = "tooltip-item";
              pill.style.backgroundColor = dp.dataset.borderColor;
              pill.style.zIndex = idx + 1;
              pill.textContent = `${dp.dataset.label}: ${dp.formattedValue}`;
              root.appendChild(pill);

              pill.style.left = `${canvasRect.left + window.pageXOffset + x}px`;
              pill.style.top = `${canvasRect.top + window.pageYOffset + y}px`;
            });
          },
        },
        datalabels: {
          display: true,
          align: "top",
          anchor: "end",
          formatter: (val, ctx) => {
            const ds = ctx.chart.data.datasets[ctx.datasetIndex];
            return ctx.dataIndex === ds.data.length - 1 ? val : null;
          },
          font: { weight: "bold", size: 12 },
          color: (ctx) => ctx.dataset.borderColor,
        },
        crosshair: {
          line: {
            color: "#001b70",
            width: 1,
          },
          sync: { enabled: false },
          zoom: { enabled: false },
          snap: { enabled: false },
          onMove: ({ chart, x, y }) => {
            // find all elements at this X
            const elements = chart.getElementsAtEventForMode(
              { x, y },
              "index",
              { intersect: false },
              false
            );
            // tell Chart.js “these are the active elements”
            chart.setActiveElements(elements);
            // and show its tooltip there
            chart.tooltip.setActiveElements(elements, { x, y });
            chart.update("none");
          },
          onLeave: ({ chart }) => {
            // clear when you leave the chart area
            chart.setActiveElements([]);
            chart.tooltip.setActiveElements([], { x: 0, y: 0 });
            chart.update("none");
          },
        },
      },
      scales: {
        x: {
          type: "time",
          time: { tooltipFormat: "MMM d, h:mm a" },
          ticks: { font: { size: 10 } },
        },
        y: {
          suggestedMin,
          suggestedMax,
          title: { display: true, text: "Price" },
          ticks: { font: { size: 10 } },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

const canvas = document.getElementById("priceChart");
let longPressTimer;

// touchstart → wait 500ms → show crosshair & tooltip
canvas.addEventListener(
  "touchstart",
  (e) => {
    longPressTimer = setTimeout(() => {
      // figure out the touch point relative to the canvas
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;

      // find nearest data element
      const points = chart.getElementsAtEventForMode(
        { x, y },
        "nearest",
        { intersect: true },
        false
      );
      if (points.length) {
        // activate that point for tooltip & crosshair
        chart.setActiveElements(points);
        chart.tooltip.setActiveElements(points, { x, y });
        chart.update("none");
      }
    }, 500);
  },
  { passive: true }
);

// touchend → cancel if released early, or clear afterwards
canvas.addEventListener(
  "touchend",
  () => {
    clearTimeout(longPressTimer);
    // reset
    chart.setActiveElements([]);
    chart.tooltip.setActiveElements([], { x: 0, y: 0 });
    chart.update("none");
  },
  { passive: true }
);

// ──────────────────────────────────────────────────────────────────────────────
// 4. Filters
// ──────────────────────────────────────────────────────────────────────────────
function filterData(range) {
  return range === "ALL"
    ? originalData
    : originalData.filter(
        (d) =>
          Date.now() - new Date(d.snapshot_time).getTime() <= rangeMap[range]
      );
}

function setupFilters() {
  const btns = document.querySelectorAll(".filter-btn");
  const saved = localStorage.getItem("lastFilterRange") || "ALL";
  btns.forEach((b) => b.classList.toggle("active", b.dataset.range === saved));
  renderChart(
    document.getElementById("chartTitle").textContent,
    filterData(saved)
  );
  btns.forEach((b) =>
    b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      localStorage.setItem("lastFilterRange", b.dataset.range);
      renderChart(
        document.getElementById("chartTitle").textContent,
        filterData(b.dataset.range)
      );
    })
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. Carousel Init
// ──────────────────────────────────────────────────────────────────────────────
let swiperInstance = null;

function initSwiper() {
  if (swiperInstance) {
    swiperInstance.destroy(true, true);
  }
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

// ──────────────────────────────────────────────────────────────────────────────
// 6. Data Loading & App Initialization
// ──────────────────────────────────────────────────────────────────────────────
async function loadAndRender() {
  document.getElementById("loadingSpinner").style.display = "block";
  try {
    const json = await fetchData(eventId);
    originalData = json.data || [];

    // Volume
    const totalVolume = originalData.reduce(
      (sum, { raw_cost }) => sum + parseFloat(raw_cost),
      0
    );
    document.getElementById("volumeDisplay").textContent = `${formatter.format(
      totalVolume
    )} Vol`;

    // Rewards & End Date
    document.getElementById("rewardsDisplay").textContent = formatter.format(
      json.rewards_pool || 0
    );
    document.getElementById("endDateDisplay").textContent =
      json.closes_at || "—";

    // Chart
    renderChart(
      json.title,
      filterData(localStorage.getItem("lastFilterRange") || "ALL")
    );
    updateTimestamp();

    // Carousel Slides
    const carousel = document.getElementById("cardCarousel");
    carousel.innerHTML = "";
    if (json.shares_data && json.rewards_pool) {
      Object.entries(json.shares_data).forEach(([choice, shares]) => {
        const ratio = json.rewards_pool / shares;
        const slide = document.createElement("div");
        slide.classList.add("swiper-slide", "choice-card");
        slide.innerHTML = `
          <div style="text-align:center">
            <div class="choice-label">${choice}</div>
            <div class="choice-value" style="font-size:1.5rem;font-weight:bold">
              ${formatter.format(ratio)}
            </div>
            <div class="choice-desc">per share holdings</div>
            <button class="choice-btn">Buy Shares</button>
          </div>`;
        carousel.append(slide);
      });
      initSwiper();
    }
  } catch (e) {
    console.error(e);
  } finally {
    document.getElementById("loadingSpinner").style.display = "none";
  }
}

function updateFades() {
  const wrapper = document.getElementById("filterWrapper");
  const scroller = document.getElementById("filterButtons");
  const { scrollLeft, scrollWidth, clientWidth } = scroller;
  wrapper.classList.toggle("hide-fade-left", scrollLeft <= 0);
  wrapper.classList.toggle(
    "hide-fade-right",
    scrollLeft + clientWidth >= scrollWidth - 1
  );
}

function init() {
  const params = new URLSearchParams(location.search);
  eventId = params.get("event_id");
  if (!eventId) return alert("Missing event_id");

  const scroller = document.getElementById("filterButtons");
  scroller.addEventListener("scroll", updateFades);
  window.addEventListener("resize", updateFades);
  updateFades();
  setupFilters();
  loadAndRender();
  setInterval(loadAndRender, 30000);
}

document.addEventListener("DOMContentLoaded", () => {
  init();
});

// Swiper for filter buttons
const filterSwiper = new Swiper('.filter-swiper', {
  slidesPerView: 'auto',
  spaceBetween: 8,
  freeMode: true,
  grabCursor: true,
  mousewheel: true,
  // No navigation or pagination
});
