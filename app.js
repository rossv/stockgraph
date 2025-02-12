/****************************************************
 * Historical Stock Prices (2012-2023) + S&P 500 Growth Rate
 ****************************************************/
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
const sp500GrowthRate = 0.07; // 7% annual growth
const MATCH_RATE = 0.25;

// Initialize Investment Storage
let investmentAmounts = new Array(historicalData.length).fill(0);

/****************************************************
 * Build UI for Investment Input
 ****************************************************/
const sliderTable = document.getElementById("sliderTable");

historicalData.forEach((item, index) => {
  const row = document.createElement("tr");

  // Year
  const yearCell = document.createElement("td");
  yearCell.textContent = item.year;
  row.appendChild(yearCell);

  // Stock Price
  const priceCell = document.createElement("td");
  priceCell.textContent = `$${item.price.toFixed(2)}`;
  row.appendChild(priceCell);

  // Investment Slider
  const sliderCell = document.createElement("td");
  const sliderInput = document.createElement("input");
  sliderInput.type = "range";
  sliderInput.min = "0";
  sliderInput.max = "20000";
  sliderInput.step = "100";
  sliderInput.value = "0";
  sliderInput.id = `slider-${item.year}`;
  sliderCell.appendChild(sliderInput);
  row.appendChild(sliderCell);

  // Investment Input Box (Formatted)
  const numberCell = document.createElement("td");
  const numberInput = document.createElement("input");
  numberInput.type = "text";
  numberInput.id = `number-${item.year}`;
  numberInput.value = "$0";
  numberCell.appendChild(numberInput);
  row.appendChild(numberCell);

  // Apply Button
  const applyCell = document.createElement("td");
  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply →";
  applyBtn.className = "applyBtn";
  applyBtn.addEventListener("click", () => {
    applyToSubsequentYears(index, investmentAmounts[index]);
  });
  applyCell.appendChild(applyBtn);
  row.appendChild(applyCell);

  // Sync Slider and Number Input
  sliderInput.addEventListener("input", () => {
    numberInput.value = formatCurrency(sliderInput.value);
    investmentAmounts[index] = parseFloat(sliderInput.value);
  });

  numberInput.addEventListener("input", () => {
    let rawValue = parseFloat(numberInput.value.replace(/[^0-9]/g, ""));
    sliderInput.value = rawValue;
    investmentAmounts[index] = rawValue;
    numberInput.value = formatCurrency(rawValue);
  });

  sliderTable.appendChild(row);
});

/****************************************************
 * Helper Functions
 ****************************************************/
function applyToSubsequentYears(startIndex, value) {
  for (let i = startIndex; i < historicalData.length; i++) {
    investmentAmounts[i] = value;
    document.getElementById(`slider-${historicalData[i].year}`).value = value;
    document.getElementById(`number-${historicalData[i].year}`).value = formatCurrency(value);
  }
}

function formatCurrency(value) {
  return `$${parseInt(value).toLocaleString()}`;
}

/****************************************************
 * Calculate and Plot Investment Growth
 ****************************************************/
document.getElementById("calculateBtn").addEventListener("click", () => {
  let years = [];
  let userValue = [];
  let userPlusMatchValue = [];
  let sp500Value = [];

  let cumulativeShares = 0;
  let cumulativeMatchShares = 0;
  let sp500Investment = 0;

  historicalData.forEach((item, index) => {
    let investDollars = investmentAmounts[index];
    let sharesBought = investDollars / item.price;
    let matchShares = MATCH_RATE * sharesBought;

    cumulativeShares += sharesBought;
    cumulativeMatchShares += matchShares;
    sp500Investment += investDollars;
    sp500Investment *= (1 + sp500GrowthRate);

    years.push(item.year);
    userValue.push(cumulativeShares * item.price);
    userPlusMatchValue.push((cumulativeShares + cumulativeMatchShares) * item.price);
    sp500Value.push(sp500Investment);
  });

  Plotly.newPlot("chart", [
    { x: years, y: userValue, fill: "tozeroy", name: "Your Shares", line: { color: "blue" } },
    { x: years, y: userPlusMatchValue, fill: "tozeroy", name: "Your + Match", line: { color: "green" } },
    { x: years, y: sp500Value, fill: "tozeroy", name: "S&P 500", line: { color: "orange" } }
  ]);
});
