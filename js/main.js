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
    console.error('Failed to load data',err);
    const sliderTable=document.getElementById('sliderTableBody');
    sliderTable.innerHTML='<tr><td colspan="5">Data load failed.</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded',init);
