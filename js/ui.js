import { historicalData } from './data.js';
import { fmtCur, fmtPrice, updateCalculation, updateScenarioComparison, investmentAmounts, resetInvestmentAmounts } from './calculator.js';

const sliderTable = document.getElementById('sliderTable');
const STORAGE_INVEST = 'investmentAmounts';
const STORAGE_PROJ = 'projectionParams';

let storageWarningShown = false;
function handleStorageError(err) {
  console.warn('Local storage unavailable; persistence disabled.', err);
  if (!storageWarningShown) {
    const div = document.createElement('div');
    div.className = 'alert alert-warning m-2';
    div.textContent = 'Saving is disabled because local storage is unavailable.';
    document.body.prepend(div);
    storageWarningShown = true;
  }
}

function saveInvestments() {
  try {
    localStorage.setItem(STORAGE_INVEST, JSON.stringify(investmentAmounts));
  } catch (e) {
    handleStorageError(e);
  }
}

function downloadInvestmentsAsJSON() {
  const payload = {
    generatedAt: new Date().toISOString(),
    investments: historicalData.map((rec, idx) => ({
      year: rec.year,
      amount: Number(investmentAmounts[idx]) || 0
    }))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'investments.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

function parseInvestmentPayload(payload) {
  if (!Array.isArray(payload)) {
    throw new Error('Expected an array of investments.');
  }
  const byYear = new Map();
  payload.forEach((entry, idx) => {
    if (typeof entry === 'number') {
      const yr = historicalData[idx]?.year;
      if (yr !== undefined) byYear.set(yr, entry);
      return;
    }
    if (entry && typeof entry === 'object') {
      const yr = ('year' in entry) ? Number(entry.year) : historicalData[idx]?.year;
      if (Number.isNaN(yr) || yr === undefined) {
        throw new Error('Each investment entry must include a valid year.');
      }
      const amt = 'amount' in entry ? entry.amount : (
        'value' in entry ? entry.value : (
          'invested' in entry ? entry.invested : 0
        )
      );
      byYear.set(yr, Number(amt) || 0);
      return;
    }
    throw new Error('Unexpected entry format in investments array.');
  });
  return byYear;
}

function applyLoadedInvestments(byYear) {
  historicalData.forEach((rec, i) => {
    const amt = byYear.has(rec.year) ? Number(byYear.get(rec.year)) || 0 : 0;
    investmentAmounts[i] = amt;
    document.getElementById(`slider-${rec.year}`).value = amt;
    document.getElementById(`number-${rec.year}`).value = fmtCur(amt);
  });
  updateCalculation();
  saveInvestments();
}

function handleInvestmentFile(file, inputEl) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const payload = Array.isArray(parsed) ? parsed : parsed?.investments;
      if (!payload) {
        throw new Error('JSON must include an "investments" array.');
      }
      const byYear = parseInvestmentPayload(payload);
      applyLoadedInvestments(byYear);
    } catch (err) {
      alert(`Failed to load investments: ${err.message}`);
    } finally {
      if (inputEl) inputEl.value = '';
    }
  };
  reader.readAsText(file);
}

function saveProjectionParams() {
  const params = {
    projectionYears: document.getElementById('projectionYears').value,
    conservativeRate: document.getElementById('conservativeRate').value,
    baseRate: document.getElementById('baseRate').value,
    aggressiveRate: document.getElementById('aggressiveRate').value,
    annualPurchase: document.getElementById('annualPurchase').value.replace(/[^0-9.]/g, ''),
    inflationToggle: document.getElementById('inflationToggle').checked,
    inflationRate: document.getElementById('inflationRate').value
  };
  try {
    localStorage.setItem(STORAGE_PROJ, JSON.stringify(params));
  } catch (e) {
    handleStorageError(e);
  }
}

function clearAll() {
  investmentAmounts.fill(0);
  historicalData.forEach(rec => {
    document.getElementById(`slider-${rec.year}`).value = 0;
    document.getElementById(`number-${rec.year}`).value = '$0';
  });
  try {
    localStorage.removeItem(STORAGE_INVEST);
  } catch (e) {
    handleStorageError(e);
  }
  updateCalculation();
}

function generatePresets() {
  const panel = document.getElementById('presetPanel');
  const heading = panel.querySelector('h6')?.outerHTML || '';
  panel.innerHTML = heading;

  const n = historicalData.length, total = 100000, sumSeries = n * (n + 1) / 2;
  const stepUp = Array.from({ length: n }, (_, i) => ((i + 1) / sumSeries) * total);
  const steady = Array(n).fill(total / n);
  const front = Array.from({ length: n }, (_, i) => i < 4 ? 25000 : 0);
  const late = Array.from({ length: n }, (_, i) => i >= n - 4 ? 25000 : 0);

  const presets = [
    { name: 'Step\u00A0Up', values: stepUp },
    { name: 'Slow\u00A0&\u00A0Steady', values: steady },
    { name: 'Front\u00A0Load', values: front },
    { name: 'Late\u00A0Start', values: late }
  ];

  presets.forEach(p => {
    const b = document.createElement('button');
    b.className = 'btn btn-secondary preset-btn me-2 mb-2';
    b.textContent = p.name;
    b.dataset.values = p.values.join(',');
    panel.appendChild(b);
  });

  const controlRow = document.createElement('div');
  controlRow.className = 'd-flex flex-wrap gap-2 mb-2';

  const snap = document.createElement('button');
  snap.type = 'button';
  snap.id = 'snapBtn';
  snap.className = 'btn btn-secondary flex-fill';
  snap.textContent = 'Snap\u00A0Investments\u00A0to\u00A0Stock\u00A0Price';
  snap.addEventListener('click', () => {
    historicalData.forEach((rec, i) => {
      const raw = Number(investmentAmounts[i]);
      const snapVal = Math.round(raw / rec.price) * rec.price;
      investmentAmounts[i] = snapVal;
      document.getElementById(`slider-${rec.year}`).value = snapVal;
      document.getElementById(`number-${rec.year}`).value = fmtCur(snapVal);
    });
    updateCalculation();
    saveInvestments();
    snap.blur();
  });

  const clr = document.createElement('button');
  clr.id = 'clearBtn';
  clr.className = 'btn btn-outline-secondary flex-fill';
  clr.textContent = 'Clear\u00A0All\u00A0Values';

  controlRow.appendChild(snap);
  controlRow.appendChild(clr);
  panel.appendChild(controlRow);

  const ioRow = document.createElement('div');
  ioRow.className = 'd-flex flex-wrap gap-2';

  const saveJson = document.createElement('button');
  saveJson.type = 'button';
  saveJson.className = 'btn btn-outline-secondary flex-fill';
  saveJson.textContent = 'Save\u00A0Investments\u00A0(JSON)';
  saveJson.addEventListener('click', () => {
    downloadInvestmentsAsJSON();
    saveJson.blur();
  });

  const loadJson = document.createElement('button');
  loadJson.type = 'button';
  loadJson.className = 'btn btn-outline-secondary flex-fill';
  loadJson.textContent = 'Load\u00A0Investments\u00A0(JSON)';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  fileInput.className = 'd-none';
  fileInput.addEventListener('change', () => handleInvestmentFile(fileInput.files?.[0], fileInput));

  loadJson.addEventListener('click', () => fileInput.click());

  ioRow.appendChild(saveJson);
  ioRow.appendChild(loadJson);
  panel.appendChild(ioRow);
  panel.appendChild(fileInput);

  panel.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const vals = e.target.dataset.values.split(',').map(Number);
      vals.forEach((v, i) => {
        investmentAmounts[i] = v;
        const yr = historicalData[i].year;
        document.getElementById(`slider-${yr}`).value = v;
        document.getElementById(`number-${yr}`).value = fmtCur(v);
      });
      updateCalculation();
      saveInvestments();
    });
  });
  clr.addEventListener('click', clearAll);
}

export function buildUI() {
  sliderTable.innerHTML = '';
  resetInvestmentAmounts(historicalData.length);

  let storedInvest = [];
  let storedProj = {};
  try {
    storedInvest = JSON.parse(localStorage.getItem(STORAGE_INVEST) || '[]');
    storedProj = JSON.parse(localStorage.getItem(STORAGE_PROJ) || '{}');
  } catch (e) {
    handleStorageError(e);
  }

  // determine an appropriate slider ceiling. Use the largest preset (25k)
  // and any stored investment, then add a small buffer so manual entries
  // aren't immediately clamped.
  const SLIDER_BASE_MAX = 25000; // largest preset value (front/late)
  const SLIDER_BUFFER = 5000;    // allow some headroom for manual input
  const sliderMax = Math.max(SLIDER_BASE_MAX, ...storedInvest) + SLIDER_BUFFER;

  // populate projection inputs if stored
  const projYears = document.getElementById('projectionYears');
  const cons = document.getElementById('conservativeRate');
  const base = document.getElementById('baseRate');
  const aggr = document.getElementById('aggressiveRate');
  const annual = document.getElementById('annualPurchase');
  console.log('Defining sliders...');
  const projYearsSlider = document.getElementById('projectionYearsSlider');
  console.log('Defined projYearsSlider', projYearsSlider);
  const consSlider = document.getElementById('conservativeRateSlider');
  console.log('Defined consSlider', consSlider);
  const baseSlider = document.getElementById('baseRateSlider');
  const aggrSlider = document.getElementById('aggressiveRateSlider');
  const annualSlider = document.getElementById('annualPurchaseSlider');

  if (storedProj.projectionYears !== undefined) {
    console.log('Setting projYears from storage');
    projYears.value = storedProj.projectionYears;
    projYearsSlider.value = storedProj.projectionYears;
  } else {
    console.log('Setting projYears from default');
    projYearsSlider.value = projYears.value;
  }
  console.log('Checking consSlider usage...');
  if (storedProj.conservativeRate !== undefined) {
    console.log('Setting cons from storage');
    cons.value = storedProj.conservativeRate;
    consSlider.value = storedProj.conservativeRate;
  } else {
    console.log('Setting cons from default');
    consSlider.value = cons.value;
  }
  console.log('consSlider usage done');
  if (storedProj.baseRate !== undefined) {
    base.value = storedProj.baseRate;
    baseSlider.value = storedProj.baseRate;
  } else {
    baseSlider.value = base.value;
  }
  if (storedProj.aggressiveRate !== undefined) {
    aggr.value = storedProj.aggressiveRate;
    aggrSlider.value = storedProj.aggressiveRate;
  } else {
    aggrSlider.value = aggr.value;
  }
  if (storedProj.annualPurchase !== undefined) {
    const ap = parseFloat(storedProj.annualPurchase) || 0;
    annual.value = fmtCur(ap);
    annualSlider.value = ap;
  } else {
    annualSlider.value = parseFloat(annual.value.replace(/[^0-9.]/g, '')) || 0;
  }
  if (storedProj.inflationToggle !== undefined) {
    inflToggle.checked = storedProj.inflationToggle;
    inflControls.style.display = inflToggle.checked ? 'block' : 'none';
  }
  if (storedProj.inflationRate !== undefined) {
    inflRate.value = storedProj.inflationRate;
    inflSlider.value = storedProj.inflationRate;
  } else {
    inflSlider.value = inflRate.value;
  }

  historicalData.forEach((rec, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'table-row-anim';
    tr.style.animationDelay = `${idx * 0.05}s`;
    const initVal = storedInvest[idx] || 0;
    investmentAmounts[idx] = initVal;
    tr.innerHTML = `
      <td>${rec.year}</td>
      <td>${fmtPrice(rec.price)}</td>
      <td>
        <div class="slidecontainer">
          <input type="range" class="slider" id="slider-${rec.year}"
                 min="0" max="${sliderMax}" step="any" value="${initVal}">
        </div>
      </td>
      <td><input type="text" id="number-${rec.year}"
                 class="currency-input" value="${fmtCur(initVal)}"></td>
      <td><button class="btn btn-sm btn-outline-primary"
                  onclick="applyToSubsequentYears(${idx})">
            Apply\u00A0\u2192
          </button></td>`;
    sliderTable.appendChild(tr);

    const slider = document.getElementById(`slider-${rec.year}`);
    const number = document.getElementById(`number-${rec.year}`);

    slider.addEventListener('input', e => {
      const raw = +e.target.value;
      const snap = Math.round(raw / rec.price) * rec.price;
      investmentAmounts[idx] = snap;
      slider.value = snap;
      number.value = fmtCur(snap);
      updateCalculation();
      saveInvestments();
    });

    number.addEventListener('focus', e => {
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    });
    number.addEventListener('blur', e => {
      const v = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
      investmentAmounts[idx] = v;
      slider.value = v;
      e.target.value = fmtCur(v);
      updateCalculation();
      saveInvestments();
    });
    number.addEventListener('input', e => {
      const v = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
      investmentAmounts[idx] = v;
      slider.value = v;
      updateCalculation();
      saveInvestments();
    });
  });

  generatePresets();

  updateCalculation();
}

function applyToSubsequentYears(startIdx) {
  const v = investmentAmounts[startIdx];
  historicalData.forEach((rec, i) => {
    if (i >= startIdx) {
      investmentAmounts[i] = v;
      document.getElementById(`slider-${rec.year}`).value = v;
      document.getElementById(`number-${rec.year}`).value = fmtCur(v);
    }
  });
  updateCalculation();
  saveInvestments();
}

window.applyToSubsequentYears = applyToSubsequentYears;

document.getElementById('goToDetailsBtn').addEventListener('click', () => {
  new bootstrap.Tab(document.getElementById('detailed-tab')).show();
});
document.getElementById('goToProjectionBtn').addEventListener('click', () => {
  new bootstrap.Tab(document.getElementById('projected-tab')).show();
});

document.getElementById('projected-tab').addEventListener('shown.bs.tab', () => {
  updateScenarioComparison();
});

const annualInput = document.getElementById('annualPurchase');
const annualSlider = document.getElementById('annualPurchaseSlider');

const projYears = document.getElementById('projectionYears');
const projYearsSlider = document.getElementById('projectionYearsSlider');
projYears.addEventListener('input', () => {
  projYearsSlider.value = projYears.value;
  updateScenarioComparison();
  saveProjectionParams();
});
projYearsSlider.addEventListener('input', () => {
  projYears.value = projYearsSlider.value;
  updateScenarioComparison();
  saveProjectionParams();
});

['conservative', 'base', 'aggressive'].forEach(prefix => {
  const input = document.getElementById(`${prefix}Rate`);
  const slider = document.getElementById(`${prefix}RateSlider`);
  input.addEventListener('input', () => {
    slider.value = input.value;
    updateScenarioComparison();
    saveProjectionParams();
  });
  slider.addEventListener('input', () => {
    input.value = slider.value;
    updateScenarioComparison();
    saveProjectionParams();
  });
});

annualSlider.addEventListener('input', () => {
  const v = +annualSlider.value;
  annualInput.value = fmtCur(v);
  updateScenarioComparison();
  saveProjectionParams();
});
annualInput.addEventListener('focus', e => {
  e.target.value = e.target.value.replace(/[^0-9.]/g, '');
});
annualInput.addEventListener('blur', e => {
  const v = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
  annualSlider.value = v;
  e.target.value = fmtCur(v);
  updateScenarioComparison();
  saveProjectionParams();
});
annualInput.addEventListener('input', e => {
  const v = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
  annualSlider.value = v;
  updateScenarioComparison();
  saveProjectionParams();
});

const inflToggle = document.getElementById('inflationToggle');
const inflControls = document.getElementById('inflationControls');
const inflRate = document.getElementById('inflationRate');
const inflSlider = document.getElementById('inflationRateSlider');

inflToggle.addEventListener('change', () => {
  inflControls.style.display = inflToggle.checked ? 'block' : 'none';
  updateScenarioComparison();
  saveProjectionParams();
});

inflRate.addEventListener('input', () => {
  inflSlider.value = inflRate.value;
  updateScenarioComparison();
  saveProjectionParams();
});

inflSlider.addEventListener('input', () => {
  inflRate.value = inflSlider.value;
  updateScenarioComparison();
  saveProjectionParams();
});

function exportTableToCSV(tableId, filename) {
  const rows = [...document.querySelectorAll(`#${tableId} tr`)];
  const csv = rows.map(r =>
    [...r.querySelectorAll('th,td')]
      .map(c => `"${c.innerText.replace(/"/g, '""')}"`)
      .join(',')
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

document.getElementById('exportCSV').addEventListener('click', () => exportTableToCSV('detailedTable', 'detailed'));
document.getElementById('exportProjectionCSV').addEventListener('click', () => exportTableToCSV('projectionTable', 'projection'));

function downloadChart(id, filename) {
  Plotly.downloadImage(document.getElementById(id), {
    format: 'png', filename
  });
}

document.getElementById('downloadMainChart').addEventListener('click', () =>
  downloadChart('chart', 'stock_value_over_time')
);
document.getElementById('downloadProjectionChart').addEventListener('click', () =>
  downloadChart('scenarioChart', 'projected_growth')
);
