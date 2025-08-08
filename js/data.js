export const matchRate = 0.25;   // 25% company match
export const vestingPeriod = 5;  // match vests 5 years later

export let historicalData = [];
export let sp500Close = [];

export async function loadData(){
  const [histRes, spRes] = await Promise.all([
    fetch('./data/history.json'),
    fetch('./data/sp500.json')
  ]);
  if(!histRes.ok || !spRes.ok){
    throw new Error('Failed to load data');
  }
  historicalData = await histRes.json();
  sp500Close = await spRes.json();
}
