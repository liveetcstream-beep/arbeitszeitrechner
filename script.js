/* ==========================================================================
   arbeitszeitrechner365.de - Interactive Calculator & Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initDailyCalc();
  initWeeklyCalc();
  initMonthlyConverter();
  initFaqAccordion();
  loadSavedDailyData();
});

// Toast notification helper
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> ${message}`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// --------------------------------------------------------------------------
// 1. TABS MANAGEMENT
// --------------------------------------------------------------------------
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(targetId);
      if (activePane) {
        activePane.classList.add('active');
      }
    });
  });
}

// --------------------------------------------------------------------------
// 2. DAILY CALCULATOR LOGIC
// --------------------------------------------------------------------------
let breakCount = 1;

function initDailyCalc() {
  const startTimeInput = document.getElementById('daily-start');
  const endTimeInput = document.getElementById('daily-end');
  const targetTimeInput = document.getElementById('daily-target');
  const autoBreakCheckbox = document.getElementById('auto-break');
  const addBreakBtn = document.getElementById('add-break-btn');
  const resetBtn = document.getElementById('reset-daily-btn');
  const copyBtn = document.getElementById('copy-daily-btn');
  const printBtn = document.getElementById('print-daily-btn');
  const presets = document.querySelectorAll('.preset-chip');

  if (startTimeInput) startTimeInput.addEventListener('input', calculateDaily);
  if (endTimeInput) endTimeInput.addEventListener('input', calculateDaily);
  if (targetTimeInput) targetTimeInput.addEventListener('input', calculateDaily);
  if (autoBreakCheckbox) autoBreakCheckbox.addEventListener('change', calculateDaily);

  if (addBreakBtn) {
    addBreakBtn.addEventListener('click', () => {
      const breaksList = document.getElementById('breaks-list');
      if (breaksList.children.length >= 4) {
        showToast('Maximal 4 Pauseneinträge möglich.');
        return;
      }
      breakCount++;
      const breakDiv = document.createElement('div');
      breakDiv.className = 'break-item';
      breakDiv.innerHTML = `
        <label style="font-size: 0.8rem; min-width: 65px; color: var(--text-muted);">${breaksList.children.length + 1}. Pause:</label>
        <input type="number" class="input-field break-min-input" value="15" min="0" max="240" step="5" placeholder="Min.">
        <span style="font-size: 0.85rem; color: var(--text-dim);">Minuten</span>
        <button type="button" class="btn-icon remove-break-btn" title="Pause entfernen">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      `;
      breaksList.appendChild(breakDiv);

      // Add listener to new input
      const newInput = breakDiv.querySelector('.break-min-input');
      newInput.addEventListener('input', calculateDaily);

      // Add listener to remove button
      const removeBtn = breakDiv.querySelector('.remove-break-btn');
      removeBtn.addEventListener('click', () => {
        breakDiv.remove();
        renumberBreaks();
        calculateDaily();
      });

      calculateDaily();
    });
  }

  // Presets click
  presets.forEach(chip => {
    chip.addEventListener('click', () => {
      const start = chip.getAttribute('data-start');
      const end = chip.getAttribute('data-end');
      const pause = chip.getAttribute('data-pause');

      if (startTimeInput) startTimeInput.value = start;
      if (endTimeInput) endTimeInput.value = end;

      // Set first break
      const firstBreak = document.querySelector('.break-min-input');
      if (firstBreak) firstBreak.value = pause;

      calculateDaily();
    });
  });

  // Action buttons
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      startTimeInput.value = '08:00';
      endTimeInput.value = '17:00';
      targetTimeInput.value = '08:00';
      autoBreakCheckbox.checked = false;
      const breaksList = document.getElementById('breaks-list');
      breaksList.innerHTML = `
        <div class="break-item">
          <label style="font-size: 0.8rem; min-width: 65px; color: var(--text-muted);">1. Pause:</label>
          <input type="number" class="input-field break-min-input" value="30" min="0" max="240" step="5" placeholder="Min.">
          <span style="font-size: 0.85rem; color: var(--text-dim);">Minuten</span>
        </div>
      `;
      breaksList.querySelector('.break-min-input').addEventListener('input', calculateDaily);
      calculateDaily();
      showToast('Eingaben zurückgesetzt');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const netVal = document.getElementById('res-net-val').textContent;
      const decVal = document.getElementById('res-dec-val').textContent;
      const grossVal = document.getElementById('res-gross-val').textContent;
      const pauseVal = document.getElementById('res-pause-val').textContent;
      const overVal = document.getElementById('res-overtime-val').textContent;

      const summaryText = `Arbeitszeitberechnung (arbeitszeitrechner365.de):\n- Nettoarbeitszeit: ${netVal} (${decVal})\n- Bruttozeit: ${grossVal}\n- Pause gesamt: ${pauseVal}\n- Überstunden: ${overVal}`;

      navigator.clipboard.writeText(summaryText).then(() => {
        showToast('Ergebnis in Zwischenablage kopiert!');
      });
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Initial Calc
  calculateDaily();
}

function renumberBreaks() {
  const items = document.querySelectorAll('#breaks-list .break-item');
  items.forEach((item, index) => {
    const label = item.querySelector('label');
    if (label) label.textContent = `${index + 1}. Pause:`;
  });
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToFormattedTime(totalMinutes) {
  const isNegative = totalMinutes < 0;
  const absMins = Math.abs(totalMinutes);
  const h = Math.floor(absMins / 60);
  const m = absMins % 60;
  const formatted = `${h}:${m < 10 ? '0' : ''}${m}`;
  return isNegative ? `-${formatted}` : formatted;
}

function calculateDaily() {
  const startStr = document.getElementById('daily-start')?.value || '08:00';
  const endStr = document.getElementById('daily-end')?.value || '17:00';
  const targetStr = document.getElementById('daily-target')?.value || '08:00';
  const autoBreak = document.getElementById('auto-break')?.checked || false;

  let startMins = timeToMinutes(startStr);
  let endMins = timeToMinutes(endStr);
  let targetMins = timeToMinutes(targetStr);

  // Overnight calculation support (Nightshift)
  if (endMins < startMins) {
    endMins += 24 * 60; // add 24 hours
  }

  let grossMins = endMins - startMins;

  // Manual breaks sum
  let manualBreakMins = 0;
  document.querySelectorAll('.break-min-input').forEach(inp => {
    manualBreakMins += Math.max(0, parseInt(inp.value, 10) || 0);
  });

  // Statutory break calculation (ArbZG §4)
  let requiredStatutoryPause = 0;
  if (grossMins > 9 * 60) {
    requiredStatutoryPause = 45;
  } else if (grossMins > 6 * 60) {
    requiredStatutoryPause = 30;
  }

  let effectiveBreakMins = manualBreakMins;
  if (autoBreak) {
    effectiveBreakMins = Math.max(manualBreakMins, requiredStatutoryPause);
  }

  let netMins = Math.max(0, grossMins - effectiveBreakMins);
  let overtimeMins = netMins - targetMins;
  let decimalHours = (netMins / 60).toFixed(2);

  // Update DOM Elements
  const resNet = document.getElementById('res-net-val');
  const resDec = document.getElementById('res-dec-val');
  const resGross = document.getElementById('res-gross-val');
  const resPause = document.getElementById('res-pause-val');
  const resOvertime = document.getElementById('res-overtime-val');
  const legalStatus = document.getElementById('legal-status-box');

  if (resNet) resNet.textContent = minutesToFormattedTime(netMins) + ' Std.';
  if (resDec) resDec.textContent = `= ${decimalHours.replace('.', ',')} Stunden (Dezimal)`;
  if (resGross) resGross.textContent = minutesToFormattedTime(grossMins) + ' h';
  if (resPause) resPause.textContent = effectiveBreakMins + ' Min.';
  
  if (resOvertime) {
    const formattedOvertime = minutesToFormattedTime(overtimeMins);
    resOvertime.textContent = (overtimeMins >= 0 ? '+' : '') + formattedOvertime + ' h';
    resOvertime.style.color = overtimeMins >= 0 ? '#34d399' : '#f87171';
  }

  // Legal Status Update
  if (legalStatus) {
    if (manualBreakMins < requiredStatutoryPause && !autoBreak) {
      legalStatus.className = 'legal-status-indicator warning';
      legalStatus.innerHTML = `⚠️ Mindestpause nach ArbZG §4: ${requiredStatutoryPause} Min. erforderlich (Eingetragen: ${manualBreakMins} Min.)`;
    } else {
      legalStatus.className = 'legal-status-indicator ok';
      legalStatus.innerHTML = `✅ Konform mit ArbZG §4 (Gesetzliche Pausenvorgaben eingehalten)`;
    }
  }

  // Save state locally
  saveDailyState({ startStr, endStr, targetStr, autoBreak, manualBreakMins });
}

function saveDailyState(data) {
  try {
    localStorage.setItem('arbeitszeit_daily_data', JSON.stringify(data));
  } catch (e) {
    // Ignore storage issues
  }
}

function loadSavedDailyData() {
  try {
    const saved = localStorage.getItem('arbeitszeit_daily_data');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.startStr) document.getElementById('daily-start').value = data.startStr;
      if (data.endStr) document.getElementById('daily-end').value = data.endStr;
      if (data.targetStr) document.getElementById('daily-target').value = data.targetStr;
      if (data.autoBreak !== undefined) document.getElementById('auto-break').checked = data.autoBreak;
      calculateDaily();
    }
  } catch (e) {
    // Ignore
  }
}

// --------------------------------------------------------------------------
// 3. WEEKLY CALCULATOR LOGIC
// --------------------------------------------------------------------------
function initWeeklyCalc() {
  const weeklyContainer = document.getElementById('weekly-inputs-body');
  const weeklyTargetInput = document.getElementById('weekly-target-hours');
  const copyMonBtn = document.getElementById('copy-mon-btn');
  const exportWeeklyCsv = document.getElementById('export-weekly-csv');

  if (!weeklyContainer) return;

  const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  
  days.forEach((day, idx) => {
    const isWeekend = idx >= 5;
    const defaultStart = isWeekend ? '' : '08:00';
    const defaultEnd = isWeekend ? '' : '17:00';
    const defaultPause = isWeekend ? '0' : '30';

    const tr = document.createElement('tr');
    tr.className = 'weekly-row';
    tr.dataset.day = day;
    tr.innerHTML = `
      <td style="font-weight: 600; color: var(--text-main);">${day}</td>
      <td><input type="time" class="input-field w-start" value="${defaultStart}"></td>
      <td><input type="time" class="input-field w-end" value="${defaultEnd}"></td>
      <td><input type="number" class="input-field w-pause" value="${defaultPause}" min="0" step="5" style="width: 70px;"></td>
      <td class="w-net-col" style="font-weight: 700; color: #60a5fa;">0:00 h</td>
    `;
    weeklyContainer.appendChild(tr);
  });

  // Attach change event listeners to all weekly inputs
  weeklyContainer.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', calculateWeekly);
  });

  if (weeklyTargetInput) {
    weeklyTargetInput.addEventListener('input', calculateWeekly);
  }

  if (copyMonBtn) {
    copyMonBtn.addEventListener('click', () => {
      const monStart = weeklyContainer.querySelector('.weekly-row:first-child .w-start').value;
      const monEnd = weeklyContainer.querySelector('.weekly-row:first-child .w-end').value;
      const monPause = weeklyContainer.querySelector('.weekly-row:first-child .w-pause').value;

      weeklyContainer.querySelectorAll('.weekly-row').forEach((row, idx) => {
        if (idx < 5) { // Apply to Mon-Fri
          row.querySelector('.w-start').value = monStart;
          row.querySelector('.w-end').value = monEnd;
          row.querySelector('.w-pause').value = monPause;
        }
      });
      calculateWeekly();
      showToast('Montag-Zeiten auf Mo-Fr übertragen!');
    });
  }

  if (exportWeeklyCsv) {
    exportWeeklyCsv.addEventListener('click', () => {
      let csvContent = "Tag;Arbeitsbeginn;Arbeitsende;Pause (Min);Nettoarbeitszeit (h)\n";
      weeklyContainer.querySelectorAll('.weekly-row').forEach(row => {
        const day = row.dataset.day;
        const start = row.querySelector('.w-start').value || '-';
        const end = row.querySelector('.w-end').value || '-';
        const pause = row.querySelector('.w-pause').value || '0';
        const net = row.querySelector('.w-net-col').textContent;
        csvContent += `${day};${start};${end};${pause};${net}\n`;
      });
      
      const totalNet = document.getElementById('w-total-net').textContent;
      const overBalance = document.getElementById('w-overtime-balance').textContent;
      csvContent += `\nGesamt Netto;;;;${totalNet}\n`;
      csvContent += `Überstunden Saldo;;;;${overBalance}\n`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Wochenarbeitszeit_arbeitszeitrechner365.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV-Export heruntergeladen!');
    });
  }

  calculateWeekly();
}

function calculateWeekly() {
  const rows = document.querySelectorAll('.weekly-row');
  let totalWeeklyNetMins = 0;

  rows.forEach(row => {
    const startStr = row.querySelector('.w-start').value;
    const endStr = row.querySelector('.w-end').value;
    const pauseMins = parseInt(row.querySelector('.w-pause').value, 10) || 0;
    const netCol = row.querySelector('.w-net-col');

    if (startStr && endStr) {
      let sMins = timeToMinutes(startStr);
      let eMins = timeToMinutes(endStr);
      if (eMins < sMins) eMins += 24 * 60; // Overnight

      let grossMins = eMins - sMins;
      let netMins = Math.max(0, grossMins - pauseMins);
      totalWeeklyNetMins += netMins;

      netCol.textContent = minutesToFormattedTime(netMins) + ' h';
    } else {
      netCol.textContent = '0:00 h';
    }
  });

  const weeklyTargetHours = parseFloat(document.getElementById('weekly-target-hours')?.value) || 40;
  const targetMins = weeklyTargetHours * 60;
  const overtimeMins = totalWeeklyNetMins - targetMins;

  const wTotalNetEl = document.getElementById('w-total-net');
  const wTotalDecEl = document.getElementById('w-total-dec');
  const wOvertimeBalanceEl = document.getElementById('w-overtime-balance');

  if (wTotalNetEl) wTotalNetEl.textContent = minutesToFormattedTime(totalWeeklyNetMins) + ' Std.';
  if (wTotalDecEl) wTotalDecEl.textContent = `= ${(totalWeeklyNetMins / 60).toFixed(2).replace('.', ',')} Dezimalstunden`;
  
  if (wOvertimeBalanceEl) {
    const formattedOvertime = minutesToFormattedTime(overtimeMins);
    wOvertimeBalanceEl.textContent = (overtimeMins >= 0 ? '+' : '') + formattedOvertime + ' h';
    wOvertimeBalanceEl.style.color = overtimeMins >= 0 ? '#34d399' : '#f87171';
  }
}

// --------------------------------------------------------------------------
// 4. MONTHLY & DECIMAL CONVERTER LOGIC
// --------------------------------------------------------------------------
function initMonthlyConverter() {
  const timeInput = document.getElementById('conv-time-str');
  const decInput = document.getElementById('conv-dec-val');
  const weeklyHoursInput = document.getElementById('conv-weekly-hrs');
  const weekFactorInput = document.getElementById('conv-week-factor');

  if (timeInput) {
    timeInput.addEventListener('input', () => {
      const val = timeInput.value;
      if (val.includes(':')) {
        const mins = timeToMinutes(val);
        const dec = (mins / 60).toFixed(2);
        document.getElementById('conv-time-res').textContent = `${dec.replace('.', ',')} Dezimalstunden`;
      }
    });
  }

  if (decInput) {
    decInput.addEventListener('input', () => {
      const val = parseFloat(decInput.value.replace(',', '.'));
      if (!isNaN(val)) {
        const totalMins = Math.round(val * 60);
        document.getElementById('conv-dec-res').textContent = `${minutesToFormattedTime(totalMins)} (Stunden:Minuten)`;
      }
    });
  }

  const calcMonthlyHours = () => {
    const wHours = parseFloat(weeklyHoursInput?.value) || 40;
    const factor = parseFloat(weekFactorInput?.value) || 4.35;
    const monthlyHours = (wHours * factor).toFixed(1);
    const yearlyHours = Math.round(wHours * 52);

    const mResEl = document.getElementById('conv-monthly-res');
    const yResEl = document.getElementById('conv-yearly-res');

    if (mResEl) mResEl.textContent = `${monthlyHours.replace('.', ',')} h / Monat`;
    if (yResEl) yResEl.textContent = `${yearlyHours} h / Jahr`;
  };

  if (weeklyHoursInput) weeklyHoursInput.addEventListener('input', calcMonthlyHours);
  if (weekFactorInput) weekFactorInput.addEventListener('change', calcMonthlyHours);
  calcMonthlyHours();
}

// --------------------------------------------------------------------------
// 5. FAQ ACCORDION
// --------------------------------------------------------------------------
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(i => i.classList.remove('active'));

        // Toggle clicked
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}
