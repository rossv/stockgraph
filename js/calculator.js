import { matchRate, vestingPeriod, historicalData, sp500Close } from './data.js';

export const fmtCur = v => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
export const fmtPrice = v => `$${Number(v).toFixed(3)}`;
const fmtNum = v => Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 });

export let investmentAmounts = [];
let finalTotalValue = 0;
let lastCalculatedYear = null;
let lastCalculatedPrice = null;

function getEnteredYearRange(len) {
  const enteredIndexes = [];
  for (let idx = 0; idx < len; idx++) {
    if ((Number(investmentAmounts[idx]) || 0) > 0) {
      enteredIndexes.push(idx);
    }
  }

  if (!enteredIndexes.length) {
    return null;
  }

  const firstIndex = enteredIndexes[0];
  const lastIndex = enteredIndexes[enteredIndexes.length - 1];
  const firstYear = historicalData[firstIndex]?.year;
  const lastYear = historicalData[lastIndex]?.year;

  if (firstYear === undefined || lastYear === undefined) {
    return null;
  }

  return [firstYear - 0.5, lastYear + 0.5];
}

export function resetInvestmentAmounts(len) {
  investmentAmounts.length = len;
  investmentAmounts.fill(0);
}

export function updateCalculation() {
  const summaryBody = document.getElementById('summaryBody');
  const detailedBody = document.getElementById('detailedBody');
  summaryBody.innerHTML = detailedBody.innerHTML = '';

  let cumShares = 0, cumInvest = 0, cumMatchShares = 0, spVal = 0;
  const yrs = [], invArr = [], empArr = [], totArr = [], spArr = [], roiEmpArr = [], roiInclArr = [];

  const histLen = historicalData.length;
  const spLen = sp500Close.length;
  const len = Math.min(histLen, spLen);
  if (histLen !== spLen) {
    console.error(`Data length mismatch: historicalData has ${histLen} entries while sp500Close has ${spLen}.`);
    alert('Data files are inconsistent. Calculations use only overlapping records.');
  }

  finalTotalValue = 0;
  lastCalculatedYear = null;
  lastCalculatedPrice = null;

  for (let idx = 0; idx < len; idx++) {
    const rec = historicalData[idx];
    const invest = Number(investmentAmounts[idx]) || 0;
    const price = rec.price;
    const empShares = invest / price;
    cumShares += empShares;
    cumInvest += invest;

    let matchThis = 0;
    if (idx >= vestingPeriod) {
      const invAgo = Number(investmentAmounts[idx - vestingPeriod]) || 0;
      if (invAgo > 0) {
        const priceAgo = historicalData[idx - vestingPeriod].price;
        matchThis = Math.round((invAgo / priceAgo) * matchRate);
        cumMatchShares += matchThis;
      }
    }

    const valEmp = cumShares * price;
    const valMatch = cumMatchShares * price;
    const totalVal = valEmp + valMatch;

    const spRec = sp500Close[idx];
    if (!spRec) {
      console.error(`Missing S&P 500 data for index ${idx}.`);
      break;
    }
    const spClose = spRec.close;
    if (idx > 0 && sp500Close[idx - 1]) {
      const prevClose = sp500Close[idx - 1].close;
      spVal = spVal * (spClose / prevClose) + invest;
    } else {
      spVal = invest;
    }

    summaryBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${rec.year}</td>
        <td>${fmtPrice(price)}</td>
        <td>${fmtCur(cumInvest)}</td>
        <td>${fmtCur(totalVal)}</td>
        <td>${fmtCur(spVal)}</td>
      </tr>`);

    const roiEmpVal = cumInvest > 0 ? ((valEmp - cumInvest) / cumInvest) * 100 : 0;
    const roiInclVal = cumInvest > 0 ? ((totalVal - cumInvest) / cumInvest) * 100 : 0;
    const roiEmp = roiEmpVal.toFixed(2);
    const roiIncl = roiInclVal.toFixed(2);
    detailedBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${rec.year}</td><td>${fmtPrice(price)}</td>
        <td>${fmtCur(invest)}</td><td>${fmtCur(cumInvest)}</td>
        <td>${fmtNum(empShares)}</td><td>${fmtNum(cumShares)}</td>
        <td>${fmtNum(matchThis)}</td><td>${fmtNum(cumMatchShares)}</td>
        <td>${fmtCur(matchThis * price)}</td>
        <td>${fmtCur(valEmp)}</td><td>${fmtCur(valMatch)}</td>
        <td>${fmtCur(totalVal)}</td><td>${fmtCur(spVal)}</td>
        <td>$${spClose.toLocaleString()}</td><td>${roiEmp}%</td><td>${roiIncl}%</td>
      </tr>`);

    yrs.push(rec.year);
    invArr.push(cumInvest); empArr.push(valEmp);
    totArr.push(totalVal); spArr.push(spVal);
    roiEmpArr.push(roiEmpVal); roiInclArr.push(roiInclVal);
    finalTotalValue = totalVal;
    lastCalculatedYear = rec.year;
    lastCalculatedPrice = price;
  }

  const roiValues = roiEmpArr.concat(roiInclArr).map(v => Math.abs(v));
  const maxRoi = Math.max(...roiValues, 0);
  let roiTick = 100;
  while (maxRoi / roiTick > 10) {
    roiTick *= 2;
  }

  const enteredYearRange = getEnteredYearRange(len);

  Plotly.newPlot('chart', [
    {
      x: yrs, y: invArr, name: 'Cumulative\u00A0Invested',
      fill: 'tozeroy', fillcolor: 'rgba(99,102,106,.5)',
      line: { color: 'rgba(99,102,106,.8)' }
    },
    {
      x: yrs, y: empArr, name: 'Employee\u00A0Shares\u00A0Value',
      fill: 'tonexty', fillcolor: 'rgba(67,176,42,.5)',
      line: { color: 'rgba(67,176,42,.8)' }
    },
    {
      x: yrs, y: totArr, name: 'Total\u00A0Value\u00A0(Emp+Match)',
      fill: 'tonexty', fillcolor: 'rgba(0,130,186,.5)',
      line: { color: 'rgba(0,130,186,.8)' }
    },
    {
      x: yrs, y: spArr, name: 'S&P\u00A0500\u00A0(if\u00A0invested)',
      mode: 'lines', line: { color: 'rgba(198,54,99,1)', width: 2 }
    },
    {
      x: yrs, y: roiEmpArr, name: 'ROI\u00A0on\u00A0your\u00A0contributions\u00A0(%)', mode: 'lines',
      line: { color: 'rgba(255,165,0,1)', dash: 'dash' }, yaxis: 'y2'
    },
    {
      x: yrs, y: roiInclArr, name: 'ROI\u00A0incl.\u00A0company\u00A0match\u00A0(%)', mode: 'lines',
      line: { color: 'rgba(255,69,0,1)', dash: 'dot' }, yaxis: 'y2'
    }
  ], {
    xaxis: { dtick: 1, title: 'Financial\u00A0Year', range: enteredYearRange || undefined },
    yaxis: { title: 'Value\u00A0($)' },
    yaxis2: { title: 'ROI\u00A0(%)', overlaying: 'y', side: 'right', showgrid: false, tick0: 0, dtick: roiTick },
    legend: { orientation: 'h', x: 0, xanchor: 'left', y: -.25 },
    margin: { t: 40 },
  }, { responsive: true, staticPlot: true, displayModeBar: false, scrollZoom: false, doubleClick: false });

  updateScenarioComparison();
}

export function updateScenarioComparison() {
  if (lastCalculatedYear === null || lastCalculatedPrice === null) {
    return;
  }

  const yrsFwd = +document.getElementById('projectionYears').value;
  const annualInput = document.getElementById('annualPurchase');
  const annual = parseFloat(annualInput.value.replace(/[^0-9.]/g, '')) || 0;
  const rCons = +document.getElementById('conservativeRate').value / 100;
  const rBase = +document.getElementById('baseRate').value / 100;
  const rAggr = +document.getElementById('aggressiveRate').value / 100;

  const useInflation = document.getElementById('inflationToggle').checked;
  const inflationRate = +document.getElementById('inflationRate').value / 100;

  const startYear = lastCalculatedYear;
  const startPrice = lastCalculatedPrice;
  const startShares = finalTotalValue / startPrice;

  const yrs = [];
  for (let i = 0; i <= yrsFwd; i++) {
    yrs.push(startYear + i);
  }

  const proj = (rate, yrs) => {
    let price = startPrice, totalShares = startShares;
    const vals = [];
    const purchases = []; // track purchases to handle vesting logic

    // We need to track purchases history for vesting.
    // However, the original logic had a simplified vesting check based on loop index.
    // To keep it consistent but correct, we'll re-simulate year by year.
    // Note: The original code had a bug in vesting logic where it didn't track past purchases array correctly for the projection loop.
    // Let's fix the vesting logic to be consistent with the main calculation if possible, 
    // or at least maintain the existing approximation but fix the array indexing.

    // Actually, let's stick to the existing logic structure but add inflation adjustment.
    // The existing logic:
    // for(let i=0;i<yrs.length;i++){
    //   if(i>0) price*=(1+rate);
    //   ...
    // }

    for (let i = 0; i < yrs.length; i++) {
      if (i > 0) price *= (1 + rate);

      if (i > 0 && annual > 0) {
        const bought = annual / price;
        totalShares += bought;
        purchases.push(bought);
      } else if (i > 0) {
        purchases.push(0);
      }

      // Vesting logic: matches shares purchased 'vestingPeriod' years ago
      // In projection, i=1 is the first future year.
      // The purchases array starts filling at i=1.
      // So purchases[0] corresponds to i=1.
      // Vesting check: i - vestingPeriod - 1
      // If vestingPeriod=3:
      // i=1: vestIdx = 1-3-1 = -3 (no match)
      // i=4: vestIdx = 4-3-1 = 0 (matches purchase from i=1)

      const vestIdx = i - vestingPeriod - 1;
      if (vestIdx >= 0 && purchases[vestIdx] > 0) {
        totalShares += purchases[vestIdx] * matchRate;
      }

      let val = totalShares * price;

      if (useInflation) {
        // Adjust for inflation: value / (1 + inflationRate)^i
        val = val / Math.pow(1 + inflationRate, i);
      }

      vals.push(val);
    }
    return vals;
  };

  const cons = proj(rCons, yrs), base = proj(rBase, yrs), aggr = proj(rAggr, yrs);

  const yAxisTitle = useInflation ? 'Projected Value (Today\'s Dollars)' : 'Projected Value ($)';

  Plotly.newPlot('scenarioChart', [
    {
      x: yrs, y: aggr, name: 'Aggressive',
      fill: 'tozeroy', fillcolor: 'rgba(198,54,99,.5)',
      line: { color: 'rgba(198,54,99,.8)' }
    },
    {
      x: yrs, y: base, name: 'Base',
      fill: 'tozeroy', fillcolor: 'rgba(0,130,186,.5)',
      line: { color: 'rgba(0,130,186,.8)' }
    },
    {
      x: yrs, y: cons, name: 'Conservative',
      fill: 'tozeroy', fillcolor: 'rgba(67,176,42,.5)',
      line: { color: 'rgba(67,176,42,.8)' }
    }
  ], {
    xaxis: { title: 'Financial\u00A0Year' },
    yaxis: { title: yAxisTitle },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.3 },
    margin: { t: 40 },
  }, { responsive: true, staticPlot: true, displayModeBar: false, scrollZoom: false, doubleClick: false });

  const tbody = document.getElementById('projectionBody');
  tbody.innerHTML = '';
  for (let i = 0; i < yrs.length; i++) {
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${yrs[i]}</td>
        <td>${fmtCur(cons[i])}</td>
        <td>${fmtCur(base[i])}</td>
        <td>${fmtCur(aggr[i])}</td>
      </tr>`);
  }
}
