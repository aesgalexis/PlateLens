const fields = [
  ["manufacturer","Manufacturer"],["equipment","Equipment / description"],["model","Model / type"],["serialNumber","Serial number"],["partNumber","Part / product code"],
  ["date","Date"],["phases","Phases"],["voltage","Voltage"],["frequency","Frequency"],["power","Total power"],["current","Current"],
  ["capacity","Capacity"],["ratio","Ratio"],["flow","Flow"],["head","Head"],["workingPressure","Working pressure"],["heatingPower","Heating power"],["airPressure","Air inlet pressure"],["steamPressure","Max steam pressure"],
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
let currentFile = null;

for (const [name,label] of fields) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  wrapper.innerHTML = `<span>${label}</span><input name="${name}" autocomplete="off">`;
  formGrid.appendChild(wrapper);
}

function setFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  currentFile = file;
  const url = URL.createObjectURL(file);
  previewImage.onload = () => URL.revokeObjectURL(url);
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
  currentFile = null; input.value = ""; previewImage.removeAttribute("src");
  previewWrap.hidden = true; dropZone.hidden = false; resultsSection.hidden = true;
  analyzeBtn.disabled = true; resetBtn.hidden = true; progressBar.style.width = "0%";
  progressText.textContent = "Choose an image to begin."; rawText.textContent = "";
  recordForm.reset();
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
    if ("filter" in ctx) ctx.filter = "grayscale(1) contrast(1.28)";
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ocrScore(result) {
  const text = (result?.data?.text || "").trim();
  const confidence = Number(result?.data?.confidence || 0);
  return confidence + Math.min(30, text.length / 8);
}
function needsLayoutRetry(text) {
  const valueSignals = (text.match(/\b(?:Hz|kW|Volt|V|A|rpm|r\/min|min-?1|bar|psig)\b/gi) || []).length;
  const labelSignals = (text.match(/\b(?:type|typ|model|modello|serial|matricola|fabr\.?\s*nr|year|baujahr|weight|gewicht|voltage|volt|current|power)\b/gi) || []).length;
  return text.trim().length >= 24 && labelSignals >= 2 && valueSignals < 3;
}
function needsTechnicalRegionRetry(text) {
  const parsed = parseNameplate(text);
  const technicalKeys = ["voltage","frequency","power","current","speed","capacity","flow","head","workingPressure","airPressure","steamPressure"];
  const technicalCount = technicalKeys.filter(key => Boolean(parsed[key])).length;
  const hasIdentity = Boolean(parsed.model || parsed.serialNumber || parsed.manufacturer);
  return hasIdentity && technicalCount < 3;
}

function mergeOcrTexts(...texts) {
  const seen = new Set();
  const lines = [];
  for (const text of texts) {
    for (const rawLine of String(text || "").split(/\r?\n/)) {
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
    let worker = null;
    try {
      worker = await Tesseract.createWorker("eng", 1, {
        logger: m => {
          if (typeof m.progress === "number") {
            const base = ocrPass === 1 ? 0 : (ocrPass === 2 ? 70 : 90);
            const span = ocrPass === 1 ? 68 : (ocrPass === 2 ? 18 : 8);
            const pct = Math.min(98, base + Math.round(m.progress * span));
            progressBar.style.width = pct + "%";
            progressText.textContent = `${friendlyStatus(m.status)} · ${pct}%`;
          }
        }
      });
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: "1"
      });

      let result = await worker.recognize(preparedImage);
      let text = (result.data.text || "").trim();

      if (Number(result.data.confidence || 0) < 42 || text.length < 24) {
        progressText.textContent = "Low OCR confidence · checking original image…";
        const fallback = await worker.recognize(currentFile);
        if (ocrScore(fallback) > ocrScore(result)) {
          result = fallback;
          text = (fallback.data.text || "").trim();
        }
      }

      if (needsTechnicalRegionRetry(text)) {
        ocrPass = 2;
        progressText.textContent = "Reading technical region…";
        const technicalRegion = {
          left: Math.round(preparedImage.width * 0.04),
          top: Math.round(preparedImage.height * 0.20),
          width: Math.round(preparedImage.width * 0.92),
          height: Math.round(preparedImage.height * 0.60)
        };
        const regionResult = await worker.recognize(preparedImage, {rectangle: technicalRegion});
        text = mergeOcrTexts(text, regionResult.data.text);
      }

      if (needsLayoutRetry(text)) {
        ocrPass = 3;
        progressText.textContent = "Reading technical layout…";
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          preserve_interword_spaces: "1"
        });
        const layoutResult = await worker.recognize(preparedImage);
        text = mergeOcrTexts(text, layoutResult.data.text);
      }

      rawText.textContent = text || "No readable text detected.";
      const parsed = parseNameplate(text);
      fillForm(parsed);
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
function parseMotorTable(lines) {
  const index = lines.findIndex(line => /\bV\b/i.test(line) && /\bHz\b/i.test(line) && /\bkW\b/i.test(line) && /(?:r\/min|min-?1|rpm)/i.test(line) && /\bA\b/.test(line));
  if (index < 0) return {};
  const rows = [];
  const hasCos = /cos/i.test(lines[index]);
  for (const line of lines.slice(index + 1, index + 10)) {
    const m = line.replace(/[Δ∆]/g, "D").match(/^(\d{3,4}\s*[YD]?)\s+(50|60)\s+(\d+(?:[.,]\d+)?)\s+(\d{3,5})\s+(\d+(?:[.,]\d+)?)(?:\s+(0[.,]\d+))?/i);
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
function parseNameplate(text) {
  const normalized = text
    .replace(/[–—]/g,"-")
    .replace(/Ø/g,"0")
    .replace(/[ \t]+/g," ");
  const lines = normalized.split(/\r?\n/).map(clean).filter(Boolean);
  const result = {};

  // Prefer values explicitly attached to labels. Industrial plates often place
  // another label/value pair on the same OCR line, so each capture is bounded.
  result.model = first(normalized, [
    /(?:^|\n)\s*(?:modello\s*\/\s*model|model|type|typ|mod\.?|modelo|t\/c)\s*[:#.-]?\s*[\[|:_-]*\s*([A-Z0-9][A-Z0-9.+_\/-]*(?:\s+[A-Z0-9.+_\/-]+){0,5}?)(?=\s*[\]|_-]*(?:\n|$|\s+(?:REV|INPUT|OUTPUT|Date|Hz|PH|Volt|Total|serial|matricola|fabr\.?|year|baujahr|weight|gewicht|P\/N|S\/N|Part\s*(?:No|Number)|Product\s*(?:No|Number))\b))/im
  ]);
  result.serialNumber = first(normalized, [
    /(?:matricola\s*\/\s*serial\s*number|serial(?:\s*(?:no|number|nr|n[°º.]?))?|s\/?n|ser\.?\s*no\.?|n[º°]\s*serie|fabr\.?\s*nr\.?)\s*[:#.=\-]?\s*[\[|:_-]*\s*([A-Z0-9][A-Z0-9._\/-]{2,30})(?=\s*[\]|_-]*(?:\n|$|\s+(?:Date|Hz|kW|KW|A|PH|Volt|Total|year|baujahr|weight|gewicht)\b))/im
  ]);
  result.partNumber = first(normalized, [
    /(?:part\s*(?:no|number)|p(?:\/|-|\.)?\s*no\.?|product\s*(?:no|number)|code|cat\.?\s*no)\s*[:#.-]?\s*[\[|:_-]*\s*([A-Z0-9][A-Z0-9.+_\/-]{2,40})/i
  ]);

  if (/^[\d\s]+$/.test(result.model)) result.model = result.model.replace(/\s+/g,"");
  if (/^[LI]\d{7,}$/i.test(result.model)) result.model = "1" + result.model.slice(1);
  if (/^[\d\s]+$/.test(result.serialNumber)) result.serialNumber = result.serialNumber.replace(/\s+/g,"");
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
    /\bDate(?:\s*\(YYMM\))?\s*[:#.-]?\s*[\[|:_-]*\s*((?:(?:0?[1-9]|1[0-2])\s*[\/.-]\s*\d{2,4}|\d{4}|(?:19|20)\d{2}[.-]\d{1,2}[.-]\d{1,2}))/i,
    /(?:^|\n)\s*((?:19|20)\d{2}[.-]\d{1,2}[.-]\d{1,2})\s*(?:\n|$)/i,
    /(?:^|\n)\s*(\d{1,2}\.\d{1,2}\.(?:19|20)\d{2})\s*(?:\n|$)/i,
    /\bProd\.?\s*((?:\d{1,2})\s*\/\s*(?:19|20)\d{2})\b/i
  ]);

  result.phases = first(normalized, [
    /\bPH\s*[:#=.-]?\s*[\[|:_-]*\s*([123])(?=\s|\]|$)/i,
    /(?:phase|phases|fasi)\s*[:#=.-]?\s*([123])\b/i
  ]);

  result.frequency = first(normalized, [
    /\b((?:50|60)(?:\s*\/\s*(?:50|60))?(?:[.,]\d+)?)\s*Hz\b/i,
    /\bHz\s*[:=~-]?\s*((?:50|60)(?:[.,]\d+)?)(?=\s|$)/i
  ]);
  if (result.frequency && !/Hz$/i.test(result.frequency)) result.frequency += " Hz";
  if (!result.frequency && /\bH[eEz]\s*\[\s*S[O0]\s*\]/i.test(normalized)) result.frequency = "50 Hz";

  result.power = first(normalized, [
    /\bTotal\s*W\s*[:=~-]?\s*[\[|:_-]*\s*(\d+(?:[.,]\d+)?)(?=\s|\]|$)/i,
    /(?:total\s+input|input\s+power)\s*[:=~-]?\s*(?:kW|W|HP)?\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\b(\d{1,6}(?:[.,]\d+)?)\s*kW\b/i,
    /(?:^|\n)\s*kW\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)(?=\s|$)/i,
    /\bkW\s*[:=~-]?\s*(\d{1,6}(?:[.,]\d+)?)(?=\s|$)/i
  ]);
  if (result.power && !/(?:kW|W)$/i.test(result.power)) {
    result.power += /\bTotal\s*W\b/i.test(normalized) ? " W" : " kW";
  }

  result.current = first(normalized, [
    /\b(\d+(?:[.,]\d+)?(?:[ \t]*\/[ \t]*\d+(?:[.,]\d+)?)*)[ \t]*A(?![-A-Z0-9])/i,
    /(?:current|amp(?:s|ere)?|corriente|strom)\s*[:=~-]?\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)*)\s*A?\b/i,
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
    /(?:Input\s+(?:a\.c\.\/d\.c\.|ac\/dc|ac|a\.c\.)|INPUT\s*:)[^\n]{0,24}?((?:\d{2,4}(?:\s*[-\/]\s*\d{2,4})?))\s*V(?:ac|dc)?\b/i,
    /\bVolt\s*[~=:.-]*\s*[\[|:_-]*\s*(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)(?=\s|\]|$)/i,
    /\bIN\s*:\s*(3x\d{2,4}\s*[-/]\s*\d{2,4})\s*V/i,
    /(?:voltage|volt|tension|spannung)\s*[:=~-]?\s*(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)\s*V?\b/i,
    /\b(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)\s*V\b/i
  ]);
  if (result.voltage && !/V$/i.test(result.voltage)) result.voltage += " V";
  const multiVoltages = uniqueValues([...normalized.matchAll(/\b(\d{3,4}Y?\s*\/\s*\d{3,4})\s*V\b/gi)].map(match => match[1]));
  if (multiVoltages.length > 1) result.voltage = joinRatings(multiVoltages, "V");

  result.capacity = first(normalized, [
    /(?:capacity|capacit[aà])\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)\s*(kg|L|Lt)?/i,
    /\bLt\s*[:=~-]?\s*[\[|:_-]*\s*(\d+(?:[.,]\d+)?)(?=\s|\]|$)/i,
    /(?:liters?|litres?|litri)\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)/i
  ]);
  if (result.capacity) {
    const cap = normalized.match(/(?:capacity|capacit[aà])\s*[:=~-]?\s*\d+(?:[.,]\d+)?\s*(kg|L|Lt)?/i);
    const capUnit = cap && cap[1] ? (/kg/i.test(cap[1]) ? "kg" : "L") : (/\bLt\b|liters?|litres?|litri/i.test(normalized) ? "L" : "");
    if (capUnit && !new RegExp(capUnit + "$", "i").test(result.capacity)) result.capacity += " " + capUnit;
  }

  result.heatingPower = first(normalized, [
    /(?:(?:Riscaldamento\s*\/\s*Heating\s*Elements?|Caldaia\s*\/\s*(?:Boiler|Bolier))[\s\S]{0,100}?\bW\s*[:=~.\-]*\s*[\[|:_-]*\s*)(\d+(?:[.,]\d+)?)/i
  ]);
  if (result.heatingPower && !/W$/i.test(result.heatingPower)) result.heatingPower += " W";

  result.airPressure = first(normalized, [
    /(?:Pressione\s+aliment\.\s+aria\s*\/\s*Air\s+inlet\s+pressure)[\s\S]{0,60}?\bBAR[\s:=~.\-\[|_]*(\d+(?:[.,]\d+)?)/i
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
  if (!result.weight && !/(?:capacity|capacit[aà])\b/i.test(normalized)) {
    result.weight = first(normalized, [/\b(\d+(?:[.,]\d+)?)\s*kg\b/i]);
  }
  if (result.weight && !/kg$/i.test(result.weight)) result.weight += " kg";

  result.ratio = first(normalized, [
    /\bi\s*[:=]\s*(\d+(?:[.,]\d+)?)/i,
    /\b(\d+\s*:\s*\d+)\b/
  ]);

  result.flow = first(normalized, [
    /\bQ\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*(?:m[³3]\/h|l\/s|l\/min)\b/i
  ]);
  if (result.flow) {
    const flowUnit = normalized.match(/\bQ\s*[:=.-]?\s*\d+(?:[.,]\d+)?\s*(m[³3]\/h|l\/s|l\/min)\b/i);
    if (flowUnit && flowUnit[1]) result.flow += " " + flowUnit[1];
  }

  result.head = first(normalized, [
    /(?:^|\n)\s*H\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*m\b/i,
    /\bQ\s*[:=.-]?\s*\d+(?:[.,]\d+)?\s*(?:m[³3]\/h|l\/s|l\/min)[^\n]{0,40}?\bH\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*m\b/i
  ]);
  if (result.head && !/m$/i.test(result.head)) result.head += " m";

  result.workingPressure = first(normalized, [
    /\bPS(?:\/PSs)?(?:\s+(?:LP|HP))?\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*bar(?:\(g\))?\b/i,
    /(?:max\.?\s*working\s*pressure|working\s*pressure|max\.?\s*pressure)\s*(?:bar(?:\(e\))?|psig)?\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\bpsig\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\bp\/t\s+(\d+(?:[.,]\d+)?)\s*\/\s*\d+(?:[.,]\d+)?\s*bar/i
  ]);
  if (result.workingPressure) {
    const pressureUnit = /psig/i.test(normalized) ? "psig" : "bar";
    if (!/(?:bar|psig)$/i.test(result.workingPressure)) result.workingPressure += " " + pressureUnit;
  }
  result.speed = first(normalized, [
    /\b(\d{2,5}\s*[-–]\s*\d{2,5})[ \t]*(?:r\/?min|rpm|min-1|min⁻¹|\/min)\b/i,
    /\b(\d{2,5})[ \t]*(?:r\/?min|rpm|min-1|min⁻¹|\/min)\b/i,
    /(?:^|\n)\s*n(?:\s+fix\.?)?\s*[:=~-]?\s*(\d{2,5})\s*(?:1\/min|r\/?min|rpm|min-1|min⁻¹)\b/i,
    /(?:^|\n)\s*(?:RPM|r\/min|min-1|min⁻¹)\s*[:=~-]?\s*(\d{2,5})\b/i
  ]);
  if (result.speed && !/rpm$/i.test(result.speed)) result.speed += " rpm";
  result.ipRating = first(normalized, [/(\bIP\s*\d{2}[A-Z]?\b)/i]);
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
    ["GEA", /\bGEA\b/i]
  ];
  const knownBrand = knownBrands.find(entry => entry[1].test(normalized));
  result.manufacturer = knownBrand ? knownBrand[0] : first(normalized, [
    /\b([A-Z][A-Za-z0-9&. -]{1,35}?(?:GmbH(?:\s*&\s*Co\.?)?|AG|Ltd\.?|S\.?A\.?|S\.?r\.?l\.?|Inc\.?|Corp\.?))(?=,|\n|$)/i
  ]);
  if (result.manufacturer === "Leroy-Somer" && !result.serialNumber) {
    result.serialNumber = first(normalized, [/(?:19|20)\d{2}\s+(\d{5,10})\b/]);
  }
  if ((result.manufacturer === "KSB" || result.manufacturer === "Sulzer") && !result.partNumber) {
    result.partNumber = first(normalized, [/\bP[-.]?\s*No\.?\s*[:#.-]?\s*([A-Z0-9][A-Z0-9 .\/_-]{4,40})/i, /\bID\s+([A-Z0-9][A-Z0-9._\/-]{5,30})\b/i]);
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
    /table|machine|motor|pump|dryer|washer|ironing|bügel|compressor|drive|fan|oven/i.test(line) &&
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

function fillForm(data) {
  let found = 0;
  for (const [name] of fields) {
    const element = recordForm.elements[name];
    element.value = data[name] || "";
    if (element.value) found++;
  }
  fieldCount.textContent = `${found} field${found === 1 ? "" : "s"} detected`;
}

function record() {
  const formData = new FormData(recordForm);
  const values = Object.fromEntries(formData.entries());
  return {
    source: "PlateLens",
    capturedAt: new Date().toISOString(),
    fields: Object.fromEntries(Object.entries(values).filter(([,v]) => String(v).trim() !== "")),
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
