/**
 * MacroCalc — Nährwert-Umrechner App Engine (v2.3)
 * Ultra-performant, iOS PWA-optimiert, Vanilla JS mit interaktiver Tabellen-Zuschneidung & OCR
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Form Inputs
  const form = document.getElementById('calcForm');
  const weightInput = document.getElementById('weightInput');
  const kcalInput = document.getElementById('kcalInput');
  const fatInput = document.getElementById('fatInput');
  const carbsInput = document.getElementById('carbsInput');
  const proteinInput = document.getElementById('proteinInput');
  const weightError = document.getElementById('weightError');
  const resetBtn = document.getElementById('resetBtn');

  // DOM Elements - Camera Trigger
  const cameraScanBtn = document.getElementById('cameraScanBtn');
  const cameraFileInput = document.getElementById('cameraFileInput');

  // DOM Elements - Crop & Scan Modal
  const cropScanModal = document.getElementById('cropScanModal');
  const closeCropModalBtn = document.getElementById('closeCropModalBtn');
  const cropViewportWrap = document.getElementById('cropViewportWrap');
  const cropCanvas = document.getElementById('cropCanvas');
  const cropBox = document.getElementById('cropBox');
  const modalScanProgress = document.getElementById('modalScanProgress');
  const modalScanText = document.getElementById('modalScanText');
  const modalProgressFill = document.getElementById('modalProgressFill');
  const modalReviewView = document.getElementById('modalReviewView');
  const cropModalInitialActions = document.getElementById('cropModalInitialActions');
  const cropModalReviewActions = document.getElementById('cropModalReviewActions');

  const cropScanConfirmBtn = document.getElementById('cropScanConfirmBtn');
  const cropScanFullBtn = document.getElementById('cropScanFullBtn');
  const applyReviewBtn = document.getElementById('applyReviewBtn');
  const retryCropBtn = document.getElementById('retryCropBtn');

  // Modal Review Inputs
  const reviewKcal = document.getElementById('reviewKcal');
  const reviewFat = document.getElementById('reviewFat');
  const reviewCarbs = document.getElementById('reviewCarbs');
  const reviewProtein = document.getElementById('reviewProtein');
  const modalToggleRawText = document.getElementById('modalToggleRawText');
  const modalRawTextPre = document.getElementById('modalRawTextPre');

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

  // Active Image State for Crop Tool
  let currentImage = null;
  let canvasScale = 1;
  let canvasOffset = { x: 0, y: 0 };
  let cropRect = { x: 0, y: 0, w: 0, h: 0 };

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
    const proteinPct = Math.max(0, 100 - fatPct - carbsPct);

    barFat.style.width = `${fatPct}%`;
    barCarbs.style.width = `${carbsPct}%`;
    barProtein.style.width = `${proteinPct}%`;
    distributionSummary.textContent = `F ${fatPct}% • KH ${carbsPct}% • E ${proteinPct}%`;
  }

  /**
   * Reset all form inputs and hide results
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
      } catch (err) {}
    }

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
    }, 2800);
  }

  /**
   * Trigger copy button feedback
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
  // Image Crop Tool Engine
  // ==========================================================================

  function openCropModal(file) {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      currentImage = img;
      cropScanModal.classList.remove('hidden');
      setupCropCanvas();
    };
    img.onerror = () => {
      showToast('Bild konnte nicht geöffnet werden.');
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  }

  function setupCropCanvas() {
    if (!currentImage) return;

    // Reset views
    cropViewportWrap.classList.remove('hidden');
    modalScanProgress.classList.add('hidden');
    modalReviewView.classList.add('hidden');
    cropModalInitialActions.classList.remove('hidden');
    cropModalReviewActions.classList.add('hidden');
    cropScanConfirmBtn.classList.remove('scanning');

    const containerW = cropViewportWrap.clientWidth || 320;
    const containerH = 280;

    const imgW = currentImage.width;
    const imgH = currentImage.height;

    // Fit inside viewport
    const scale = Math.min(containerW / imgW, containerH / imgH, 1);
    canvasScale = scale;

    const displayW = Math.round(imgW * scale);
    const displayH = Math.round(imgH * scale);

    cropCanvas.width = displayW;
    cropCanvas.height = displayH;

    const ctx = cropCanvas.getContext('2d');
    ctx.drawImage(currentImage, 0, 0, displayW, displayH);

    // Initial cropBox centered on 85% of image
    const initialW = Math.round(displayW * 0.88);
    const initialH = Math.round(displayH * 0.88);
    const initialX = Math.round((displayW - initialW) / 2);
    const initialY = Math.round((displayH - initialH) / 2);

    updateCropBoxUI(initialX, initialY, initialW, initialH);
  }

  function updateCropBoxUI(x, y, w, h) {
    const canvasRect = cropCanvas.getBoundingClientRect();
    const containerRect = cropViewportWrap.getBoundingClientRect();

    const canvasLeft = canvasRect.left - containerRect.left;
    const canvasTop = canvasRect.top - containerRect.top;

    cropRect = {
      x: Math.max(0, Math.min(x, cropCanvas.width - 40)),
      y: Math.max(0, Math.min(y, cropCanvas.height - 40)),
      w: Math.max(40, Math.min(w, cropCanvas.width - x)),
      h: Math.max(40, Math.min(h, cropCanvas.height - y))
    };

    cropBox.style.left = `${canvasLeft + cropRect.x}px`;
    cropBox.style.top = `${canvasTop + cropRect.y}px`;
    cropBox.style.width = `${cropRect.w}px`;
    cropBox.style.height = `${cropRect.h}px`;
  }

  // Interactive Touch & Mouse Dragging for Crop Box
  let isDragging = false;
  let dragMode = null; // 'move' or 'nw', 'ne', 'sw', 'se'
  let dragStart = { x: 0, y: 0 };
  let startCropRect = { x: 0, y: 0, w: 0, h: 0 };

  function onPointerDown(e) {
    const handle = e.target.getAttribute('data-handle');
    if (handle) {
      dragMode = handle;
    } else if (e.target === cropBox || cropBox.contains(e.target)) {
      dragMode = 'move';
    } else {
      return;
    }

    isDragging = true;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    dragStart = { x: clientX, y: clientY };
    startCropRect = { ...cropRect };
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging || !dragMode) return;

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;

    let { x, y, w, h } = startCropRect;

    if (dragMode === 'move') {
      x += dx;
      y += dy;
    } else if (dragMode === 'se') {
      w += dx;
      h += dy;
    } else if (dragMode === 'sw') {
      x += dx;
      w -= dx;
      h += dy;
    } else if (dragMode === 'ne') {
      y += dy;
      w += dx;
      h -= dy;
    } else if (dragMode === 'nw') {
      x += dx;
      y += dy;
      w -= dx;
      h -= dy;
    }

    updateCropBoxUI(x, y, w, h);
    e.preventDefault();
  }

  function onPointerUp() {
    isDragging = false;
    dragMode = null;
  }

  cropViewportWrap.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  cropViewportWrap.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp);

  // ==========================================================================
  // Image Preprocessing & OCR Execution
  // ==========================================================================

  /**
   * Pre-processes cropped region:
   * 1. Extracts region from full-res image
   * 2. Upscales to ~1200px if small
   * 3. Normalizes min-max contrast
   * 4. Suppresses black table grid lines so letters don't connect
   */
  function prepareCanvasForOCR(useFullImage = false) {
    if (!currentImage) return null;

    let srcX = 0;
    let srcY = 0;
    let srcW = currentImage.width;
    let srcH = currentImage.height;

    if (!useFullImage && canvasScale > 0) {
      srcX = Math.round(cropRect.x / canvasScale);
      srcY = Math.round(cropRect.y / canvasScale);
      srcW = Math.round(cropRect.w / canvasScale);
      srcH = Math.round(cropRect.h / canvasScale);
    }

    // Upscale factor if cropped table is low resolution
    const scale = Math.max(1, Math.min(3, 1400 / srcW));
    const targetW = Math.round(srcW * scale);
    const targetH = Math.round(srcH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // Draw high-res cropped source
    ctx.drawImage(currentImage, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

    // Apply Contrast Stretch & Line Suppression
    try {
      const imgData = ctx.getImageData(0, 0, targetW, targetH);
      const d = imgData.data;
      const totalPixels = targetW * targetH;

      // 1. Min-Max Luminance Stretch
      let minLum = 255;
      let maxLum = 0;
      for (let i = 0; i < totalPixels; i++) {
        const lum = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;
      }

      const lumRange = Math.max(20, maxLum - minLum);
      for (let i = 0; i < totalPixels; i++) {
        const lum = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        const norm = Math.round(((lum - minLum) / lumRange) * 255);
        d[i * 4] = norm;
        d[i * 4 + 1] = norm;
        d[i * 4 + 2] = norm;
      }

      // 2. Grid Line Eraser (removes straight horizontal lines > 30px)
      for (let y = 1; y < targetH - 1; y++) {
        let runStart = -1;
        for (let x = 0; x < targetW; x++) {
          const idx = (y * targetW + x) * 4;
          if (d[idx] < 115) {
            if (runStart === -1) runStart = x;
          } else {
            if (runStart !== -1 && (x - runStart) > 30) {
              for (let k = runStart; k < x; k++) {
                const kIdx = (y * targetW + k) * 4;
                d[kIdx] = 245; d[kIdx + 1] = 245; d[kIdx + 2] = 245;
              }
            }
            runStart = -1;
          }
        }
      }

      // 3. Grid Line Eraser (removes straight vertical lines > 30px)
      for (let x = 1; x < targetW - 1; x++) {
        let runStart = -1;
        for (let y = 0; y < targetH; y++) {
          const idx = (y * targetW + x) * 4;
          if (d[idx] < 115) {
            if (runStart === -1) runStart = y;
          } else {
            if (runStart !== -1 && (y - runStart) > 30) {
              for (let k = runStart; k < y; k++) {
                const kIdx = (k * targetW + x) * 4;
                d[kIdx] = 245; d[kIdx + 1] = 245; d[kIdx + 2] = 245;
              }
            }
            runStart = -1;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      // Fallback to standard canvas if security blocks pixel manipulation
    }

    return canvas;
  }

  /**
   * High-Precision OCR Nutrition Parser Engine
   */
  function parseNutritionOCR(rawText) {
    const result = {
      kcal: null,
      fat: null,
      carbs: null,
      protein: null
    };

    if (!rawText || typeof rawText !== 'string') return result;

    let text = rawText
      .replace(/kca[l1!tI|\]\)]/gi, 'kcal')
      .replace(/kcol/gi, 'kcal')
      .replace(/[—–]/g, '-')
      .replace(/k\s*[Jj]/g, 'kJ');

    function cleanFloat(str) {
      if (!str) return null;
      const match = str.match(/(\d+\s*[\.,]\s*\d+|\d+)/);
      if (match) {
        const clean = match[1].replace(/\s+/g, '').replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? null : num;
      }
      return null;
    }

    // Segment matching: finds keyword and extracts text up to exclusion
    function findMacroInText(sourceText, keywords, exclusions) {
      for (const kw of keywords) {
        const regex = new RegExp('(?:^|[^a-zA-ZäöüßÄÖÜ])(' + kw + ')', 'i');
        const match = sourceText.match(regex);
        if (match) {
          const startIdx = match.index + match[0].length;
          let segment = sourceText.substring(startIdx);

          let cutIdx = Math.min(segment.length, 120);
          for (const ex of exclusions) {
            const exRegex = new RegExp('(?:^|[^a-zA-ZäöüßÄÖÜ])' + ex, 'i');
            const exMatch = segment.match(exRegex);
            if (exMatch && exMatch.index < cutIdx) {
              cutIdx = exMatch.index;
            }
          }
          segment = segment.substring(0, cutIdx);

          const val = cleanFloat(segment);
          if (val !== null) return val;
        }
      }
      return null;
    }

    // --- A. KALORIEN ---
    const directKcal = text.match(/(\d+[\.,]?\d*)\s*kcal/i) || text.match(/kcal\s*[:=]?\s*(\d+[\.,]?\d*)/i);
    if (directKcal) {
      result.kcal = Math.round(parseFloat(directKcal[1].replace(',', '.')));
    } else {
      const slashKcal = text.match(/\/\s*(\d+)\s*(?:kcal)?/i) || text.match(/\(\s*(\d+)\s*kcal\s*\)/i);
      if (slashKcal) {
        result.kcal = parseInt(slashKcal[1], 10);
      }
    }

    // --- B. FETT (strictly ignore 'gesättigt', 'davon', etc.) ---
    result.fat = findMacroInText(
      text,
      ['fett', 'fat', 'lipides', 'grassi', 'mati&res', 'matières'],
      ['gesättigt', 'gesaettigt', 'saturated', 'davon', 'of which', 'saturi', 'saturés', 'kohlenhydrat', 'carbs']
    );

    // --- C. KOHLENHYDRATE (strictly ignore 'Zucker', 'davon', etc.) ---
    result.carbs = findMacroInText(
      text,
      ['kohlenhydrat[a-z]*', 'carbohydrat[a-z]*', 'carbs', 'glucides', 'carboidrati'],
      ['zucker', 'sugar', 'davon', 'of which', 'zuccheri', 'sucres', 'eiweiß', 'eiweiss', 'protein', 'ballaststoff']
    );

    // --- D. EIWEISS / PROTEIN (strictly ignore Ballaststoffe, Salz, etc.) ---
    result.protein = findMacroInText(
      text,
      ['eiwei[ßs]+', 'eiweils', 'eiweif', 'eiweib', 'protein[a-z]*', 'protéin[a-z]*', 'proteines'],
      ['salz', 'salt', 'sale', 'natrium', 'sodium', 'ballaststoff', 'fibre', 'fibres', 'kj', 'kcal']
    );

    // --- E. EU Nutrition Column Sequence Fallback (LMIV 1169/2011) ---
    // Standard row order: [Fett, gesättigt, Kohlenhydrate, Zucker, (Ballaststoffe), Eiweiß, Salz]
    const gramMatches = [];
    const gramRegex = /(\d+[\.,]?\d*)\s*g(?![a-zA-Z])/gi;
    let m;
    while ((m = gramRegex.exec(text)) !== null) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (!isNaN(val)) gramMatches.push(val);
    }

    if (gramMatches.length >= 4) {
      if (result.fat === null) result.fat = gramMatches[0];
      if (result.carbs === null && gramMatches.length >= 3) result.carbs = gramMatches[2];
      if (result.protein === null) {
        const eiweissCandidate = gramMatches.length >= 6 ? gramMatches[gramMatches.length - 2] : gramMatches[gramMatches.length - 1];
        if (eiweissCandidate !== undefined) result.protein = eiweissCandidate;
      }
    }

    // --- F. Plausibility Correction for 100g basis ---
    // In 100g, fat, carbs, or protein cannot exceed 100g.
    // If OCR missed a decimal point (e.g. '400g' or '40g' for '4.0g'):
    ['fat', 'carbs', 'protein'].forEach(key => {
      if (result[key] !== null) {
        if (result[key] > 100 && result[key] <= 1000) {
          result[key] = parseFloat((result[key] / 100).toFixed(1));
        }
      }
    });

    return result;
  }

  /**
   * Execute OCR Scan on prepared Canvas
   */
  async function executeScan(useFullImage = false) {
    if (typeof Tesseract === 'undefined') {
      showToast('OCR-Modul wird geladen, bitte einen Moment...');
      return;
    }

    const canvas = prepareCanvasForOCR(useFullImage);
    if (!canvas) return;

    // Show modal progress
    modalScanProgress.classList.remove('hidden');
    cropViewportWrap.classList.add('hidden');
    cropModalInitialActions.classList.add('hidden');
    modalProgressFill.style.width = '15%';
    modalScanText.textContent = 'Analysiere Nährwerttabelle...';

    try {
      const result = await Tesseract.recognize(canvas, 'deu', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = 20 + Math.round((m.progress || 0) * 75);
            modalProgressFill.style.width = `${pct}%`;
            modalScanText.textContent = `Erkenne Text... ${Math.round((m.progress || 0) * 100)}%`;
          } else if (m.status === 'loading tesseract core') {
            modalScanText.textContent = 'Initialisiere OCR...';
          }
        }
      });

      const ocrText = result?.data?.text || '';
      modalRawTextPre.textContent = ocrText.trim() || '(Kein lesbarer Text erkannt)';

      const parsed = parseNutritionOCR(ocrText);

      modalProgressFill.style.width = '100%';
      modalScanText.textContent = 'Erkennung abgeschlossen!';

      // Fill Review Inputs
      reviewKcal.value = parsed.kcal !== null ? parsed.kcal : '';
      reviewFat.value = parsed.fat !== null ? parsed.fat : '';
      reviewCarbs.value = parsed.carbs !== null ? parsed.carbs : '';
      reviewProtein.value = parsed.protein !== null ? parsed.protein : '';

      // Transition to Review Screen
      setTimeout(() => {
        modalScanProgress.classList.add('hidden');
        modalReviewView.classList.remove('hidden');
        cropModalReviewActions.classList.remove('hidden');
      }, 350);

    } catch (err) {
      console.error('OCR Fehler:', err);
      showToast('Fehler bei der Texterkennung.');
      modalScanProgress.classList.add('hidden');
      cropViewportWrap.classList.remove('hidden');
      cropModalInitialActions.classList.remove('hidden');
    }
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  // Camera Trigger
  if (cameraScanBtn && cameraFileInput) {
    cameraScanBtn.addEventListener('click', () => {
      cameraFileInput.click();
    });

    cameraFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        openCropModal(file);
      }
    });
  }

  // Close Modal
  if (closeCropModalBtn) {
    closeCropModalBtn.addEventListener('click', () => {
      cropScanModal.classList.add('hidden');
      cameraFileInput.value = '';
    });
  }

  // Crop & Scan Confirm
  if (cropScanConfirmBtn) {
    cropScanConfirmBtn.addEventListener('click', () => {
      executeScan(false);
    });
  }

  // Scan Full Image
  if (cropScanFullBtn) {
    cropScanFullBtn.addEventListener('click', () => {
      executeScan(true);
    });
  }

  // Retry / Adjust Crop
  if (retryCropBtn) {
    retryCropBtn.addEventListener('click', () => {
      modalReviewView.classList.add('hidden');
      cropModalReviewActions.classList.add('hidden');
      cropViewportWrap.classList.remove('hidden');
      cropModalInitialActions.classList.remove('hidden');
    });
  }

  // Apply Review Values to MacroCalc Main Form
  if (applyReviewBtn) {
    applyReviewBtn.addEventListener('click', () => {
      if (reviewKcal.value.trim()) {
        kcalInput.value = reviewKcal.value.trim();
        triggerFieldHighlight(kcalInput);
      }
      if (reviewFat.value.trim()) {
        fatInput.value = reviewFat.value.trim();
        triggerFieldHighlight(fatInput);
      }
      if (reviewCarbs.value.trim()) {
        carbsInput.value = reviewCarbs.value.trim();
        triggerFieldHighlight(carbsInput);
      }
      if (reviewProtein.value.trim()) {
        proteinInput.value = reviewProtein.value.trim();
        triggerFieldHighlight(proteinInput);
      }

      cropScanModal.classList.add('hidden');
      cameraFileInput.value = '';
      showToast('✅ Nährwerte in MacroCalc übernommen!');

      if (weightInput.value.trim().length > 0) {
        calculateMacros();
      } else {
        weightInput.focus();
      }
    });
  }

  // Toggle Raw Text in Modal
  if (modalToggleRawText && modalRawTextPre) {
    modalToggleRawText.addEventListener('click', () => {
      const isHidden = modalRawTextPre.classList.contains('hidden');
      if (isHidden) {
        modalRawTextPre.classList.remove('hidden');
        modalToggleRawText.textContent = 'Gelesenen Rohtext ausblenden ▴';
      } else {
        modalRawTextPre.classList.add('hidden');
        modalToggleRawText.textContent = 'Gelesenen Rohtext prüfen ▾';
      }
    });
  }

  function triggerFieldHighlight(inputEl) {
    inputEl.classList.remove('ocr-highlight');
    void inputEl.offsetWidth;
    inputEl.classList.add('ocr-highlight');
    setTimeout(() => {
      inputEl.classList.remove('ocr-highlight');
    }, 1800);
  }

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
