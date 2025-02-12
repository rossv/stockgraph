/****************************************************
 * Historical Stock Prices (2012-2023)
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

// Company match rate
const MATCH_RATE = 0.25;

// Will hold the investment amounts for each year
// (defaults to 0 for each year initially)
let investmentAmounts = new Array(historicalData.length).fill(0);

/****************************************************
 * Build the slider rows dynamically
 ****************************************************/
const sliderTable = document.getElementById("sliderTable");

historicalData.forEach((item, index) => {
  // Create a table row
  const row = document.createElement("tr");

  // Year label
  const yearCell = document.createElement("td");
  yearCell.textContent = item.year;
  row.appendChild(yearCell);

  // Slider
  const sliderCell = document.createElement("td");
  const sliderInput = document.createElement("input");
  sliderInput.type = "range";
  sliderInput.min = "0";
  sliderInput.max = "20000";  // adjust as needed
  sliderInput.step = "100";   // adjust as needed
  sliderInput.value = "0";
  sliderInput.id = `slider-${item.year}`;
  sliderCell.appendChild(sliderInput);
  row.appendChild(sliderCell);

  // Numeric input
  const numberCell = document.createElement("td");
  const numberInput = document.createElement("input");
  numberInput.type = "number";
  numberInput.min = "0";
  numberInput.step = "100";
  numberInput.value = "0";
  numberInput.id = `number-${item.year}`;
  numberCell.appendChild(numberInput);
  row.appendChild(numberCell);

  // Button: apply to subsequent years
  const applyCell = document.createElement("td");
  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply →";
  applyBtn.className = "applyBtn";
  applyBtn.addEventListener("click", () => {
    applyToSubsequentYears(index, parseFloat(numberInput.value));
  });
  applyCell.appendChild(applyBtn);
  row.appendChild(applyCell);

  // Keep the slider and number input in sync
  sliderInput.addEventListener("input", () => {
    numberInput.value = sliderInput.value;
    investmentAmounts[index] = parseFloat(sliderInput.value);
  });
  numberInput.addEventListener("input", () => {
    sliderInput.value = numberInput.value;
    investmentAmounts[index] = parseFloat(numberInput.value);
  });

  // Add the row to the table
  sliderTable.appendChild(row);
});

/****************************************************
 * Apply a given value to all subsequent years
 ****************************************************/
function applyToSubsequentYears(startIndex, value) {
  for (let i = startIndex; i < historicalData.length; i++) {
    investmentAmounts[i] = value;
    const year = historicalData[i].year;
    const slider = document.getElementById(`slider-${year}`);
    const number = document.getElementById(`number-${year}`);
    slider.value = value;
    number.value = value;
  }
}

/****************************************************
 * Calculate & Plot
 ****************************************************/
document.getElementById("calculateBtn").addEventListener("click", () => {
  // Calculate the total shares for each year, and
  // then the total value of those shares at that year's price

  let cumulativeUserShares = 0;
  let cumulativeMatchShares = 0;

  // Arrays for the plot
  const years = [];
  const userValue = [];         // Value of user-purchased shares
  const userPlusMatchValue = []; // Value of user + match

  historicalData.forEach((item, index) => {
    const investDollars = investmentAmounts[index];
    const sharesBought = investDollars / item.price;
    const matchShares = MATCH_RATE * sharesBought;

    // Accumulate total shares
    cumulativeUserShares += sharesBought;
    cumulativeMatchShares += matchShares;

    // End-of-year total value (just user shares)
    const totalUserValue = cumulativeUserShares * item.price;

    // End-of-year total value (user + match)
    const totalUserPlusMatch = (cumulativeUserShares + cumulativeMatchShares) * item.price;

    years.push(item.year);
    userValue.push(totalUserValue);
    userPlusMatchValue.push(totalUserPlusMatch);
  });

  // Build Plotly traces
  const traceUser = {
    x: years,
    y: userValue,
    mode: "lines+markers",
    name: "Your Shares Only",
    line: { color: "blue" }
  };

  const traceUserMatch = {
    x: years,
    y: userPlusMatchValue,
    mode: "lines+markers",
    name: "Your Shares + 25% Match",
    line: { color: "green" }
  };

  const layout = {
    title: "Value of Your Investments Over Time",
    xaxis: { title: "Year" },
    yaxis: { title: "Value (USD)" },
    margin: { t: 50, b: 50, l: 60, r: 20 }
  };

  Plotly.newPlot("chart", [traceUser, traceUserMatch], layout, { responsive: true });
});
