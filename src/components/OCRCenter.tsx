import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Save, ScanLine, ShieldCheck, Upload } from "lucide-react";
import { api } from "../lib/api.js";
import { extractBloodForm, LocalOcrResult } from "../lib/bloodFormOcr.js";
import { IPatientProfile, IUser } from "../types.js";

interface OCRCenterProps {
  onNavigate: (view: string, targetId?: string) => void;
  user: IUser;
  profile: IPatientProfile | null;
}

const EMPTY_RESULT: LocalOcrResult = {
  testDate: new Date().toISOString().slice(0, 10), facility: "Phiếu xét nghiệm huyết học",
  indicators: {
    rbc: "", wbc: "", hgb: "", hct: "", mcv: "", mch: "", mchc: "", plt: "",
    wbcComposition: "", neutrophil: "", eosinophil: "", basophil: "", mono: "", lympho: "",
    nrbc: "", reticulocyte: "", abnormalCells: "", malaria: "", esr1: "", esr2: ""
  },
  confidence: {},
  needsReview: []
};

export default function OCRCenter({ onNavigate, user, profile }: OCRCenterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<LocalOcrResult>(EMPTY_RESULT);
  const [recognized, setRecognized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("Sẵn sàng");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chooseFile = (selected: File) => {
    if (!selected.type.startsWith("image/")) return setError("Vui lòng chọn ảnh JPG hoặc PNG.");
    if (selected.size > 12 * 1024 * 1024) return setError("Ảnh vượt quá giới hạn 12 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      setFile(selected); setPreview(reader.result as string); setResult(EMPTY_RESULT);
      setRecognized(false); setSaved(false); setError(null); setStep("Ảnh mới");
    };
    reader.onerror = () => setError("Không thể đọc ảnh đã chọn.");
    reader.readAsDataURL(selected);
  };

  const useSample = async () => {
    try {
      const response = await fetch("/phieu-mau-da-dien.png");
      const blob = await response.blob();
      chooseFile(new File([blob], "phieu-mau-da-dien.png", { type: "image/png" }));
    } catch { setError("Không thể tải phiếu mẫu."); }
  };

  const runOCR = async () => {
    if (!preview) return setError("Hãy chọn ảnh hoặc dùng phiếu mẫu trước.");
    setLoading(true); setError(null); setSaved(false); setProgress(0);
    try {
      const extracted = await extractBloodForm(preview, (message, value) => {
        setStep(message); setProgress(value);
      });
      setResult(extracted); setRecognized(true); setStep("Hoàn tất");
    } catch (err: any) {
      setError(err?.message || "Không thể nhận dạng ảnh. Hãy thử ảnh rõ và thẳng hơn.");
      setStep("Có lỗi");
    } finally { setLoading(false); }
  };

  const changeInfo = (key: keyof Omit<LocalOcrResult, "indicators">, value: string) => {
    setResult(current => ({ ...current, [key]: value })); setSaved(false);
  };
  const changeIndicator = (key: string, value: string) => {
    setResult(current => ({
      ...current,
      indicators: { ...current.indicators, [key]: value },
      confidence: { ...current.confidence, [key]: 100 },
      needsReview: current.needsReview.filter(item => item !== key),
    }));
    setSaved(false);
  };

  const saveResult = async () => {
    setSaving(true); setError(null);
    try {
      const record = await api.saveRecord({
        patientName: user.fullName, testDate: result.testDate, facility: result.facility,
        indicators: result.indicators, imageUrl: preview || undefined,
        doctorNotes: `Dữ liệu chỉ số được nhập từ Tesseract OCR và đã được người dùng kiểm tra. KSV sốt rét: ${result.indicators.malaria || "không ghi nhận"}.`
      });
      setSaved(true);
      setTimeout(() => onNavigate("test-detail", record._id), 500);
    } catch (err: any) { setError(err?.message || "Không thể lưu kết quả xét nghiệm."); }
    finally { setSaving(false); }
  };

  const reset = () => {
    setFile(null); setPreview(null); setResult(EMPTY_RESULT); setRecognized(false);
    setSaved(false); setError(null); setProgress(0); setStep("Sẵn sàng");
  };

  const resultInput = (key: string, text = false) => (
    <input
      type="text"
      inputMode={text ? "text" : "decimal"}
      aria-label={`Kết quả ${key}`}
      value={result.indicators[key] || ""}
      onChange={event => changeIndicator(key, event.target.value)}
      title={result.confidence[key] === undefined ? undefined : `Độ tin cậy OCR: ${result.confidence[key]}%`}
      className={`h-9 w-full px-2 text-center text-sm font-extrabold outline-none transition-colors ${result.needsReview.includes(key) ? "bg-amber-100 text-amber-900 ring-2 ring-inset ring-amber-400" : "bg-blue-50/60 text-blue-800 focus:bg-blue-100"}`}
    />
  );

  return (
    <div className="max-w-[1440px] mx-auto space-y-7">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-semibold mb-3">
            <ScanLine className="w-3.5 h-3.5" /> NHẬP KẾT QUẢ NHANH HƠN
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">Ảnh phiếu xét nghiệm <span className="text-blue-600">thành dữ liệu.</span></h1>
          <p className="text-slate-500 mt-2 text-sm">Tesseract OCR tự đọc từng ô và điền vào biểu mẫu để bạn kiểm tra trước khi lưu.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start lg:self-auto text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-2">
          <ShieldCheck className="w-4 h-4" /> Xử lý tại trình duyệt · Không dùng AI
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-sm flex items-start gap-3"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[440px_minmax(0,1fr)] gap-6 items-start">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3"><span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 text-xs font-black grid place-items-center">01</span><h2 className="font-bold text-slate-900">Phiếu xét nghiệm</h2></div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">{step}</span>
          </div>

          <div className="p-4 space-y-4">
            <div
              onDragEnter={event => { event.preventDefault(); setDragging(true); }}
              onDragOver={event => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={event => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files[0]) chooseFile(event.dataTransfer.files[0]); }}
              onClick={() => !preview && fileInputRef.current?.click()}
              className={`min-h-[500px] rounded-xl border-2 border-dashed flex items-center justify-center p-3 transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50/70"} ${!preview ? "cursor-pointer hover:border-blue-400" : ""}`}
            >
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={event => event.target.files?.[0] && chooseFile(event.target.files[0])} />
              {preview ? <img src={preview} alt="Phiếu xét nghiệm" className="w-full max-h-[560px] object-contain rounded-lg" /> : <div className="text-center px-6"><div className="w-16 h-16 mx-auto mb-4 bg-blue-50 text-blue-600 rounded-full grid place-items-center"><Upload className="w-8 h-8" /></div><h3 className="font-bold text-slate-800">Kéo thả ảnh hoặc bấm để chọn</h3><p className="text-xs text-slate-400 mt-2">Ảnh JPG/PNG, chụp thẳng và đủ bốn góc.</p></div>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={useSample} className="py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50">Dùng phiếu mẫu</button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50">Chọn ảnh khác</button>
            </div>
            <button type="button" onClick={runOCR} disabled={!preview || loading} className="w-full h-14 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 disabled:opacity-50 text-white font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang đọc {progress}%</> : <><ScanLine className="w-5 h-5" /> Đọc ảnh và tự điền</>}
            </button>
            {loading && <div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="text-[11px] text-slate-500 text-center mt-2">{step}</p></div>}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3"><span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 text-xs font-black grid place-items-center">02</span><h2 className="font-bold text-slate-900">Kết quả nhận dạng</h2></div>
            <button type="button" onClick={reset} className="text-xs font-bold text-blue-600 hover:text-blue-700">Xóa form</button>
          </div>

          {!recognized && !loading ? (
            <div className="min-h-[650px] flex flex-col items-center justify-center text-center text-slate-400 px-6">
              <FileText className="w-14 h-14 text-slate-200 mb-4" />
              <h3 className="font-bold text-slate-700">Biểu mẫu sẽ tự điền tại đây</h3>
              <p className="text-sm max-w-sm mt-2">Chọn phiếu mẫu hoặc tải ảnh lên, sau đó bấm “Đọc ảnh và tự điền”.</p>
            </div>
          ) : (
            <div className="p-5 lg:p-7 space-y-7">
              <div className="flex items-center justify-between"><div><h3 className="font-extrabold text-xl text-slate-900">Kết quả nhận dạng</h3><p className="text-sm text-slate-500">Kiểm tra lại các ô trước khi lưu.</p></div>{saved && <span className="text-xs text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Đã lưu</span>}</div>

              {result.needsReview.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div><strong>Cần kiểm tra {result.needsReview.length} ô màu vàng.</strong><p className="mt-1 text-xs text-amber-700">OCR không tự đoán khi chữ mờ hoặc ô bị lệch. Bấm vào ô để sửa rồi mới lưu.</p></div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4"><h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">Thông tin từ tài khoản</h4><span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700"><ShieldCheck className="w-3.5 h-3.5" /> Không lấy từ ảnh</span></div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: "Họ và tên", value: user.fullName },
                    { label: "Ngày sinh", value: profile?.dob || "Chưa cập nhật" },
                    { label: "Số điện thoại", value: user.phone || "Chưa cập nhật" },
                  ].map(field => <label key={field.label} className="text-sm font-semibold text-slate-600">{field.label}<input readOnly value={field.value} className="mt-1.5 w-full h-12 rounded-xl border border-slate-200 bg-slate-100 px-4 font-bold text-slate-700 cursor-not-allowed" /></label>)}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase mb-4">Thông tin lấy từ phiếu</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="text-sm font-semibold text-slate-600">Ngày xét nghiệm<input type="date" value={result.testDate} onChange={event => changeInfo("testDate", event.target.value)} className="mt-1.5 w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
                  <label className="text-sm font-semibold text-slate-600">Loại phiếu<input readOnly value={result.facility} className="mt-1.5 w-full h-12 rounded-xl border border-slate-200 bg-slate-100 px-4 font-bold text-slate-700" /></label>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-extrabold text-slate-900">1. Tế bào máu ngoại vi:</h4>
                <div className="overflow-x-auto bg-white">
                  <table className="w-full min-w-[720px] table-fixed border-collapse text-[12px] leading-tight text-slate-900">
                    <colgroup><col className="w-[36%]" /><col className="w-[14%]" /><col className="w-[36%]" /><col className="w-[14%]" /></colgroup>
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-slate-500 px-2 py-2 text-center">Chỉ số</th>
                        <th className="border border-slate-500 px-2 py-2 text-center">Kết quả</th>
                        <th className="border border-slate-500 px-2 py-2 text-center">Chỉ số</th>
                        <th className="border border-slate-500 px-2 py-2 text-center">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-500 px-2 py-1.5 text-center">Số lượng HC: nam (4,0–5,8 x10¹²/l)<br />nữ (3,9–5,4 x10¹²/l)</td>
                        <td className="border border-slate-500 p-0">{resultInput("rbc")}</td>
                        <td className="border border-slate-500 px-2 py-1.5">Số lượng BC (4–10 x10⁹/l)</td>
                        <td className="border border-slate-500 p-0">{resultInput("wbc")}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-500 px-2 py-1.5 text-center">Huyết sắc tố: nam (140–160 g/l)<br />nữ (125–145 g/l)</td>
                        <td className="border border-slate-500 p-0">{resultInput("hgb")}</td>
                        <td className="border border-slate-500 px-2 py-1.5">Thành phần bạch cầu (%):</td>
                        <td className="border border-slate-500 p-0">{resultInput("wbcComposition")}</td>
                      </tr>
                      <tr>
                        <td rowSpan={3} className="border border-slate-500 px-2 py-1.5 text-center align-middle">Hematocrit: nam (0,38–0,50 l/l)<br />nữ (0,35–0,47 l/l)</td>
                        <td rowSpan={3} className="border border-slate-500 p-0 align-middle">{resultInput("hct")}</td>
                        <td className="border border-slate-500 px-2 py-1.5">- Đoạn trung tính</td>
                        <td className="border border-slate-500 p-0">{resultInput("neutrophil")}</td>
                      </tr>
                      <tr><td className="border border-slate-500 px-2 py-1.5">- Đoạn ưa axit</td><td className="border border-slate-500 p-0">{resultInput("eosinophil")}</td></tr>
                      <tr><td className="border border-slate-500 px-2 py-1.5">- Đoạn ưa bazơ</td><td className="border border-slate-500 p-0">{resultInput("basophil")}</td></tr>
                      <tr><td className="border border-slate-500 px-2 py-1.5 text-center">MCV (83–92 fl)</td><td className="border border-slate-500 p-0">{resultInput("mcv")}</td><td className="border border-slate-500 px-2 py-1.5">- Mono</td><td className="border border-slate-500 p-0">{resultInput("mono")}</td></tr>
                      <tr><td className="border border-slate-500 px-2 py-1.5 text-center">MCH (27–32 pg)</td><td className="border border-slate-500 p-0">{resultInput("mch")}</td><td className="border border-slate-500 px-2 py-1.5">- Lympho</td><td className="border border-slate-500 p-0">{resultInput("lympho")}</td></tr>
                      <tr><td className="border border-slate-500 px-2 py-1.5 text-center">MCHC (320–356 g/l)</td><td className="border border-slate-500 p-0">{resultInput("mchc")}</td><td className="border border-slate-500 px-2 py-1.5">- Tế bào bất thường</td><td className="border border-slate-500 p-0">{resultInput("abnormalCells")}</td></tr>
                      <tr><td className="border border-slate-500 px-2 py-1.5 text-center">Hồng cầu có nhân (0 x10⁹/l)</td><td className="border border-slate-500 p-0">{resultInput("nrbc")}</td><td className="border border-slate-500" /><td className="border border-slate-500" /></tr>
                      <tr><td className="border border-slate-500 px-2 py-1.5 text-center">Hồng cầu lưới (0,1–0,5 %)</td><td className="border border-slate-500 p-0">{resultInput("reticulocyte")}</td><td className="border border-slate-500" /><td className="border border-slate-500" /></tr>
                      <tr><td className="border border-slate-500 px-2 py-1.5 text-center">Số lượng tiểu cầu (150–400 x10⁹/l)</td><td className="border border-slate-500 p-0">{resultInput("plt")}</td><td className="border border-slate-500" /><td className="border border-slate-500" /></tr>
                      <tr><td className="border border-slate-500" /><td className="border border-slate-500" /><td className="border border-slate-500 px-2 py-1.5 text-center">Máu lắng: giờ 1 (&lt; 15 mm)</td><td className="border border-slate-500 p-0">{resultInput("esr1")}</td></tr>
                      <tr><td className="border border-slate-500 px-2 py-1.5">KSV sốt rét:</td><td className="border border-slate-500 p-0">{resultInput("malaria", true)}</td><td className="border border-slate-500 px-2 py-1.5 text-center">giờ 2 (&lt; 20 mm)</td><td className="border border-slate-500 p-0">{resultInput("esr2")}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 space-y-2 text-xs text-slate-800">
                  <p className="font-extrabold">2. Đông máu:</p>
                  <p>Thời gian máu chảy: <span className="inline-block w-20 border-b border-dotted border-slate-500" /> phút <span className="inline-block w-12 border-b border-dotted border-slate-500" /></p>
                  <p>Thời gian máu đông: <span className="inline-block w-20 border-b border-dotted border-slate-500" /> phút <span className="inline-block w-12 border-b border-dotted border-slate-500" /></p>
                  <p className="font-extrabold">3. Nhóm máu: <span className="ml-2 font-normal">Hệ ABO:</span> <span className="inline-block w-20 border-b border-dotted border-slate-500" /></p>
                  <p className="pl-20">Hệ Rh: <span className="inline-block w-20 border-b border-dotted border-slate-500" /></p>
                </div>
              </div>

              <button type="button" onClick={saveResult} disabled={saving || saved} className="w-full h-14 rounded-xl bg-slate-900 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg">
                {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang lưu…</> : saved ? <><CheckCircle2 className="w-5 h-5" /> Đã lưu vào hồ sơ</> : <><Save className="w-5 h-5" /> Lưu vào hồ sơ xét nghiệm</>}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

