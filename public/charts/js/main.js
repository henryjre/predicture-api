const formatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

Chart.register(ChartDataLabels);

let originalData = [];
let chart;
let eventId = null;

const rangeMap = {
  "1m": 1 * 60 * 1000,
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

function updateLatestPriceMarkers(latest, colors) {
  const container = document.getElementById("customLegend");
  container.innerHTML = "";
  if (!latest?.prices) return;

  Object.entries(latest.prices).forEach(([key, val], i) => {
    // 1) Create wrapper
    const item = document.createElement("div");
    item.classList.add("legend-item");

    // 2) Create dot
    const dot = document.createElement("span");
    dot.classList.add("legend-dot");
    dot.style.backgroundColor = colors[i % colors.length];

    // 3) Create label
    const label = document.createElement("span");
    label.textContent = `${key} ${(val * 100).toFixed(1)}%`;

    // 4) Assemble and append
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
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    document.getElementById("noDataMessage").style.display = "block";
    data = [{ snapshot_time: new Date(), prices: { A: 0, B: 0, C: 0 } }];
  } else {
    document.getElementById("noDataMessage").style.display = "none";
  }

  updateLatestPriceMarkers(data[data.length - 1], colors);

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

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("priceChart"), {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { right: 50 } },
      interaction: { mode: "nearest", axis: "xy", intersect: true },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "nearest",
          intersect: true,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}`,
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
      },
      scales: {
        x: {
          type: "time",
          time: { tooltipFormat: "MMM d, h:mm a" },
          ticks: {
            font: {
              size: 10, // <- makes the bottom (time) tick labels smaller
            },
          },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Price" },
          ticks: {
            font: {
              size: 10, // <- makes the left-side (price) tick labels smaller
            },
          },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

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

async function loadAndRender() {
  document.getElementById("loadingSpinner").style.display = "block";
  try {
    const json = await fetchData(eventId);
    originalData = json.data || [];

    if (json.shares_data) {
      const totalRewards = Object.values(json.shares_data).reduce(
        (sum, val) => sum + val,
        0
      );
    }

    const totalVolume = json.data.reduce(
      (sum, { raw_cost }) => sum + parseFloat(raw_cost),
      0
    );
    document.getElementById("volumeDisplay").textContent =
      formatter.format(totalVolume);

    document.getElementById("endDateDisplay").textContent = json.end_date;

    renderChart(
      json.title,
      filterData(localStorage.getItem("lastFilterRange") || "ALL")
    );
    updateTimestamp();
  } catch (e) {
    console.error(e);
  }
  document.getElementById("loadingSpinner").style.display = "none";
}

function init() {
  const params = new URLSearchParams(location.search);
  eventId = params.get("event_id");
  if (!eventId) return alert("Missing event_id");
  setupFilters();
  loadAndRender();

  setInterval(loadAndRender, 30000);
}

const wrapper = document.getElementById("filterWrapper");
const scroller = document.getElementById("filterButtons");

function updateFades() {
  const { scrollLeft, scrollWidth, clientWidth } = scroller;
  // hide left fade if scrolled all the way left
  wrapper.classList.toggle("hide-fade-left", scrollLeft <= 0);
  // hide right fade if scrolled to (or past) the end
  wrapper.classList.toggle(
    "hide-fade-right",
    scrollLeft + clientWidth >= scrollWidth - 1 /* fudge for rounding */
  );
}

// wire it up
scroller.addEventListener("scroll", updateFades);
window.addEventListener("resize", updateFades);
// initial check
updateFades();

init();
