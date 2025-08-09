import { loadData } from './data.js';
import { buildUI } from './ui.js';

async function init(){
  const spinner=document.getElementById('loadingSpinner');
  spinner.classList.remove('d-none');
  try{
    await loadData();
    buildUI();
  }catch(err){
    console.error('Failed to load data',err);
    const sliderTable=document.getElementById('sliderTable');
    sliderTable.innerHTML='<tr><td colspan="5">Data load failed.</td></tr>';
  }finally{
    spinner.classList.add('d-none');
  }
}

document.addEventListener('DOMContentLoaded',init);
