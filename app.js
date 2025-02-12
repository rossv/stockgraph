// Investment Parameters
const years = 30;
const privateStockGrowthRate = 0.08; // 8% annually
const sp500GrowthRate = 0.07;          // 7% annually
const companyMatchRate = 0.25;         // 25% match
const vestingPeriod = 5;               // 5-year vesting

// Calculate Investment Growth Data
function calculateGrowth(investment, type) {
  const yearsArray = [];
  const privateStock = [];
  const sp500 = [];
  
  let totalInvested = investment;
  let vestedMatch = 0;
  let matchContribution = investment * companyMatchRate;
  
  for (let i = 0; i <= years; i++) {
    yearsArray.push(i);

    // For annual contributions, add new investment each year (after year 0)
    if (type === 'annual' && i > 0) {
      totalInvested += investment;
      matchContribution = investment * companyMatchRate;
    }

    // Vesting logic: add match only after vesting period
    if (i >= vestingPeriod) {
      vestedMatch += matchContribution;
    }

    // Compute growth values
    privateStock.push((totalInvested + vestedMatch) * Math.pow(1 + privateStockGrowthRate, i));
    sp500.push(totalInvested * Math.pow(1 + sp500GrowthRate, i));
  }
  
  return { yearsArray, privateStock, sp500, totalInvested, vestedMatch };
}

// Render or update the chart using Plotly and update debug info
function updateChart() {
  const investmentAmount = parseFloat(document.getElementById('investmentAmount').value);
  const investmentType = document.getElementById('investmentType').value;
  const data = calculateGrowth(investmentAmount, investmentType);
  
  const trace1 = {
    x: data.yearsArray,
    y: data.privateStock,
    mode: 'lines+markers',
    name: 'Private Stock Investment',
    line: { color: 'blue' }
  };
  
  const trace2 = {
    x: data.yearsArray,
    y: data.sp500,
    mode: 'lines+markers',
    name: 'S&P 500',
    line: { color: 'green' }
  };
  
  const chartData = [trace1, trace2];
  
  const layout = {
    title: 'Investment Growth Over Time',
    xaxis: { title: 'Years' },
    yaxis: { title: 'Value ($)' },
    margin: { t: 50, b: 50 }
  };
  
  // Use Plotly.react to smoothly update the chart
  Plotly.react('investmentChart', chartData, layout, {responsive: true});
  
  // Update debug information so you can verify updates are coming through
  const debugInfo = document.getElementById('debugInfo');
  debugInfo.innerHTML = `
    <p>Chart updated at: ${new Date().toLocaleTimeString()}</p>
    <p>Investment Type: ${investmentType}</p>
    <p>Investment Amount: $${investmentAmount.toFixed(2)}</p>
    <p>Total Invested after 30 years: $${data.totalInvested.toFixed(2)}</p>
    <p>Vested Match after 30 years: $${data.vestedMatch.toFixed(2)}</p>
  `;
}

// Set up event listener for the Calculate button
document.getElementById('calculateBtn').addEventListener('click', updateChart);

// Initial chart rendering
updateChart();
