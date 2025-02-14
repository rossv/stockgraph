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

// Actual S&P500 annual returns (2012–2023); 2024 defined but excluded.
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

// Global variable for projection years (default 5)
let projectionYears = 5;

// Array to store investment amounts per year (in order of historicalData)
let investmentAmounts = new Array(historicalData.length).fill(0);

const sliderTable = document.getElementById("sliderTable");

// Build input rows.
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

// Update all subsequent years when "Apply" is clicked.
function applyToSubsequentYears(startIndex) {
  let value = investmentAmounts[startIndex];
  for (let i = startIndex; i < historicalData.length; i++) {
    investmentAmounts[i] = value;
    document.getElementById(`slider-${historicalData[i].year}`).value = value;
    document.getElementById(`number-${historicalData[i].year}`).value = formatCurrency(value);
  }
  updateCalculation();
}

// Projection controls.
document.getElementById("projMinus").addEventListener("click", () => {
  if (projectionYears > 0) {
    projectionYears--;
    document.getElementById("projValue").innerText = projectionYears;
    updateCalculation();
  }
});
document.getElementById("projPlus").addEventListener("click", () => {
  projectionYears++;
  document.getElementById("projValue").innerText = projectionYears;
  updateCalculation();
});

// Helper: format dollars with commas, no decimals.
function formatCurrency(value) {
  return `$${parseInt(value).toLocaleString()}`;
}

// Helper: format stock prices with 2 decimals.
function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

// Helper: compute average annual growth from an array (ignoring zero prior values).
function computeAverageGrowth(arr) {
  let growths = [];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1] > 0) {
      growths.push((arr[i] / arr[i - 1]) - 1);
    }
  }
  if (growths.length === 0) return 0;
  return growths.reduce((a, b) => a + b, 0) / growths.length;
}

// Helper: project future values given an array, growth rate, and number of years.
function projectArray(arr, growth, yearsToProject) {
  let proj = [];
  if (arr.length === 0) return proj;
  let lastValue = arr[arr.length - 1];
  for (let i = 0; i < yearsToProject; i++) {
    lastValue = lastValue * (1 + growth);
    proj.push(lastValue);
  }
  return proj;
}

// Main calculation: updates table and plot.
function updateCalculation() {
  // Actual simulation years: 2012–2023.
  const simYears = sp500Returns.filter(item => item.year !== 2024).map(item => item.year);
  const summaryBody = document.getElementById("summaryBody");
  summaryBody.innerHTML = "";
  
  // Cumulative simulation values.
  let cumulativeEmployeeShares = 0;
  let cumulativeEmployeeInvested = 0;
  let cumulativeMatchingAwarded = 0;
  let cumulativeMatchingShares = 0;
  let sp500Value = 0;
  let cumulativeVesting = 0;
  
  // Arrays for plotting (actual).
  let investedValueArray = [];
  let employeeValueArray = [];
  let totalValueArray = [];
  let sp500ValueArray = [];
  
  simYears.forEach(simYear => {
    let dataEntry = historicalData.find(item => item.year === simYear);
    let currentStockPrice = dataEntry ? dataEntry.price : historicalData[historicalData.length - 1].price;
    let invIndex = historicalData.findIndex(item => item.year === simYear);
    let invested = (invIndex !== -1) ? investmentAmounts[invIndex] : 0;
    
    if (invIndex !== -1) {
      let purchasePrice = historicalData[invIndex].price;
      let employeeShares = invested / purchasePrice;
      cumulativeEmployeeShares += employeeShares;
      cumulativeEmployeeInvested += invested;
    }
    
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
    cumulativeVesting += vestThisYear;
    cumulativeMatchingAwarded = cumulativeVesting;
    cumulativeMatchingShares += matchingSharesThisYear;
    
    let currentValueEmployee = cumulativeEmployeeShares * currentStockPrice;
    let currentValueMatching = cumulativeMatchingShares * currentStockPrice;
    let totalCurrentValue = currentValueEmployee + currentValueMatching;
    
    let spReturnObj = sp500Returns.find(item => item.year === simYear);
    let spReturn = spReturnObj ? spReturnObj.return : 0;
    sp500Value = sp500Value * (1 + spReturn) + invested;
    
    // Add row to table.
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
  
  // Compute average growth rates for each series (using only actual values).
  let totalGrowth = computeAverageGrowth(totalValueArray);
  let employeeGrowth = computeAverageGrowth(employeeValueArray);
  let sp500Growth = computeAverageGrowth(sp500ValueArray);
  let investedGrowth = (investedValueArray[0] > 0) ? computeAverageGrowth(investedValueArray) : 0;
  
  // Create projected years.
  const lastYear = simYears[simYears.length - 1];
  let projectedYears = [];
  for (let i = 1; i <= projectionYears; i++) {
    projectedYears.push(lastYear + i);
  }
  
  // Compute projected arrays.
  let totalProj = projectArray(totalValueArray, totalGrowth, projectionYears);
  let employeeProj = projectArray(employeeValueArray, employeeGrowth, projectionYears);
  let sp500Proj = projectArray(sp500ValueArray, sp500Growth, projectionYears);
  let investedProj = projectArray(investedValueArray, investedGrowth, projectionYears);
  
  // Plot traces.
  Plotly.newPlot("chart", [
    // Actual traces.
    {
      x: simYears,
      y: totalValueArray,
      name: "Total Current Value (Emp+Match)",
      fill: "tozeroy",
      fillcolor: "rgba(0,130,186,1)",
      line: { color: "rgba(0,130,186,1)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    },
    {
      x: simYears,
      y: employeeValueArray,
      name: "Current Value Purchases",
      fill: "tozeroy",
      fillcolor: "rgba(67,176,42,1)",
      line: { color: "rgba(67,176,42,1)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    },
    {
      x: simYears,
      y: sp500ValueArray,
      name: "Current Value S&P500",
      fill: "tozeroy",
      fillcolor: "rgba(198,54,99,1)",
      line: { color: "rgba(198,54,99,1)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    },
    {
      x: simYears,
      y: investedValueArray,
      name: "Employee Total Invested",
      fill: "tozeroy",
      fillcolor: "rgba(99,102,106,1)",
      line: { color: "rgba(99,102,106,1)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    },
    // Projection traces (dotted lines).
    {
      x: projectedYears,
      y: totalProj,
      name: "Projected Total Current Value (Emp+Match)",
      mode: "lines",
      line: { dash: "dot", color: "rgba(0,130,186,1)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    },
    {
      x: projectedYears,
      y: employeeProj,
      name: "Projected Current Value Purchases",
      mode: "lines",
      line: { dash: "dot", color: "rgba(67,176,42,1)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    },
    {
      x: projectedYears,
      y: sp500Proj,
      name: "Projected Current Value S&P500",
      mode: "lines",
      line: { dash: "dot", color: "rgba(198,54,99,1)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    },
    {
      x: projectedYears,
      y: investedProj,
      name: "Projected Employee Total Invested",
      mode: "lines",
      line: { dash: "dot", color: "rgba(99,102,106,1)" },
      hovertemplate: '$%{y:,.0f}<extra></extra>'
    }
  ], {
    xaxis: { dtick: 1, range: [simYears[0], projectedYears[projectedYears.length - 1]] },
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
