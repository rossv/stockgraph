// Stock data for each year (2012–2023)
const historicalData = [
  { year: 2012, price: 4.46 },
  { year: 2013, price: 6.52 },
  { year: 2014, price: 9.41 },
  { year: 2015, price: 11.2 },
  { year: 2016, price: 12.13 },
  { year: 2017, price: 13.6 },
  { year: 2018, price: 13.28 },
  { year: 2019, price: 14.76 },
  { year: 2020, price: 19.7 },
  { year: 2021, price: 35.3 },
  { year: 2022, price: 43.72 },
  { year: 2023, price: 51.02 }
];

// Actual S&P500 annual returns (2012–2023); 2024 is defined but will be excluded.
const sp500Returns = [
  { year: 2012, return: 0.16 },
  { year: 2013, return: 0.3239 },
  { year: 2014, return: 0.1369 },
  { year: 2015, return: 0.0138 },
  { year: 2016, return: 0.1196 },
  { year: 2017, return: 0.2183 },
  { year: 2018, return: -0.0438 },
  { year: 2019, return: 0.3149 },
  { year: 2020, return: 0.1840 },
  { year: 2021, return: 0.2871 },
  { year: 2022, return: -0.1811 },
  { year: 2023, return: 0.2629 },
  { year: 2024, return: 0.2502 }
];

const MATCH_RATE = 0.25;
const VESTING_PERIOD = 5; // Vesting occurs after 5 years

// Array to store investment amounts per year (index corresponds to historicalData)
let investmentAmounts = new Array(historicalData.length).fill(0);

const sliderTable = document.getElementById("sliderTable");

// Build input rows with slider, text field, and apply button.
historicalData.forEach((item, index) => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${item.year}</td>
    <td>$${item.price.toFixed(2)}</td>
    <td><input type="range" min="0" max="20000" step="100" value="0" id="slider-${item.year}"></td>
    <td><input type="text" id="number-${item.year}" value="$0"></td>
    <td><button class="applyBtn" onclick="applyToSubsequentYears(${index})">Apply →</button></td>
  `;
  sliderTable.appendChild(row);

  // When slider changes, update the amount and recalc.
  document.getElementById(`slider-${item.year}`).addEventListener("input", (event) => {
    let value = event.target.value;
    investmentAmounts[index] = parseFloat(value);
    document.getElementById(`number-${item.year}`).value = formatCurrency(value);
    updateCalculation();
  });

  // When text field changes, update the amount and recalc.
  document.getElementById(`number-${item.year}`).addEventListener("input", (event) => {
    let value = parseFloat(event.target.value.replace(/[^0-9]/g, ""));
    investmentAmounts[index] = value;
    document.getElementById(`slider-${item.year}`).value = value;
    event.target.value = formatCurrency(value);
    updateCalculation();
  });
});

// Update all subsequent years when "Apply" is clicked, then update calculation.
function applyToSubsequentYears(startIndex) {
  let value = investmentAmounts[startIndex];
  for (let i = startIndex; i < historicalData.length; i++) {
    investmentAmounts[i] = value;
    document.getElementById(`slider-${historicalData[i].year}`).value = value;
    document.getElementById(`number-${historicalData[i].year}`).value = formatCurrency(value);
  }
  updateCalculation();
}

// Helper: formats dollars (no decimals for contributions)
function formatCurrency(value) {
  return `$${parseInt(value).toLocaleString()}`;
}

// Helper: formats stock prices with 2 decimals.
function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

// Main calculation function: updates table and chart.
function updateCalculation() {
  // Simulate for years 2012–2023 (exclude 2024)
  const simYears = sp500Returns.filter(item => item.year !== 2024).map(item => item.year);
  const summaryBody = document.getElementById("summaryBody");
  summaryBody.innerHTML = "";
  
  // Initialize cumulative variables.
  let cumulativeEmployeeShares = 0;
  let cumulativeEmployeeInvested = 0;
  let cumulativeMatchingAwarded = 0;  // Cumulative matching dollars awarded (vested)
  let cumulativeMatchingShares = 0;     // Cumulative matching shares awarded
  let sp500Value = 0;
  
  // We'll also track cumulative vesting for the cumulative column.
  let cumulativeVesting = 0;
  
  simYears.forEach(simYear => {
    // Get current stock price (if available; otherwise use last available price).
    let dataEntry = historicalData.find(item => item.year === simYear);
    let currentStockPrice = dataEntry ? dataEntry.price : historicalData[historicalData.length - 1].price;
    
    // Get invested amount for this simulation year.
    let invIndex = historicalData.findIndex(item => item.year === simYear);
    let invested = (invIndex !== -1) ? investmentAmounts[invIndex] : 0;
    
    if (invIndex !== -1) {
      // Employee shares are purchased at that year's price.
      let purchasePrice = historicalData[invIndex].price;
      let employeeShares = invested / purchasePrice;
      cumulativeEmployeeShares += employeeShares;
      cumulativeEmployeeInvested += invested;
    }
    
    // Compute vesting for THIS year (non-cumulative).
    let vestThisYear = 0;
    let matchingSharesThisYear = 0;
    historicalData.forEach((entry, idx) => {
      if (simYear === entry.year + VESTING_PERIOD) {
        let matchingAwarded = investmentAmounts[idx] * MATCH_RATE;
        vestThisYear += matchingAwarded;
        let matchingShares = matchingAwarded / currentStockPrice;
        matchingSharesThisYear += matchingShares;
      }
    });
    cumulativeVesting += vestThisYear;  // cumulative vest dollars awarded
    cumulativeMatchingAwarded = cumulativeVesting;
    cumulativeMatchingShares += matchingSharesThisYear;
    
    // Revalue employee and matching shares at current price.
    let currentValueEmployee = cumulativeEmployeeShares * currentStockPrice;
    let currentValueMatching = cumulativeMatchingShares * currentStockPrice;
    let totalCurrentValue = currentValueEmployee + currentValueMatching;
    
    // S&P500 simulation: apply this year's return to previous balance, then add this year's invested amount.
    let spReturnObj = sp500Returns.find(item => item.year === simYear);
    let spReturn = spReturnObj ? spReturnObj.return : 0;
    sp500Value = sp500Value * (1 + spReturn) + invested;
    
    // Build the summary table row.
    summaryBody.innerHTML += `<tr>
      <td>${simYear}</td>
      <td>${formatPrice(currentStockPrice)}</td>
      <td>${formatCurrency(invested)}</td>
      <td>${formatCurrency(cumulativeEmployeeInvested)}</td>
      <td>${formatCurrency(vestThisYear)}</td>
      <td>${formatCurrency(cumulativeMatchingAwarded)}</td>
      <td>${formatCurrency(currentValueMatching)}</td>
      <td>${formatCurrency(currentValueEmployee)}</td>
      <td>${formatCurrency(totalCurrentValue)}</td>
      <td>${formatCurrency(sp500Value)}</td>
    </tr>`;
  });
  
  // Plotting: recalc temporary values.
  const employeeValueArray = [];
  const totalValueArray = [];
  const sp500ValueArray = [];
  
  let cumEmployeeShares = 0;
  let cumEmployeeInvested = 0;
  let cumMatchingAwarded = 0;
  let cumMatchingShares = 0;
  let sp500Val = 0;
  simYears.forEach(simYear => {
    let dataEntry = historicalData.find(item => item.year === simYear);
    let currentStockPrice = dataEntry ? dataEntry.price : historicalData[historicalData.length - 1].price;
    let invIndex = historicalData.findIndex(item => item.year === simYear);
    let invested = (invIndex !== -1) ? investmentAmounts[invIndex] : 0;
    if (invIndex !== -1) {
      let purchasePrice = historicalData[invIndex].price;
      let employeeShares = invested / purchasePrice;
      cumEmployeeShares += employeeShares;
      cumEmployeeInvested += invested;
    }
    // Vesting for this year.
    let vestThisYearPlot = 0;
    let matchingSharesThisYearPlot = 0;
    historicalData.forEach((entry, idx) => {
      if (simYear === entry.year + VESTING_PERIOD) {
        let matchingAwarded = investmentAmounts[idx] * MATCH_RATE;
        vestThisYearPlot += matchingAwarded;
        let matchingShares = matchingAwarded / currentStockPrice;
        matchingSharesThisYearPlot += matchingShares;
      }
    });
    cumMatchingAwarded += vestThisYearPlot;
    cumMatchingShares += matchingSharesThisYearPlot;
    
    let currentValueEmployee = cumEmployeeShares * currentStockPrice;
    let currentValueMatching = cumMatchingShares * currentStockPrice;
    let totalCurrentValue = currentValueEmployee + currentValueMatching;
    employeeValueArray.push(currentValueEmployee);
    totalValueArray.push(totalCurrentValue);
    
    let spReturnObj = sp500Returns.find(item => item.year === simYear);
    let spReturn = spReturnObj ? spReturnObj.return : 0;
    sp500Val = sp500Val * (1 + spReturn) + invested;
    sp500ValueArray.push(sp500Val);
  });
  
  Plotly.newPlot("chart", [
    { x: simYears, y: employeeValueArray, name: "Current Value Purchases", fill: "tozeroy", line: { color: "blue" } },
    { x: simYears, y: totalValueArray, name: "Total Current Value (Emp+Match)", fill: "tozeroy", line: { color: "green" } },
    { x: simYears, y: sp500ValueArray, name: "Current Value S&P500", fill: "tozeroy", line: { color: "orange" } }
  ], {
    xaxis: { dtick: 1 }
  });
}

// If you still want the Calculate button, attach updateCalculation() to it.
document.getElementById("calculateBtn").addEventListener("click", updateCalculation);

// Clear All Values button.
document.getElementById("clearBtn").addEventListener("click", () => {
  investmentAmounts = new Array(historicalData.length).fill(0);
  historicalData.forEach((item) => {
    document.getElementById(`slider-${item.year}`).value = 0;
    document.getElementById(`number-${item.year}`).value = formatCurrency(0);
  });
  document.getElementById("summaryBody").innerHTML = "";
  Plotly.purge("chart");
});
