const fields = [
  ["manufacturer","Manufacturer"],["model","Model / type"],["serialNumber","Serial number"],
  ["voltage","Voltage"],["frequency","Frequency"],["power","Power"],["current","Current"],
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
function parseNameplate(text) {
  const normalized = text.replace(/[–—]/g,"-").replace(/Ø/g,"0");
  const lines = normalized.split(/\r?\n/).map(clean).filter(Boolean);
  const result = {};

  result.model = first(normalized, [
    /(?:model|type|typ|mod\.?|modelo)\s*[:#-]?\s*([A-Z0-9][A-Z0-9 .\/_-]{2,30})/i
  ]);
  result.serialNumber = first(normalized, [
    /(?:serial(?:\s*(?:no|number|nr))?|s\/?n|ser\.?\s*no\.?|n[º°]\s*serie)\s*[:#-]?\s*([A-Z0-9][A-Z0-9.\/_-]{2,30})/i
  ]);
  result.voltage = first(normalized, [
    /(?:voltage|volt|tension|spannung)?\s*[:=-]?\s*((?:\d{2,4}(?:\s*[\/\-]\s*\d{2,4})?\s*)V\b)/i
  ]);
  result.frequency = first(normalized, [/((?:50|60)(?:\s*\/\s*(?:50|60))?\s*Hz\b)/i]);
  result.power = first(normalized, [
    /(?:power|p\d?|potencia)?\s*[:=-]?\s*((?:\d+(?:[.,]\d+)?)\s*(?:kW|W|HP|CV)\b)/i
  ]);
  result.current = first(normalized, [
    /(?:current|amp(?:s|ere)?|corriente)?\s*[:=-]?\s*((?:\d+(?:[.,]\d+)?(?:\s*[\/\-]\s*\d+(?:[.,]\d+)?)?)\s*A\b)/i
  ]);
  result.speed = first(normalized, [
    /((?:\d{2,5})\s*(?:r\/?min|rpm|min-1|min⁻¹)\b)/i
  ]);
  result.ipRating = first(normalized, [/(\bIP\s*\d{2}[A-Z]?\b)/i]);
  result.year = first(normalized, [
    /(?:year|yr|año|built|date)\s*[:#-]?\s*((?:19|20)\d{2})/i,
    /\b((?:19|20)\d{2})\b/
  ]);
  result.cosPhi = first(normalized, [
    /(?:cos\s*[φϕø]|power\s*factor|pf)\s*[:=-]?\s*(0[.,]\d{1,3})/i
  ]);
  result.weight = first(normalized, [
    /(?:weight|mass|peso|kg)\s*[:=-]?\s*((?:\d+(?:[.,]\d+)?)\s*kg\b)/i
  ]);

  const genericLabels = /^(model|type|typ|serial|s\/n|voltage|power|current|frequency|hz|rpm|ip|year|cos)/i;
  const candidate = lines.find(line =>
    line.length >= 2 && line.length <= 32 &&
    /[A-Za-z]/.test(line) && !genericLabels.test(line) &&
    !/\b(?:V|Hz|kW|rpm|IP\d|A)\b/i.test(line)
  );
  result.manufacturer = candidate || "";
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
