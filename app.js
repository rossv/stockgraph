// Investment Parameters
const years = 30;
const privateStockGrowthRate = 0.08; // 8% annually
const sp500GrowthRate = 0.07; // 7% annually
const companyMatchRate = 0.25; // 25% match
const vestingPeriod = 5; // 5-year vesting

// Declare Chart Variable (Global)
let investmentChart = null;

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

// Function to Initialize or Update the Chart
function updateChart() {
    let investmentAmount = parseFloat(document.getElementById('investmentAmount').value) || 10000; // Default to 10K
    let investmentType = document.getElementById('investmentType').value;

    let data = calculateGrowth(investmentAmount, investmentType);

    let ctx = document.getElementById('investmentChart').getContext('2d');

    if (!investmentChart) {
        // Create Chart (Only Once)
        investmentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.yearsArray,
                datasets: [
                    {
                        label: 'Private Stock Investment',
                        data: data.privateStock,
                        borderColor: 'blue',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: 'S&P 500',
                        data: data.sp500,
                        borderColor: 'green',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 500 },
                scales: {
                    x: { title: { display: true, text: 'Years' } },
                    y: { title: { display: true, text: 'Investment Value ($)' }, beginAtZero: true }
                }
            }
        });
    } else {
        // Update Existing Chart Data
        investmentChart.data.labels = data.yearsArray;
        investmentChart.data.datasets[0].data = data.privateStock;
        investmentChart.data.datasets[1].data = data.sp500;
        investmentChart.update();
    }
}

// Wait until the page fully loads before running the script
document.addEventListener("DOMContentLoaded", function () {
    updateChart(); // Initial Chart Render

    // Event Listeners for User Inputs
    document.getElementById('investmentAmount').addEventListener('input', updateChart);
    document.getElementById('investmentType').addEventListener('change', updateChart);
});
