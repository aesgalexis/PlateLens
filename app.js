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

analyzeBtn.addEventListener("click", async () => {
  if (!currentFile) return;
  if (!window.Tesseract) {
    progressText.textContent = "OCR library could not be loaded. Check your connection and reload.";
    return;
  }

  analyzeBtn.disabled = true;
  progressText.textContent = "Starting OCR…";
  try {
    const result = await Tesseract.recognize(currentFile, "eng", {
      logger: m => {
        if (typeof m.progress === "number") {
          const pct = Math.round(m.progress * 100);
          progressBar.style.width = pct + "%";
          progressText.textContent = `${friendlyStatus(m.status)} · ${pct}%`;
        }
      }
    });
    const text = result.data.text.trim();
    rawText.textContent = text || "No readable text detected.";
    const parsed = parseNameplate(text);
    fillForm(parsed);
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({behavior:"smooth",block:"start"});
    progressText.textContent = "OCR complete. Verify the extracted values.";
    progressBar.style.width = "100%";
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
    /(?:^|\n)\s*(?:modello\s*\/\s*model|model|type|typ|mod\.?|modelo|t\/c)\s*[:#.-]?\s*[\[|:_-]*\s*([A-Z0-9][A-Z0-9.+_\/-]*(?:\s+[A-Z0-9.+_\/-]+){0,5}?)(?=\s*[\]|_-]*(?:\n|$|\s+(?:Date|Hz|PH|Volt|Total|serial|matricola|fabr\.?|year|baujahr|weight|gewicht|P\/N|S\/N)\b))/im
  ]);
  result.serialNumber = first(normalized, [
    /(?:matricola\s*\/\s*serial\s*number|serial(?:\s*(?:no|number|nr))?|s\/?n|ser\.?\s*no\.?|n[º°]\s*serie|fabr\.?\s*nr\.?)\s*[:#.-]?\s*[\[|:_-]*\s*([A-Z0-9][A-Z0-9._\/-]{2,30})(?=\s*[\]|_-]*(?:\n|$|\s+(?:Date|Hz|PH|Volt|Total|year|baujahr|weight|gewicht)\b))/im
  ]);
  result.partNumber = first(normalized, [
    /(?:part\s*(?:no|number)|p\/n|product\s*(?:no|number)|code|cat\.?\s*no)\s*[:#.-]?\s*[\[|:_-]*\s*([A-Z0-9][A-Z0-9.+_\/-]{2,40})/i
  ]);

  if (/^[\d\s]+$/.test(result.model)) result.model = result.model.replace(/\s+/g,"");
  if (/^[\d\s]+$/.test(result.serialNumber)) result.serialNumber = result.serialNumber.replace(/\s+/g,"");
  if (!result.model) {
    result.model = first(normalized, [
      /3\s*[~\-]\s*(?:motor|mot)\s+([A-Z0-9][A-Z0-9.+_\/-]{3,30})/i,
      /3\s*~\s+([A-Z][A-Z0-9.+_\/-]{3,30})/i
    ]);
  }

  result.date = first(normalized, [
    /\bDate\s*[:#.-]?\s*[\[|:_-]*\s*((?:0?[1-9]|1[0-2])\s*[\/.-]\s*\d{2,4})/i
  ]);

  result.phases = first(normalized, [
    /\bPH\s*[:#=.-]?\s*[\[|:_-]*\s*([123])(?=\s|\]|$)/i,
    /(?:phase|phases|fasi)\s*[:#=.-]?\s*([123])\b/i
  ]);

  result.frequency = first(normalized, [
    /\bHz\s*[:=~-]?\s*((?:50|60)(?:[.,]\d+)?)(?=\s|$)/i,
    /\b((?:50|60)(?:[.,]\d+)?)\s*Hz\b/i
  ]);
  if (result.frequency && !/Hz$/i.test(result.frequency)) result.frequency += " Hz";

  result.power = first(normalized, [
    /\bTotal\s*W\s*[:=~-]?\s*[\[|:_-]*\s*(\d+(?:[.,]\d+)?)(?=\s|\]|$)/i,
    /\bkW\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)(?=\s|$)/i,
    /\b(\d+(?:[.,]\d+)?)\s*kW\b/i
  ]);
  if (result.power && !/(?:kW|W)$/i.test(result.power)) {
    result.power += /\bTotal\s*W\b/i.test(normalized) ? " W" : " kW";
  }

  result.current = first(normalized, [
    /(?:^|\s)A\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)(?=\s|$)/i,
    /(?:current|amp(?:s|ere)?|corriente|strom)\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)\s*A?\b/i,
    /\b(\d+(?:[.,]\d+)?)\s*A\b/i
  ]);
  if (result.current && !/A$/i.test(result.current)) result.current += " A";
  if (!result.current) {
    const fla = normalized.match(/(?:Package|Motor|Drive\s+Motor)\s+FLA\s+([\d|/.,\s]+)/i);
    if (fla && fla[1]) result.current = clean(fla[1]).replace(/[|]+/g, " / ") + " A";
  }

  result.voltage = first(normalized, [
    /\bVolt\s*[~=:.-]?\s*(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)(?=\s|$)/i,\n    /\bIN\s*:\s*(3x\d{2,4}\s*[-/]\s*\d{2,4})\s*V/i,
    /(?:voltage|volt|tension|spannung)\s*[:=~-]?\s*(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)\s*V?\b/i,
    /\b(\d{2,4}(?:\s*[\/-]\s*\d{2,4})?)\s*V\b/i
  ]);
  if (result.voltage && !/V$/i.test(result.voltage)) result.voltage += " V";
  const multiVoltages = uniqueValues([...normalized.matchAll(/\b(\d{3,4}Y?\s*\/\s*\d{3,4})\s*V\b/gi)].map(match => match[1]));
  if (multiVoltages.length > 1) result.voltage = joinRatings(multiVoltages, "V");

  result.capacity = first(normalized, [
    /\bLt\s*[:=~-]?\s*[\[|:_-]*\s*(\d+(?:[.,]\d+)?)(?=\s|\]|$)/i,
    /(?:liters?|litres?|litri)\s*[:=~-]?\s*(\d+(?:[.,]\d+)?)/i
  ]);
  if (result.capacity && !/L$/i.test(result.capacity)) result.capacity += " L";

  result.heatingPower = first(normalized, [
    /(?:Riscaldamento\s*\/\s*Heating\s*Elements?[\s\S]{0,80}?\bW\s*[:=~-]?\s*[\[|:_-]*\s*)(\d+(?:[.,]\d+)?)/i
  ]);
  if (result.heatingPower && !/W$/i.test(result.heatingPower)) result.heatingPower += " W";

  result.airPressure = first(normalized, [
    /(?:Pressione\s+aliment\.\s+aria\s*\/\s*Air\s+inlet\s+pressure)[\s\S]{0,60}?\bBAR\s*[:=~-]?\s*[\[|:_-]*\s*(\d+(?:[.,]\d+)?)/i
  ]);
  if (result.airPressure && !/bar$/i.test(result.airPressure)) result.airPressure += " bar";

  result.steamPressure = first(normalized, [
    /(?:Pressione\s+max\s+vapore\s*\/\s*Max\s+steam\s+pressure)[\s\S]{0,60}?\bBAR\s*[:=~-]?\s*[\[|:_-]*\s*(\d+(?:[.,]\d+)?)/i
  ]);
  if (result.steamPressure && !/bar$/i.test(result.steamPressure)) result.steamPressure += " bar";

  result.year = first(normalized, [
    /(?:year\s+of\s+manufacture|baujahr\s*\/\s*year|baujahr|year|yr|año|built)\s*[:#.-]?\s*\'?((?:19|20)?\d{2})/i
  ]);

  result.weight = first(normalized, [
    /(?:gewicht\s*\/\s*weight|gewicht|weight|mass|peso)\s*(?:kg)?\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)(?=\s|$)/i,
    /\b(\d+(?:[.,]\d+)?)\s*kg\b/i
  ]);
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
    /\bH\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)\s*m?\b/i
  ]);
  if (result.head && !/m$/i.test(result.head)) result.head += " m";

  result.workingPressure = first(normalized, [
    /(?:max\.?\s*working\s*pressure|working\s*pressure|max\.?\s*pressure)\s*(?:bar(?:\(e\))?|psig)?\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\bpsig\s*[:=.-]?\s*(\d+(?:[.,]\d+)?)/i,
    /\bp\/t\s+(\d+(?:[.,]\d+)?)\s*\/\s*\d+(?:[.,]\d+)?\s*bar/i
  ]);
  if (result.workingPressure) {
    const pressureUnit = /psig/i.test(normalized) ? "psig" : "bar";
    if (!/(?:bar|psig)$/i.test(result.workingPressure)) result.workingPressure += " " + pressureUnit;
  }
  result.speed = first(normalized, [
    /((?:\d{2,5})\s*(?:r\/?min|rpm|min-1|min⁻¹)\b)/i
  ]);
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
    ["Barbanti", /\bBarbanti\b/i]
  ];
  const knownBrand = knownBrands.find(entry => entry[1].test(normalized));
  result.manufacturer = knownBrand ? knownBrand[0] : first(normalized, [
    /\b([A-Z][A-Za-z0-9&. -]{1,35}?(?:GmbH(?:\s*&\s*Co\.?)?|AG|Ltd\.?|S\.?A\.?|S\.?r\.?l\.?|Inc\.?|Corp\.?))(?=,|\n|$)/i
  ]);

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

  if (!result.year) {
    result.year = first(normalized, [/\b((?:19|20)\d{2})\b/]);
  }

  const motorTable = parseMotorTable(lines);
  for (const [key, value] of Object.entries(motorTable)) {
    if (value && !result[key]) result[key] = value;
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
