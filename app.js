/*────────────────────────────────────────────────────────────
  app.js  –  Stock Investment Dashboard (full version)
  Last updated: 2025‑05‑12
────────────────────────────────────────────────────────────*/

/* ───── Fixed plan parameters ───────────────────────────── */
const matchRate     = 0.25;   // 25 % company match
const vestingPeriod = 5;      // match vests after 5 full years

/* ───── Historical Wade‑Trim April prices ───────────────── */
const historicalData = [
  { year: 1996, price:  1.60 }, { year: 1997, price:  1.81 },
  { year: 1998, price:  1.86 }, { year: 1999, price:  2.27 },
  { year: 2000, price:  3.00 }, { year: 2001, price:  3.46 },
  { year: 2002, price:  4.08 }, { year: 2003, price:  5.19 },
  { year: 2004, price:  6.38 }, { year: 2005, price:  7.40 },
  { year: 2006, price:  6.69 }, { year: 2007, price:  7.53 },
  { year: 2008, price:  5.32 }, { year: 2009, price:  5.82 },
  { year: 2010, price:  4.63 }, { year: 2011, price:  5.01 },
  { year: 2012, price:  4.46 }, { year: 2013, price:  6.52 },
  { year: 2014, price:  9.41 }, { year: 2015, price: 11.20 },
  { year: 2016, price: 12.13 }, { year: 2017, price: 13.60 },
  { year: 2018, price: 13.28 }, { year: 2019, price: 14.76 },
  { year: 2020, price: 19.70 }, { year: 2021, price: 35.30 },
  { year: 2022, price: 43.72 }, { year: 2023, price: 51.02 },
  { year: 2024, price: 62.35 }
];

/* ───── April‑1 S&P 500 closes for “what‑if” ───────────── */
const sp500Close = [
  { year: 1996, close:  653.7 }, { year: 1997, close:  759.6 },
  { year: 1998, close:  737.7 }, { year: 1999, close: 1294   },
  { year: 2000, close: 1499   }, { year: 2001, close: 1160   },
  { year: 2002, close: 1147   }, { year: 2003, close:  858.5 },
  { year: 2004, close: 1132   }, { year: 2005, close: 1173   },
  { year: 2006, close: 1295   }, { year: 2007, close: 1421   },
  { year: 2008, close: 1370   }, { year: 2009, close:  811.1 },
  { year: 2010, close: 1178   }, { year: 2011, close: 1332   },
  { year: 2012, close: 1408   }, { year: 2013, close: 1562   },
  { year: 2014, close: 1886   }, { year: 2015, close: 2060   },
  { year: 2016, close: 2073   }, { year: 2017, close: 2363   },
  { year: 2018, close: 2641   }, { year: 2019, close: 2867   },
  { year: 2020, close: 2471   }, { year: 2021, close: 4020   },
  { year: 2022, close: 4546   }, { year: 2023, close: 3577   },
  { year: 2024, close: 5244   }
];

/* ───── Working state ─────────────────────────────────── */
let investmentAmounts = Array(historicalData.length).fill(0); // $ invested each year
let finalTotalValue   = 0;                                    // value at last hist. year

/* ───── Utilities ─────────────────────────────────────── */
const formatCurrency = v => `$${Number(v).toLocaleString(undefined,
  {minimumFractionDigits:2,maximumFractionDigits:2})}`;
const formatPrice    = v => `$${Number(v).toFixed(2)}`;

/*─────────────────────────────────────────────────────────
   BUILD “Investments by Year” SLIDER TABLE
─────────────────────────────────────────────────────────*/
const sliderTable = document.getElementById("sliderTable");

historicalData.forEach((rec, idx) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${rec.year}</td>
    <td>${formatPrice(rec.price)}</td>
    <td>
      <div class="slidecontainer">
        <input type="range" class="slider" id="slider-${rec.year}"
               min="0" max="20000" step="any" value="0">
      </div>
    </td>
    <td><input type="text" id="number-${rec.year}" value="${formatCurrency(0)}"></td>
    <td><button class="btn btn-sm btn-outline-primary"
                onclick="applyToSubsequentYears(${idx})">Apply →</button></td>`;
  sliderTable.appendChild(tr);

  /* sync slider ↔ text box */
  const slider = tr.querySelector(`#slider-${rec.year}`);
  const number = tr.querySelector(`#number-${rec.year}`);

  slider.addEventListener("input", e => {
    const raw     = +e.target.value;
    const snapped = Math.floor(raw / rec.price) * rec.price;
    investmentAmounts[idx] = snapped;
    slider.value = snapped;
    number.value = formatCurrency(snapped);
    updateCalculation();
  });

  number.addEventListener("input", e => {
    const v = parseFloat(e.target.value.replace(/[^0-9.]/g,"")) || 0;
    investmentAmounts[idx] = v;
    updateCalculation();
  });
});

/*─────────────────────────────────────────────────────────
   PRESET BUTTONS + “CLEAR ALL” AFTER Late Start
─────────────────────────────────────────────────────────*/
function generatePresets() {
  const panel = document.getElementById("presetPanel");
  panel.innerHTML = "";  // reset

  /* prepare four distributions for a $100k example */
  const n = historicalData.length, total=100000;
  const sumSeries = n*(n+1)/2;
  const stepUp = Array.from({length:n},(_,i)=>((i+1)/sumSeries)*total);
  const steady = Array(n).fill(total/n);
  const front  = Array.from({length:n},(_,i)=> i<4?25000:0);
  const late   = Array.from({length:n},(_,i)=> i>=n-4?25000:0);

  const presets = [
    {name:"Step Up",        values:stepUp},
    {name:"Slow & Steady",  values:steady},
    {name:"Front Load",     values:front},
    {name:"Late Start",     values:late}
  ];

  presets.forEach(p=>{
    const b=document.createElement("button");
    b.className="btn btn-secondary preset-btn me-2 mb-2";
    b.textContent=p.name;
    b.dataset.values=p.values.join(",");
    panel.appendChild(b);
  });

  /* Clear‑All button appended LAST */
  const clr=document.createElement("button");
  clr.id="clearBtn";
  clr.className="btn btn-outline-secondary ms-2 mb-2";
  clr.textContent="Clear All Values";
  panel.appendChild(clr);

  /* click handlers */
  panel.querySelectorAll(".preset-btn").forEach(btn=>{
    btn.addEventListener("click", e=>{
      const vals=e.target.dataset.values.split(",").map(Number);
      vals.forEach((v,i)=>{
        investmentAmounts[i]=v;
        const yr=historicalData[i].year;
        document.getElementById(`slider-${yr}`).value  = v;
        document.getElementById(`number-${yr}`).value  = formatCurrency(v);
      });
      updateCalculation();
    });
  });
  clr.addEventListener("click", clearAll);
}
generatePresets();

/*─────────────────────────────────────────────────────────
   BULK HELPERS
─────────────────────────────────────────────────────────*/
function applyToSubsequentYears(startIdx) {
  const v = investmentAmounts[startIdx];
  historicalData.forEach((rec,i)=>{
    if(i>=startIdx){
      investmentAmounts[i]=v;
      document.getElementById(`slider-${rec.year}`).value  = v;
      document.getElementById(`number-${rec.year}`).value  = formatCurrency(v);
    }
  });
  updateCalculation();
}

document.getElementById("snapBtn").addEventListener("click", ()=>{
  historicalData.forEach((rec,i)=>{
    const raw     = investmentAmounts[i];
    const snapped = Math.floor(raw/rec.price) * rec.price;
    investmentAmounts[i]=snapped;
    document.getElementById(`slider-${rec.year}`).value  = snapped;
    document.getElementById(`number-${rec.year}`).value  = formatCurrency(snapped);
  });
  updateCalculation();
});

function clearAll() {
  investmentAmounts.fill(0);
  historicalData.forEach(rec=>{
    document.getElementById(`slider-${rec.year}`).value  = 0;
    document.getElementById(`number-${rec.year}`).value  = formatCurrency(0);
  });
  updateCalculation();
}

/*─────────────────────────────────────────────────────────
   MAIN HISTORICAL CALCULATION + CHART
─────────────────────────────────────────────────────────*/
function updateCalculation() {
  const summaryBody  = document.getElementById("summaryBody");
  const detailedBody = document.getElementById("detailedBody");
  summaryBody.innerHTML  = "";
  detailedBody.innerHTML = "";

  let cumulativeShares      = 0;
  let cumulativeInvested    = 0;
  let cumulativeMatchShares = 0;
  let sp500Value            = 0;

  const years=[], investedSeries=[], employeeValSeries=[],
        totalValSeries=[], sp500Series=[];

  historicalData.forEach((rec, idx) => {
    const invested = investmentAmounts[idx];
    const price    = rec.price;

    /* employee shares bought this year */
    const empShares = invested/price;
    cumulativeShares   += empShares;
    cumulativeInvested += invested;

    /* vesting: match from 5 years ago */
    let matchSharesThisYear = 0;
    if(idx>=vestingPeriod){
      const purchaseAgo = investmentAmounts[idx-vestingPeriod];
      if(purchaseAgo>0){
        const priceAgo = historicalData[idx-vestingPeriod].price;
        matchSharesThisYear = Math.round((purchaseAgo/priceAgo) * matchRate);
        cumulativeMatchShares += matchSharesThisYear;
      }
    }

    const valueEmployee = cumulativeShares      * price;
    const valueMatch    = cumulativeMatchShares * price;
    const totalValue    = valueEmployee + valueMatch;

    /* simple S&P500 “invested instead” model */
    const spClose = sp500Close[idx].close;
    if(idx===0){
      sp500Value = invested;
    } else {
      const prevClose = sp500Close[idx-1].close;
      sp500Value = (sp500Value + invested) * (spClose / prevClose);
    }

    /* summary row */
    summaryBody.innerHTML += `
      <tr>
        <td>${rec.year}</td>
        <td>${formatPrice(price)}</td>
        <td>${formatCurrency(cumulativeInvested)}</td>
        <td>${formatCurrency(totalValue)}</td>
        <td>${formatCurrency(sp500Value)}</td>
      </tr>`;

    /* detailed row */
    const roi = cumulativeInvested>0 ? ((totalValue-cumulativeInvested)/cumulativeInvested*100).toFixed(2) : "0.00";
    detailedBody.innerHTML += `
      <tr>
        <td>${rec.year}</td>
        <td>${formatPrice(price)}</td>
        <td>${formatCurrency(invested)}</td>
        <td>${formatCurrency(cumulativeInvested)}</td>
        <td>${empShares.toFixed(2)}</td>
        <td>${cumulativeShares.toFixed(2)}</td>
        <td>${matchSharesThisYear}</td>
        <td>${cumulativeMatchShares}</td>
        <td>${formatCurrency(matchSharesThisYear*price)}</td>
        <td>${formatCurrency(valueEmployee)}</td>
        <td>${formatCurrency(valueMatch)}</td>
        <td>${formatCurrency(totalValue)}</td>
        <td>${formatCurrency(sp500Value)}</td>
        <td>$${spClose.toLocaleString()}</td>
        <td>${roi}%</td>
      </tr>`;

    years.push(rec.year);
    investedSeries.push(cumulativeInvested);
    employeeValSeries.push(valueEmployee);
    totalValSeries.push(totalValue);
    sp500Series.push(sp500Value);
    finalTotalValue = totalValue;          // save for projection tab
  });

  /* Plotly historical chart */
  Plotly.newPlot("chart",[
    {x:years,y:investedSeries, name:"Cumulative Invested",
     fill:"tozeroy",fillcolor:"rgba(99,102,106,.5)",
     line:{color:"rgba(99,102,106,.8)"}},
    {x:years,y:employeeValSeries, name:"Employee Shares Value",
     fill:"tonexty",fillcolor:"rgba(67,176,42,.5)",
     line:{color:"rgba(67,176,42,.8)"}},
    {x:years,y:totalValSeries, name:"Total Value (Emp+Match)",
     fill:"tonexty",fillcolor:"rgba(0,130,186,.5)",
     line:{color:"rgba(0,130,186,.8)"}},
    {x:years,y:sp500Series, name:"S&P 500 (if invested)",
     mode:"lines",line:{color:"rgba(198,54,99,1)",width:2}}
  ],{
    xaxis:{dtick:1,title:"Year"},
    yaxis:{title:"Value ($)"},
    legend:{orientation:"h",x:0,xanchor:"left",y:-.25},
    margin:{t:40}
  },{responsive:true});

  updateScenarioComparison();   // refresh projection tab
}

/*─────────────────────────────────────────────────────────
   PROJECTION TAB – optional Annual Purchase
─────────────────────────────────────────────────────────*/
function updateScenarioComparison() {
  const yrsFwd        = +document.getElementById("projectionYears").value;
  const annualPurchase= +document.getElementById("annualPurchase").value;
  const rCons         = +document.getElementById("conservativeRate").value/100;
  const rBase         = +document.getElementById("baseRate").value/100;
  const rAggr         = +document.getElementById("aggressiveRate").value/100;

  const startYear  = historicalData.at(-1).year;
  const startPrice = historicalData.at(-1).price;
  const startShares= finalTotalValue / startPrice;

  /* internal projection helper */
  function runScenario(rate){
    let price=startPrice;
    let totalShares=startShares;
    const purchases=[];   // track shares bought each future year

    const years=[],values=[];
    for(let i=0;i<=yrsFwd;i++){
      const yr=startYear+i;

      /* year 0 = today (no growth/purchase) */
      if(i>0){
        price*=(1+rate);}

      /* after price grows, purchase this year */
      if(i>0 && annualPurchase>0){
        const bought=annualPurchase/price;
        totalShares+=bought;
        purchases.push(bought);
      } else if(i>0){
        purchases.push(0);
      }

      /* vest any purchase exactly vestingPeriod+1 years ago */
      const vestIdx=i-vestingPeriod-1;
      if(vestIdx>=0 && purchases[vestIdx]>0){
        totalShares += purchases[vestIdx]*matchRate;
      }

      years.push(yr);
      values.push(totalShares*price);
    }
    return {years,values};
  }

  const cons = runScenario(rCons);
  const base = runScenario(rBase);
  const aggr = runScenario(rAggr);

  /* Plot projections */
  Plotly.newPlot("scenarioChart",[
    {x:aggr.years,y:aggr.values,name:"Aggressive",
     fill:"tozeroy",fillcolor:"rgba(198,54,99,.5)",
     line:{color:"rgba(198,54,99,.8)"}},
    {x:base.years,y:base.values,name:"Base",
     fill:"tozeroy",fillcolor:"rgba(0,130,186,.5)",
     line:{color:"rgba(0,130,186,.8)"}},
    {x:cons.years,y:cons.values,name:"Conservative",
     fill:"tozeroy",fillcolor:"rgba(67,176,42,.5)",
     line:{color:"rgba(67,176,42,.8)"}}
  ],{
    xaxis:{title:"Year"},
    yaxis:{title:"Projected Value ($)"},
    legend:{orientation:"h",x:0.5,xanchor:"center",y:-0.3},
    margin:{t:40}
  },{responsive:true});

  /* projection table */
  const tbody=document.getElementById("projectionBody");
  tbody.innerHTML="";
  for(let i=0;i<cons.years.length;i++){
    tbody.innerHTML += `
      <tr>
        <td>${cons.years[i]}</td>
        <td>${formatCurrency(cons.values[i])}</td>
        <td>${formatCurrency(base.values[i])}</td>
        <td>${formatCurrency(aggr.values[i])}</td>
      </tr>`;
  }
}

/* projection input listeners */
["projectionYears","annualPurchase","conservativeRate","baseRate","aggressiveRate"]
  .forEach(id=>document.getElementById(id).addEventListener("input",updateScenarioComparison));

/*─────────────────────────────────────────────────────────
   TAB SWITCH BUTTONS
─────────────────────────────────────────────────────────*/
document.getElementById("goToDetailsBtn").addEventListener("click", ()=>{
  new bootstrap.Tab(document.getElementById("detailed-tab")).show();
});
document.getElementById("goToProjectionBtn").addEventListener("click", ()=>{
  new bootstrap.Tab(document.getElementById("projected-tab")).show();
});

/*─────────────────────────────────────────────────────────
   INITIAL RENDER
─────────────────────────────────────────────────────────*/
updateCalculation();
