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

// Initialize an array to store each year's investment (default 0)
let investmentAmounts = new Array(historicalData.length).fill(0);

/****************************************************
 * Dynamically Build the Slider Rows
 ****************************************************/
const sliderTable = document.getElementById("sliderTable");

historicalData.forEach((item, index) => {
  // Create table row
  const row = document.createElement("tr");

  // Year label
  const yearCell = document.createElement("td");
  yearCell.textContent = item.year;
  row.appendChild(yearCell);

  // Slider cell
  const sliderCell = document.createElement("td");
  const sliderInput = document.createElement("input");
  sliderInput.type = "range";
  sliderInput.min = "0";
  sliderInput.max = "20000";  // adjust range as needed
  sliderInput.step = "100";   // adjust step as needed
  sliderInput.value = "0";
  sliderInput.id = `slider-${item.year}`;
  sliderCell.appendChild(sliderInput);
  row.appendChild(sliderCell);

  // Number input cell
  const numberCell = document.createElement("td");
  const numberInput = document.createElement("input");
  numberInput.type = "number";
  numberInput.min = "0";
  numberInput.step = "100";
  numberInput.value = "0";
  numberInput.id = `number-${item.year}`;
  numberCell.appendChild(numberInput);
  row.appendChild(numberCell);

  // "Apply to Subsequent Years" button cell
  const applyCell = document.createElement("td");
  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply →";
  applyBtn.className = "applyBtn";
  applyBtn.addEventListener("click", () => {
    applyToSubsequentYears(index, parseFloat(numberInput.value));
  });
  applyCell.appendChild(applyBtn);
  row.appendChild(applyCell);

  // Keep slider and number input synchronized
  sliderInput.addEventListener("input", () => {
    numberInput.value = sliderInput.value;
    investmentAmounts[index] = parseFloat(sliderInput.value);
  });
  numberInput.addEventListener("input", () => {
    sliderInput.value = numberInput.value;
    investmentAmounts[index] = parseFloat(numberInput.value);
  });

  // Append the row to the table
  sliderTable.appendChild(row);
});

/****************************************************
 * Function to Apply a Value to All Subsequent Years
 ****************************************************/
function applyToSubsequentYears(startIndex, value) {
  for (let i = startIndex; i < historicalData.length; i++) {
    investmentAmounts[i] = value;
    const year = historicalData[i].year;
    const slider = document.getElementById(`slider-${year}`);
    const number = document.getElementById(`number-${year}`);
    if (slider && number) {
      slider.value = value;
      number.value = value;
    }
  }
}

/****************************************************
 * Calculate and Plot the Investment Growth
 ****************************************************/
document.getElementById("calculateBtn").addEventListener("click", () => {
  let cumulativeUserShares = 0;
  let cumulativeMatchShares = 0;

  const years = [];
  const userValue = [];
  const userPlusMatchValue = [];

  historicalData.forEach((item, index) => {
    // Retrieve the investment for this year
    const investDollars = investmentAmounts[index];
    const sharesBought = investDollars / item.price;
    const matchShares = MATCH_RATE * sharesBought;

    // Accumulate shares over the years
    cumulativeUserShares += sharesBought;
    cumulativeMatchShares += matchShares;

    // Calculate the end-of-year values at the current year's price
    const totalUserValue = cumulativeUserShares * item.price;
    const totalUserPlusMatch = (cumulativeUserShares + cumulativeMatchShares) * item.price;

    years.push(item.year);
    userValue.push(totalUserValue);
    userPlusMatchValue.push(totalUserPlusMatch);
  });

  // Prepare Plotly traces
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

  // Chart layout settings
  const layout = {
    title: "Value of Your Investments Over Time",
    xaxis: { title: "Year" },
    yaxis: { title: "Value (USD)" },
    margin: { t: 50, b: 50, l: 60, r: 20 }
  };

  // Render the chart in the "chart" div
  Plotly.newPlot("chart", [traceUser, traceUserMatch], layout, { responsive: true });
});
