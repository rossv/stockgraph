// Investment Parameters
const years = 30;
const privateStockGrowthRate = 0.08; // 8% annually
const sp500GrowthRate = 0.07; // 7% annually
const companyMatchRate = 0.25; // 25% match
const vestingPeriod = 5; // 5-year vesting

// Initialize Chart
let ctx = document.getElementById('investmentChart').getContext('2d');
let investmentChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: { responsive: true, maintainAspectRatio: false }
});

// Function to Calculate Investment Growth
function calculateGrowth(investment, type) {
    let privateStock = [];
    let sp500 = [];
    let yearsArray = [];
    
    let vestedMatch = 0; // Track vested match
    let totalInvested = investment; // Initial investment
    let matchContribution = investment * companyMatchRate; // 25% match

    for (let i = 0; i <= years; i++) {
        yearsArray.push(i);

        // If using annual contributions, add investment yearly
        if (type === 'annual' && i > 0) {
            totalInvested += investment;
            matchContribution = investment * companyMatchRate;
        }

        // Vesting logic (only count match after 5 years)
        if (i >= vestingPeriod) {
            vestedMatch += matchContribution;
        }

        // Calculate growth
        privateStock.push((totalInvested + vestedMatch) * Math.pow(1 + privateStockGrowthRate, i));
        sp500.push(totalInvested * Math.pow(1 + sp500GrowthRate, i));
    }

    return { yearsArray, privateStock, sp500 };
}

// Function to Update Chart
function updateChart() {
    let investmentAmount = parseFloat(document.getElementById('investmentAmount').value);
    let investmentType = document.getElementById('investmentType').value;

    let data = calculateGrowth(investmentAmount, investmentType);

    investmentChart.data.labels = data.yearsArray;
    investmentChart.data.datasets = [
        {
            label: 'Private Stock Investment',
            data: data.privateStock,
            borderColor: 'blue',
            fill: false
        },
        {
            label: 'S&P 500',
            data: data.sp500,
            borderColor: 'green',
            fill: false
        }
    ];

    investmentChart.update();
}

// Initial chart update
updateChart();
