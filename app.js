// Investment Parameters
const years = 30;
const privateStockGrowthRate = 0.08; // 8% annually
const sp500GrowthRate = 0.07;          // 7% annually
const companyMatchRate = 0.25;         // 25% match
const vestingPeriod = 5;               // 5-year vesting

// Initialize Chart (create once)
const ctx = document.getElementById('investmentChart').getContext('2d');
let investmentChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: []
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 }, // Adjust duration or set to 0 to disable animation
    plugins: {
      tooltip: { mode: 'index', intersect: false }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }
});

// Calculate Investment Growth Data
function calculateGrowth(investment, type) {
  const privateStock = [];
  const sp500 = [];
  const yearsArray = [];
  
  let vestedMatch = 0;
  let totalInvested = investment;
  let matchContribution = investment * companyMatchRate;

  for (let i = 0; i <= years; i++) {
    yearsArray.push(i);

    if (type === 'annual' && i > 0) {
      totalInvested += investment;
      matchContribution = investment * companyMatchRate;
    }

    if (i >= vestingPeriod) {
      vestedMatch += matchContribution;
    }

    privateStock.push((totalInvested + vestedMatch) * Math.pow(1 + privateStockGrowthRate, i));
    sp500.push(totalInvested * Math.pow(1 + sp500GrowthRate, i));
  }
  
  return { yearsArray, privateStock, sp500 };
}

// Update Chart Data
function updateChart() {
  const investmentAmount = parseFloat(document.getElementById('investmentAmount').value);
  const investmentType = document.getElementById('investmentType').value;
  const data = calculateGrowth(investmentAmount, investmentType);
  
  // Update chart labels and datasets
  investmentChart.data.labels = data.yearsArray;
  investmentChart.data.datasets = [
    {
      label: 'Private Stock Investment',
      data: data.privateStock,
      borderColor: 'blue',
      fill: false,
      tension: 0.2 // smooths out the line curve
    },
    {
      label: 'S&P 500',
      data: data.sp500,
      borderColor: 'green',
      fill: false,
      tension: 0.2
    }
  ];

  investmentChart.update();
}

// Set up event listener for button click
document.getElementById('calculateBtn').addEventListener('click', updateChart);

// Initial chart rendering
updateChart();
