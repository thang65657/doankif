import { createWorker, PSM, Worker } from "tesseract.js";

export type BloodFieldKey =
  | "rbc" | "wbc" | "hgb" | "hct" | "mcv" | "mch" | "mchc" | "plt"
  | "wbcComposition" | "neutrophil" | "eosinophil" | "basophil" | "mono" | "lympho"
  | "nrbc" | "reticulocyte" | "abnormalCells" | "malaria" | "esr1" | "esr2";

export interface LocalOcrResult {
  testDate: string;
  facility: string;
  indicators: Record<string, string>;
  confidence: Record<string, number>;
  needsReview: string[];
}

type FieldSpec = {
  box: [number, number, number, number];
  label: string;
  kind?: "number" | "text";
  min?: number;
  max?: number;
  decimalPlaces?: number[];
  forceDecimal?: number;
  optional?: boolean;
};

// Tọa độ trên phiếu chuẩn 547 x 759. Chỉ OCR vùng KẾT QUẢ;
// tên chỉ số và đơn vị là nội dung cố định trong giao diện.
const FIELDS: Record<BloodFieldKey, FieldSpec> = {
  rbc: { box: [210, 184, 285, 218], label: "RBC", min: 1.5, max: 8, decimalPlaces: [1, 2] },
  wbc: { box: [457, 184, 534, 218], label: "WBC", min: 1, max: 50, decimalPlaces: [1, 2] },
  hgb: { box: [210, 220, 285, 253], label: "HGB", min: 30, max: 300 },
  wbcComposition: { box: [457, 220, 534, 253], label: "thành phần bạch cầu", min: 0, max: 1, forceDecimal: 2 },
  hct: { box: [210, 254, 285, 288], label: "HCT", min: 0.1, max: 0.8, forceDecimal: 2 },
  neutrophil: { box: [457, 254, 534, 272], label: "đoạn trung tính", min: 0, max: 100 },
  eosinophil: { box: [457, 273, 534, 290], label: "đoạn ưa axit", min: 0, max: 100 },
  basophil: { box: [457, 291, 534, 309], label: "đoạn ưa bazơ", min: 0, max: 100 },
  mcv: { box: [210, 289, 285, 309], label: "MCV", min: 40, max: 150 },
  mono: { box: [457, 310, 534, 328], label: "Mono", min: 0, max: 100 },
  mch: { box: [210, 310, 285, 328], label: "MCH", min: 10, max: 60 },
  lympho: { box: [457, 329, 534, 348], label: "Lympho", min: 0, max: 100 },
  mchc: { box: [210, 329, 285, 348], label: "MCHC", min: 100, max: 500 },
  abnormalCells: { box: [457, 349, 534, 367], label: "tế bào bất thường", min: 0, max: 100 },
  nrbc: { box: [210, 349, 285, 367], label: "hồng cầu có nhân", min: 0, max: 100, decimalPlaces: [1] },
  reticulocyte: { box: [210, 368, 285, 385], label: "hồng cầu lưới", min: 0, max: 5, forceDecimal: 1 },
  plt: { box: [210, 386, 285, 421], label: "PLT", min: 10, max: 1500 },
  esr1: { box: [457, 422, 534, 440], label: "máu lắng giờ 1", min: 0, max: 200 },
  malaria: { box: [210, 441, 285, 457], label: "KSV sốt rét", kind: "text", optional: true },
  esr2: { box: [457, 441, 534, 457], label: "máu lắng giờ 2", min: 0, max: 200 },
};

type RasterSource = HTMLImageElement | HTMLCanvasElement;
type Layout = { tableLeft: number; tableRight: number; tableTop: number; tableBottom: number; detected: boolean };
type FieldReading = { value: string; confidence: number; plausible: boolean };

function widthOf(source: RasterSource) {
  return source instanceof HTMLImageElement ? source.naturalWidth : source.width;
}

function heightOf(source: RasterSource) {
  return source instanceof HTMLImageElement ? source.naturalHeight : source.height;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không thể mở ảnh đã chọn."));
    image.src = src;
  });
}

function sourceToCanvas(source: RasterSource) {
  const width = widthOf(source);
  const height = heightOf(source);
  const scale = Math.min(1, 2800 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Trình duyệt không hỗ trợ Canvas.");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function estimateSkew(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return 0;
  const { width, height } = canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  const xStep = width > 1600 ? 5 : width > 900 ? 3 : 2;
  const points: [number, number][] = [];
  const top = Math.round(height * 0.14);
  const bottom = Math.round(height * 0.72);
  for (let y = top; y < bottom; y++) {
    for (let x = 0; x < width; x += xStep) {
      const offset = (y * width + x) * 4;
      const gray = pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114;
      if (gray < 90) points.push([x, y]);
    }
  }
  if (points.length < 100) return 0;

  let bestAngle = 0;
  let bestScore = 0;
  let straightScore = 0;
  for (let angle = -3; angle <= 3.001; angle += 0.25) {
    const slope = Math.tan(angle * Math.PI / 180);
    const bins = new Int32Array(height + 80);
    for (const [x, y] of points) {
      const corrected = Math.round(y - slope * (x - width / 2)) + 40;
      if (corrected >= 1 && corrected < bins.length - 1) bins[corrected]++;
    }
    let score = 0;
    for (let index = 1; index < bins.length - 1; index++) {
      score = Math.max(score, bins[index - 1] + bins[index] + bins[index + 1]);
    }
    if (score > bestScore) { bestScore = score; bestAngle = angle; }
    if (Math.abs(angle) < 0.01) straightScore = score;
  }
  if (Math.abs(bestAngle) < 0.2 || bestScore < straightScore * 1.08) return 0;
  return bestAngle;
}

function deskew(source: RasterSource) {
  const initial = sourceToCanvas(source);
  const angle = estimateSkew(initial);
  if (!angle) return initial;
  const radians = -angle * Math.PI / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(initial.width * cos + initial.height * sin);
  canvas.height = Math.ceil(initial.height * cos + initial.width * sin);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return initial;
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(radians);
  context.drawImage(initial, -initial.width / 2, -initial.height / 2);
  return canvas;
}

function groupLines(counts: number[], minimum: number) {
  const result: number[] = [];
  let first = -1;
  for (let index = 0; index < counts.length; index++) {
    if (counts[index] >= minimum && first < 0) first = index;
    if ((counts[index] < minimum || index === counts.length - 1) && first >= 0) {
      const last = counts[index] < minimum ? index - 1 : index;
      result.push(Math.round((first + last) / 2));
      first = -1;
    }
  }
  return result;
}

function detectTable(source: RasterSource): Layout {
  const canvas = sourceToCanvas(source);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Trình duyệt không hỗ trợ Canvas.");
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const rows = new Array(canvas.height).fill(0);
  const cols = new Array(canvas.width).fill(0);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const offset = (y * canvas.width + x) * 4;
      const gray = pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114;
      if (gray < 125) { rows[y]++; cols[x]++; }
    }
  }
  const fallback = {
    tableLeft: Math.round(canvas.width * 8 / 547), tableRight: Math.round(canvas.width * 538 / 547),
    tableTop: Math.round(canvas.height * 165 / 759), tableBottom: Math.round(canvas.height * 458 / 759), detected: false,
  };
  const horizontal = groupLines(rows, canvas.width * 0.44);
  if (horizontal.length < 8) return fallback;
  const tableTop = horizontal[0];
  const tableBottom = horizontal[horizontal.length - 1];
  const tableHeight = tableBottom - tableTop;
  if (tableHeight < canvas.height * 0.15 || tableHeight > canvas.height * 0.8) return fallback;
  const vertical = groupLines(cols, Math.max(20, tableHeight * 0.38));
  if (vertical.length < 4) return { ...fallback, tableTop, tableBottom };
  const tableLeft = vertical[0];
  const tableRight = vertical[vertical.length - 1];
  if (tableRight - tableLeft < canvas.width * 0.65) return fallback;
  return { tableLeft, tableRight, tableTop, tableBottom, detected: true };
}

function mapBox(box: [number, number, number, number], source: RasterSource, layout: Layout) {
  const [x1, y1, x2, y2] = box;
  const x = (value: number) => layout.tableLeft + (value - 8) / 530 * (layout.tableRight - layout.tableLeft);
  const y = (value: number) => layout.tableTop + (value - 165) / 293 * (layout.tableBottom - layout.tableTop);
  const width = widthOf(source);
  const height = heightOf(source);
  return [
    Math.max(0, Math.min(width, x(x1))), Math.max(0, Math.min(height, y(y1))),
    Math.max(0, Math.min(width, x(x2))), Math.max(0, Math.min(height, y(y2))),
  ] as const;
}

function otsuThreshold(grays: Uint8Array) {
  const histogram = new Array(256).fill(0);
  for (const value of grays) histogram[value]++;
  const total = grays.length;
  let sum = 0;
  for (let index = 0; index < 256; index++) sum += index * histogram[index];
  let backgroundWeight = 0, backgroundSum = 0, maximumVariance = 0, threshold = 170;
  for (let index = 0; index < 256; index++) {
    backgroundWeight += histogram[index];
    if (!backgroundWeight) continue;
    const foregroundWeight = total - backgroundWeight;
    if (!foregroundWeight) break;
    backgroundSum += index * histogram[index];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (sum - backgroundSum) / foregroundWeight;
    const variance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;
    if (variance > maximumVariance) { maximumVariance = variance; threshold = index; }
  }
  return Math.max(105, Math.min(215, threshold + 16));
}

function cropField(source: RasterSource, spec: FieldSpec, layout: Layout) {
  let [left, top, right, bottom] = mapBox(spec.box, source, layout);
  const width = right - left;
  const height = bottom - top;
  const isText = spec.kind === "text";
  left += width * (isText ? 0.025 : 0.065);
  right -= width * (isText ? 0.025 : 0.065);
  top += height * 0.035;
  bottom -= height * 0.035;
  const sourceWidth = Math.max(2, right - left);
  const sourceHeight = Math.max(2, bottom - top);
  const scale = Math.max(4, Math.min(10, 120 / sourceHeight));
  const padding = 28;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(120, Math.round(sourceWidth * scale + padding * 2));
  canvas.height = Math.max(80, Math.round(sourceHeight * scale + padding * 2));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Không thể xử lý vùng OCR.");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, left, top, sourceWidth, sourceHeight, padding, padding, sourceWidth * scale, sourceHeight * scale);
  context.fillStyle = "white";
  const edge = 8;
  context.fillRect(0, 0, canvas.width, padding + edge);
  context.fillRect(0, canvas.height - padding - edge, canvas.width, padding + edge);
  context.fillRect(0, 0, padding + edge, canvas.height);
  context.fillRect(canvas.width - padding - edge, 0, padding + edge, canvas.height);
  return canvas;
}

function inkRatio(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return 0;
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let ink = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    const gray = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
    if (gray < 190) ink++;
  }
  return ink / (data.length / 4);
}

function makeVariant(source: HTMLCanvasElement, mode: "binary" | "high" | "gray") {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return source;
  context.drawImage(source, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const grays = new Uint8Array(image.data.length / 4);
  for (let offset = 0, index = 0; offset < image.data.length; offset += 4, index++) {
    grays[index] = Math.round(image.data[offset] * 0.299 + image.data[offset + 1] * 0.587 + image.data[offset + 2] * 0.114);
  }
  const threshold = otsuThreshold(grays) + (mode === "high" ? 22 : 0);
  for (let offset = 0, index = 0; offset < image.data.length; offset += 4, index++) {
    const gray = grays[index];
    const value = mode === "gray" ? Math.max(0, Math.min(255, (gray - 55) * 1.45)) : (gray < threshold ? 0 : 255);
    image.data[offset] = value; image.data[offset + 1] = value; image.data[offset + 2] = value; image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

function formatNumber(value: number, decimals?: number) {
  if (decimals === undefined) return String(value);
  return value.toFixed(decimals).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function normalizeNumeric(raw: string, spec: FieldSpec) {
  const corrected = raw.replace(/[OoQ]/g, "0").replace(/[Il|!]/g, "1").replace(/[Ss]/g, "5")
    .replace(/[Bb]/g, "8").replace(/,/g, ".").replace(/\s+/g, "");
  const token = corrected.match(/[-+]?\d+(?:\.\d+)?/)?.[0];
  if (!token) return { value: "", plausible: false };
  const original = Number(token);
  if (!Number.isFinite(original)) return { value: "", plausible: false };
  if (token.includes(".")) {
    const plausible = (spec.min === undefined || original >= spec.min) && (spec.max === undefined || original <= spec.max);
    return { value: String(original), plausible };
  }
  if (spec.forceDecimal !== undefined) {
    const value = original / 10 ** spec.forceDecimal;
    return { value: formatNumber(value, spec.forceDecimal), plausible: (spec.min === undefined || value >= spec.min) && (spec.max === undefined || value <= spec.max) };
  }
  const candidates = [{ value: original, decimals: undefined as number | undefined }];
  for (const decimals of spec.decimalPlaces || []) candidates.push({ value: original / 10 ** decimals, decimals });
  const score = (candidate: { value: number; decimals?: number }) => {
    const inRange = (spec.min === undefined || candidate.value >= spec.min) && (spec.max === undefined || candidate.value <= spec.max);
    let value = inRange ? 100 : -50;
    if (candidate.decimals === undefined) value += 8;
    if (/^0\d/.test(token) && candidate.decimals !== undefined) value += 25;
    return value;
  };
  candidates.sort((a, b) => score(b) - score(a));
  const selected = candidates[0];
  const plausible = (spec.min === undefined || selected.value >= spec.min) && (spec.max === undefined || selected.value <= spec.max);
  return { value: formatNumber(selected.value, selected.decimals), plausible };
}

function normalizeText(raw: string) {
  const text = raw.replace(/[^a-zA-ZÀ-ỹ\s]/g, " ").replace(/\s+/g, " ").trim();
  const plain = text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
  if (/AM\s*TINH|AMTINH/.test(plain)) return "ÂM TÍNH";
  if (/DUONG\s*TINH|DUONGTINH/.test(plain)) return "DƯƠNG TÍNH";
  return text.toUpperCase();
}

async function readVariant(worker: Worker, image: HTMLCanvasElement, spec: FieldSpec): Promise<FieldReading> {
  const isText = spec.kind === "text";
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_LINE,
    tessedit_char_whitelist: isText
      ? "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯàáâãèéêìíòóôõùúăđĩũơư "
      : "0123456789.,+-",
    user_defined_dpi: "300",
  });
  const { data } = await worker.recognize(image);
  if (isText) {
    const value = normalizeText(data.text);
    return { value, confidence: value ? Math.round(data.confidence) : 0, plausible: Boolean(value) };
  }
  const normalized = normalizeNumeric(data.text, spec);
  return { value: normalized.value, confidence: Math.round(data.confidence), plausible: normalized.plausible };
}

function readingScore(reading: FieldReading) {
  if (!reading.value) return -1000;
  return reading.confidence + (reading.plausible ? 35 : -25);
}

async function readField(worker: Worker, source: RasterSource, spec: FieldSpec, layout: Layout): Promise<FieldReading> {
  const crop = cropField(source, spec, layout);
  if (inkRatio(crop) < 0.0012) return { value: "", confidence: spec.optional ? 100 : 0, plausible: Boolean(spec.optional) };
  const first = await readVariant(worker, makeVariant(crop, "binary"), spec);
  if (first.value && first.plausible && first.confidence >= 82) return first;
  const alternatives = [first, await readVariant(worker, makeVariant(crop, "gray"), spec), await readVariant(worker, makeVariant(crop, "high"), spec)];
  const supportedScore = (reading: FieldReading) => {
    const agreeingPasses = alternatives.filter(item => item.value && item.value === reading.value).length;
    return readingScore(reading) + agreeingPasses * 24;
  };
  alternatives.sort((a, b) => supportedScore(b) - supportedScore(a));
  return alternatives[0];
}

function detectDate(raw: string) {
  const normalized = raw.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const separated = normalized.match(/\b(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{4})\b/);
  const written = normalized.match(/ngay\s*(\d{1,2})\s*thang\s*(\d{1,2})\s*nam\s*(\d{4})/);
  const match = separated || written;
  if (!match) return "";
  const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export async function extractBloodForm(imageSource: string, onProgress?: (message: string, percent: number) => void): Promise<LocalOcrResult> {
  const image = await loadImage(imageSource);
  if (image.naturalWidth < 420 || image.naturalHeight < 300) throw new Error("Ảnh quá nhỏ. Hãy dùng ảnh phiếu rõ, rộng tối thiểu 420 px.");
  onProgress?.("Đang làm thẳng và căn khung bảng…", 3);
  const normalizedImage = deskew(image);
  const layout = detectTable(normalizedImage);
  const worker = await createWorker("eng", 1);
  const values = {} as Record<BloodFieldKey, string>;
  const confidence: Record<string, number> = {};
  const needsReview: string[] = [];
  try {
    const entries = Object.entries(FIELDS) as [BloodFieldKey, FieldSpec][];
    for (let index = 0; index < entries.length; index++) {
      const [key, spec] = entries[index];
      onProgress?.(`Đang đọc ${spec.label} (${index + 1}/${entries.length})…`, 5 + Math.round(index / entries.length * 86));
      const reading = await readField(worker, normalizedImage, spec, layout);
      values[key] = reading.value;
      confidence[key] = reading.confidence;
      if (!spec.optional && (!reading.value || !reading.plausible || reading.confidence < 58)) needsReview.push(key);
    }
    onProgress?.("Đang tìm ngày xét nghiệm…", 94);
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, tessedit_char_whitelist: "", user_defined_dpi: "300" });
    const fullPage = await worker.recognize(normalizedImage);
    const testDate = detectDate(fullPage.data.text);
    if (!layout.detected) for (const [key, spec] of entries) if (!spec.optional && !needsReview.includes(key)) needsReview.push(key);
    onProgress?.("Nhận dạng hoàn tất", 100);
    return { testDate, facility: "Phiếu xét nghiệm huyết học", indicators: values, confidence, needsReview };
  } finally {
    await worker.terminate();
  }
}

