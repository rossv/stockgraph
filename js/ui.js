import { historicalData } from './data.js';
import { fmtCur, fmtPrice, updateCalculation, updateScenarioComparison, investmentAmounts, resetInvestmentAmounts } from './calculator.js';

const sliderTable=document.getElementById('sliderTable');

function clearAll(){
  investmentAmounts.fill(0);
  historicalData.forEach(rec=>{
    document.getElementById(`slider-${rec.year}`).value=0;
    document.getElementById(`number-${rec.year}`).value='$0';
  });
  updateCalculation();
}

function generatePresets(){
  const panel=document.getElementById('presetPanel');
  const heading=panel.querySelector('h6')?.outerHTML || '';
  panel.innerHTML=heading;

  const n=historicalData.length,total=100000,sumSeries=n*(n+1)/2;
  const stepUp=Array.from({length:n},(_,i)=>((i+1)/sumSeries)*total);
  const steady=Array(n).fill(total/n);
  const front =Array.from({length:n},(_,i)=>i<4?25000:0);
  const late  =Array.from({length:n},(_,i)=>i>=n-4?25000:0);

  const presets=[
    {name:'Step\u00A0Up',values:stepUp},
    {name:'Slow\u00A0&\u00A0Steady',values:steady},
    {name:'Front\u00A0Load',values:front},
    {name:'Late\u00A0Start',values:late}
  ];

  presets.forEach(p=>{
    const b=document.createElement('button');
    b.className='btn btn-secondary preset-btn me-2 mb-2';
    b.textContent=p.name;
    b.dataset.values=p.values.join(',');
    panel.appendChild(b);
  });

  const clr=document.createElement('button');
  clr.id='clearBtn';
  clr.className='btn btn-outline-secondary ms-2 mb-2';
  clr.textContent='Clear\u00A0All\u00A0Values';
  panel.appendChild(clr);

  panel.querySelectorAll('.preset-btn').forEach(btn=>{
    btn.addEventListener('click',e=>{
      const vals=e.target.dataset.values.split(',').map(Number);
      vals.forEach((v,i)=>{
        investmentAmounts[i]=v;
        const yr=historicalData[i].year;
        document.getElementById(`slider-${yr}`).value=v;
        document.getElementById(`number-${yr}`).value=fmtCur(v);
      });
      updateCalculation();
    });
  });
  clr.addEventListener('click',clearAll);
}

export function buildUI(){
  sliderTable.innerHTML='';
  resetInvestmentAmounts(historicalData.length);

  historicalData.forEach((rec,idx)=>{
    const tr=document.createElement('tr');
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
            Apply\u00A0\u2192
          </button></td>`;
    sliderTable.appendChild(tr);

    const slider=document.getElementById(`slider-${rec.year}`);
    const number=document.getElementById(`number-${rec.year}`);

    slider.addEventListener('input',e=>{
      const raw=+e.target.value;
      const snap=Math.round(raw/rec.price)*rec.price;
      investmentAmounts[idx]=snap;
      slider.value=snap;
      number.value=fmtCur(snap);
      updateCalculation();
    });

    number.addEventListener('focus',e=>{
      e.target.value=e.target.value.replace(/[^0-9.]/g,'');
    });
    number.addEventListener('blur',e=>{
      const v=parseFloat(e.target.value.replace(/[^0-9.]/g,''))||0;
      investmentAmounts[idx]=v;
      slider.value=v;
      e.target.value=fmtCur(v);
      updateCalculation();
    });
    number.addEventListener('input',e=>{
      const v=parseFloat(e.target.value.replace(/[^0-9.]/g,''))||0;
      investmentAmounts[idx]=v;
      slider.value=v;
      updateCalculation();
    });
  });

  generatePresets();
  updateCalculation();
}

export function applyToSubsequentYears(startIdx){
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

window.applyToSubsequentYears=applyToSubsequentYears;

document.getElementById('snapBtn').addEventListener('click',()=>{
  historicalData.forEach((rec,i)=>{
    const raw=investmentAmounts[i];
    const snap=Math.round(raw/rec.price)*rec.price;
    investmentAmounts[i]=snap;
    document.getElementById(`slider-${rec.year}`).value=snap;
    document.getElementById(`number-${rec.year}`).value=fmtCur(snap);
  });
  updateCalculation();
});

document.getElementById('goToDetailsBtn').addEventListener('click',()=>{
  new bootstrap.Tab(document.getElementById('detailed-tab')).show();
});
document.getElementById('goToProjectionBtn').addEventListener('click',()=>{
  new bootstrap.Tab(document.getElementById('projected-tab')).show();
});

const annualInput=document.getElementById('annualPurchase');
['projectionYears','conservativeRate','baseRate','aggressiveRate'].forEach(
 id=>document.getElementById(id).addEventListener('input',updateScenarioComparison)
);
annualInput.addEventListener('focus',e=>{
  e.target.value=e.target.value.replace(/[^0-9.]/g,'');
});
annualInput.addEventListener('blur',e=>{
  const v=parseFloat(e.target.value.replace(/[^0-9.]/g,''))||0;
  e.target.value=fmtCur(v).replace('.00','');
  updateScenarioComparison();
});
annualInput.addEventListener('input',updateScenarioComparison);

function exportDetailedTable(){
  const rows=[...document.querySelectorAll('#detailedTable tr')];
  const csv=rows.map(r=>
    [...r.querySelectorAll('th,td')]
      .map(c=>`"${c.innerText.replace(/"/g,'""')}"`)
      .join(',')
  ).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download='detailed.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

  document.getElementById('exportCSV').addEventListener('click',exportDetailedTable);

function downloadMainChart(){
  Plotly.downloadImage(document.getElementById('chart'),{
    format:'png',filename:'stock_value_over_time'
  });
}

function downloadProjectionChart(){
  Plotly.downloadImage(document.getElementById('scenarioChart'),{
    format:'png',filename:'projected_growth'
  });
}

document.getElementById('downloadMainChart').addEventListener('click',downloadMainChart);
document.getElementById('downloadProjectionChart').addEventListener('click',downloadProjectionChart);
