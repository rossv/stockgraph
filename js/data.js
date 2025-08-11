export const matchRate = 0.25;   // 25% company match
export const vestingPeriod = 5;  // match vests 5 years later

export let historicalData = [];
export let sp500Close = [];

async function fetchJson(url){
  try{
    const res=await fetch(url);
    if(!res.ok){
      throw new Error(`${res.status} ${res.statusText}`);
    }
    return await res.json();
  }catch(err){
    throw new Error(`${err.message} (${url})`);
  }
}

export async function loadData(){
  try{
    [historicalData, sp500Close]=await Promise.all([
      fetchJson('./data/history.json'),
      fetchJson('./data/sp500.json')
    ]);
  }catch(err){
    throw new Error(err.message);
  }
}
