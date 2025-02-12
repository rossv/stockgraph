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

const sp500GrowthRate = 0.07;
const MATCH_RATE = 0.25;
let investmentAmounts = new Array(historicalData.length).fill(0);

const sliderTable = document.getElementById("sliderTable");

// Build Table Rows with Apply Buttons
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

function formatCurrency(value) {
  return `$${parseInt(value).toLocaleString()}`;
}

document.getElementById("calculateBtn").addEventListener("click", () => {
  let years = [], userValue = [], userPlusMatchValue = [], sp500Value = [];
  let cumulativeShares = 0, cumulativeMatchShares = 0, sp500Investment = 0;

  let summaryBody = document.getElementById("summaryBody");
  summaryBody.innerHTML = "";

  historicalData.forEach((item, index) => {
    let investDollars = investmentAmounts[index];
    let sharesBought = investDollars / item.price;
    let matchShares = MATCH_RATE * sharesBought;
    cumulativeShares += sharesBought;
    cumulativeMatchShares += matchShares;
    sp500Investment = (sp500Investment + investDollars) * (1 + sp500GrowthRate);

    years.push(item.year);
    userValue.push(cumulativeShares * item.price);
    userPlusMatchValue.push((cumulativeShares + cumulativeMatchShares) * item.price);
    sp500Value.push(sp500Investment);

    summaryBody.innerHTML += `<tr>
      <td>${item.year}</td>
      <td>${formatCurrency(investDollars)}</td>
      <td>${formatCurrency(userPlusMatchValue[index])}</td>
    </tr>`;
  });

  Plotly.newPlot("chart", [
    { x: years, y: userValue, name: "Purchased Shares", fill: "tozeroy", line: { color: "blue" } },
    { x: years, y: userPlusMatchValue, name: "Purchased Shares + Matching Shares", fill: "tozeroy", line: { color: "green" } },
    { x: years, y: sp500Value, name: "S&P 500", fill: "tozeroy", line: { color: "orange" } }
  ]);
});
