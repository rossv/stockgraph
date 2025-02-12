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

// Build Input Table
historicalData.forEach((item, index) => {
  const row = document.createElement("tr");

  const yearCell = document.createElement("td");
  yearCell.textContent = item.year;
  row.appendChild(yearCell);

  const priceCell = document.createElement("td");
  priceCell.textContent = `$${item.price.toFixed(2)}`;
  row.appendChild(priceCell);

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

  const numberCell = document.createElement("td");
  const numberInput = document.createElement("input");
  numberInput.type = "text";
  numberInput.id = `number-${item.year}`;
  numberInput.value = "$0";
  numberCell.appendChild(numberInput);
  row.appendChild(numberCell);

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
    sp500Investment += investDollars;
    sp500Investment *= (1 + sp500GrowthRate);

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
    { x: years, y: userValue, fill: "tozeroy", name: "Purchased Shares", line: { color: "blue" } },
    { x: years, y: userPlusMatchValue, fill: "tozeroy", name: "Purchased Shares + Matching Shares", line: { color: "green" } },
    { x: years, y: sp500Value, fill: "tozeroy", name: "S&P 500", line: { color: "orange" } }
  ]);
});
