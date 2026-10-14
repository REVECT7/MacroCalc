/**
 * MacroCalc — Nährwert-Umrechner App Engine
 * Ultra-performant, iOS PWA-optimiert, Vanilla JS
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Inputs
  const form = document.getElementById('calcForm');
  const weightInput = document.getElementById('weightInput');
  const kcalInput = document.getElementById('kcalInput');
  const fatInput = document.getElementById('fatInput');
  const carbsInput = document.getElementById('carbsInput');
  const proteinInput = document.getElementById('proteinInput');
  const weightError = document.getElementById('weightError');
  const resetBtn = document.getElementById('resetBtn');

  // DOM Elements - Results
  const resultSection = document.getElementById('resultSection');
  const resultWeightSummary = document.getElementById('resultWeightSummary');
  const resKcalVal = document.getElementById('resKcalVal');
  const resFatVal = document.getElementById('resFatVal');
  const resCarbsVal = document.getElementById('resCarbsVal');
  const resProteinVal = document.getElementById('resProteinVal');
  const copyAllBtn = document.getElementById('copyAllBtn');

  // Macro Bar Elements
  const barFat = document.getElementById('barFat');
  const barCarbs = document.getElementById('barCarbs');
  const barProtein = document.getElementById('barProtein');
  const distributionSummary = document.getElementById('distributionSummary');

  // Toast Notification Element
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimeout = null;


  /**
   * Helper: Parse localized number string (supports German comma and period)
   */
  function parseLocalNumber(val) {
    if (!val) return 0;
    const cleanStr = String(val).trim().replace(',', '.');
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  /**
   * Calculate and render nutrition values
   */
  function calculateMacros() {
    const weightRaw = weightInput.value.trim().replace(',', '.');
    const weight = parseFloat(weightRaw);

    if (isNaN(weight) || weight <= 0) {
      weightError.classList.add('visible');
      weightInput.classList.add('is-invalid');
      weightInput.focus();
      return;
    }

    weightError.classList.remove('visible');
    weightInput.classList.remove('is-invalid');

    const kcalPer100 = parseLocalNumber(kcalInput.value);
    const fatPer100 = parseLocalNumber(fatInput.value);
    const carbsPer100 = parseLocalNumber(carbsInput.value);
    const proteinPer100 = parseLocalNumber(proteinInput.value);

    // Formula: (Wert / 100) * Nettogewicht
    const factor = weight / 100;
    const calculatedKcal = Math.round(kcalPer100 * factor);
    const calculatedFat = (fatPer100 * factor).toFixed(1);
    const calculatedCarbs = (carbsPer100 * factor).toFixed(1);
    const calculatedProtein = (proteinPer100 * factor).toFixed(1);

    // Update DOM values
    resKcalVal.textContent = calculatedKcal;
    resFatVal.textContent = calculatedFat;
    resCarbsVal.textContent = calculatedCarbs;
    resProteinVal.textContent = calculatedProtein;
    resultWeightSummary.textContent = `für ${weight}g Portion`;

    // Update Distribution Bar
    updateMacroDistribution(parseFloat(calculatedFat), parseFloat(calculatedCarbs), parseFloat(calculatedProtein));

    // Show Result Section with animation
    resultSection.classList.remove('hidden');

    // Smooth scroll into view on smaller mobile screens
    if (window.innerWidth < 640) {
      setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }

  /**
   * Update the Macro Ratio distribution percentage bar
   */
  function updateMacroDistribution(fatG, carbsG, proteinG) {
    const totalMacrosG = fatG + carbsG + proteinG;
    if (totalMacrosG <= 0) {
      barFat.style.width = '0%';
      barCarbs.style.width = '0%';
      barProtein.style.width = '0%';
      distributionSummary.textContent = 'F 0% • KH 0% • E 0%';
      return;
    }

    const fatPct = Math.round((fatG / totalMacrosG) * 100);
    const carbsPct = Math.round((carbsG / totalMacrosG) * 100);
    const proteinPct = Math.max(0, 100 - fatPct - carbsPct); // ensure 100% sum

    barFat.style.width = `${fatPct}%`;
    barCarbs.style.width = `${carbsPct}%`;
    barProtein.style.width = `${proteinPct}%`;
    distributionSummary.textContent = `F ${fatPct}% • KH ${carbsPct}% • E ${proteinPct}%`;
  }

  /**
   * Reset all form inputs and hide results smoothly
   */
  function resetAll() {
    form.reset();
    weightInput.value = '';
    kcalInput.value = '';
    fatInput.value = '';
    carbsInput.value = '';
    proteinInput.value = '';

    weightError.classList.remove('visible');
    weightInput.classList.remove('is-invalid');
    resultSection.classList.add('hidden');

    weightInput.focus();
    showToast('Eingaben geleert');
  }

  /**
   * Robust clipboard copy with fallback
   */
  async function copyToClipboard(textToCopy) {
    if (!textToCopy) return false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } catch (err) {
        // Fallback to execCommand if API rejected
      }
    }

    // Classic execCommand fallback for iOS / insecure contexts
    try {
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = textToCopy;
      tempTextArea.style.position = 'fixed';
      tempTextArea.style.left = '-9999px';
      tempTextArea.style.top = '0';
      tempTextArea.setAttribute('readonly', '');
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      tempTextArea.setSelectionRange(0, 99999);
      const successful = document.execCommand('copy');
      document.body.removeChild(tempTextArea);
      return successful;
    } catch (e) {
      return false;
    }
  }

  /**
   * Show toast notification at the bottom
   */
  function showToast(msg) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMessage.textContent = msg;
    toastNotification.classList.remove('hidden');

    toastTimeout = setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 2200);
  }

  /**
   * Trigger copy button feedback (swaps icon to checkmark & text to "Kopiert!")
   */
  function setButtonCopiedFeedback(btn, originalLabel, isCopyAll = false) {
    const copyIcon = btn.querySelector('.copy-icon');
    const checkIcon = btn.querySelector('.check-icon');
    const labelSpan = btn.querySelector(isCopyAll ? '.btn-text' : '.copy-label');

    btn.classList.add('copied');
    if (copyIcon) copyIcon.classList.add('hidden');
    if (checkIcon) checkIcon.classList.remove('hidden');
    if (labelSpan) labelSpan.textContent = 'Kopiert!';

    setTimeout(() => {
      btn.classList.remove('copied');
      if (copyIcon) copyIcon.classList.remove('hidden');
      if (checkIcon) checkIcon.classList.add('hidden');
      if (labelSpan) labelSpan.textContent = originalLabel;
    }, 1800);
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  // Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateMacros();
  });

  // Enter key support across all inputs
  const allInputs = [weightInput, kcalInput, fatInput, carbsInput, proteinInput];
  allInputs.forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        calculateMacros();
      }
    });

    // Clear error highlight on typing
    input.addEventListener('input', () => {
      if (weightInput.classList.contains('is-invalid') && weightInput.value.trim().length > 0) {
        weightError.classList.remove('visible');
        weightInput.classList.remove('is-invalid');
      }
    });
  });

  // Reset Button
  resetBtn.addEventListener('click', resetAll);


  // Single Value Copy Buttons
  document.querySelectorAll('.btn-copy-single').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-copy-target');
      const suffix = btn.getAttribute('data-copy-suffix') || '';
      const targetEl = document.getElementById(targetId);

      if (!targetEl) return;
      const val = targetEl.textContent.trim();
      const textToCopy = suffix ? `${val} ${suffix}` : val;

      const ok = await copyToClipboard(textToCopy);
      if (ok) {
        setButtonCopiedFeedback(btn, 'Kopieren', false);
        showToast(`Kopiert: ${textToCopy}`);
      }
    });
  });

  // "Alle Makros kopieren" Button
  // Format requested: `XXX kcal | XX.Xg F | XX.Xg KH | XX.Xg E`
  copyAllBtn.addEventListener('click', async () => {
    const kcal = resKcalVal.textContent.trim();
    const fat = resFatVal.textContent.trim();
    const carbs = resCarbsVal.textContent.trim();
    const protein = resProteinVal.textContent.trim();

    const formattedAll = `${kcal} kcal | ${fat}g F | ${carbs}g KH | ${protein}g E`;

    const ok = await copyToClipboard(formattedAll);
    if (ok) {
      setButtonCopiedFeedback(copyAllBtn, 'Alle Makros kopieren', true);
      showToast(`Kopiert: ${formattedAll}`);
    }
  });

  // Register Service Worker for offline capability & PWA installability
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          const offlineBadge = document.getElementById('offlineStatusBadge');
          if (offlineBadge) {
            offlineBadge.classList.add('active');
          }
        })
        .catch((err) => {
          console.warn('Service Worker Registrierung fehlgeschlagen:', err);
        });
    });
  }
});
