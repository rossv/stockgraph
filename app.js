/*──────────────────────────────────────────────────────
  app.js  –  full version (12 May 2025)
──────────────────────────────────────────────────────*/

/* ── Constants & split‑adjusted prices (3‑decimal) ── */
const matchRate=0.25, vestingPeriod=5;
const historicalData=[
  1996,1997,1998,1999,2000,2001,2002,2003,2004,
  2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,
  2015,2016,2017,2018,2019,2020,2021,2022,2023,2024
].map((yr,i)=>({
  year:yr,
  price:[
    0.160,0.181,0.186,0.227,0.300,0.346,0.408,0.519,0.638,0.740,
    0.669,0.753,0.532,0.582,0.463,0.501,0.446,0.652,0.941,1.120,
    1.213,1.360,1.328,1.476,1.970,3.530,4.372,5.102,6.235
  ][i]
}));

/* unchanged S&P array (omitted here for brevity) */
const sp500Close=[653.7,759.6,737.7,1294,1499,1160,1147,858.5,1132,1173,
1295,1421,1370,811.1,1178,1332,1408,1562,1886,2060,2073,2363,2641,2867,2471,
4020,4546,3577,5244].map((c,i)=>({year:1996+i,close:c}));

/* ── State ─────────────────────────────────────────── */
let investmentAmounts=Array(historicalData.length).fill(0);
let finalTotalValue=0;

/* ── Helpers ───────────────────────────────────────── */
const formatCurrency=v=>v===null?'-':`$${Number(v).toLocaleString(
  undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const formatPrice=v=>`$${Number(v).toFixed(3)}`;   // 3‑decimal

/* ── Build slider rows ─────────────────────────────── */
const sliderTable=document.getElementById("sliderTable");
historicalData.forEach((rec,idx)=>{
  const tr=document.createElement("tr");
  tr.innerHTML=`
    <td>${rec.year}</td>
    <td>${formatPrice(rec.price)}</td>
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
         Apply to All Following Years
       </button></td>`;
  sliderTable.appendChild(tr);

  /* sync slider ↔ textbox */
  const slider=tr.querySelector(`#slider-${rec.year}`);
  const number=tr.querySelector(`#number-${rec.year}`);

  slider.addEventListener("input",e=>{
    const raw=+e.target.value;
    const snapped=Math.round(raw/rec.price)*rec.price; /* nearest */
    investmentAmounts[idx]=snapped;
    slider.value=snapped;
    number.value=formatCurrency(snapped);
    updateCalculation();
  });

  /* focus removes formatting, blur re‑formats */
  number.addEventListener("focus",e=>{
    const val=e.target.value.replace(/[^0-9.]/g,"");
    e.target.value=val==="0.00"||val==="0"?"":val;
  });
  number.addEventListener("blur",e=>{
    let v=parseFloat(e.target.value.replace(/[^0-9.]/g,""))||0;
    investmentAmounts[idx]=v;
    e.target.value=formatCurrency(v);
    updateCalculation();
  });
  number.addEventListener("input",e=>{
    let v=parseFloat(e.target.value.replace(/[^0-9.]/g,""))||0;
    investmentAmounts[idx]=v;
    updateCalculation();
  });
});

/* ── Preset buttons + Clear All ───────────────────── */
function generatePresets(){
  const panel=document.getElementById("presetPanel");
  panel.innerHTML="";
  const n=historicalData.length,total=100000,
        sumSeries=n*(n+1)/2,
        stepUp=Array.from({length:n},(_,i)=>((i+1)/sumSeries)*total),
        steady=Array(n).fill(total/n),
        front =Array.from({length:n},(_,i)=>i<4?25000:0),
        late  =Array.from({length:n},(_,i)=>i>=n-4?25000:0);

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
      e.target.blur();
      const vals=e.target.dataset.values.split(",").map(Number);
      vals.forEach((v,i)=>{
        investmentAmounts[i]=v;
        const yr=historicalData[i].year;
        document.getElementById(`slider-${yr}`).value=v;
        document.getElementById(`number-${yr}`).value=formatCurrency(v);
      });
      updateCalculation();
    });
  });
  clr.addEventListener("click",clearAll);
}
generatePresets();

/* ── Clear & Snap helpers ─────────────────────────── */
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
    const snapped=Math.round(raw/rec.price)*rec.price;
    investmentAmounts[i]=snapped;
    document.getElementById(`slider-${rec.year}`).value=snapped;
    document.getElementById(`number-${rec.year}`).value=formatCurrency(snapped);
  });
  updateCalculation();
});

/* ── NAV shortcuts ────────────────────────────────── */
document.getElementById("goToDetailsBtn").addEventListener("click",()=>{
  new bootstrap.Tab(document.getElementById("detailed-tab")).show();
});
document.getElementById("goToProjectionBtn").addEventListener("click",()=>{
  new bootstrap.Tab(document.getElementById("projected-tab")).show();
});

/* ── Historical calc & chart ──────────────────────── */
function updateCalculation(){
  const summaryBody=document.getElementById("summaryBody");
  const detailedBody=document.getElementById("detailedBody");
  summaryBody.innerHTML=detailedBody.innerHTML="";

  let cumShares=0,cumInvest=0,cumMatchShares=0,spVal=0;
  const years=[], investedArr=[], empValArr=[], totalArr=[], spArr=[];

  historicalData.forEach((rec,idx)=>{
    const invest=investmentAmounts[idx];
    const price=rec.price;
    const empShares=invest/price;
    cumShares+=empShares;
    cumInvest+=invest;

    /* vesting */
    let matchThisYear=0;
    if(idx>=vestingPeriod){
      const investAgo=investmentAmounts[idx-vestingPeriod];
      if(investAgo>0){
        const priceAgo=historicalData[idx-vestingPeriod].price;
        matchThisYear=Math.round((investAgo/priceAgo)*matchRate);
        cumMatchShares+=matchThisYear;
      }
    }

    const valEmp=cumShares*price;
    const valMatch=cumMatchShares*price;
    const totalVal=valEmp+valMatch;

    /* simple S&P progression */
    const spClose=sp500Close[idx].close;
    if(idx===0){ spVal=invest; }
    else{
      const prevClose=sp500Close[idx-1].close;
      spVal=(spVal+invest)*(spClose/prevClose);
    }

    /* build rows */
    summaryBody.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${rec.year}</td>
        <td>${formatPrice(price)}</td>
        <td>${formatCurrency(cumInvest)}</td>
        <td>${formatCurrency(totalVal)}</td>
        <td>${formatCurrency(spVal)}</td>
      </tr>`);
    const roi=cumInvest>0?((totalVal-cumInvest)/cumInvest*100).toFixed(2):"0.00";
    detailedBody.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${rec.year}</td>
        <td>${formatPrice(price)}</td>
        <td>${formatCurrency(invest)}</td>
        <td>${formatCurrency(cumInvest)}</td>
        <td>${empShares.toFixed(2)}</td>
        <td>${cumShares.toFixed(2)}</td>
        <td>${matchThisYear}</td>
        <td>${cumMatchShares}</td>
        <td>${formatCurrency(matchThisYear*price)}</td>
        <td>${formatCurrency(valEmp)}</td>
        <td>${formatCurrency(valMatch)}</td>
        <td>${formatCurrency(totalVal)}</td>
        <td>${formatCurrency(spVal)}</td>
        <td>$${spClose.toLocaleString()}</td>
        <td>${roi}%</td>
      </tr>`);

    years.push(rec.year);
    investedArr.push(cumInvest);
    empValArr.push(valEmp);
    totalArr.push(totalVal);
    spArr.push(spVal);
    finalTotalValue=totalVal;
  });

  /* Plot historical */
  Plotly.newPlot("chart",[
    {x:years,y:investedArr,name:"Cumulative Invested",
     fill:"tozeroy",fillcolor:"rgba(99,102,106,.5)",
     line:{color:"rgba(99,102,106,.8)"}},
    {x:years,y:empValArr,name:"Employee Shares Value",
     fill:"tonexty",fillcolor:"rgba(67,176,42,.5)",
     line:{color:"rgba(67,176,42,.8)"}},
    {x:years,y:totalArr,name:"Total Value (Emp+Match)",
     fill:"tonexty",fillcolor:"rgba(0,130,186,.5)",
     line:{color:"rgba(0,130,186,.8)"}},
    {x:years,y:spArr,name:"S&P 500 (if invested)",
     mode:"lines",line:{color:"rgba(198,54,99,1)",width:2}}
  ],{
    xaxis:{dtick:1,title:"Financial Year"},
    yaxis:{title:"Value ($)"},
    legend:{orientation:"h",x:0,xanchor:"left",y:-.25},
    margin:{t:40}
  },{responsive:true});

  updateScenarioComparison();
}

/* ── Annual purchase input (currency formatting) ──── */
const annualInput=document.getElementById("annualPurchase");
annualInput.addEventListener("focus",e=>{
  e.target.value=e.target.value.replace(/[^0-9.]/g,"");
});
annualInput.addEventListener("blur",e=>{
  let v=parseFloat(e.target.value.replace(/[^0-9.]/g,""))||0;
  e.target.value=formatCurrency(v).replace(".00","");
  updateScenarioComparison();
});
annualInput.addEventListener("input",()=>updateScenarioComparison());

/* ── Projection tab calc & chart ───────────────────── */
["projectionYears","conservativeRate","baseRate","aggressiveRate"]
  .forEach(id=>document.getElementById(id)
  .addEventListener("input",updateScenarioComparison));

function updateScenarioComparison(){
  const yrsFwd=+document.getElementById("projectionYears").value;
  const annual=parseFloat(
    annualInput.value.replace(/[^0-9.]/g,""))||0;
  const rCons=+document.getElementById("conservativeRate").value/100;
  const rBase=+document.getElementById("baseRate").value/100;
  const rAggr=+document.getElementById("aggressiveRate").value/100;

  const startYear=historicalData.at(-1).year;
  const startPrice=historicalData.at(-1).price;
  const startShares=finalTotalValue/startPrice;

  function proj(rate){
    let price=startPrice,totalShares=startShares;
    const purchases=[];
    const yrs=[],vals=[];
    for(let i=0;i<=yrsFwd;i++){
      const yr=startYear+i;
      if(i>0){ price*=(1+rate); }
      if(i>0&&annual>0){
        const bought=annual/price;
        totalShares+=bought;
        purchases.push(bought);
      }else if(i>0) purchases.push(0);
      const vestIdx=i-vestingPeriod-1;
      if(vestIdx>=0&&purchases[vestIdx]>0){
        totalShares+=purchases[vestIdx]*matchRate;
      }
      yrs.push(yr);
      vals.push(totalShares*price);
    }
    return{yrs,vals};
  }

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
    legend:{orientation:"h",x:0.5,xanchor:"center",y:-0.30},
    margin:{t:40}
  },{responsive:true});

  const tbody=document.getElementById("projectionBody");
  tbody.innerHTML="";
  for(let i=0;i<cons.yrs.length;i++){
    tbody.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${cons.yrs[i]}</td>
        <td>${formatCurrency(cons.vals[i])}</td>
        <td>${formatCurrency(base.vals[i])}</td>
        <td>${formatCurrency(aggr.vals[i])}</td>
      </tr>`);
  }
}

/* ── Initial render ───────────────────────────────── */
updateCalculation();
