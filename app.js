const historicalData = [
  { year: 2012, price: 4.46, sp500Return: 16.00 },
  { year: 2013, price: 6.52, sp500Return: 32.39 },
  { year: 2014, price: 9.41, sp500Return: 13.69 },
  { year: 2015, price: 11.2, sp500Return: 1.38 },
  { year: 2016, price: 12.13, sp500Return: 11.96 },
  { year: 2017, price: 13.6, sp500Return: 21.83 },
  { year: 2018, price: 13.28, sp500Return: -4.38 },
  { year: 2019, price: 14.76, sp500Return: 31.49 },
  { year: 2020, price: 19.7, sp500Return: 18.40 },
  { year: 2021, price: 35.3, sp500Return: 28.71 },
  { year: 2022, price: 43.72, sp500Return: -18.11 },
  { year: 2023, price: 51.02, sp500Return: 26.29 },
  { year: 2024, price: 51.02, sp500Return: 25.02 }
];

const MATCH_RATE = 0.25;
const VESTING_PERIOD = 5;
let investmentAmounts = new Array(historicalData.length).fill(0);

document.getElementById("calculateBtn").addEventListener("click", () => {
  let cumulativeShares = 0, cumulativeMatchShares = 0, sp500Investment = 0;
  let years = [], userValue = [], userPlusMatchValue = [], sp500Value = [];
  
  let summaryBody = document.getElementById("summaryBody");
  summaryBody.innerHTML = "";

  historicalData.forEach((item, index) => {
    let invested = investmentAmounts[index];
    let vestedMatch = index >= VESTING_PERIOD ? invested * MATCH_RATE : 0;
    let sharesBought = invested / item.price;
    cumulativeShares += sharesBought;
    cumulativeMatchShares += vestedMatch / item.price;
    sp500Investment = (sp500Investment + invested) * (1 + item.sp500Return / 100);

    years.push(item.year);
    userValue.push(cumulativeShares * item.price);
    userPlusMatchValue.push((cumulativeShares + cumulativeMatchShares) * item.price);
    sp500Value.push(sp500Investment);

    summaryBody.innerHTML += `<tr>
      <td>${item.year}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>${formatCurrency(invested)}</td>
      <td>${formatCurrency(vestedMatch)}</td>
      <td>${formatCurrency(userValue[index])}</td>
      <td>${formatCurrency(userPlusMatchValue[index])}</td>
      <td>${formatCurrency(sp500Value[index])}</td>
    </tr>`;
  });

  Plotly.newPlot("chart", [
    { x: years, y: userValue, name: "Purchased Shares", fill: "tozeroy", line: { color: "blue" } },
    { x: years, y: userPlusMatchValue, name: "Purchased Shares + Matching Shares", fill: "tozeroy", line: { color: "green" } },
    { x: years, y: sp500Value, name: "S&P 500", fill: "tozeroy", line: { color: "orange" } }
  ], {
    xaxis: { title: "Year", tickmode: "array", tickvals: years }, 
    yaxis: { title: "Value ($)" }
  });
});

document.getElementById("clearBtn").addEventListener("click", () => {
  investmentAmounts.fill(0);
  document.querySelectorAll("input[type='range']").forEach(el => el.value = 0);
  document.querySelectorAll("input[type='text']").forEach(el => el.value = "$0");
  document.getElementById("summaryBody").innerHTML = "";
  Plotly.newPlot("chart", [], {});
});

function formatCurrency(value) {
  return `$${parseInt(value).toLocaleString()}`;
}
