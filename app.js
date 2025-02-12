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

// Actual S&P500 annual returns (2012–2024)
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
const VESTING_PERIOD = 5; // vesting happens after 5 years
let investmentAmounts = new Array(historicalData.length).fill(0);

const sliderTable = document.getElementById("sliderTable");

// Build input rows with sliders, number fields, and apply buttons.
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
  });

  document.getElementById(`number-${item.year}`).addEventListener("input", (event) => {
    let value = parseFloat(event.target.value.replace(/[^0-9]/g, ""));
    investmentAmounts[index] = value;
    document.getElementById(`slider-${item.year}`).value = value;
    event.target.value = formatCurrency(value);
  });
});

function applyToSubsequentYears(startIndex) {
  let value = investmentAmounts[startIndex];
  for (let i = startIndex; i < historicalData.length; i++) {
    investmentAmounts[i] = value;
    document.getElementById(`slider-${historicalData[i].year}`).value = value;
    document.getElementById(`number-${historicalData[i].year}`).value = formatCurrency(value);
  }
}

// Formats dollars (no decimals for contributions)
function formatCurrency(value) {
  return `$${parseInt(value).toLocaleString()}`;
}

// Formats stock prices with 2 decimals.
function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

// Calculate and plot when the Calculate button is clicked.
document.getElementById("calculateBtn").addEventListener("click", () => {
  const simYears = sp500Returns.map(item => item.year);
  const summaryBody = document.getElementById("summaryBody");
  summaryBody.innerHTML = "";
  
  let cumulativeShares = 0;
  let cumulativeInvested = 0;
  let cumulativeVestedMatch = 0;
  let sp500Value = 0;
  
  const userPurchaseValue = [];
  const userPurchasePlusMatchValue = [];
  const sp500ValueArray = [];
  
  simYears.forEach(simYear => {
    // Get stock price: if available from historicalData, else use the last available price.
    let dataEntry = historicalData.find(item => item.year === simYear);
    let stockPrice = dataEntry ? dataEntry.price : historicalData[historicalData.length - 1].price;
    
    // Get invested amount for this year (only if there's an input for it).
    let invIndex = historicalData.findIndex(item => item.year === simYear);
    let invested = invIndex !== -1 ? investmentAmounts[invIndex] : 0;
    cumulativeInvested += invested;
    
    // Calculate shares bought this year.
    let sharesBought = invested / stockPrice;
    cumulativeShares += sharesBought;
    let currentValuePurchases = cumulativeShares * stockPrice;
    
    // Calculate vested match _this year_ (only contributions that are exactly 5 years old vest now).
    let vestedThisYear = 0;
    historicalData.forEach((entry, idx) => {
      if (simYear === entry.year + VESTING_PERIOD) {
        vestedThisYear += investmentAmounts[idx] * MATCH_RATE;
      }
    });
    cumulativeVestedMatch += vestedThisYear;
    
    let currentValuePurchasedPlusMatch = currentValuePurchases + cumulativeVestedMatch;
    
    // S&P500 simulation: apply this year's return only to the previous balance, then add this year's invested amount.
    let spReturnObj = sp500Returns.find(item => item.year === simYear);
    let spReturn = spReturnObj ? spReturnObj.return : 0;
    sp500Value = sp500Value * (1 + spReturn) + invested;
    
    // Save values for plotting.
    userPurchaseValue.push(currentValuePurchases);
    userPurchasePlusMatchValue.push(currentValuePurchasedPlusMatch);
    sp500ValueArray.push(sp500Value);
    
    // Build the summary table row.
    summaryBody.innerHTML += `<tr>
      <td>${simYear}</td>
      <td>${formatPrice(stockPrice)}</td>
      <td>${formatCurrency(invested)}</td>
      <td>${formatCurrency(cumulativeInvested)}</td>
      <td>${formatCurrency(vestedThisYear)}</td>
      <td>${formatCurrency(currentValuePurchases)}</td>
      <td>${formatCurrency(currentValuePurchasedPlusMatch)}</td>
      <td>${formatCurrency(sp500Value)}</td>
    </tr>`;
  });
  
  // Plot three lines with x-axis showing every year.
  Plotly.newPlot("chart", [
    { x: simYears, y: userPurchaseValue, name: "Current Value Purchases", fill: "tozeroy", line: { color: "blue" } },
    { x: simYears, y: userPurchasePlusMatchValue, name: "Current Value Purchased + Matching", fill: "tozeroy", line: { color: "green" } },
    { x: simYears, y: sp500ValueArray, name: "Current Value S&P500", fill: "tozeroy", line: { color: "orange" } }
  ], {
    xaxis: { dtick: 1 }
  });
});

// Clear All Values button resets inputs, summary table, and chart.
document.getElementById("clearBtn").addEventListener("click", () => {
  investmentAmounts = new Array(historicalData.length).fill(0);
  historicalData.forEach((item) => {
    document.getElementById(`slider-${item.year}`).value = 0;
    document.getElementById(`number-${item.year}`).value = formatCurrency(0);
  });
  document.getElementById("summaryBody").innerHTML = "";
  Plotly.purge("chart");
});
