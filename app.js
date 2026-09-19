const fields = [
  ["manufacturer","Manufacturer"],["equipment","Equipment / description"],["model","Model / type"],["serialNumber","Serial number"],["partNumber","Part / product code"],["orderNumber","Order / work order"],
  ["date","Date"],["phases","Phases"],["voltage","Voltage"],["frequency","Frequency"],["power","Total power"],["apparentPower","Apparent power"],["current","Current"],
  ["capacity","Capacity / load"],["volume","Volume"],["refrigerant","Refrigerant / medium"],["ratio","Ratio"],["flow","Flow"],["head","Head"],["workingPressure","Working pressure"],["overpressure","Max / overpressure"],["heatingPower","Heating power"],["heatingType","Heating type"],["airPressure","Air operating pressure"],["airSupplyPressure","Air supply pressure"],["steamPressure","Max steam pressure"],["operatingTemperature","Operating temperature"],["fuseRating","Fuse rating"],
  ["speed","Speed"],["ipRating","IP rating"],["year","Year"],["cosPhi","Power factor / cos φ"],["weight","Weight"]
];

const input = document.querySelector("#imageInput");
const dropZone = document.querySelector("#dropZone");
const previewWrap = document.querySelector("#previewWrap");
const previewImage = document.querySelector("#previewImage");
const fileName = document.querySelector("#fileName");
const analyzeBtn = document.querySelector("#analyzeBtn");
const resetBtn = document.querySelector("#resetBtn");
const replaceBtn = document.querySelector("#replaceBtn");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const resultsSection = document.querySelector("#resultsSection");
const formGrid = document.querySelector("#formGrid");
const rawText = document.querySelector("#rawText");
const fieldCount = document.querySelector("#fieldCount");
const recordForm = document.querySelector("#recordForm");
const showEmptyBtn = document.querySelector("#showEmptyBtn");
let currentFile = null;
let showEmptyFields = false;
let detectedFieldPresence = new Set();

for (const [name,label] of fields) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  wrapper.dataset.field = name;
  wrapper.innerHTML = `<span>${label}</span><input name="${name}" autocomplete="off"><small class="field-note" aria-live="polite"></small>`;
  formGrid.appendChild(wrapper);
}

function updateFieldVisibility() {
  let readable = 0;
  let unreadable = 0;
  for (const [name] of fields) {
    const inputEl = recordForm.elements[name];
    const wrapper = inputEl.closest(".field");
    const note = wrapper.querySelector(".field-note");
    const hasValue = Boolean(String(inputEl.value || "").trim());
    const labelDetected = detectedFieldPresence.has(name);
    const knownButUnreadable = labelDetected && !hasValue;

    wrapper.hidden = !showEmptyFields && !hasValue && !knownButUnreadable;
    wrapper.classList.toggle("field--unreadable", knownButUnreadable);
    wrapper.classList.toggle("field--empty", !hasValue && !knownButUnreadable);

    if (knownButUnreadable) {
      inputEl.placeholder = "Detected, unreadable";
      note.textContent = "Detected on plate · unreadable";
      unreadable++;
    } else if (!hasValue && showEmptyFields) {
      inputEl.placeholder = "";
      note.textContent = "Not detected";
    } else {
      inputEl.placeholder = "";
      note.textContent = "";
    }

    if (hasValue) readable++;
  }
  const parts = [readable + " read"];
  if (unreadable) parts.push(unreadable + " unreadable");
  fieldCount.textContent = parts.join(" · ");
  showEmptyBtn.textContent = showEmptyFields ? "Hide empty fields" : "Show empty fields";
}

showEmptyBtn.addEventListener("click", () => {
  showEmptyFields = !showEmptyFields;
  updateFieldVisibility();
});

function setFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  currentFile = file;
  const url = URL.createObjectURL(file);
  previewImage.onload = () => URL.revokeObjectURL(url);
  previewImage.style.transform = "";
  previewImage.src = url;
  fileName.textContent = file.name || "Pasted image";
  dropZone.hidden = true;
  previewWrap.hidden = false;
  analyzeBtn.disabled = false;
  resetBtn.hidden = false;
  progressText.textContent = "Ready to analyze.";
  progressBar.style.width = "0%";
}

input.addEventListener("change", () => setFile(input.files[0]));
replaceBtn.addEventListener("click", () => input.click());
resetBtn.addEventListener("click", reset);

["dragenter","dragover"].forEach(type => dropZone.addEventListener(type, e => {
  e.preventDefault(); dropZone.classList.add("is-dragging");
}));
["dragleave","drop"].forEach(type => dropZone.addEventListener(type, e => {
  e.preventDefault(); dropZone.classList.remove("is-dragging");
}));
dropZone.addEventListener("drop", e => setFile(e.dataTransfer.files[0]));
document.addEventListener("paste", e => {
  const item = [...e.clipboardData.items].find(item => item.type.startsWith("image/"));
  if (item) setFile(item.getAsFile());
});

function reset() {
  currentFile = null; input.value = ""; previewImage.removeAttribute("src"); previewImage.style.transform = "";
  previewWrap.hidden = true; dropZone.hidden = false; resultsSection.hidden = true;
  analyzeBtn.disabled = true; resetBtn.hidden = true; progressBar.style.width = "0%";
  progressText.textContent = "Choose an image to begin."; rawText.textContent = "";
  recordForm.reset(); showEmptyFields = false; detectedFieldPresence = new Set(); updateFieldVisibility();
}

async function prepareOcrImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    const longest = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = longest < 1600 ? 1600 / longest : (longest > 2400 ? 2400 / longest : 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d", {willReadFrequently:false});
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function makeGrayVariant(source) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", {willReadFrequently:false});
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if ("filter" in ctx) ctx.filter = "grayscale(1) contrast(1.28)";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function rotateCanvas(source, degrees, maxSide = null) {
  const sourceWidth = source.naturalWidth || source.width;
  const sourceHeight = source.naturalHeight || source.height;
  const angle = ((degrees % 360) + 360) % 360;
  const radians = angle * Math.PI / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const boundWidth = sourceWidth * cos + sourceHeight * sin;
  const boundHeight = sourceWidth * sin + sourceHeight * cos;
  const scale = maxSide ? Math.min(1, maxSide / Math.max(boundWidth, boundHeight)) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(boundWidth * scale));
  canvas.height = Math.max(1, Math.round(boundHeight * scale));
  const ctx = canvas.getContext("2d", {willReadFrequently:false});
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  ctx.drawImage(source, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  return canvas;
}



async function applyOrientedPreview(file, degrees) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    const displayCanvas = rotateCanvas(image, degrees, 1800);
    previewImage.style.transform = "";
    previewImage.style.transition = "";
    previewImage.src = displayCanvas.toDataURL("image/jpeg", 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}


function cropCanvas(source, rectangle) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rectangle.width));
  canvas.height = Math.max(1, Math.round(rectangle.height));
  const ctx = canvas.getContext("2d", {willReadFrequently:false});
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    source,
    rectangle.left,
    rectangle.top,
    rectangle.width,
    rectangle.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas;
}

function makeBinaryVariant(source) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", {willReadFrequently:true});
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const histogram = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) histogram[data[i]]++;

  const total = canvas.width * canvas.height;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0;
  let weightB = 0;
  let bestVariance = -1;
  let threshold = 145;

  for (let i = 0; i < 256; i++) {
    weightB += histogram[i];
    if (!weightB) continue;
    const weightF = total - weightB;
    if (!weightF) break;
    sumB += i * histogram[i];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const variance = weightB * weightF * (meanB - meanF) * (meanB - meanF);
    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = i;
    }
  }

  let white = 0;
  let black = 0;
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = value;
    if (value) white++; else black++;
  }

  if (black > white) {
    for (let i = 0; i < data.length; i += 4) {
      const value = 255 - data[i];
      data[i] = data[i + 1] = data[i + 2] = value;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

async function detectBestOrientation(worker, source, onProbe) {
  const candidates = [0, 90, 180, 270];
  let best = {angle:0, score:-Infinity, text:"", confidence:0};
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
    preserve_interword_spaces: "1"
  });
  for (let index = 0; index < candidates.length; index++) {
    const angle = candidates[index];
    if (onProbe) onProbe(index, angle);
    const probe = rotateCanvas(source, angle, 1050);
    const result = await worker.recognize(probe);
    const text = (result.data.text || "").trim();
    const confidence = Number(result.data.confidence || 0);
    const score = orientationScore(text, confidence);
    if (score > best.score) best = {angle, score, text, confidence};
  }
  return best;
}

async function refineSkewOrientation(worker, source, baseAngle, baseScore, onProbe) {
  if (baseScore >= 105) return {angle:baseAngle, score:baseScore};
  const offsets = [-12, -6, 6, 12];
  let best = {angle:baseAngle, score:baseScore};
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
    preserve_interword_spaces: "1"
  });
  for (let index = 0; index < offsets.length; index++) {
    const angle = baseAngle + offsets[index];
    if (onProbe) onProbe(index, angle);
    const probe = rotateCanvas(source, angle, 1050);
    const result = await worker.recognize(probe);
    const text = (result.data.text || "").trim();
    const confidence = Number(result.data.confidence || 0);
    const score = orientationScore(text, confidence);
    if (score > best.score + 4) best = {angle, score};
  }
  return best;
}

function ocrScore(result) {
  const text = (result?.data?.text || "").trim();
  const confidence = Number(result?.data?.confidence || 0);
  return confidence + Math.min(30, text.length / 8);
}
function extractionCoverage(text) {
  const parsed = parseNameplate(text);
  const technicalKeys = ["voltage","frequency","power","apparentPower","current","speed","capacity","volume","flow","head","workingPressure","overpressure","airPressure","airSupplyPressure","steamPressure","operatingTemperature","fuseRating"];
  const identityKeys = ["manufacturer","model","serialNumber","partNumber","orderNumber"];
  const technicalCount = technicalKeys.filter(key => Boolean(parsed[key])).length;
  const identityCount = identityKeys.filter(key => Boolean(parsed[key])).length;
  const fieldCount = Object.values(parsed).filter(Boolean).length;
  const source = String(text || "");
  const unitSignals = (source.match(/\b(?:Hz|kW|kVA|Volt|V|A|amper|rpm|r\/min|min-?1|bar|mbar|psi|psig|kg|m3\/h|m³\/h|lts?\/hora)\b/gi) || []).length;
  const lines = source.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const shortLines = lines.filter(line => line.length <= 2).length;
  const garbageLines = lines.filter(line => {
    const alnum = (line.match(/[A-Za-zÀ-ÿ0-9]/g) || []).length;
    const symbols = (line.match(/[^A-Za-zÀ-ÿ0-9\s]/g) || []).length;
    return alnum < 2 || symbols > alnum * 1.5;
  }).length;
  const fragmentation = lines.length ? (shortLines + garbageLines * 0.6) / lines.length : 1;
  return {parsed, technicalCount, identityCount, fieldCount, unitSignals, fragmentation, lineCount:lines.length};
}
function needsSparseRetry(text) {
  const coverage = extractionCoverage(text);
  return coverage.fragmentation > 0.20 || coverage.technicalCount < 5 || coverage.fieldCount < 8 || coverage.unitSignals < 5;
}
function needsTechnicalRegionRetry(text) {
  const coverage = extractionCoverage(text);
  return coverage.fragmentation > 0.18 || coverage.technicalCount < 5 || coverage.fieldCount < 8;
}
function needsLayoutRetry(text) {
  const coverage = extractionCoverage(text);
  return coverage.fragmentation > 0.22 || (coverage.technicalCount < 5 && coverage.fieldCount < 10);
}

function ocrTextQuality(text) {
  const source = String(text || "").trim();
  if (!source) return -999;
  const coverage = extractionCoverage(source);
  return coverage.technicalCount * 24
    + coverage.identityCount * 18
    + coverage.fieldCount * 5
    + coverage.unitSignals * 4
    + Math.min(24, coverage.lineCount)
    - coverage.fragmentation * 90;
}

function mergeOcrTexts(...texts) {
  const ranked = texts
    .map(text => String(text || "").trim())
    .filter(Boolean)
    .sort((a, b) => ocrTextQuality(b) - ocrTextQuality(a));
  const seen = new Set();
  const lines = [];
  for (const text of ranked) {
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      const key = line.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(line);
    }
  }
  return lines.join("\n");
}
analyzeBtn.addEventListener("click", async () => {
  if (!currentFile) return;
  if (!window.Tesseract) {
    progressText.textContent = "OCR library could not be loaded. Check your connection and reload.";
    return;
  }

  analyzeBtn.disabled = true;
  progressText.textContent = "Starting OCR…";
  try {
    const preparedImage = await prepareOcrImage(currentFile);
    let ocrPass = 1;
    let orientationProbe = 0;
    let worker = null;
    try {
      worker = await Tesseract.createWorker(["eng","deu","ita","spa"], 1, {
        logger: m => {
          if (typeof m.progress === "number") {
            let base;
            let span;
            if (ocrPass === 0) {
              base = orientationProbe * 6;
              span = 6;
            } else {
              base = ocrPass === 1 ? 28 : (ocrPass === 2 ? 67 : (ocrPass === 3 ? 82 : 93));
              span = ocrPass === 1 ? 38 : (ocrPass === 2 ? 13 : (ocrPass === 3 ? 10 : 5));
            }
            const pct = Math.min(98, base + Math.round(m.progress * span));
            progressBar.style.width = pct + "%";
            progressText.textContent = friendlyStatus(m.status) + " · " + pct + "%";
          }
        }
      });
      ocrPass = 0;
      progressText.textContent = "Detecting plate orientation…";
      let orientation = await detectBestOrientation(worker, orientationImage, (index, angle) => {
        orientationProbe = index;
        progressText.textContent = "Checking orientation " + angle + "°…";
      });
      const refined = await refineSkewOrientation(worker, orientationImage, orientation.angle, orientation.score, (index, angle) => {
        orientationProbe = index;
        progressText.textContent = "Checking tilt " + Math.round(angle) + "°…";
      });
      orientation.angle = refined.angle;
      orientation.score = refined.score;

      const orientedImage = rotateCanvas(preparedImage, orientation.angle);
      await applyOrientedPreview(currentFile, orientation.angle);

      const plateFrame = {
        left: Math.round(orientedImage.width * 0.05),
        top: Math.round(orientedImage.height * 0.05),
        width: Math.round(orientedImage.width * 0.90),
        height: Math.round(orientedImage.height * 0.90)
      };
      const plateBody = {
        left: Math.round(orientedImage.width * 0.06),
        top: Math.round(orientedImage.height * 0.04),
        width: Math.round(orientedImage.width * 0.84),
        height: Math.round(orientedImage.height * 0.78)
      };

      ocrPass = 1;
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: "1"
      });

      let result = await worker.recognize(orientedImage);
      // The low-resolution SPARSE_TEXT orientation probe often recovers labels
      // that AUTO misses on reflective or grid-lined metal plates. Keep it.
      let text = mergeOcrTexts(orientation.text, result.data.text);

      if (needsSparseRetry(text)) {
        ocrPass = 2;
        progressText.textContent = "Reading plate frame…";
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_COLUMN,
          preserve_interword_spaces: "1"
        });
        const frameResult = await worker.recognize(orientedImage, {rectangle: plateFrame});
        text = mergeOcrTexts(text, frameResult.data.text);
      }

      if (needsSparseRetry(text)) {
        ocrPass = 3;
        progressText.textContent = "Reading plate body…";
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          preserve_interword_spaces: "1"
        });
        const bodyResult = await worker.recognize(orientedImage, {rectangle: plateBody});
        text = mergeOcrTexts(text, bodyResult.data.text);
      }

      if (needsSparseRetry(text)) {
        ocrPass = 4;
        progressText.textContent = "Reading sparse plate body…";
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
          preserve_interword_spaces: "1"
        });
        const bodySparseResult = await worker.recognize(orientedImage, {rectangle: plateBody});
        text = mergeOcrTexts(text, bodySparseResult.data.text);
      }

      if (needsSparseRetry(text)) {
        ocrPass = 5;
        progressText.textContent = "Reading grayscale plate body…";
        const grayBody = makeGrayVariant(cropCanvas(orientedImage, plateBody));
        const grayBodyResult = await worker.recognize(grayBody);
        text = mergeOcrTexts(text, grayBodyResult.data.text);
      }

      if (needsSparseRetry(text)) {
        ocrPass = 6;
        progressText.textContent = "Recovering sparse technical text…";
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
          preserve_interword_spaces: "1"
        });
        const sparseResult = await worker.recognize(orientedImage);
        text = mergeOcrTexts(text, sparseResult.data.text);
      }

      if (needsSparseRetry(text)) {
        ocrPass = 3;
        progressText.textContent = "Reading high-contrast plate…";
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
          preserve_interword_spaces: "1"
        });
        const bodyImage = cropCanvas(orientedImage, plateBody);
        const binaryImage = makeBinaryVariant(bodyImage);
        const binaryResult = await worker.recognize(binaryImage);
        text = mergeOcrTexts(text, binaryResult.data.text);
      }

      if (needsTechnicalRegionRetry(text)) {
        ocrPass = 4;
        progressText.textContent = "Reading technical region…";
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
          preserve_interword_spaces: "1"
        });
        const technicalRegion = {
          left: Math.round(orientedImage.width * 0.04),
          top: Math.round(orientedImage.height * 0.16),
          width: Math.round(orientedImage.width * 0.92),
          height: Math.round(orientedImage.height * 0.68)
        };
        const regionResult = await worker.recognize(orientedImage, {rectangle: technicalRegion});
        text = mergeOcrTexts(text, regionResult.data.text);
      }

      if (needsLayoutRetry(text)) {
        ocrPass = 5;
        progressText.textContent = "Reading technical layout…";
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          preserve_interword_spaces: "1"
        });
        const layoutResult = await worker.recognize(orientedImage);
        text = mergeOcrTexts(text, layoutResult.data.text);
      }

      rawText.textContent = text || "No readable text detected.";
      const parsed = parseNameplate(text);
      fillForm(parsed, detectFieldPresence(text));
      resultsSection.hidden = false;
      resultsSection.scrollIntoView({behavior:"smooth",block:"start"});
      progressText.textContent = "OCR complete. Verify the extracted values.";
      progressBar.style.width = "100%";
    } finally {
      if (worker) await worker.terminate();
    }
  } catch (error) {
    console.error(error);
    progressText.textContent = "Analysis failed. Try a clearer or tighter photo.";
    progressBar.style.width = "0%";
  } finally {
    analyzeBtn.disabled = false;
  }
});

function friendlyStatus(status) {
  const map = {
    "loading tesseract core":"Loading OCR",
    "initializing tesseract":"Initializing",
    "loading language traineddata":"Loading language",
    "initializing api":"Preparing reader",
    "recognizing text":"Reading plate"
  };
  return map[status] || "Working";
}

function clean(value) {
  return value ? value.replace(/\s+/g," ").replace(/^[\s:;|.-]+|[\s:;|.-]+$/g,"").trim() : "";
}
function first(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return clean(match[1]);
  }
  return "";
}
function uniqueValues(values) {
  const out = [];
  for (const value of values.map(clean).filter(Boolean)) {
    if (!out.some(existing => existing.toLowerCase() === value.toLowerCase())) out.push(value);
  }
  return out;
}
function joinRatings(values, unit) {
  const cleaned = uniqueValues(values.map(value => clean(value).replace(new RegExp("\\s*" + unit + "$", "i"), "")));
  return cleaned.length ? cleaned.join(" / ") + " " + unit : "";
}
function orientationScore(text, confidence = 0) {
  const source = String(text || "").trim();
  if (!source) return -100;
  const technicalSignals = (source.match(/\b(?:type|tipo|typ|model|serial|fabr\.?\s*nr|volt(?:age)?|hz|kw|cv|hp|amp(?:er|ere)?|rpm|r\/min|min-?1|ip\s*\d{2}|pressure|bar|q|head|weight|peso|year|baujahr|monof[aá]sico|trif[aá]sico|condensador)\b/gi) || []).length;
  const units = (source.match(/\b(?:\d+(?:[.,]\d+)?)\s*(?:V(?:olt)?|Hz|kW|W|CV|HP|A|amp(?:er)?|rpm|bar|m3\/h|m³\/h|l\/min|lts?\/hora|kg)\b/gi) || []).length;
  const words = (source.match(/\b[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,}\b/g) || []).length;
  const garbage = (source.match(/[{}<>^~]{2,}|[|\\]{3,}/g) || []).length;
  const parsed = parseNameplate(source);
  const parsedCount = Object.values(parsed).filter(Boolean).length;
  return Number(confidence || 0) * 0.55 + technicalSignals * 10 + units * 7 + parsedCount * 5 + Math.min(18, words * 0.7) + Math.min(12, source.length / 35) - garbage * 8;
}

function parseMotorTable(lines) {
  const index = lines.findIndex(line => /\bV\b/i.test(line) && /\bHz\b/i.test(line) && /\bkW\b/i.test(line) && /(?:r\/min|min-?1|rpm)/i.test(line) && /\bA\b/.test(line));
  if (index < 0) return {};
  const rows = [];
  const hasCos = /cos/i.test(lines[index]);
  for (const line of lines.slice(index + 1, index + 10)) {
    const m = line.replace(/[Δ∆]/g, "D").match(/^(?:[DY]\s+)?(\d{3,4}\s*[YD]?)\s+(50|60)\s+(\d+(?:[.,]\d+)?)\s+(\d{3,5})\s+(\d+(?:[.,]\d+)?)(?:\s+(0[.,]\d+))?/i);
    if (!m) { if (rows.length) break; else continue; }
    rows.push({voltage:m[1], frequency:m[2], power:m[3], speed:m[4], current:m[5], cosPhi:hasCos ? (m[6] || "") : ""});
  }
  if (!rows.length) return {};
  return {
    voltage: joinRatings(rows.map(row => row.voltage), "V"),
    frequency: joinRatings(rows.map(row => row.frequency), "Hz"),
    power: joinRatings(rows.map(row => row.power), "kW"),
    speed: joinRatings(rows.map(row => row.speed), "rpm"),
    current: joinRatings(rows.map(row => row.current), "A"),
    cosPhi: uniqueValues(rows.map(row => row.cosPhi).filter(Boolean)).join(" / ")
  };
}
function detectFieldPresence(text) {
  const source = String(text || "").replace(/\r/g, "");
  const patterns = {
    manufacturer: /\b(?:manufacturer|fabricante|hersteller|costruttore)\b/i,
    equipment: /\b(?:equipment|description|machine|maquina|máquina|anlage|apparato)\b/i,
    model: /\b(?:model(?:lo|o)?|type|tipo|typ|t\/c)\b/i,
    serialNumber: /\b(?:serial(?:\s*(?:no|number|nr|n[°º.]?))?|s\/n|sn\b|matricola|fabr\.?\s*nr\.?|works\s*n[°º]?|n[°º]?\s*de\s*serie)\b/i,
    partNumber: /\b(?:part\s*(?:no|number)|p\/n|product\s*(?:no|number|code)|article\s*no\.?|cat\.?\s*no|cod\.?)\b/i,
    orderNumber: /\b(?:work\s+order|order\s*(?:no|number)?|o\/n)\b/i,
    date: /\b(?:date|build\s+date|prod\.?\s*date|manufactur(?:ing|ed)\s+date)\b/i,
    year: /\b(?:year|baujahr|anno|año|yr\b)\b/i,
    phases: /\b(?:ph(?:ase|ases)?|fasi|monof[aá]sico|trif[aá]sico)\b/i,
    voltage: /\b(?:volt(?:age|s)?|spannung|tension|tensión|U\s*\(\s*V\s*\)|rated\s+voltage|mains\s+voltage)\b/i,
    frequency: /\b(?:frequency|frecuencia|frequenz|freq\.?|F\s*\(\s*Hz\s*\)|Hz)\b/i,
    power: /\b(?:power|potencia|leistung|rated\s+power|input\s+power|total\s+W|kW|HP|CV|P2)\b/i,
    apparentPower: /\b(?:apparent\s+power|kVA)\b/i,
    current: /\b(?:current|corriente|strom|amps?|ampere|amperios|F\.\s*L\.\s*A\.?|FLA|I\s*\(\s*A\s*\))\b/i,
    capacity: /\b(?:capacity|capacidad|capacità|trocken[\s-]*füllmenge|fullmenge|füllmenge)\b/i,
    volume: /\b(?:volume|füllraum|fullraum|liters?|litres?|litri|Lt\b|LTR\b)\b/i,
    refrigerant: /\b(?:refrigerant|refrig\.?|kältemittel|fluide\s+frigorigène)\b/i,
    ratio: /\b(?:ratio|reduction|reducci[oó]n|übersetzung|i\s*=)\b/i,
    flow: /\b(?:flow|caudal|portata|durchfluss|Q\s*[:=])\b/i,
    head: /\b(?:head|altura|prevalenza|förderhöhe|H\s*[:=])\b/i,
    workingPressure: /\b(?:working\s+pressure|max\.?\s*pressure|pressure|presi[oó]n|pressione|betriebsdruck|druck|MAWP|pmax|PS\b)\b/i,
    overpressure: /\b(?:overpressure|überdruck|ueberdruck|betriebsüberdruck|betriebsueberdruck)\b/i,
    heatingPower: /\b(?:heating\s+elements?|riscaldamento|heater\s+power)\b/i,
    heatingType: /\b(?:heating\s+type|beheizungsart|heizart|dampf|steam)\b/i,
    airPressure: /\b(?:air\s+inlet\s+pressure|air\s+operating\s+pressure|druckluft\s+betriebsdruck|pressione\s+aliment\.?\s+aria)\b/i,
    airSupplyPressure: /\b(?:air\s+supply\s+pressure|druckluft\s+netzanschlu(?:ss|ß))\b/i,
    steamPressure: /\b(?:max\s+steam\s+pressure|pressione\s+max\s+vapore)\b/i,
    operatingTemperature: /\b(?:operating\s+temperature|betriebstemperatur|temperature|temperatur)\b/i,
    fuseRating: /\b(?:fuse|fusing|absicherung)\b/i,
    speed: /\b(?:speed|velocidad|drehzahl|rpm|r\/min|min-?1|nmax|n1max|n2max|FLRPM)\b/i,
    ipRating: /\b(?:degree\s+of\s+protection|protection\s+degree|IP\s*(?:X\d|\d{0,2}))\b/i,
    cosPhi: /\b(?:cos\s*[φϕ]|cos\s*phi|power\s+factor|P\.\s*F\.?)\b/i,
    weight: /\b(?:weight|gewicht|peso|mass|mges)\b/i
  };
  return new Set(Object.entries(patterns).filter(([, pattern]) => pattern.test(source)).map(([name]) => name));
}

function parseNameplate(text) {
  const normalized = text
    .replace(/[–—]/g,"-")
    .replace(/Ø/g,"0")
    .replace(/\bm\s+tros\b/gi,"metros")
    .replace(/\bampe\b/gi,"amper")
    .replace(/[ \t]+/g," ");
  const lines = normalized.split(/\r?\n/).map(clean).filter(Boolean);
  const result = {};

  // Prefer values explicitly attached to labels. Industrial plates often place
  // another label/value pair on the same OCR line, so each capture is bounded.
  result.model = first(normalized, [
    /\b(?:compressor|pump|unit)\s+model\s*[:#.-]?\s*([A-Z0-9][A-Z0-9.+_\/-]*(?:\s+[A-Z0-9.+_\/-]+){0,3})\s*(?=\n|$)/im,
    /(?:^|\n)\s*(?:n[°º]?\s*de\s*modele|modell|modello|modelo|model(?:\s*(?:no|number))?|type|tipo|typ|mod\.?|t\/c)\s*[:#.-]?\s*[\[|:_-]*\s*([A-Z0-9][A-Z0-9.+_\/-]*(?:\s+[A-Z0-9.+_\/-]+){0,5}?)(?=\s*[\]|_-]*(?:\n|$|\s+(?:REV|INPUT|OUTPUT|Date|Hz|PH|Volt|Total|serial|matricola|fabr\.?|year|baujahr|weight|gewicht|P\/N|S\/N|Part\s*(?:No|Number)|Product\s*(?:No|Number))\b))/im
  ]);
  result.serialNumber = first(normalized, [
    /(?:matricola\s*\/\s*serial\s*number|n[°º]?\s*de\s*serie|works\s*n[°º]?|serial(?:\s*(?:no|number|nr|n[°º.]?))?|s\.?\s*nr\.?|(?:^|\n)\s*No\.?|s\/?n|ser\.?\s*no\.?|n[º°]\s*serie|fabr\.?\s*nr\.?)\s*[:#.=\-]?\s*[\[|:_-]*\s*([A-Z0-9][A-Z0-9._\/-]{2,30})(?=\s*[\]|_-]*(?:\n|$|\s+(?:Date|Hz|kW|KW|A|PH|Volt|Total|year|baujahr|weight|gewicht)\b))/im
  ]);
  if (!result.serialNumber) {
    result.serialNumber = first(normalized, [
      /\bserial(?:\s*(?:no|number|nr))?\s*[:#.-]?\s*([A-Z0-9][A-Z0-9._\/-]{2,30})/i,
      /(?:^|\n)\s*Nr\.?\s*[:#.-]?\s*([A-Z0-9][A-Z0-9._\/-]{2,30})/im
    ]);
  }
  result.partNumber = first(normalized, [
    /(?:part\s*(?:no|number)|p\/n|p(?:\/|-|\.)?\s*no\.?|product\s*(?:no|number)|article\s*no\.?|cod\.?|code|cat\.?\s*no(?:\.\/part\s*no\.?)?)\s*[:#.-]?\s*[\[|:_-]*\s*([A-Z0-9][A-Z0-9.+_\/-]{2,40})/i
  ]);
  result.orderNumber = first(normalized, [
    /(?:work\s+order|order|o\/n)\s*[:#.-]?\s*([A-Z0-9][A-Z0-9.+_\/-]{2,40})/i
  ]);

  if (/^[\d\s]+$/.test(result.model)) result.model = result.model.replace(/\s+/g,"");
  if (/^[LI]\d{7,}$/i.test(result.model)) result.model = "1" + result.model.slice(1);
  if (/^[\d\s]+$/.test(result.serialNumber)) result.serialNumber = result.serialNumber.replace(/\s+/g,"");
  if (result.model && result.model.replace(/[^A-Z0-9]/gi, "").length < 2) result.model = "";
  if (result.serialNumber && !/\d/.test(result.serialNumber)) result.serialNumber = "";
  if (!result.model) result.model = first(normalized, [/\bMODEL\s*:\s*([A-Z0-9][A-Z0-9.+_\/-]+)\b/i]);
  if (!result.model) {
    result.model = first(normalized, [
      /3\s*[~\-]\s*(?:motor|mot)\s+([A-Z0-9][A-Z0-9.+_\/-]{3,30}(?:\s+[A-Z0-9.+_\/-]{1,12}){0,3})/i,
      /3\s*~\s+([A-Z][A-Z0-9.+_\/-]{3,30}(?:\s+[A-Z0-9.+_\/-]{1,12}){0,3})/i,
      /(?:^|\n)\s*(LXM62[A-Z0-9]+)\s*(?:\n|$)/i,
      /(?:^|\n)\s*((?:Movitec|Omega|VMS)\s+[A-Z0-9][A-Z0-9 .+_\/-]{2,40})\s*(?:\n|$)/i,
      /(?:^|\n)\s*(LSHRM\s+\d+[A-Z0-9 ]{0,20})\s*(?:\n|$)/i
    ]);
  }

  result.date = first(normalized, [
    /\bDate(?:\s*\(YYMM\))?\s*[:#.-]?\s*[\[|:_-]*\s*((?:(?:0?[1-9]|1[0-2])\s*[\/.-]\s*\d{2,4}|(?:19|20)\d{2}[.\/-]\d{1,2}(?:[.\/-]\d{1,2})?|\d{4}))/i,
    /(?:^|\n)\s*((?:19|20)\d{2}[.-]\d{1,2}[.-]\d{1,2})\s*(?:\n|$)/i,
    /(?:^|\n)\s*(\d{1,2}\.\d{1,2}\.(?:19|20)\d{2})\s*(?:\n|$)/i,
    /\bProd\.?\s*((?:\d{1,2})\s*\/\s*(?:19|20)\d{2})\b/i
  ]);

  result.phases = first(normalized, [
    /\bPH\s*[:#=.-]?\s*[\[|:_-]*\s*([123])(?=\s|\]|$)/i,
    /(?:phase|phases|fasi)\s*[:#=.-]?\s*([123])\b/i,
    /\b(monof[aá]sico)\b/i,
    /\b(trif[aá]sico)\b/i,
    /\b([13])\s*PH\b/i,
    /\b([13])\s*Phase\b/i,
    /\b([13])\s*[-–]\s*Phase\b/i,
    /\b([13])\s*[x×]\s*\d{2,4}\s*V\b/i
  ]);
  if (/^monof/i.test(result.phases || "")) result.phases = "1";
  if (/^trif/i.test(result.phases || "")) result.phases = "3";

  result.frequency = first(normalized, [
    /\b((?:50|60)(?:\s*\/\s*(?:50|60))?(?:[.,]\d+)?)\s*Hz\b/i,
    /\b(\d{2,3}\s*[-–]\s*\d{2,3})\s*Hz\b/i,
    /\b(?:Hz|F\s*\(\s*Hz\s*\))\s*[:=~-]?\s*((?:50|60)(?:\s*\/\s*(?:50|60))?)(?=\s|$)/i
  ]);
  if (result.frequency && !/Hz$/i.test(result.frequency)) result.frequency += " Hz";
  const hasSlashFrequency = /\b(?:50\s*\/\s*60|60\s*\/\s*50)\s*Hz\b/i.test(normalized);
  if (!hasSlashFrequency) {
    const standaloneFrequencies = uniqueValues([...normalized.matchAll(/\b(50|60)\s*Hz\b/gi)].map(match => match[1]));
    if (standaloneFrequencies.length > 1) result.frequency = joinRatings(standaloneFrequencies, "Hz");
  }
  if (!result.frequency && /\bH[eEz]\s*\[\s*S[O0]\s*\]/i.test(normalized)) result.frequency = "50 Hz";

  result.power = first(normalized, [
    /\bPower\s+LD\/ND\/HD\s*[:=.-]?\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?){1,3})\s*kW\b/i,
    /(?:^|\n)\s*(?:kW|KW)[ \t]*[:=.-]?[ \t]*(\d+(?:[.,]\d+)?(?:[ \t]*\/[ \t]*\d+(?:[.,]\d+)?)*)\b/i,
    /\bkW\.?MAX\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\bTotal\s*W\s*[:=~-]?\s*[\[|:_-]*\s*(\d+(?:[.,]\d+)?)(?=\s|\]|$)/i,
    /(?:total\s+input|input\s+power)\s*[:=~-]?\s*(?:kW|W|HP)?\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\b(\d{1,6}(?:[.,]\d+)?)\s*kW\b/i,
    /(?:^|\n)\s*kW\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)(?=\s|$)/i,
    /\bkW\s*[:=~-]?\s*(\d{1,6}(?:[.,]\d+)?)(?=\s|$)/i
  ]);
  if (result.power && !/(?:kW|W|HP)$/i.test(result.power)) {
    result.power += /\bTotal\s*W\b/i.test(normalized) ? " W" : " kW";
  }
  result.apparentPower = first(normalized, [
    /(?:rated\s+power|apparent\s+power|rating)\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*kVA\b/i,
    /\b(\d+(?:[.,]\d+)?)\s*kVA\b/i
  ]);
  if (result.apparentPower && !/kVA$/i.test(result.apparentPower)) result.apparentPower += " kVA";

  result.current = first(normalized, [
    /\bAmps\s+LD\/ND\/HD\s*[:=.-]?\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?){1,3})\b/i,
    /\bA\.?MAX\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\b(\d{1,5}(?:[.,]\d+)?(?:[ \t]*\/[ \t]*\d{1,5}(?:[.,]\d+)?)*)[ \t]*A(?![-A-Z0-9])/i,
    /(?:current|amp(?:s|ere)?|corriente|strom)[ \t]*[:=~-]?[ \t]*(\d+(?:[.,]\d+)?(?:[ \t]*\/[ \t]*\d+(?:[.,]\d+)?)*)[ \t]*A?\b/i,
    /(?:F\.[ \t]*L\.[ \t]*A\.?|FLAMPS|AMPS?|I[ \t]*\([ \t]*A[ \t]*\))[ \t]*[:=.-]?[ \t]*(\d+(?:[.,]\d+)?(?:[ \t]*\/[ \t]*\d+(?:[.,]\d+)?){0,3})\b/i,
    /\b(\d+(?:[.,]\d+)?)\s*Amps?\b/i,
    /\b(\d+(?:[.,]\d+)?)\s*ampe(?:r(?:e|ios?)?)?\b/i,
    /(?:^|\n)\s*A\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)(?=\s|$)/i,
    /(?:baujahr\s*\/\s*year|baujahr|year)\s*[:#.-]?\s*(?:19|20)?\d{2}\s+A\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)/i
  ]);
  if (result.current && !/A$/i.test(result.current)) result.current += " A";
  const modelLineCurrentFalsePositive = result.current && lines.some(line => {
    const ampValue = result.current.replace(/\s*A$/i, "").toLowerCase();
    const normalizedLine = line.toLowerCase();
    return normalizedLine.includes(ampValue + " a") &&
      /^(?:Omega|Type|Typ|Model)\b/i.test(line) && !/\b(?:V|Hz|kW|W|current|amp|FLA|INPUT|OUTPUT)\b/i.test(line);
  });
  if (modelLineCurrentFalsePositive) result.current = "";
  const yearAsCurrent = result.current && result.year && result.current.replace(/\s*A$/i, "") === result.year;
  if (yearAsCurrent) {
    const labelledCurrent = normalized.match(/\bA\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)\b/i);
    result.current = labelledCurrent && labelledCurrent[1] ? labelledCurrent[1] + " A" : "";
  }
  if (!result.current) {
    const fla = normalized.match(/(?:Package|Motor|Drive\s+Motor)\s+FLA\s+([\d|/.,\s]+)/i);
    if (fla && fla[1]) result.current = clean(fla[1]).replace(/[|]+/g, " / ") + " A";
  }

  result.voltage = first(normalized, [
    /\b(\d{2,4}\s*\.{2,3}\s*\d{2,4})\s*V(?:AC|DC)?\b/i,
    /(?:^|\n)\s*(?:VOLTS?|V\.)[ \t]*[:=.-]?[ \t]*((?:\d{2,4}(?:[ \t]*[-\/][ \t]*\d{2,4})?)(?:[ \t]*\/[ \t]*\d{2,4}(?:[ \t]*[-\/][ \t]*\d{2,4})?)*)/i,
    /U[ \t]*\([ \t]*V[ \t]*\)[ \t]*[:=.-]?[ \t]*((?:\d{2,4}(?:[ \t]*[-\/][ \t]*\d{2,4})?))/i,
    /\b3AC\s*(\d{2,4}\s*[-–]\s*\d{2,4})\s*V?/i,
    /\b(\d{3,4}(?:\s*[\/-]\s*\d{3,4})?)\s*Volt\b/i,
    /(?:Input\s+(?:a\.c\.\/d\.c\.|ac\/dc|ac|a\.c\.)|INPUT\s*:)[^\n]{0,24}?((?:\d{2,4}(?:\s*[-\/]\s*\d{2,4})?))\s*V(?:ac|dc)?\b/i,
    /\bVolt\s*[~=:.-]*\s*[\[|:_-]*\s*(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)(?=\s|\]|$)/i,
    /\bIN\s*:\s*(3x\d{2,4}\s*[-/]\s*\d{2,4})\s*V/i,
    /(?:voltage|volt|tension|spannung)\s*[:=~-]?\s*(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)\s*V?\b/i,
    /\b(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)\s*V\b/i,
    /\b(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)\s*VOLTS?\b/i,
    /\b(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)\s*Volt\b/i
  ]);
  if (result.voltage && !/V$/i.test(result.voltage)) result.voltage += " V";
  if (result.voltage) {
    const voltageValue = result.voltage.replace(/\s*V$/i, "").replace(/\s+/g, "").toLowerCase();
    const matchingLines = lines.filter(line => line.replace(/\s+/g, "").toLowerCase().includes(voltageValue + "v"));
    const capacitorOnlyVoltage = matchingLines.length > 0 && matchingLines.every(line => /(?:co)?ndensador|capacitor|condenser/i.test(line));
    if (capacitorOnlyVoltage) result.voltage = "";
  }
  const multiVoltages = uniqueValues([...normalized.matchAll(/\b(\d{3,4}Y?\s*\/\s*\d{3,4})\s*V\b/gi)].map(match => match[1]));
  if (multiVoltages.length > 1) result.voltage = joinRatings(multiVoltages, "V");

  result.capacity = first(normalized, [
    /(?:zul\.?\s*)?(?:Trocken[\s-]*f[üu]llmenge|fullmenge|füllmenge)\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)\s*kg\b/i,
    /(?:capacity|capacit[aà])\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)\s*(kg|L|Lt)?/i,
    /\bLt\s*[:=~-]?\s*[\[|:_-]*\s*(\d+(?:[.,]\d+)?)(?=\s|\]|$)/i,
    /(?:liters?|litres?|litri)\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\b(\d+(?:[.,]\d+)?)\s*LTR\.?\b/i,
    /(?:APPROX\.?\s*)?U\.S\.\s*GALS?\.?\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)/i
  ]);
  if (result.capacity) {
    const cap = normalized.match(/(?:capacity|capacit[aà]|trocken[\s-]*f[üu]llmenge|fullmenge|füllmenge)\s*[:=~-]?\s*\d+(?:[.,]\d+)?\s*(kg|L|Lt)?/i);
    const capUnit = cap && cap[1] ? (/kg/i.test(cap[1]) ? "kg" : "L") : (/Trocken[\s-]*f[üu]llmenge|fullmenge|füllmenge/i.test(normalized) ? "kg" : (/\bLt\b|liters?|litres?|litri/i.test(normalized) ? "L" : ""));
    if (capUnit && !new RegExp(capUnit + "$", "i").test(result.capacity)) result.capacity += " " + capUnit;
  }

  result.volume = first(normalized, [
    /(?:F[üu]llraum|Fullraum|volume)\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)\s*(?:L|Lt|ltr\.?)\b/i,
    /\b(\d+(?:[.,]\d+)?)\s*LTR\.?\b/i
  ]);
  if (result.volume && !/L$/i.test(result.volume)) result.volume += " L";
  if (!result.capacity && result.volume) result.capacity = result.volume;

  result.heatingPower = first(normalized, [
    /(?:(?:Riscaldamento\s*\/\s*Heating\s*Elements?|Caldaia\s*\/\s*(?:Boiler|Bolier))[\s\S]{0,100}?\bW\s*[:=~.\-]*\s*[\[|:_-]*\s*)(\d+(?:[.,]\d+)?)/i
  ]);
  if (result.heatingPower && !/W$/i.test(result.heatingPower)) result.heatingPower += " W";

  if (!result.power) {
    result.power = first(normalized, [
      /Anschlu(?:ss|ß)wert\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)\s*kW\b/i
    ]);
    if (result.power) result.power += " kW";
  }
  result.fuseRating = first(normalized, [
    /Absicherung\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)\s*A\b/i
  ]);
  if (result.fuseRating) result.fuseRating += " A";
  result.heatingType = first(normalized, [
    /Beheizungsart\s*[:=~-]?\s*([A-Za-zÄÖÜäöüß-]{3,20})/i
  ]);
  result.operatingTemperature = first(normalized, [
    /(?:zul\.?\s*)?Betriebs[\s-]*temperatur\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)\s*°?C\b/i
  ]);
  if (result.operatingTemperature) result.operatingTemperature += " °C";
  result.airSupplyPressure = first(normalized, [
    /Druckluft[\s-]*Netzanschlu(?:ss|ß)\s*[:=~-]?\s*(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*bar\b/i
  ]);
  if (result.airSupplyPressure) result.airSupplyPressure += " bar";

  result.airPressure = first(normalized, [
    /(?:Pressione\s+aliment\.\s+aria\s*\/\s*Air\s+inlet\s+pressure)[\s\S]{0,60}?\bBAR[\s:=~.\-\[|_]*(\d+(?:[.,]\d+)?)/i,
    /Druckluft[\s-]*Betriebsdruck\s*[:=~-]?\s*(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*bar\b/i
  ]);
  if (result.airPressure && !/bar$/i.test(result.airPressure)) result.airPressure += " bar";

  result.steamPressure = first(normalized, [
    /(?:Pressione\s+max\s+vapore\s*\/\s*Max\s+steam\s+pressure)[\s\S]{0,60}?\bBAR[\s:=~.\-\[|_]*(\d+(?:[.,]\d+)?)/i
  ]);
  if (result.steamPressure && !/bar$/i.test(result.steamPressure)) result.steamPressure += " bar";

  result.year = first(normalized, [
    /(?:year\s+of\s+manufacture|baujahr\s*\/\s*year|baujahr|year|yr|año|built)\s*[:#.-]?\s*\'?((?:19|20)?\d{2})/i
  ]);
  const currentEqualsYear = result.current && result.year && result.current.replace(/\s*A$/i, "") === result.year;
  if (currentEqualsYear) {
    const labelledCurrentAfterYear = normalized.match(/(?:baujahr\s*\/\s*year|baujahr|year)\s*[:#.-]?\s*(?:19|20)?\d{2}\s+A\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)/i);
    result.current = labelledCurrentAfterYear && labelledCurrentAfterYear[1] ? labelledCurrentAfterYear[1] + " A" : "";
  }

  result.weight = first(normalized, [
    /(?:gewicht\s*\/\s*weight|gewicht|weight|mass|peso)\s*(?:kg)?\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)(?=\s|$)/i
  ]);
  if (!result.weight && !/(?:capacity|capacit[aà]|volume|trocken[\s-]*f[üu]llmenge|fullmenge|füllmenge)\b/i.test(normalized)) {
    result.weight = first(normalized, [/\b(\d+(?:[.,]\d+)?)\s*kg(?!\s*\/\s*h)\b/i]);
  }
  if (result.weight && !/kg$/i.test(result.weight)) result.weight += " kg";

  result.refrigerant = first(normalized, [
    /(?:refrigerant|refrig\.?|medium)\s*[:=.-]?\s*(R\d{2,4}[A-Z]?|NH[₃3]|CO[₂2]|HFO[-A-Z0-9]+)\b/i,
    /\b(R(?:22|32|134a|290|404A|407C|410A|448A|449A|452A|454[AC]|507|513A|600a))\b/i
  ]);
  result.ratio = first(normalized, [
    /\bi\s*[:=]\s*(\d+(?:[.,]\d+)?)/i,
    /\b(\d+\s*:\s*\d+)\b/
  ]);

  result.flow = first(normalized, [
    /\b(?:PUMP\s+CAP(?:ACITY)?|CAP(?:ACITY)?)\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*(?:GPM|m[³3]\/h|l\/min)\b/i,
    /\bQ\s*[:=.-]?\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?)\s*(?:m[³3]\/h|l\/s|l\/min|lts?\/hora|litros?\/hora)\b/i
  ]);
  if (result.flow) {
    const flowUnit = normalized.match(/(?:\bQ\s*[:=.-]?|\b(?:PUMP\s+CAP(?:ACITY)?|CAP(?:ACITY)?)\s*[:=.-]?)\s*\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?\s*(m[³3]\/h|l\/s|l\/min|lts?\/hora|litros?\/hora|GPM)\b/i);
    if (flowUnit && flowUnit[1]) result.flow += " " + flowUnit[1];
  }

  result.head = first(normalized, [
    /(?:^|\n)\s*H\s*[:=.-]?\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?)\s*(?:m|metros?)\b/i,
    /\bQ\s*[:=.-]?\s*\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?\s*(?:m[³3]\/h|l\/s|l\/min|lts?\/hora)[^\n]{0,50}?\bH\s*[:=.-]?\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?)\s*(?:m|metros?)\b/i
  ]);
  if (result.head && !/m$/i.test(result.head)) result.head += " m";

  result.workingPressure = first(normalized, [
    /zul[aä]ssiger\s+Betriebsdruck\s*[:=~-]?\s*(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*bar\b/i,
    /\b(?:RATED|FULL\s+LOAD)\s+OPERATING\s+PRESSURE\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*PSIG\b/i,
    /\bMAX\.?\s*(?:SERVICE\s+)?PRESS(?:URE)?\.?\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*(PSI|PSIG|bar)\b/i,
    /\bMAWP\s*(\d+(?:[.,]\d+)?)\s*PSI\b/i,
    /\bPRESSURE\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*PSI\b/i,
    /\bAIR\s+WORKING\s+PRESS\.?\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*psig\b/i,
    /\bp\s*max\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*bar\b/i,
    /\bVacuum\s*[:=.-]?\s*\d+(?:[.,]\d+)?\s*hPa\s*\(\s*(\d+(?:[.,]\d+)?)\s*mbar\s*\)/i,
    /\bPS(?:\/PSs)?(?:\s+(?:LP|HP))?\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*bar(?:\(g\))?\b/i,
    /(?:max\.?\s*working\s*pressure|working\s*pressure|max\.?\s*pressure)\s*(?:bar(?:\(e\))?|psig)?\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\bpsig\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\bp\/t\s+(\d+(?:[.,]\d+)?)\s*\/\s*\d+(?:[.,]\d+)?\s*bar/i
  ]);
  if (result.workingPressure) {
    const pressureUnit = /\bpsig\b/i.test(normalized) ? "psig" : (/\bPSI\b/i.test(normalized) ? "PSI" : (/\bmbar\b/i.test(normalized) ? "mbar" : "bar"));
    if (!/(?:bar|psig)$/i.test(result.workingPressure)) result.workingPressure += " " + pressureUnit;
  }
  result.overpressure = first(normalized, [
    /(?:zul\.?\s*)?Betriebs[\s-]*(?:über|ueber)druck\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)\s*bar\b/i
  ]);
  if (result.overpressure) result.overpressure += " bar";

  result.speed = first(normalized, [
    /\bn1\s*max\s*[:=.-]?\s*(\d{2,5})\s*(?:\/min|r\/?min|rpm)\b/i,
    /(?:^|\n)\s*(?:R\.[ \t]*P\.[ \t]*M\.?|RPM|FLRPM|F\.[ \t]*L\.[ \t]*RPM)[ \t]*[:=.-]?[ \t]*(\d{2,5}(?:[ \t]*\/[ \t]*\d{2,5}){0,3})\b/i,
    /\bINPUT\s+RPM\s*[:=.-]?\s*(\d{2,5})\b/i,
    /\bn\s*max\s*[:=.-]?\s*(\d{2,5})\s*(?:U\/min|1\/min|r\/?min|rpm)\b/i,
    /\b(\d{2,5}\s*[-–]\s*\d{2,5})[ \t]*(?:r\/?min|rpm|min-1|min⁻¹|\/min)\b/i,
    /\b(\d{2,5})[ \t]*(?:r\/?min|rpm|min-1|min⁻¹|U\/min|\/min)\b/i,
    /(?:^|\n)\s*n(?:\s+fix\.?)?\s*[:=~-]?\s*(\d{2,5})\s*(?:1\/min|r\/?min|rpm|min-1|min⁻¹)\b/i,
    /(?:^|\n)\s*(?:RPM|r\/min|min-1|min⁻¹)\s*[:=~-]?\s*(\d{2,5})\b/i
  ]);
  if (result.speed && !/rpm$/i.test(result.speed)) result.speed += " rpm";
  result.ipRating = first(normalized, [/(\bIP\s*(?:X\d|\d{2})[A-Z]?\b)/i]);
  result.cosPhi = first(normalized, [
    /(?:cos\s*[φϕø]|power\s*factor|pf)\s*[:=-]?\s*(0[.,]\d{1,3})/i
  ]);

  // Company lines are a stronger manufacturer signal than arbitrary first text.
  const knownBrands = [
    ["SEW-EURODRIVE", /\bSEW[\s-]*EURODRIVE\b/i],
    ["Atlas Copco", /\bAtlas\s*Copco\b/i],
    ["Danfoss", /\bDanfoss\b/i],
    ["Electrolux", /\bElectrolux\b/i],
    ["Bonfiglioli", /\bBonfiglioli\b/i],
    ["Grundfos", /\bGrundfos\b/i],
    ["Siemens", /\bSiemens\b/i],
    ["KAESER", /\bKaeser\b/i],
    ["ABB", /\bABB(?:\s+Motors?)?\b/i],
    ["WEG", /\bWEG\b/i],
    ["VEIT", /\bVEIT\b/i],
    ["Barbanti", /\bBarbanti\b/i],
    ["YASKAWA", /\bYASKAWA\b/i],
    ["Schneider Electric", /\bSchneider\s+Electric\b/i],
    ["KSB", /\bKSB(?:\s+(?:B\.V\.|SE\s*&\s*Co\.\s*KGaA|Pumps?))?\b/i],
    ["Sulzer", /\bSULZER\b/i],
    ["Leroy-Somer", /\b(?:Nidec\s+)?Leroy[\s-]*Somer\b/i],
    ["Copeland", /\bCopeland\b/i],
    ["EBARA", /\bEBARA\b/i],
    ["Alfa Laval", /\bAlfa\s+Laval\b/i],
    ["Festo", /\bFesto\b/i],
    ["GEA", /\bGEA\b/i],
    ["BLOCH", /(?:\bBLOCH\b|bombas?h?bloch\.com)/i],
    ["Trane", /\bTRANE\b/i],
    ["Cleaver-Brooks", /\bCleaver[\s-]*Brooks\b/i],
    ["Parker", /\bParker\b/i],
    ["Riello", /\bRIELLO\b/i],
    ["Busch", /\bBUSCH\b/i],
    ["Ingersoll Rand", /\bINGERSOLL[\s-]*RAND\b/i],
    ["Falk", /\bFALK\b/i],
    ["Sullair", /\bSULLAIR\b/i],
    ["Baldor-Reliance", /\bBALDOR[\s•-]*RELIANCE\b/i],
    ["Leeson", /\bLEESON\b/i],
    ["Brook Crompton", /\bBROOK\s+CROMPTON\b/i],
    ["Marathon", /\bMARATHON(?:\s+ELECTRIC)?\b/i],
    ["Toshiba", /\bTOSHIBA\b/i],
    ["Mitsubishi Electric", /\bMITSUBISHI\s+ELECTRIC\b/i],
    ["Allen-Bradley", /\bAllen[\s-]*Bradley\b/i],
    ["Primus", /\bPrimus\b/i],
    ["Pedrollo", /\bPedrollo\b/i],
    ["Flygt", /\bFlygt\b/i],
    ["Wilo", /\bWilo\b/i],
    ["Goulds", /\bGoulds(?:\s+Pumps?)?\b/i],
    ["CompAir", /\bCompAir\b/i],
    ["Bitzer", /\bBitzer\b/i],
    ["Carrier", /\bCarrier\b/i],
    ["Daikin", /\bDaikin\b/i],
    ["York", /\bYork\b/i],
    ["Motovario", /\bMotovario\b/i],
    ["Lenze", /\bLenze\b/i],
    ["NORD", /\b(?:NORD|Nord\s+Drive\s+Systems)\b/i],
    ["Bauer", /\bBauer\b/i],
    ["TECO-Westinghouse", /\b(?:TECO[\s-]*Westinghouse|TECO)\b/i],
    ["Flowserve", /\bFlowserve\b/i],
    ["Bell & Gossett", /\bBell\s*&\s*Gossett\b/i],
    ["Gardner Denver", /\bGardner\s+Denver\b/i],
    ["BOGE", /\bBOGE\b/i],
    ["Waukesha", /\bWaukesha(?:\s+Cherry[\s-]*Burrell)?\b/i],
    ["Becker", /\bBecker\b/i],
    ["Armstrong", /\bArmstrong\b/i],
    ["Quincy", /\bQuincy\b/i],
    ["ELGi", /\bELGI\b/i],
    ["Lowara", /\bLowara\b/i],
    ["Calpeda", /\bCalpeda\b/i],
    ["Emerson", /\bEmerson(?:\s+Climate\s+Technologies)?\b/i],
    ["PHARMAGG", /\bPHARMAGG\b/i],
    ["Kannegiesser", /\bKannegiesser\b/i]
  ];
  const knownBrand = knownBrands.find(entry => entry[1].test(normalized));
  result.manufacturer = knownBrand ? knownBrand[0] : first(normalized, [
    /\b([A-Z][A-Za-z0-9&. -]{1,35}?(?:GmbH(?:\s*&\s*Co\.?)?|AG|Ltd\.?|S\.?A\.?|S\.?r\.?l\.?|Inc\.?|Corp\.?))(?=,|\n|$)/i
  ]);
  if (result.manufacturer === "Leroy-Somer" && !result.serialNumber) {
    result.serialNumber = first(normalized, [/(?:19|20)\d{2}\s+([A-Z]?\d{5,10})\b/i]);
  }
  if (result.manufacturer === "KSB") {
    const ksbPart = first(normalized, [
      /\bP[-.]?\s*No\.?\s*[:#.-]?\s*([A-Z0-9]+(?:\s*\/\s*[A-Z0-9]+)?)/i,
      /\bID\s+([A-Z0-9][A-Z0-9._\/-]{5,30})\b/i
    ]);
    if (ksbPart) result.partNumber = ksbPart;
  }
  if (result.manufacturer === "Sulzer" && !result.partNumber) {
    result.partNumber = first(normalized, [/\bID\s+([A-Z0-9][A-Z0-9._\/-]{5,30})\b/i]);
  }
  if (result.manufacturer === "Schneider Electric" && !result.model) {
    result.model = first(normalized, [/(?:^|\n)\s*(LXM62[A-Z0-9]+)\s*(?:\n|$)/i]);
  }
  if (result.manufacturer === "Schneider Electric" && !result.serialNumber) {
    result.serialNumber = first(normalized, [/\bCode\s*\n\s*(\d{8,14})\b/i, /(?:^|\n)\s*(\d{10})\s*\n\s*\d{1,2}\.\d{1,2}\.(?:19|20)\d{2}/i]);
    if (result.serialNumber && result.partNumber === result.serialNumber) result.partNumber = "";
  }
  if (result.manufacturer === "EBARA" && !result.partNumber) {
    result.partNumber = first(normalized, [/\bP\/?No\.?\s*[:#.-]?\s*([A-Z0-9][A-Z0-9._\/-]{4,30})/i]);
  }
  if (result.manufacturer === "KSB" && !result.model) {
    result.model = first(normalized, [/(?:^|\n)\s*((?:Movitec|Omega)\s+[A-Z0-9][A-Z0-9 .+_\/-]{2,40})\s*(?:\n|$)/i]);
  }
  if (result.manufacturer === "Sulzer" && !result.model) {
    result.model = first(normalized, [/(?:^|\n)\s*((?:VMS|Sanimax|Sanimat|AHLSTAR)[A-Z0-9 .+_\/-]{2,40})\s*(?:\n|$)/i]);
  }
  if (result.manufacturer === "Copeland" && !result.model) {
    result.model = first(normalized, [/\bModel\s*[:#.-]?\s*([A-Z0-9][A-Z0-9.+_\/-]{4,40})/i]);
  }

  if (result.manufacturer === "Trane") {
    if (!result.model) result.model = first(normalized, [/MODELO\s*\n\s*([A-Z0-9][A-Z0-9._\/-]{8,60})/i, /MODEL\s*\n\s*([A-Z0-9][A-Z0-9._\/-]{8,60})/i]);
    result.serialNumber = first(normalized, [/SERIAL\s*N[°º]?\s*([A-Z0-9]+(?:\s+\d+)?)(?=\s+(?:ANNEE|YEAR|BAUJAHR)|\n|$)/i]) || result.serialNumber;
  }
  if (result.manufacturer === "Parker" && !result.serialNumber) {
    result.serialNumber = first(normalized, [/Typ\s+[A-Z0-9._\/-]+\s*\n\s*([A-Z0-9]+\/[A-Z0-9]+)/i]);
  }
  if (result.manufacturer === "Riello") {
    if (!result.model) result.model = first(normalized, [/RIELLO\s+([0-9]+\s*G\d+\s*[A-Z]*)\b/i]);
    if (!result.serialNumber) result.serialNumber = first(normalized, [/(?:^|\n)\s*N\.\s*(\d{6,})\b/i]);
    if (!result.partNumber) result.partNumber = first(normalized, [/\bCOD\.\s*(\d{5,})\b/i]);
  }
  if (result.manufacturer === "Falk" && !result.capacity) {
    const gals = first(normalized, [/(?:APPROX\.\s*)?U\.S\.\s*GALS\.\s*(\d+(?:[.,]\d+)?)/i]);
    if (gals) result.capacity = gals + " US gal";
  }
  if (result.manufacturer === "WEG" && !result.model) {
    result.model = first(normalized, [
      /(?:^|\n)\s*(W3[A-Z0-9._\/-]{7,})\s*(?:\n|$)/i,
      /(?:^|\n)\s*(\d{3}[A-Z]\/?[A-Z]?-\d{2})\s*(?:\n|$)/i
    ]);
  }
  if (result.manufacturer === "WEG" && !result.serialNumber) {
    result.serialNumber = first(normalized, [/(?:^|\n)\s*(\d{8,12})\s*(?:\n|$)/]);
  }
  if (result.manufacturer === "WEG" && !result.year) {
    result.year = first(normalized, [/\b\d{2}[A-Z]{3}(\d{2})\b/i]);
  }
  if (result.manufacturer === "ABB" && !result.serialNumber) {
    result.serialNumber = first(normalized, [
      /\byear\s+(?:19|20)?\d{2}\s+No\.\s*([A-Z0-9][A-Z0-9._\/-]{6,30})/i,
      /(?:^|\n)\s*No\.\s*([A-Z0-9][A-Z0-9._\/-]{6,30})\b/i
    ]);
  }
  if (result.manufacturer === "ABB" && !result.model) {
    result.model = first(normalized, [/(?:^|\n)\s*(ACS\d{3,4}-[A-Z0-9+._\/-]+)\s*(?:\n|$)/i]);
  }
  if (result.manufacturer === "Schneider Electric" && !result.model) {
    result.model = first(normalized, [/(?:^|\n)\s*(ATV\d{3}[A-Z0-9._\/-]+)\s*(?:\n|$)/i, /(?:^|\n)\s*(LXM62[A-Z0-9]+)\s*(?:\n|$)/i]);
  }
  if (result.manufacturer === "Mitsubishi Electric" && !result.model) {
    result.model = first(normalized, [/(?:^|\n)\s*(FR-[A-Z]\d{3}-[A-Z0-9._\/-]+)\s*(?:\n|$)/i]);
  }
  if (result.manufacturer === "Siemens") {
    const siemensMotorModel = first(normalized, [
      /\b(1FT\d{4}-[A-Z0-9-]+)\b/i,
      /(?:^|\n)\s*(1FG\s+\d{4}-[A-Z0-9-]+)\s*(?:\n|$)/i
    ]);
    if (siemensMotorModel) result.model = siemensMotorModel;
  }
  if (result.manufacturer === "Siemens" && !result.model) {
    result.model = first(normalized, [/(?:POWER\s+MODULE\s+)?(PM\d{3}-\d)\b/i, /(?:^|\n)\s*(6SL\d[A-Z0-9._\/-]+)\s*(?:\n|$)/i]);
  }
  if (result.manufacturer === "Allen-Bradley" && !result.model) {
    result.model = first(normalized, [/(PowerFlex\s+\d{3}(?:TM)?)/i]);
  }
  if (result.manufacturer === "BLOCH" && !result.model) {
    result.model = first(normalized, [/(?:^|\n)\s*(\d{2,3}M)\s*(?:\n|$)/i]);
  }
  if (result.manufacturer === "BLOCH" && !result.head) {
    result.head = first(normalized, [/\b(\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?)\s*metros\b/i]);
    if (result.head) result.head += " m";
  }

  if (result.manufacturer === "PHARMAGG") {
    const pharmaModel = first(normalized, [
      /\b(FU\s*\d{3,5})\b/i,
      /(?:^|\n)\s*Typ\s*[:=.-]?\s*(FU\s*\d{3,5})\b/im
    ]);
    if (pharmaModel) result.model = pharmaModel.replace(/\s+/g, "");

    const pharmaSerial = first(normalized, [
      /Fabr\.?\s*Nr\.?\s*[:=.-]?\s*(\d{8,14})\b/i,
      /\b(\d{10,12})\b/
    ]);
    if (pharmaSerial) result.serialNumber = pharmaSerial;

    const ratedCurrent = first(normalized, [
      /Nennstrom\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*A\b/i
    ]);
    if (ratedCurrent) result.current = ratedCurrent + " A";
    else if (result.current) result.current = "";

    if (!/(?:^|\n)\s*(?:ratio\b|[ÜU]bersetzung\b)/im.test(normalized)) {
      result.ratio = "";
    }
  }

  if (result.manufacturer === "Alfa Laval" && !result.orderNumber) {
    result.orderNumber = first(normalized, [/\bOrder\s*[:#.-]?\s*([A-Z0-9][A-Z0-9._\/-]{3,30})/i]);
  }

  // Description normally sits above the technical key/value rows.
  const technicalStart = lines.findIndex(line =>
    /^(?:model|type|typ|fabr\.?\s*nr|serial|baujahr|year|gewicht|weight|hz|kw|volt|voltage|current|strom)\b/i.test(line)
  );
  const descriptionPool = (technicalStart > 0 ? lines.slice(0, technicalStart) : lines.slice(0, 6))
    .filter(line =>
      line.length >= 4 &&
      line.length <= 60 &&
      !/^CE$/i.test(line) &&
      !/^veit$/i.test(line) &&
      !/GmbH|Justus|Germany|www\.|@/i.test(line)
    );
  result.equipment = descriptionPool.find(line =>
    /table|machine|motor|pump|dryer|washer|ironing|bügel|compressor|drive|fan|oven|transformer|boiler|burner|heat\s+exchanger|chiller/i.test(line) &&
    !/^(?:model|modello|matricola|serial|date|hz|ph|volt|total|lt|bar)\b/i.test(line)
  ) || "";
  if (/^(?:SEW-EURODRIVE|KAESER COMPRESSORS|ABB Motors)$/i.test(result.equipment)) result.equipment = "";

  if (!result.year) {
    result.year = first(normalized, [/\b((?:19|20)\d{2})\b/]);
  }

  const motorTable = parseMotorTable(lines);
  for (const [key, value] of Object.entries(motorTable)) {
    if (value) result[key] = value;
  }

  return result;
}

function fillForm(data, presence = new Set()) {
  showEmptyFields = false;
  detectedFieldPresence = new Set(presence);
  for (const [name] of fields) {
    const element = recordForm.elements[name];
    element.value = data[name] || "";
  }
  updateFieldVisibility();
}

function record() {
  const formData = new FormData(recordForm);
  const values = Object.fromEntries(formData.entries());
  const fieldsOut = Object.fromEntries(Object.entries(values).filter(([,v]) => String(v).trim() !== ""));
  return {
    source: "PlateLens",
    capturedAt: new Date().toISOString(),
    fields: fieldsOut,
    unreadableFields: [...detectedFieldPresence].filter(name => !String(values[name] || "").trim()),
    rawOcr: rawText.textContent
  };
}
function humanText() {
  const r = record();
  return Object.entries(r.fields).map(([key,value]) => {
    const label = fields.find(([name]) => name === key)?.[1] || (key === "notes" ? "Notes" : key);
    return `${label}: ${value}`;
  }).join("\n");
}
async function copy(value, button) {
  await navigator.clipboard.writeText(value);
  const old = button.textContent; button.textContent = "Copied";
  setTimeout(() => button.textContent = old, 1200);
}
document.querySelector("#copyRawBtn").addEventListener("click", e => copy(rawText.textContent,e.currentTarget));
document.querySelector("#copyTextBtn").addEventListener("click", e => copy(humanText(),e.currentTarget));
document.querySelector("#copyJsonBtn").addEventListener("click", e => copy(JSON.stringify(record(),null,2),e.currentTarget));
document.querySelector("#downloadJsonBtn").addEventListener("click", () => {
  const data = JSON.stringify(record(),null,2);
  const blob = new Blob([data],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `platelens-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
});
