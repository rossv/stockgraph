// Fixed parameters
const matchRate = 0.25;
const vestingPeriod = 5;

// Historical stock prices (April prices)
const historicalData = [
  { year: 1996, price: 1.60 },
  { year: 1997, price: 1.81 },
  { year: 1998, price: 1.86 },
  { year: 1999, price: 2.27 },
  { year: 2000, price: 3.00 },
  { year: 2001, price: 3.46 },
  { year: 2002, price: 4.08 },
  { year: 2003, price: 5.19 },
  { year: 2004, price: 6.38 },
  { year: 2005, price: 7.40 },
  { year: 2006, price: 6.69 },
  { year: 2007, price: 7.53 },
  { year: 2008, price: 5.32 },
  { year: 2009, price: 5.82 },
  { year: 2010, price: 4.63 },
  { year: 2011, price: 5.01 },
  { year: 2012, price: 4.46 },
  { year: 2013, price: 6.52 },
  { year: 2014, price: 9.41 },
  { year: 2015, price: 11.20 },
  { year: 2016, price: 12.13 },
  { year: 2017, price: 13.60 },
  { year: 2018, price: 13.28 },
  { year: 2019, price: 14.76 },
  { year: 2020, price: 19.70 },
  { year: 2021, price: 35.30 },
  { year: 2022, price: 43.72 },
  { year: 2023, price: 51.02 },
  { year: 2024, price: 62.35 }
];

// S&P 500 data (still from 2012–2024, add more if you want to go earlier)
const sp500Close = [
  { year: 1996, close: 653.7 }, { year: 1997, close: 759.6},
  { year: 1998, close: 737.65 }, { year: 1999, close: 1294 },
  { year: 2000, close: 1499 }, { year: 2001, close: 1160 },
  { year: 2002, close: 1147 }, { year: 2003, close: 858.5 },
  { year: 2004, close: 1132 }, { year: 2005, close: 1173 },
  { year: 2006, close: 1295 }, { year: 2007, close: 1421 },
  { year: 2008, close: 1370 }, { year: 2009, close: 811.1 },
  { year: 2010, close: 1178 }, { year: 2011, close: 1332 },
  { year: 2012, close: 1408 }, { year: 2013, close: 1562 },
  { year: 2014, close: 1886 }, { year: 2015, close: 2060 },
  { year: 2016, close: 2073 }, { year: 2017, close: 2363 },
  { year: 2018, close: 2641 }, { year: 2019, close: 2867 },
  { year: 2020, close: 2471 }, { year: 2021, close: 4020 },
  { year: 2022, close: 4546 }, { year: 2023, close: 3577 },
  { year: 2024, close: 5244 }, { year: 2023, close: 5633 }
];

let investmentAmounts = new Array(historicalData.length).fill(0);
let finalTotalValue = 0;

function formatCurrency(value) {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

const sliderTable = document.getElementById("sliderTable");
historicalData.forEach((item, index) => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${item.year}</td>
    <td>${formatPrice(item.price)}</td>
    <td>
      <div class="slidecontainer">
        <input type="range" min="0" max="20000" step="any" value="0" id="slider-${item.year}" class="slider">
      </div>
    </td>
    <td><input type="text" id="number-${item.year}" value="${formatCurrency(0)}"></td>
    <td><button class="btn btn-sm btn-outline-primary" onclick="applyToSubsequentYears(${index})">Apply →</button></td>
  `;
  sliderTable.appendChild(row);

  const slider = document.getElementById(`slider-${item.year}`);
  const numberField = document.getElementById(`number-${item.year}`);

  slider.addEventListener("input", (e) => {
    const rawVal = parseFloat(e.target.value);
    const price = item.price;
    const snappedVal = Math.floor(rawVal / price) * price;
    investmentAmounts[index] = snappedVal;
    slider.value = snappedVal;
    numberField.value = formatCurrency(snappedVal);
    updateCalculation();
  });

  numberField.addEventListener("input", (e) => {
    let rawInput = e.target.value.replace(/[^0-9.]/g, "");
    let value = parseFloat(rawInput);
    if (isNaN(value)) value = 0;
    investmentAmounts[index] = value;
    updateCalculation();
  });
});

// ✅ Generate dynamic preset buttons
function generatePresets() {
  const presetPanel = document.getElementById("presetPanel");
  presetPanel.innerHTML = `<h6>Preset Investments ($100,000 Investment)</h6>`;

  const n = historicalData.length;
  const total = 100000;

  // Step Up: divide total proportional to 1 + 2 + ... + n
  const sumOfSeries = (n * (n + 1)) / 2;
  const stepUp = Array.from({ length: n }, (_, i) => ((i + 1) / sumOfSeries) * total);

  // Slow and Steady: equal investment every year
  const steady = Array(n).fill(total / n);

  // Front Load: first 4 years get 25k
  const front = Array(n).fill(0);
  for (let i = 0; i < Math.min(4, n); i++) {
    front[i] = 25000;
  }

  // Late Start: last 4 years get 25k
  const late = Array(n).fill(0);
  for (let i = n - 4; i < n; i++) {
    if (i >= 0) late[i] = 25000;
  }

  const presets = [
    { name: "Step Up", values: stepUp },
    { name: "Slow and Steady", values: steady },
    { name: "Front Load", values: front },
    { name: "Late Start", values: late }
  ];

  presets.forEach(preset => {
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary preset-btn me-2 mb-2";
    btn.textContent = preset.name;
    btn.setAttribute("data-values", preset.values.map(v => v.toFixed(2)).join(","));
    presetPanel.appendChild(btn);
  });

  document.querySelectorAll('.preset-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const values = e.target.getAttribute('data-values').split(',').map(val => parseFloat(val.trim()));
      if (values.length !== historicalData.length) {
        alert("Preset does not match number of years.");
        return;
      }
      values.forEach((value, index) => {
        investmentAmounts[index] = value;
        const year = historicalData[index].year;
        document.getElementById(`slider-${year}`).value = value;
        document.getElementById(`number-${year}`).value = formatCurrency(value);
      });
      updateCalculation();
    });
  });
}


// 👇 Call it after building sliders
generatePresets();

function applyToSubsequentYears(startIndex) {
  const value = investmentAmounts[startIndex];
  historicalData.forEach((item, i) => {
    if (i >= startIndex) {
      investmentAmounts[i] = value;
      document.getElementById(`slider-${item.year}`).value = value;
      document.getElementById(`number-${item.year}`).value = formatCurrency(value);
    }
  });
  updateCalculation();
}

const snapBtn = document.getElementById("snapBtn");
snapBtn.addEventListener("click", () => {
  historicalData.forEach((item, index) => {
    const price = item.price;
    const numberField = document.getElementById(`number-${item.year}`);
    let rawInput = numberField.value.replace(/[^0-9.]/g, "");
    let value = parseFloat(rawInput);
    if (isNaN(value)) value = 0;
    const snappedVal = Math.floor(value / price) * price;
    investmentAmounts[index] = snappedVal;
    document.getElementById(`slider-${item.year}`).value = snappedVal;
    numberField.value = formatCurrency(snappedVal);
  });
  updateCalculation();
});

function updateCalculation() {
  const simYears = historicalData.map(item => item.year);
  const summaryBody = document.getElementById("summaryBody");
  const detailedBody = document.getElementById("detailedBody");
  summaryBody.innerHTML = "";
  detailedBody.innerHTML = "";

  let cumulativeEmployeeShares = 0;
  let cumulativeEmployeeInvested = 0;
  let cumulativeMatchingShares = 0;
  let sp500Value = 0;

  let investedValueArray = [];
  let employeeValueArray = [];
  let totalValueArray = [];
  let sp500ValueArray = [];

  simYears.forEach((simYear, idx) => {
    const dataEntry = historicalData.find(item => item.year === simYear);
    const currentStockPrice = dataEntry.price;
    const invIndex = historicalData.findIndex(item => item.year === simYear);
    const invested = invIndex !== -1 ? investmentAmounts[invIndex] : 0;

    const employeeSharesThisYear = invested / currentStockPrice;
    cumulativeEmployeeShares += employeeSharesThisYear;
    cumulativeEmployeeInvested += invested;

    let matchAwardedThisYear_shares = 0;
    historicalData.forEach((entry, idx2) => {
      if (simYear === entry.year + vestingPeriod) {
        const purchaseAmount = investmentAmounts[idx2];
        if (purchaseAmount > 0) {
          const matchShares = Math.round((purchaseAmount / entry.price) * matchRate);
          matchAwardedThisYear_shares += matchShares;
        }
      }
    });
    const matchAwardedThisYear_dollars = matchAwardedThisYear_shares * currentStockPrice;
    cumulativeMatchingShares += matchAwardedThisYear_shares;

    const currentValueEmployee = cumulativeEmployeeShares * currentStockPrice;
    const currentValueMatching = cumulativeMatchingShares * currentStockPrice;
    const totalCurrentValue = currentValueEmployee + currentValueMatching;

    const sp500Record = sp500Close.find(rec => rec.year === simYear);
    const sp500Price = sp500Record?.close ?? "";
    const currentClose = sp500Record?.close ?? null;
    const sp500Index = sp500Close.findIndex(rec => rec.year === simYear);
    if (sp500Index === 0) {
      sp500Value = invested;
    } else {
      const prevClose = sp500Close[sp500Index - 1]?.close;
      sp500Value = sp500Value === 0 && invested > 0
        ? invested
        : (sp500Value + invested) * (currentClose / prevClose);
    }

    summaryBody.innerHTML += `
      <tr>
        <td>${simYear}</td>
        <td>${formatPrice(currentStockPrice)}</td>
        <td>$${Math.round(cumulativeEmployeeInvested).toLocaleString()}</td>
        <td>$${Math.round(totalCurrentValue).toLocaleString()}</td>
        <td>$${Math.round(sp500Value).toLocaleString()}</td>
      </tr>
    `;

    const roi = cumulativeEmployeeInvested > 0
      ? ((totalCurrentValue - cumulativeEmployeeInvested) / cumulativeEmployeeInvested * 100).toFixed(2)
      : "0.00";

    detailedBody.innerHTML += `
      <tr>
        <td>${simYear}</td>
        <td>${formatPrice(currentStockPrice)}</td>
        <td>${formatCurrency(invested)}</td>
        <td>${formatCurrency(cumulativeEmployeeInvested)}</td>
        <td>${employeeSharesThisYear.toFixed(2)}</td>
        <td>${cumulativeEmployeeShares.toFixed(2)}</td>
        <td>${Math.round(matchAwardedThisYear_shares).toLocaleString()}</td>
        <td>${Math.round(cumulativeMatchingShares).toLocaleString()}</td>
        <td>${formatCurrency(matchAwardedThisYear_dollars)}</td>
        <td>${formatCurrency(currentValueEmployee)}</td>
        <td>${formatCurrency(currentValueMatching)}</td>
        <td>${formatCurrency(totalCurrentValue)}</td>
        <td>${formatCurrency(sp500Value)}</td>
        <td>${sp500Price ? `$${Number(sp500Price).toLocaleString()}` : '-'}</td>
        <td>${roi}%</td>
      </tr>`;

    investedValueArray.push(cumulativeEmployeeInvested);
    employeeValueArray.push(currentValueEmployee);
    totalValueArray.push(totalCurrentValue);
    sp500ValueArray.push(sp500Value);
    finalTotalValue = totalCurrentValue;
  });

  Plotly.newPlot("chart", [
    {
      x: simYears, y: investedValueArray, name: "Cumulative Invested",
      fill: "tozeroy", fillcolor: "rgba(99,102,106,0.5)",
      line: { color: "rgba(99,102,106,0.8)" }
    },
    {
      x: simYears, y: employeeValueArray, name: "Employee Shares Value",
      fill: "tonexty", fillcolor: "rgba(67,176,42,0.5)",
      line: { color: "rgba(67,176,42,0.8)" }
    },
    {
      x: simYears, y: totalValueArray, name: "Total Value (Emp+Match)",
      fill: "tonexty", fillcolor: "rgba(0,130,186,0.5)",
      line: { color: "rgba(0,130,186,0.8)" }
    },
    {
      x: simYears, y: sp500ValueArray, name: "S&P500",
      mode: 'lines', line: { color: "rgba(198,54,99,1)", width: 2 }
    }
  ], {
    xaxis: { dtick: 1, title: 'Year' },
    yaxis: { title: 'Value ($)' },
    legend: { orientation: "h", x: 0, xanchor: "left", y: -0.2 },
    margin: { t: 40 }
  }, { responsive: true });

  updateScenarioComparison();
}

function updateScenarioComparison() {
  const projectionYears = parseInt(document.getElementById("projectionYears").value);
  const conservativeRate = parseFloat(document.getElementById("conservativeRate").value) / 100;
  const baseRate = parseFloat(document.getElementById("baseRate").value) / 100;
  const aggressiveRate = parseFloat(document.getElementById("aggressiveRate").value) / 100;

  const startYear = historicalData[historicalData.length - 1].year;
  const startingValue = finalTotalValue;

  let years = [], conservative = [], base = [], aggressive = [];
  let currentCon = startingValue, currentBase = startingValue, currentAgg = startingValue;

  for (let i = 0; i <= projectionYears; i++) {
    years.push(startYear + i);
    conservative.push(currentCon);
    base.push(currentBase);
    aggressive.push(currentAgg);
    currentCon *= (1 + conservativeRate);
    currentBase *= (1 + baseRate);
    currentAgg *= (1 + aggressiveRate);
  }

  Plotly.newPlot("scenarioChart", [
    {
      x: years, y: aggressive, name: "Aggressive",
      fill: "tozeroy", fillcolor: "rgba(198,54,99,0.5)",
      line: { color: "rgba(198,54,99,0.8)" }
    },
    {
      x: years, y: base, name: "Base",
      fill: "tozeroy", fillcolor: "rgba(0,130,186,0.5)",
      line: { color: "rgba(0,130,186,0.8)" }
    },
    {
      x: years, y: conservative, name: "Conservative",
      fill: "tozeroy", fillcolor: "rgba(67,176,42,0.5)",
      line: { color: "rgba(67,176,42,0.8)" }
    }
  ], {
    xaxis: { title: 'Year' },
    yaxis: { title: 'Projected Value ($)' },
    legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.3 },
    margin: { t: 40 }
  }, { responsive: true });

  const projectionBody = document.getElementById("projectionBody");
  projectionBody.innerHTML = "";
  for (let i = 0; i < years.length; i++) {
    projectionBody.innerHTML += `
      <tr>
        <td>${years[i]}</td>
        <td>${formatCurrency(conservative[i])}</td>
        <td>${formatCurrency(base[i])}</td>
        <td>${formatCurrency(aggressive[i])}</td>
      </tr>`;
  }
}

document.getElementById("projectionYears").addEventListener("input", updateScenarioComparison);
document.getElementById("conservativeRate").addEventListener("input", updateScenarioComparison);
document.getElementById("baseRate").addEventListener("input", updateScenarioComparison);
document.getElementById("aggressiveRate").addEventListener("input", updateScenarioComparison);

document.getElementById("clearBtn").addEventListener("click", () => {
  investmentAmounts = new Array(historicalData.length).fill(0);
  historicalData.forEach(item => {
    document.getElementById(`slider-${item.year}`).value = 0;
    document.getElementById(`number-${item.year}`).value = formatCurrency(0);
  });
  document.getElementById("summaryBody").innerHTML = "";
  document.getElementById("detailedBody").innerHTML = "";
  Plotly.purge("chart");
  updateCalculation();
});

document.getElementById("goToDetailsBtn").addEventListener("click", () => {
  const triggerEl = document.getElementById("detailed-tab");
  const tab = new bootstrap.Tab(triggerEl);
  tab.show();
});
document.getElementById("goToProjectionBtn").addEventListener("click", () => {
  const triggerEl = document.getElementById("projected-tab");
  const tab = new bootstrap.Tab(triggerEl);
  tab.show();
});

// Initial run
updateCalculation();

