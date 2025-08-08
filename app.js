/*────────────────────────────────────────────────────────────
  app.js  –  Stock Investment Dashboard
  Last updated: 12 May 2025
────────────────────────────────────────────────────────────*/


/* ── Fixed parameters ───────────────────────────────────── */
const matchRate     = 0.25;   // 25 % company match
const vestingPeriod = 5;      // match vests 5 years later

/* ── Data placeholders ─────────────────────────────────── */
let historicalData = [];
let sp500Close     = [];

/* ── State ─────────────────────────────────────────────── */
let investmentAmounts = [];
let finalTotalValue   = 0;

/* ── Formatting helpers ───────────────────────────────── */
const fmtCur   = v => `$${Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtPrice = v => `$${Number(v).toFixed(3)}`;

/*─────────────────────────────────────────────────────────
  Build “Investments by Year” slider rows
─────────────────────────────────────────────────────────*/
const sliderTable=document.getElementById("sliderTable");

function buildUI(){
  sliderTable.innerHTML="";
  investmentAmounts = Array(historicalData.length).fill(0);

  historicalData.forEach((rec,idx)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${rec.year}</td>
      <td>${fmtPrice(rec.price)}</td>
      <td>
        <div class="slidecontainer">
          <input type="range" class="slider" id="slider-${rec.year}"
                 min="0" max="20000" step="any" value="0">
        </div>
      </td>
      <td><input type="text" id="number-${rec.year}"
                 class="currency-input" value="$0"></td>
      <td><button class="btn btn-sm btn-outline-primary"
                  onclick="applyToSubsequentYears(${idx})">
            Apply →
          </button></td>`;
    sliderTable.appendChild(tr);

    const slider=document.getElementById(`slider-${rec.year}`);
    const number=document.getElementById(`number-${rec.year}`);

    /* slider -> textbox */
    slider.addEventListener("input",e=>{
      const raw=+e.target.value;
      const snap=Math.round(raw/rec.price)*rec.price; // nearest
      investmentAmounts[idx]=snap;
      slider.value=snap;
      number.value=fmtCur(snap);
      updateCalculation();
    });

    /* textbox UX */
    number.addEventListener("focus",e=>{
      e.target.value=e.target.value.replace(/[^0-9.]/g,"");
    });
    number.addEventListener("blur",e=>{
      const v=parseFloat(e.target.value.replace(/[^0-9.]/g,""))||0;
      investmentAmounts[idx]=v;
      slider.value=v;             // keep slider in sync with manual entry
      e.target.value=fmtCur(v);
      updateCalculation();
    });
    number.addEventListener("input",e=>{
      const v=parseFloat(e.target.value.replace(/[^0-9.]/g,""))||0;
      investmentAmounts[idx]=v;
      slider.value=v;             // reflect typed value immediately
      updateCalculation();
    });
  });

  generatePresets();
  updateCalculation();
}

/*─────────────────────────────────────────────────────────
  Preset buttons + Clear All
─────────────────────────────────────────────────────────*/
function generatePresets(){
  const panel=document.getElementById("presetPanel");

  /* keep existing heading if present */
  const heading=panel.querySelector('h6')?.outerHTML || '';
  panel.innerHTML=heading;

  const n=historicalData.length,total=100000,sumSeries=n*(n+1)/2;
  const stepUp=Array.from({length:n},(_,i)=>((i+1)/sumSeries)*total);
  const steady=Array(n).fill(total/n);
  const front =Array.from({length:n},(_,i)=>i<4?25000:0);
  const late  =Array.from({length:n},(_,i)=>i>=n-4?25000:0);

  const presets=[
    {name:"Step Up",values:stepUp},
    {name:"Slow & Steady",values:steady},
    {name:"Front Load",values:front},
    {name:"Late Start",values:late}
  ];

  presets.forEach(p=>{
    const b=document.createElement("button");
    b.className="btn btn-secondary preset-btn me-2 mb-2";
    b.textContent=p.name;
    b.dataset.values=p.values.join(",");
    panel.appendChild(b);
  });

  const clr=document.createElement("button");
  clr.id="clearBtn";
  clr.className="btn btn-outline-secondary ms-2 mb-2";
  clr.textContent="Clear All Values";
  panel.appendChild(clr);

  panel.querySelectorAll(".preset-btn").forEach(btn=>{
    btn.addEventListener("click",e=>{
      const vals=e.target.dataset.values.split(",").map(Number);
      vals.forEach((v,i)=>{
        investmentAmounts[i]=v;
        const yr=historicalData[i].year;
        document.getElementById(`slider-${yr}`).value=v;
        document.getElementById(`number-${yr}`).value=fmtCur(v);
      });
      updateCalculation();
    });
  });
  clr.addEventListener("click",clearAll);
}

/*─────────────────────────────────────────────────────────
  Bulk helpers
─────────────────────────────────────────────────────────*/
function clearAll(){
  investmentAmounts.fill(0);
  historicalData.forEach(rec=>{
    document.getElementById(`slider-${rec.year}`).value=0;
    document.getElementById(`number-${rec.year}`).value="$0";
  });
  updateCalculation();
}

document.getElementById("snapBtn").addEventListener("click",()=>{
  historicalData.forEach((rec,i)=>{
    const raw=investmentAmounts[i];
    const snap=Math.round(raw/rec.price)*rec.price;
    investmentAmounts[i]=snap;
    document.getElementById(`slider-${rec.year}`).value=snap;
    document.getElementById(`number-${rec.year}`).value=fmtCur(snap);
  });
  updateCalculation();
});

function applyToSubsequentYears(startIdx){
  const v=investmentAmounts[startIdx];
  historicalData.forEach((rec,i)=>{
    if(i>=startIdx){
      investmentAmounts[i]=v;
      document.getElementById(`slider-${rec.year}`).value=v;
      document.getElementById(`number-${rec.year}`).value=fmtCur(v);
    }
  });
  updateCalculation();
}

/* Nav buttons */
document.getElementById("goToDetailsBtn").addEventListener("click",()=>{
  new bootstrap.Tab(document.getElementById("detailed-tab")).show();
});
document.getElementById("goToProjectionBtn").addEventListener("click",()=>{
  new bootstrap.Tab(document.getElementById("projected-tab")).show();
});

/*─────────────────────────────────────────────────────────
  Historical calculation & chart
─────────────────────────────────────────────────────────*/
function updateCalculation(){
  const summaryBody=document.getElementById("summaryBody");
  const detailedBody=document.getElementById("detailedBody");
  summaryBody.innerHTML=detailedBody.innerHTML="";

  let cumShares=0,cumInvest=0,cumMatchShares=0,spVal=0;
  const yrs=[],invArr=[],empArr=[],totArr=[],spArr=[];

  historicalData.forEach((rec,idx)=>{
    const invest=investmentAmounts[idx];
    const price =rec.price;
    const empShares=invest/price;
    cumShares+=empShares;
    cumInvest+=invest;

    /* vesting */
    let matchThis=0;
    if(idx>=vestingPeriod){
      const invAgo=investmentAmounts[idx-vestingPeriod];
      if(invAgo>0){
        const priceAgo=historicalData[idx-vestingPeriod].price;
        matchThis=Math.round((invAgo/priceAgo)*matchRate);
        cumMatchShares+=matchThis;
      }
    }

    const valEmp=cumShares*price;
    const valMatch=cumMatchShares*price;
    const totalVal=valEmp+valMatch;

    /* S&P progression */
    const spClose=sp500Close[idx].close;
    if(idx===0) spVal=invest;
    else{
      const prevClose=sp500Close[idx-1].close;
      spVal=(spVal+invest)*(spClose/prevClose);
    }

    /* summary row */
    summaryBody.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${rec.year}</td>
        <td>${fmtPrice(price)}</td>
        <td>${fmtCur(cumInvest)}</td>
        <td>${fmtCur(totalVal)}</td>
        <td>${fmtCur(spVal)}</td>
      </tr>`);

    /* detailed row */
    const roi=cumInvest>0?(((totalVal-cumInvest)/cumInvest)*100).toFixed(2):"0.00";
    detailedBody.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${rec.year}</td><td>${fmtPrice(price)}</td>
        <td>${fmtCur(invest)}</td><td>${fmtCur(cumInvest)}</td>
        <td>${empShares.toFixed(2)}</td><td>${cumShares.toFixed(2)}</td>
        <td>${matchThis}</td><td>${cumMatchShares}</td>
        <td>${fmtCur(matchThis*price)}</td>
        <td>${fmtCur(valEmp)}</td><td>${fmtCur(valMatch)}</td>
        <td>${fmtCur(totalVal)}</td><td>${fmtCur(spVal)}</td>
        <td>$${spClose.toLocaleString()}</td><td>${roi}%</td>
      </tr>`);

    yrs.push(rec.year);
    invArr.push(cumInvest); empArr.push(valEmp);
    totArr.push(totalVal);  spArr.push(spVal);
    finalTotalValue=totalVal;
  });

  Plotly.newPlot("chart",[
    {x:yrs,y:invArr,name:"Cumulative Invested",
     fill:"tozeroy",fillcolor:"rgba(99,102,106,.5)",
     line:{color:"rgba(99,102,106,.8)"}},
    {x:yrs,y:empArr,name:"Employee Shares Value",
     fill:"tonexty",fillcolor:"rgba(67,176,42,.5)",
     line:{color:"rgba(67,176,42,.8)"}},
    {x:yrs,y:totArr,name:"Total Value (Emp+Match)",
     fill:"tonexty",fillcolor:"rgba(0,130,186,.5)",
     line:{color:"rgba(0,130,186,.8)"}},
    {x:yrs,y:spArr,name:"S&P 500 (if invested)",
     mode:"lines",line:{color:"rgba(198,54,99,1)",width:2}}
  ],{
    xaxis:{dtick:1,title:"Financial Year"},
    yaxis:{title:"Value ($)"},
    legend:{orientation:"h",x:0,xanchor:"left",y:-.25},
    margin:{t:40}
  },{responsive:true});

  updateScenarioComparison();
}

/*─────────────────────────────────────────────────────────
  Projection logic
─────────────────────────────────────────────────────────*/
const annualInput=document.getElementById("annualPurchase");
["projectionYears","conservativeRate","baseRate","aggressiveRate"].forEach(
 id=>document.getElementById(id).addEventListener("input",updateScenarioComparison)
);
annualInput.addEventListener("focus",e=>{
  e.target.value=e.target.value.replace(/[^0-9.]/g,"");
});
annualInput.addEventListener("blur",e=>{
  const v=parseFloat(e.target.value.replace(/[^0-9.]/g,""))||0;
  e.target.value=fmtCur(v).replace(".00","");
  updateScenarioComparison();
});
annualInput.addEventListener("input",updateScenarioComparison);

function updateScenarioComparison(){
  const yrsFwd=+document.getElementById("projectionYears").value;
  const annual=parseFloat(annualInput.value.replace(/[^0-9.]/g,""))||0;
  const rCons=+document.getElementById("conservativeRate").value/100;
  const rBase=+document.getElementById("baseRate").value/100;
  const rAggr=+document.getElementById("aggressiveRate").value/100;

  const startYear=historicalData.at(-1).year;
  const startPrice=historicalData.at(-1).price;
  const startShares=finalTotalValue/startPrice;

  const proj=rate=>{
    let price=startPrice,totalShares=startShares;
    const purchases=[],yrs=[],vals=[];
    for(let i=0;i<=yrsFwd;i++){
      const yr=startYear+i;
      if(i>0) price*=(1+rate);
      if(i>0 && annual>0){
        const bought=annual/price;
        totalShares+=bought;
        purchases.push(bought);
      }else if(i>0) purchases.push(0);
      const vestIdx=i-vestingPeriod-1;
      if(vestIdx>=0 && purchases[vestIdx]>0){
        totalShares+=purchases[vestIdx]*matchRate;
      }
      yrs.push(yr); vals.push(totalShares*price);
    }
    return{yrs,vals};
  };

  const cons=proj(rCons),base=proj(rBase),aggr=proj(rAggr);

  Plotly.newPlot("scenarioChart",[
    {x:aggr.yrs,y:aggr.vals,name:"Aggressive",
     fill:"tozeroy",fillcolor:"rgba(198,54,99,.5)",
     line:{color:"rgba(198,54,99,.8)"}},
    {x:base.yrs,y:base.vals,name:"Base",
     fill:"tozeroy",fillcolor:"rgba(0,130,186,.5)",
     line:{color:"rgba(0,130,186,.8)"}},
    {x:cons.yrs,y:cons.vals,name:"Conservative",
     fill:"tozeroy",fillcolor:"rgba(67,176,42,.5)",
     line:{color:"rgba(67,176,42,.8)"}}
  ],{
    xaxis:{title:"Financial Year"},
    yaxis:{title:"Projected Value ($)"},
    legend:{orientation:"h",x:0.5,xanchor:"center",y:-0.3},
    margin:{t:40}
  },{responsive:true});

  const tbody=document.getElementById("projectionBody");
  tbody.innerHTML="";
  for(let i=0;i<cons.yrs.length;i++){
    tbody.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${cons.yrs[i]}</td>
        <td>${fmtCur(cons.vals[i])}</td>
        <td>${fmtCur(base.vals[i])}</td>
        <td>${fmtCur(aggr.vals[i])}</td>
      </tr>`);
  }
}

async function loadJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

async function init(){
  try{
    [historicalData,sp500Close] = await Promise.all([
      loadJSON("./data/history.json"),
      loadJSON("./data/sp500.json")
    ]);
    buildUI();
  }catch(err){
    console.error("Failed to load data",err);
    sliderTable.innerHTML = '<tr><td colspan="5">Data load failed.</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', init);
