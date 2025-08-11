import { loadData } from './data.js';
import { buildUI } from './ui.js';
import { updateCalculation } from './calculator.js';

async function init(){
  try{
    await loadData();
    buildUI();
    const firstTabEl=document.querySelector('#historical-tab');
    if(firstTabEl){
      new bootstrap.Tab(firstTabEl).show();
      updateCalculation();
      firstTabEl.addEventListener('shown.bs.tab', () => {
        const chart=document.getElementById('chart');
        const roiChart=document.getElementById('roiChart');
        if(chart) Plotly.Plots.resize(chart);
        if(roiChart) Plotly.Plots.resize(roiChart);
      });
    }
  }catch(err){
    const message=`Failed to load data: ${err.message}`;
    console.error(message);
    const sliderTable=document.getElementById('sliderTable');
    if(sliderTable){
      sliderTable.innerHTML=`<tr><td colspan="5">${message}</td></tr>`;
    }
  }
}

document.addEventListener('DOMContentLoaded',init);
