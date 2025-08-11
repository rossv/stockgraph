import { matchRate, vestingPeriod, historicalData, sp500Close } from './data.js';

export const fmtCur = v => `$${Number(v).toLocaleString(undefined,{maximumFractionDigits:0})}`;
export const fmtPrice = v => `$${Number(v).toFixed(3)}`;
export const fmtNum = v => Number(v).toLocaleString(undefined,{maximumFractionDigits:0});

export let investmentAmounts = [];
export let finalTotalValue = 0;

export function resetInvestmentAmounts(len){
  investmentAmounts = Array(len).fill(0);
}

export function updateCalculation(){
  const summaryBody=document.getElementById('summaryBody');
  const detailedBody=document.getElementById('detailedBody');
  summaryBody.innerHTML=detailedBody.innerHTML='';

  let cumShares=0,cumInvest=0,cumMatchShares=0,spVal=0;
  const yrs=[],invArr=[],empArr=[],totArr=[],spArr=[],roiArr=[];

  historicalData.forEach((rec,idx)=>{
    const invest=investmentAmounts[idx];
    const price =rec.price;
    const empShares=invest/price;
    cumShares+=empShares;
    cumInvest+=invest;

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

    const spClose=sp500Close[idx].close;
    if(idx===0) spVal=invest;
    else{
      const prevClose=sp500Close[idx-1].close;
      spVal=(spVal+invest)*(spClose/prevClose);
    }

    summaryBody.insertAdjacentHTML('beforeend',`
      <tr>
        <td>${rec.year}</td>
        <td>${fmtPrice(price)}</td>
        <td>${fmtCur(cumInvest)}</td>
        <td>${fmtCur(totalVal)}</td>
        <td>${fmtCur(spVal)}</td>
      </tr>`);

    const roiVal=cumInvest>0?((totalVal-cumInvest)/cumInvest)*100:0;
    const roi=roiVal.toFixed(2);
    detailedBody.insertAdjacentHTML('beforeend',`
      <tr>
        <td>${rec.year}</td><td>${fmtPrice(price)}</td>
        <td>${fmtCur(invest)}</td><td>${fmtCur(cumInvest)}</td>
        <td>${fmtNum(empShares)}</td><td>${fmtNum(cumShares)}</td>
        <td>${fmtNum(matchThis)}</td><td>${fmtNum(cumMatchShares)}</td>
        <td>${fmtCur(matchThis*price)}</td>
        <td>${fmtCur(valEmp)}</td><td>${fmtCur(valMatch)}</td>
        <td>${fmtCur(totalVal)}</td><td>${fmtCur(spVal)}</td>
        <td>$${spClose.toLocaleString()}</td><td>${roi}%</td>
      </tr>`);

    yrs.push(rec.year);
    invArr.push(cumInvest); empArr.push(valEmp);
    totArr.push(totalVal);  spArr.push(spVal); roiArr.push(roiVal);
    finalTotalValue=totalVal;
  });

  Plotly.newPlot('chart',[
    {x:yrs,y:invArr,name:'Cumulative\u00A0Invested',
     fill:'tozeroy',fillcolor:'rgba(99,102,106,.5)',
     line:{color:'rgba(99,102,106,.8)'}},
    {x:yrs,y:empArr,name:'Employee\u00A0Shares\u00A0Value',
     fill:'tonexty',fillcolor:'rgba(67,176,42,.5)',
     line:{color:'rgba(67,176,42,.8)'}},
    {x:yrs,y:totArr,name:'Total\u00A0Value\u00A0(Emp+Match)',
     fill:'tonexty',fillcolor:'rgba(0,130,186,.5)',
     line:{color:'rgba(0,130,186,.8)'}},
    {x:yrs,y:spArr,name:'S&P\u00A0500\u00A0(if\u00A0invested)',
     mode:'lines',line:{color:'rgba(198,54,99,1)',width:2}},
    {x:yrs,y:roiArr,name:'ROI\u00A0(%)',mode:'lines',
     line:{color:'rgba(255,165,0,1)',dash:'dash'},yaxis:'y2'}
  ],{
    xaxis:{dtick:1,title:'Financial\u00A0Year'},
    yaxis:{title:'Value\u00A0($)'},
    yaxis2:{title:'ROI\u00A0(%)',overlaying:'y',side:'right',showgrid:false,tick0:0,dtick:100},
    legend:{orientation:'h',x:0,xanchor:'left',y:-.25},
    margin:{t:40},
  },{responsive:true,staticPlot:true,displayModeBar:false,scrollZoom:false,doubleClick:false});

  updateScenarioComparison();
}

export function updateScenarioComparison(){
  const yrsFwd=+document.getElementById('projectionYears').value;
  const annualInput=document.getElementById('annualPurchase');
  const annual=parseFloat(annualInput.value.replace(/[^0-9.]/g,''))||0;
  const rCons=+document.getElementById('conservativeRate').value/100;
  const rBase=+document.getElementById('baseRate').value/100;
  const rAggr=+document.getElementById('aggressiveRate').value/100;

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

  Plotly.newPlot('scenarioChart',[
    {x:aggr.yrs,y:aggr.vals,name:'Aggressive',
     fill:'tozeroy',fillcolor:'rgba(198,54,99,.5)',
     line:{color:'rgba(198,54,99,.8)'}},
    {x:base.yrs,y:base.vals,name:'Base',
     fill:'tozeroy',fillcolor:'rgba(0,130,186,.5)',
     line:{color:'rgba(0,130,186,.8)'}},
    {x:cons.yrs,y:cons.vals,name:'Conservative',
     fill:'tozeroy',fillcolor:'rgba(67,176,42,.5)',
     line:{color:'rgba(67,176,42,.8)'}}
  ],{
    xaxis:{title:'Financial\u00A0Year'},
    yaxis:{title:'Projected\u00A0Value\u00A0($)'},
    legend:{orientation:'h',x:0.5,xanchor:'center',y:-0.3},
    margin:{t:40},
  },{responsive:true,staticPlot:true,displayModeBar:false,scrollZoom:false,doubleClick:false});

  const tbody=document.getElementById('projectionBody');
  tbody.innerHTML='';
  for(let i=0;i<cons.yrs.length;i++){
    tbody.insertAdjacentHTML('beforeend',`
      <tr>
        <td>${cons.yrs[i]}</td>
        <td>${fmtCur(cons.vals[i])}</td>
        <td>${fmtCur(base.vals[i])}</td>
        <td>${fmtCur(aggr.vals[i])}</td>
      </tr>`);
  }
}
