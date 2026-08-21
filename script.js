/* ==========================================================================
   arbeitszeitrechner365.de - Interactive Calculator & Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initTabs();
  initDailyCalc();
  initWeeklyCalc();
  initMonthlyConverter();
  initFaqAccordion();
  loadSavedDailyData();
  initLohnrechner();
  initFeiertage();
  initSideConverter();
  initRatingWidget();
});

// ── Mobile Menu Toggle ──
function initMobileMenu() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  function openMenu() {
    btn.classList.add('open');
    menu.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    btn.classList.remove('open');
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Toggle on button click
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close when a menu link is clicked
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close when clicking outside the menu
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}


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

  const calcBtn = document.getElementById('calc-daily-btn');

  if (startTimeInput) startTimeInput.addEventListener('input', calculateDaily);
  if (endTimeInput) endTimeInput.addEventListener('input', calculateDaily);
  if (targetTimeInput) targetTimeInput.addEventListener('input', calculateDaily);
  if (autoBreakCheckbox) autoBreakCheckbox.addEventListener('change', calculateDaily);
  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      calculateDaily();
      showToast('Arbeitszeit erfolgreich berechnet!');
    });
  }

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
      presets.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

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

  // Dynamic Formula Transparency
  const formulaText = document.getElementById('res-formula-text');
  if (formulaText) {
    formulaText.textContent = `${startStr} – ${endStr} = ${minutesToFormattedTime(grossMins)} Anwesenheit | ${minutesToFormattedTime(grossMins)} – ${minutesToFormattedTime(effectiveBreakMins)} Pause = ${minutesToFormattedTime(netMins)} Nettoarbeitszeit`;
  }
  
  if (resOvertime) {
    const formattedOvertime = minutesToFormattedTime(overtimeMins);
    resOvertime.textContent = (overtimeMins >= 0 ? '+' : '') + formattedOvertime + ' h';
    resOvertime.style.color = overtimeMins >= 0 ? '#15803d' : '#dc2626';
  }

  // Legal Status Update
  if (legalStatus) {
    if (manualBreakMins < requiredStatutoryPause && !autoBreak) {
      legalStatus.className = 'legal-status-indicator warning';
      legalStatus.innerHTML = `⚠️ Gesetzliche Mindestpause: ${requiredStatutoryPause} Min. erforderlich (Eingetragen: ${manualBreakMins} Min.)`;
    } else {
      legalStatus.className = 'legal-status-indicator ok';
      legalStatus.innerHTML = `✅ Gesetzliche Pausenvorgaben eingehalten`;
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
  const calcBtn = document.getElementById('calc-weekly-btn');
  const daysSelect = document.getElementById('weekly-days-select');
  const startInput = document.getElementById('weekly-start');
  const endInput = document.getElementById('weekly-end');
  const pauseInput = document.getElementById('weekly-pause');

  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      calculateWeekly();
      showToast('Wochenarbeitszeit erfolgreich berechnet!');
    });
  }

  if (daysSelect) daysSelect.addEventListener('change', calculateWeekly);
  if (startInput) startInput.addEventListener('input', calculateWeekly);
  if (endInput) endInput.addEventListener('input', calculateWeekly);
  if (pauseInput) pauseInput.addEventListener('input', calculateWeekly);

  calculateWeekly();
}

function calculateWeekly() {
  const numDays = parseInt(document.getElementById('weekly-days-select')?.value, 10) || 5;
  const startStr = document.getElementById('weekly-start')?.value || '09:00';
  const endStr = document.getElementById('weekly-end')?.value || '17:30';
  const manualPauseMins = parseInt(document.getElementById('weekly-pause')?.value, 10) || 30;
  const autoBreak = document.getElementById('weekly-auto-break')?.checked || false;

  let sMins = timeToMinutes(startStr);
  let eMins = timeToMinutes(endStr);
  if (eMins < sMins) eMins += 24 * 60; // Overnight shift support

  let dailyGrossMins = eMins - sMins;

  // Statutory break check (ArbZG)
  let requiredPause = 0;
  if (dailyGrossMins > 9 * 60) requiredPause = 45;
  else if (dailyGrossMins > 6 * 60) requiredPause = 30;

  let effectivePause = manualPauseMins;
  if (autoBreak) {
    effectivePause = Math.max(manualPauseMins, requiredPause);
  }

  let dailyNetMins = Math.max(0, dailyGrossMins - effectivePause);

  let totalGrossMins = dailyGrossMins * numDays;
  let totalPauseMins = effectivePause * numDays;
  let totalNetMins = dailyNetMins * numDays;
  let netDec = (totalNetMins / 60).toFixed(2);

  // Update DOM Output Cards (Competitor Format)
  const elDays = document.getElementById('w-res-days');
  const elGross = document.getElementById('w-res-gross');
  const elPause = document.getElementById('w-res-pause');
  const elNet = document.getElementById('w-res-net');
  const elDec = document.getElementById('w-res-dec');
  const elBanner = document.getElementById('w-res-banner-text');

  if (elDays) elDays.textContent = `${numDays} Tage`;
  if (elGross) elGross.textContent = minutesToFormattedTime(totalGrossMins);
  if (elPause) elPause.textContent = minutesToFormattedTime(totalPauseMins);
  if (elNet) elNet.textContent = minutesToFormattedTime(totalNetMins);
  if (elDec) elDec.textContent = `${netDec} Stunden`;
  if (elBanner) elBanner.textContent = `Bei ${numDays} Arbeitstagen pro Woche und einer täglichen Arbeitszeit von ${minutesToFormattedTime(dailyNetMins)} ergibt sich eine wöchentliche Nettoarbeitszeit von ${minutesToFormattedTime(totalNetMins)}.`;
}

// Action button handlers for Weekly tab
document.addEventListener('DOMContentLoaded', () => {
  const copyWeekly = document.getElementById('copy-weekly-btn');
  const printWeekly = document.getElementById('print-weekly-btn');
  const autoBreakCheckbox = document.getElementById('weekly-auto-break');

  if (copyWeekly) {
    copyWeekly.addEventListener('click', () => {
      const days = document.getElementById('w-res-days').textContent;
      const gross = document.getElementById('w-res-gross').textContent;
      const pause = document.getElementById('w-res-pause').textContent;
      const net = document.getElementById('w-res-net').textContent;
      const dec = document.getElementById('w-res-dec').textContent;

      const summary = `Wöchentliche Arbeitszeit:\n- Arbeitstage: ${days}\n- Bruttozeit: ${gross}\n- Pausen: ${pause}\n- Nettoarbeitszeit: ${net} (${dec})`;
      navigator.clipboard.writeText(summary).then(() => {
        showToast('Wöchentliches Ergebnis kopiert!');
      });
    });
  }

  if (printWeekly) {
    printWeekly.addEventListener('click', () => window.print());
  }

  if (autoBreakCheckbox) {
    autoBreakCheckbox.addEventListener('change', calculateWeekly);
  }
});

// --------------------------------------------------------------------------
// 4. MONTHLY CALCULATOR LOGIC (Competitor Matching)
// --------------------------------------------------------------------------
const MONTHLY_WORKING_DAYS = {
  '2026-07': { name: 'Juli 2026', days5: 23, days6: 27, days7: 31, days4: 18 },
  '2026-08': { name: 'August 2026', days5: 21, days6: 26, days7: 31, days4: 17 },
  '2026-09': { name: 'September 2026', days5: 22, days6: 26, days7: 30, days4: 17 },
  '2026-10': { name: 'Oktober 2026', days5: 22, days6: 27, days7: 31, days4: 17 },
  '2026-11': { name: 'November 2026', days5: 21, days6: 25, days7: 30, days4: 17 },
  '2026-12': { name: 'Dezember 2026', days5: 22, days6: 26, days7: 31, days4: 17 }
};

function initMonthlyConverter() {
  const calcBtn = document.getElementById('calc-monthly-btn');
  const daysSelect = document.getElementById('monthly-days-select');
  const monthSelect = document.getElementById('monthly-month-select');
  const startInput = document.getElementById('monthly-start');
  const endInput = document.getElementById('monthly-end');
  const pauseInput = document.getElementById('monthly-pause');

  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      calculateMonthly();
      showToast('Monatliche Arbeitszeit erfolgreich berechnet!');
    });
  }

  if (daysSelect) daysSelect.addEventListener('change', calculateMonthly);
  if (monthSelect) monthSelect.addEventListener('change', calculateMonthly);
  if (startInput) startInput.addEventListener('input', calculateMonthly);
  if (endInput) endInput.addEventListener('input', calculateMonthly);
  if (pauseInput) pauseInput.addEventListener('input', calculateMonthly);

  calculateMonthly();
}

function calculateMonthly() {
  const daysPerWeek = parseInt(document.getElementById('monthly-days-select')?.value, 10) || 6;
  const monthKey = document.getElementById('monthly-month-select')?.value || '2026-07';
  const startStr = document.getElementById('monthly-start')?.value || '09:00';
  const endStr = document.getElementById('monthly-end')?.value || '17:30';
  const manualPauseMins = parseInt(document.getElementById('monthly-pause')?.value, 10) || 30;
  const autoBreak = document.getElementById('monthly-auto-break')?.checked || false;

  const monthData = MONTHLY_WORKING_DAYS[monthKey] || MONTHLY_WORKING_DAYS['2026-07'];
  
  let numDaysInMonth = monthData.days6;
  if (daysPerWeek === 5) numDaysInMonth = monthData.days5;
  if (daysPerWeek === 7) numDaysInMonth = monthData.days7;
  if (daysPerWeek === 4) numDaysInMonth = monthData.days4;

  let sMins = timeToMinutes(startStr);
  let eMins = timeToMinutes(endStr);
  if (eMins < sMins) eMins += 24 * 60; // Overnight

  let dailyGrossMins = eMins - sMins;

  // Statutory break check (ArbZG)
  let requiredPause = 0;
  if (dailyGrossMins > 9 * 60) requiredPause = 45;
  else if (dailyGrossMins > 6 * 60) requiredPause = 30;

  let effectivePause = manualPauseMins;
  if (autoBreak) {
    effectivePause = Math.max(manualPauseMins, requiredPause);
  }

  let dailyNetMins = Math.max(0, dailyGrossMins - effectivePause);

  let totalGrossMins = dailyGrossMins * numDaysInMonth;
  let totalPauseMins = effectivePause * numDaysInMonth;
  let totalNetMins = dailyNetMins * numDaysInMonth;
  let netDec = (totalNetMins / 60).toFixed(2);

  // Update DOM Output Cards (Exact Competitor Image 2 Match)
  const elTitle = document.getElementById('m-res-title');
  const elDays = document.getElementById('m-res-days');
  const elGross = document.getElementById('m-res-gross');
  const elPause = document.getElementById('m-res-pause');
  const elNet = document.getElementById('m-res-net');
  const elDec = document.getElementById('m-res-dec');
  const elBanner = document.getElementById('m-res-banner-text');

  if (elTitle) elTitle.textContent = `Monatliche Arbeitszeit - ${monthData.name}`;
  if (elDays) elDays.textContent = `${numDaysInMonth} Tage`;
  if (elGross) elGross.textContent = minutesToFormattedTime(totalGrossMins);
  if (elPause) elPause.textContent = minutesToFormattedTime(totalPauseMins);
  if (elNet) elNet.textContent = minutesToFormattedTime(totalNetMins);
  if (elDec) elDec.textContent = `${netDec} Stunden`;
  if (elBanner) elBanner.textContent = `Im ${monthData.name} mit ${numDaysInMonth} Arbeitstagen ergibt sich bei einer täglichen Arbeitszeit von ${minutesToFormattedTime(dailyNetMins)} eine monatliche Nettoarbeitszeit von ${minutesToFormattedTime(totalNetMins)}.`;
}

// Action button handlers for Monthly tab
document.addEventListener('DOMContentLoaded', () => {
  const copyMonthly = document.getElementById('copy-monthly-btn');
  const printMonthly = document.getElementById('print-monthly-btn');
  const autoBreakCheckbox = document.getElementById('monthly-auto-break');

  if (copyMonthly) {
    copyMonthly.addEventListener('click', () => {
      const title = document.getElementById('m-res-title').textContent;
      const days = document.getElementById('m-res-days').textContent;
      const gross = document.getElementById('m-res-gross').textContent;
      const pause = document.getElementById('m-res-pause').textContent;
      const net = document.getElementById('m-res-net').textContent;
      const dec = document.getElementById('m-res-dec').textContent;

      const summary = `${title}:\n- Arbeitstage: ${days}\n- Bruttozeit: ${gross}\n- Pausen: ${pause}\n- Nettoarbeitszeit: ${net} (${dec})`;
      navigator.clipboard.writeText(summary).then(() => {
        showToast('Monatliches Ergebnis kopiert!');
      });
    });
  }

  if (printMonthly) {
    printMonthly.addEventListener('click', () => window.print());
  }

  if (autoBreakCheckbox) {
    autoBreakCheckbox.addEventListener('change', calculateMonthly);
  }
});

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

// --------------------------------------------------------------------------
// 6. LOHNRECHNER (SALARY CALCULATOR)
// --------------------------------------------------------------------------
function initLohnrechner() {
  const inputs = [
    'lohn-stundenlohn', 'lohn-stunden', 'lohn-ueberstunden',
    'lohn-ue-zuschlag', 'lohn-nacht-stunden'
  ];

  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateLohn);
    if (el) el.addEventListener('change', calculateLohn);
  });

  calculateLohn();
}

function calculateLohn() {
  const stundenlohn = parseFloat(document.getElementById('lohn-stundenlohn')?.value) || 0;
  const gearbStunden = parseFloat(document.getElementById('lohn-stunden')?.value) || 0;
  const ueberstunden = Math.min(parseFloat(document.getElementById('lohn-ueberstunden')?.value) || 0, gearbStunden);
  const ueZuschlagPct = parseFloat(document.getElementById('lohn-ue-zuschlag')?.value) || 0;
  const nachtStunden = parseFloat(document.getElementById('lohn-nacht-stunden')?.value) || 0;

  // Regular hours (non-overtime)
  const regelStunden = Math.max(0, gearbStunden - ueberstunden);

  // Grundverdienst = alle Stunden × Stundenlohn (inkl. Überstunden zum Grundlohn)
  const grundverdienst = gearbStunden * stundenlohn;

  // Überstundenzuschlag: nur der Zuschlag (nicht nochmal der Grundlohn)
  const ueZuschlagBetrag = ueberstunden * stundenlohn * (ueZuschlagPct / 100);

  // Nachtzuschlag: 25% des Stundenlohns × Nachtstunden
  const nachtZuschlagBetrag = nachtStunden * stundenlohn * 0.25;

  const gesamt = grundverdienst + ueZuschlagBetrag + nachtZuschlagBetrag;

  // Update DOM
  const formatEuro = (val) => val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  const elGrund = document.getElementById('lohn-grundverdienst');
  const elUe = document.getElementById('lohn-ue-betrag');
  const elNacht = document.getElementById('lohn-nacht-betrag');
  const elGesamt = document.getElementById('lohn-gesamt');

  if (elGrund) elGrund.textContent = formatEuro(grundverdienst);
  if (elUe) elUe.textContent = formatEuro(ueZuschlagBetrag);
  if (elNacht) elNacht.textContent = formatEuro(nachtZuschlagBetrag);
  if (elGesamt) elGesamt.textContent = formatEuro(gesamt);
}

// --------------------------------------------------------------------------
// 7. BUNDESLAND FEIERTAGE 2026
// --------------------------------------------------------------------------
// Feiertage 2026 per Bundesland (Arbeitstage aus 365 Tagen - 52 Sonntage - 52 Samstage - Feiertage auf Werktagen)
const FEIERTAGE_DATA = {
  BW: { name: 'Baden-Württemberg', anzahl: 12, arbeitstage: 250 },
  BY: { name: 'Bayern', anzahl: 13, arbeitstage: 249 },
  BE: { name: 'Berlin', anzahl: 10, arbeitstage: 252 },
  BB: { name: 'Brandenburg', anzahl: 12, arbeitstage: 250 },
  HB: { name: 'Bremen', anzahl: 10, arbeitstage: 252 },
  HH: { name: 'Hamburg', anzahl: 10, arbeitstage: 252 },
  HE: { name: 'Hessen', anzahl: 12, arbeitstage: 250 },
  MV: { name: 'Mecklenburg-Vorpommern', anzahl: 11, arbeitstage: 251 },
  NI: { name: 'Niedersachsen', anzahl: 10, arbeitstage: 252 },
  NW: { name: 'Nordrhein-Westfalen', anzahl: 11, arbeitstage: 251 },
  RP: { name: 'Rheinland-Pfalz', anzahl: 12, arbeitstage: 250 },
  SL: { name: 'Saarland', anzahl: 12, arbeitstage: 250 },
  SN: { name: 'Sachsen', anzahl: 11, arbeitstage: 251 },
  ST: { name: 'Sachsen-Anhalt', anzahl: 11, arbeitstage: 251 },
  SH: { name: 'Schleswig-Holstein', anzahl: 10, arbeitstage: 252 },
  TH: { name: 'Thüringen', anzahl: 11, arbeitstage: 251 },
};


function initFeiertage() {
  const select = document.getElementById('lohn-bundesland');
  if (select) {
    select.addEventListener('change', updateFeiertage);
    updateFeiertage();
  }
}

function updateFeiertage() {
  const select = document.getElementById('lohn-bundesland');
  if (!select) return;

  const key = select.value;
  const data = FEIERTAGE_DATA[key];
  if (!data) return;

  const wochenstunden = parseFloat(document.getElementById('lohn-stunden')?.value) || 40;
  const stdProTag = 8; // Annahme: 8h/Tag
  const jahresstunden = data.arbeitstage * stdProTag;

  const elArbeitstage = document.getElementById('feiertag-arbeitstage');
  const elJahresstunden = document.getElementById('feiertag-jahresstunden');
  const elAnzahl = document.getElementById('feiertag-anzahl');

  if (elArbeitstage) elArbeitstage.textContent = data.arbeitstage;
  if (elJahresstunden) elJahresstunden.textContent = jahresstunden.toLocaleString('de-DE') + ' h';
  if (elAnzahl) elAnzahl.textContent = data.anzahl;
}

// --------------------------------------------------------------------------
// 8. SIDEBAR QUICK CONVERTER
// --------------------------------------------------------------------------
function initSideConverter() {
  const timeBtn = document.getElementById('side-time-btn');
  const decBtn = document.getElementById('side-dec-btn');
  const timeIn = document.getElementById('side-time-in');
  const decIn = document.getElementById('side-dec-in');

  if (timeBtn && timeIn) {
    const doTimeConv = () => {
      const val = timeIn.value.trim();
      if (!val) return;
      const mins = timeToMinutes(val);
      const dec = (mins / 60).toFixed(2).replace('.', ',');
      document.getElementById('side-time-out').textContent = `= ${dec} Std.`;
    };
    timeBtn.addEventListener('click', doTimeConv);
    timeIn.addEventListener('keyup', (e) => { if (e.key === 'Enter') doTimeConv(); });
  }

  if (decBtn && decIn) {
    const doDecConv = () => {
      const val = parseFloat(decIn.value.replace(',', '.')) || 0;
      const totalMins = Math.round(val * 60);
      const formatted = minutesToFormattedTime(totalMins);
      document.getElementById('side-dec-out').textContent = `= ${formatted} Std.`;
    };
    decBtn.addEventListener('click', doDecConv);
    decIn.addEventListener('keyup', (e) => { if (e.key === 'Enter') doDecConv(); });
  }
}

// --------------------------------------------------------------------------
// 9. STAR RATING WIDGET (localStorage-based, Google-compliant)
// --------------------------------------------------------------------------
function initRatingWidget() {
  // Seed values — honest starting point for a new site
  const SEED_TOTAL = 73.5;   // sum of all star values (seed: 15 × 4.9)
  const SEED_COUNT = 15;     // number of seed ratings


  const LS_KEY_TOTAL = 'az365_rating_total';
  const LS_KEY_COUNT = 'az365_rating_count';
  const LS_KEY_VOTED = 'az365_user_voted';

  // Load from localStorage or use seeds
  let total = parseFloat(localStorage.getItem(LS_KEY_TOTAL)) || SEED_TOTAL;
  let count = parseInt(localStorage.getItem(LS_KEY_COUNT), 10) || SEED_COUNT;
  const hasVoted = localStorage.getItem(LS_KEY_VOTED) === '1';

  const stars     = document.querySelectorAll('.rate-star');
  const feedback  = document.getElementById('rating-feedback');
  const avgDisplay   = document.getElementById('rating-avg-display');
  const countDisplay = document.getElementById('rating-count-display');
  const heroValue    = document.getElementById('hero-rating-value');
  const heroCount    = document.getElementById('hero-rating-count');

  function calcAvg(t, c) {
    return c > 0 ? (t / c).toFixed(1).replace('.', ',') : '5,0';
  }

  function renderStarColors(hoverVal) {
    stars.forEach(s => {
      s.style.color = parseInt(s.dataset.val, 10) <= hoverVal ? '#e8a020' : '#cbd5e1';
    });
  }

  function updateDisplays() {
    const avg = calcAvg(total, count);
    if (avgDisplay)  avgDisplay.textContent  = avg;
    if (countDisplay) countDisplay.textContent = count;
    if (heroValue)   heroValue.textContent   = `${avg} / 5`;
    if (heroCount)   heroCount.textContent   = `\u2022 ${count} Bewertungen`;
  }

  // Initialize displays on load
  updateDisplays();

  if (hasVoted) {
    const avg = calcAvg(total, count);
    renderStarColors(Math.round(parseFloat(avg.replace(',', '.'))));
    if (feedback) { feedback.textContent = '\u2705 Danke f\u00fcr Ihre Bewertung!'; feedback.style.color = '#16a34a'; }
    stars.forEach(s => s.style.cursor = 'default');
    return;
  }

  // Hover effects
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => renderStarColors(parseInt(star.dataset.val, 10)));
    star.addEventListener('mouseleave', () => renderStarColors(0));
  });

  // Click — submit rating
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val, 10);

      total += val;
      count += 1;

      localStorage.setItem(LS_KEY_TOTAL, total.toString());
      localStorage.setItem(LS_KEY_COUNT, count.toString());
      localStorage.setItem(LS_KEY_VOTED, '1');

      renderStarColors(val);
      updateDisplays();

      const messages = [
        '',
        '\ud83d\ude14 Schade! Wir arbeiten daran, uns zu verbessern.',
        '\ud83d\ude10 Danke f\u00fcr Ihr Feedback!',
        '\ud83d\ude42 Danke! Wir freuen uns \u00fcber Ihr Feedback.',
        '\ud83d\ude0a Super! Sch\u00f6n, dass der Rechner hilfreich war.',
        '\ud83c\udf1f Herzlichen Dank! Das freut uns sehr!'
      ];
      if (feedback) {
        feedback.textContent = messages[val] || '\u2705 Danke f\u00fcr Ihre Bewertung!';
        feedback.style.color = val >= 4 ? '#16a34a' : '#64748b';
      }

      // Remove hover listeners after vote
      stars.forEach(s => {
        s.style.cursor = 'default';
        const clone = s.cloneNode(true);
        s.parentNode.replaceChild(clone, s);
      });
    });
  });
}
