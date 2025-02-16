// Define historical stock data (assumed April 30 closing prices for the stock).
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

// Define S&P500 closing values on April 30 for each year.
const sp500Close = [
  { year: 2012, close: 1397.91 },
  { year: 2013, close: 1597.57 },
  { year: 2014, close: 1883.95 },
  { year: 2015, close: 2085.51 },
  { year: 2016, close: 2065.30 },
  { year: 2017, close: 2384.20 },
  { year: 2018, close: 2648.05 },
  { year: 2019, close: 2945.83 },
  { year: 2020, close: 2912.43 },
  { year: 2021, close: 4181.17 },
  { year: 2022, close: 4131.93 },
  { year: 2023, close: 4169.48 },
  { year: 2024, close: 5035.69 }
];

const MATCH_RATE = 0.25;
const VESTING_PERIOD = 5; // Vesting occurs on April 30 after 5 years

// Array to hold employee investment inputs (order matches historicalData).
let investmentAmounts = new Array(historicalData.length).fill(0);

const sliderTable = document.getElementById("sliderTable");

// Build the input rows for each year.
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

  document.getElementById(`slider-${item.year}`).addEventListener("input", (event) => {
    let value = event.target.value;
    investmentAmounts[index] = parseFloat(value);
    document.getElementById(`number-${item.year}`).value = formatCurrency(value);
    updateCalculation();
  });
  
  document.getElementById(`number-${item.year}`).addEventListener("input", (event) => {
    let value = parseFloat(event.target.value.replace(/[^0-9]/g, ""));
    investmentAmounts[index] = value;
    document.getElementById(`slider-${item.year}`).value = value;
    event.target.value = formatCurrency(value);
    updateCalculation();
  });
});

function applyToSubsequentYears(startIndex) {
  let value = investmentAmounts[startIndex];
  for (let i = startIndex; i < historicalData.length; i++) {
    investmentAmounts[i] = value;
    document.getElementById(`slider-${historicalData[i].year}`).value = value;
    document.getElementById(`number-${historicalData[i].year}`).value = formatCurrency(value);
  }
  updateCalculation();
}

// Helper: format numbers as dollars (no decimals, with commas).
function formatCurrency(value) {
  return `$${parseInt(value).toLocaleString()}`;
}

// Helper: format stock prices (2 decimals).
function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

// Main update function.
function updateCalculation() {
  // We'll simulate for the years for which we have employee data (2012–2023).
  const simYears = sp500Close.filter(rec => rec.year < 2024).map(rec => rec.year);
  const summaryBody = document.getElementById("summaryBody");
  summaryBody.innerHTML = "";
  
  // Initialize cumulative variables for employee stock.
  let cumulativeEmployeeShares = 0;
  let cumulativeEmployeeInvested = 0;
  let cumulativeMatchingAwarded = 0;
  let cumulativeMatchingShares = 0;
  let sp500Value = 0;  // S&P500 simulation value.
  let cumulativeVesting = 0;
  
  // Arrays for plotting (actual data).
  let investedValueArray = [];
  let employeeValueArray = [];
  let totalValueArray = [];
  let sp500ValueArray = [];
  
  simYears.forEach((simYear, idx) => {
    // Get the employee stock price for this year.
    let dataEntry = historicalData.find(item => item.year === simYear);
    let currentStockPrice = dataEntry ? dataEntry.price : historicalData[historicalData.length - 1].price;
    
    // Get the invested amount for this year.
    let invIndex = historicalData.findIndex(item => item.year === simYear);
    let invested = (invIndex !== -1) ? investmentAmounts[invIndex] : 0;
    
    // Calculate employee shares purchased this year.
    if (invIndex !== -1) {
      let purchasePrice = historicalData[invIndex].price;
      let employeeShares = invested / purchasePrice;
      cumulativeEmployeeShares += employeeShares;
      cumulativeEmployeeInvested += invested;
    }
    
    // Calculate vesting for this year.
    let vestThisYear = 0;
    let matchingSharesThisYear = 0;
    historicalData.forEach((entry, idx2) => {
      if (simYear === entry.year + VESTING_PERIOD) {
        let matchingAwarded = investmentAmounts[idx2] * MATCH_RATE;
        vestThisYear += matchingAwarded;
        let matchingShares = matchingAwarded / currentStockPrice;
        matchingSharesThisYear += matchingShares;
      }
    });
    cumulativeVesting += vestThisYear;
    cumulativeMatchingAwarded = cumulativeVesting;
    cumulativeMatchingShares += matchingSharesThisYear;
    
    // Calculate current values for employee purchases.
    let currentValueEmployee = cumulativeEmployeeShares * currentStockPrice;
    let currentValueMatching = cumulativeMatchingShares * currentStockPrice;
    let totalCurrentValue = currentValueEmployee + currentValueMatching;
    
    // S&P500 simulation using the provided closing values:
    // For the first year that has a nonzero investment, set sp500Value = invested.
    let sp500Record = sp500Close.find(rec => rec.year === simYear);
    let currentClose = sp500Record ? sp500Record.close : null;
    let sp500Index = sp500Close.findIndex(rec => rec.year === simYear);
    if (sp500Index === 0) {
      // For 2012, if there is an investment, set sp500Value equal to that investment.
      sp500Value = invested;
    } else {
      let prevClose = sp500Close[sp500Index - 1].close;
      if (sp500Value === 0 && invested > 0) {
        sp500Value = invested; 
      } else {
        sp500Value = (sp500Value + invested) * (currentClose / prevClose);
      }
    }
    
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
    
    investedValueArray.push(cumulativeEmployeeInvested);
    employeeValueArray.push(currentValueEmployee);
    totalValueArray.push(totalCurrentValue);
    sp500ValueArray.push(sp500Value);
  });
  
  // Plot actual data traces with fill opacity 0.8.
  Plotly.newPlot("chart", [
    {
      x: simYears,
      y: totalValueArray,
      name: "Total Current Value (Emp+Match)",
      fill: "tozeroy",
      fillcolor: "rgba(0,130,186,0.8)",
      line: { color: "rgba(0,130,186,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    },
    {
      x: simYears,
      y: employeeValueArray,
      name: "Current Value Purchases",
      fill: "tozeroy",
      fillcolor: "rgba(67,176,42,0.8)",
      line: { color: "rgba(67,176,42,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    },
    {
      x: simYears,
      y: sp500ValueArray,
      name: "Current Value S&P500",
      fill: "tozeroy",
      fillcolor: "rgba(198,54,99,0.8)",
      line: { color: "rgba(198,54,99,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    },
    {
      x: simYears,
      y: investedValueArray,
      name: "Employee Total Invested",
      fill: "tozeroy",
      fillcolor: "rgba(99,102,106,0.8)",
      line: { color: "rgba(99,102,106,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    }
  ], {
    xaxis: { dtick: 1 },
    legend: {
      orientation: "h",
      x: 0,
      xanchor: "left",
      y: -0.2
    }
  }, { responsive: true });
}

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
