import React, { useState, useEffect, ReactNode } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, ShieldCheck, AlertTriangle, User, Brain, FileText, Sparkles, Send, Loader2, ArrowLeft, Stethoscope, Award } from "lucide-react";
import { api } from "../lib/api.js";
import { IBloodTestRecord } from "../types.js";

interface TestDetailProps {
  recordId: string;
  user: any;
  onNavigate: (view: string, targetId?: string) => void;
}

export default function TestDetail({ recordId, user, onNavigate }: TestDetailProps) {
  const [record, setRecord] = useState<IBloodTestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [signReport, setSignReport] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    async function fetchRecord() {
      try {
        const data = await api.getRecordDetail(recordId);
        setRecord(data);
        setDoctorNotes(data.doctorNotes || "");
      } catch (err) {
        console.error("Failed to load record:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [recordId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-slate-800">Không tìm thấy kết quả xét nghiệm</h3>
        <button onClick={() => onNavigate("dashboard")} className="text-blue-600 font-bold hover:underline">Quay lại trang chính</button>
      </div>
    );
  }

  // Handle doctor saving assessment and signature
  const handleSaveAssessment = async () => {
    setUpdating(true);
    try {
      const updated = await api.updateAssessment(record._id, {
        doctorNotes,
        signReport,
      });
      setRecord(updated);
      alert("Đã cập nhật đánh giá lâm sàng thành công!");
    } catch (err) {
      console.error(err);
      alert("Cập nhật đánh giá thất bại.");
    } finally {
      setUpdating(false);
    }
  };

  // Trigger AI analysis update
  const handleRegenerateAI = async () => {
    setAiAnalyzing(true);
    try {
      const response = await api.analyzeAI(record._id);
      setRecord(response.record);
    } catch (err) {
      console.error(err);
      alert("Phân tích AI thất bại.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Helper to render inline formatting like **bold text**
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-extrabold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part.replace(/\*/g, "");
    });
  };

  // Helper to render AI markdown text nicely using custom breaks
  const renderFormattedAIAnalysis = (text: string) => {
    if (!text) return <p className="text-indigo-200 text-xs sm:text-[13.5px]">Báo cáo đang trống hoặc chưa khởi tạo.</p>;
    
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];

    const pushCurrentList = (key: string | number) => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${key}`} className="space-y-2.5 my-2.5 pl-1 w-full">
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed === "") {
        pushCurrentList(i);
        elements.push(<div key={`space-${i}`} className="h-2" />);
        continue;
      }

      // Check for headers
      if (trimmed.startsWith("###")) {
        pushCurrentList(i);
        elements.push(
          <h5 key={`h5-${i}`} className="font-bold text-sky-300 text-xs sm:text-[13.5px] mt-4 mb-2 leading-snug">
            {renderInlineFormatting(trimmed.replace("###", "").trim())}
          </h5>
        );
      } else if (trimmed.startsWith("##")) {
        pushCurrentList(i);
        elements.push(
          <h4 key={`h4-${i}`} className="font-extrabold text-indigo-200 text-sm sm:text-base mt-5 mb-3 pb-1 border-b border-indigo-850">
            {renderInlineFormatting(trimmed.replace("##", "").trim())}
          </h4>
        );
      } else if (trimmed.startsWith("#")) {
        pushCurrentList(i);
        elements.push(
          <h3 key={`h3-${i}`} className="font-black text-white text-base sm:text-lg mt-6 mb-3">
            {renderInlineFormatting(trimmed.replace("#", "").trim())}
          </h3>
        );
      }
      // Check for numbered list items
      else if (/^\d+\.\s+/.test(trimmed)) {
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        const num = numMatch ? numMatch[1] : "1";
        const itemText = numMatch ? numMatch[2] : trimmed.substring(2).trim();
        currentList.push(
          <li key={`li-${i}-${currentList.length}`} className="flex items-start gap-2 text-slate-200 text-xs sm:text-[13.5px] leading-relaxed">
            <span className="text-sky-300 font-extrabold mt-0.5 shrink-0 text-[10px] bg-sky-950/80 w-5 h-5 rounded-full flex items-center justify-center border border-sky-800/40 shadow-sm">
              {num}
            </span>
            <span className="flex-1 pt-0.5">{renderInlineFormatting(itemText)}</span>
          </li>
        );
      }
      // Check for bullet list items
      else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const itemText = trimmed.substring(1).trim();
        currentList.push(
          <li key={`li-${i}-${currentList.length}`} className="flex items-start gap-2 text-slate-200 text-xs sm:text-[13.5px] leading-relaxed">
            <span className="text-sky-400 mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-sky-400/80 shadow-sm" />
            <span className="flex-1">{renderInlineFormatting(itemText)}</span>
          </li>
        );
      }
      // Regular paragraph
      else {
        pushCurrentList(i);
        elements.push(
          <p key={`p-${i}`} className="text-slate-200 text-xs sm:text-[13.5px] leading-relaxed my-2">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      }
    }

    pushCurrentList("final");
    return elements;
  };

  // Normalize indicators for horizontal progress bars comparison
  // Normal value sits at 50%. Below min slides to 0%. Above max slides to 100%.
  const getNormalizedPercentage = (value: number, min: number, max: number): number => {
    const range = max - min;
    if (value < min) {
      const pct = (value / min) * 40; // scale from 0 to 40%
      return Math.max(5, pct);
    }
    if (value > max) {
      const diff = value - max;
      const pct = 60 + (diff / max) * 40; // scale from 60 to 100%
      return Math.min(95, pct);
    }
    // value within min-max maps to 40% - 60%
    const ratio = (value - min) / range;
    return 40 + ratio * 20;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => onNavigate(user.role === "doctor" ? "doctor-portal" : "history")}
        className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại lịch sử
      </button>

      {/* Main Header card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-full uppercase">Xét nghiệm máu</span>
            <span className="text-xs text-slate-400 font-mono">ID: {record._id.substring(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Kết Quả Ngày {new Date(record.testDate).toLocaleDateString("vi-VN", { dateStyle: "long" })}
          </h1>
          <p className="text-xs text-slate-400 flex flex-wrap gap-x-4">
            <span>🏥 Cơ sở: <strong className="text-slate-600">{record.facility}</strong></span>
            <span>👨‍⚕️ Người thực hiện: <strong className="text-slate-600">{record.performer}</strong></span>
            <span>🕒 Lưu lúc: <strong className="text-slate-600">{new Date(record.savedAt || record.createdAt).toLocaleString("vi-VN", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
            })}</strong></span>
          </p>
        </div>

        {record.doctorSignature && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
            <Award className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Đã Ký Số Bệnh Án</p>
              <p className="text-[10px] text-slate-500 font-mono">{record.doctorSignature.substring(0, 24)}...</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: List of indicators with status bar visualization */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 border-b border-slate-100 pb-4">
              <FileText className="w-5 h-5 text-blue-600" /> Kết quả chỉ số chi tiết
            </h3>

            <div className="space-y-6">
              {Object.entries(record.indicators).map(([key, ind]: [string, any]) => {
                const isNormal = ind.status === "normal";
                const isHigh = ind.status === "high";
                const percentage = getNormalizedPercentage(ind.value, ind.refMin, ind.refMax);

                return (
                  <div key={key} className="space-y-2 p-3 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-bold text-slate-800">{ind.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">Khoảng chuẩn: {ind.refMin} - {ind.refMax} {ind.unit}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-900 text-base">{ind.value} <span className="text-xs text-slate-400 font-medium">{ind.unit}</span></span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            isNormal
                              ? "bg-emerald-100 text-emerald-800"
                              : isHigh
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ind.status === "normal" ? "chuẩn" : ind.status === "high" ? "cao" : "thấp"}
                        </span>
                      </div>
                    </div>

                    {/* Indicator scale viz bar */}
                    <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      {/* Standard Normal Range box (centered between 40% to 60%) */}
                      <div className="absolute left-[40%] right-[40%] top-0 bottom-0 bg-emerald-100 rounded-sm" />
                      
                      {/* Current value bullet pointer */}
                      <div
                        className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all border border-white ${
                          isNormal ? "bg-emerald-500" : isHigh ? "bg-red-500" : "bg-amber-500"
                        }`}
                        style={{ left: `calc(${percentage}% - 5px)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis Report and Doctor Comments */}
        <div className="space-y-8">
          {/* AI Health analysis report */}
          <div className="bg-indigo-950 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full blur-3xl opacity-30" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-800 rounded-full blur-3xl opacity-30" />

            <div className="relative space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-300" />
                  <h3 className="font-bold text-white text-base">Tư vấn sức khỏe AI</h3>
                </div>
                {user.role !== "doctor" && (
                  <button
                    onClick={handleRegenerateAI}
                    disabled={aiAnalyzing}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:bg-white/5"
                  >
                    {aiAnalyzing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Làm mới
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-indigo-800">
                {aiAnalyzing ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                    <p className="text-xs text-indigo-200">AI đang phân tích xu hướng biến thiên chỉ số của bạn...</p>
                  </div>
                ) : (
                  <div className="text-slate-100 prose prose-invert max-w-none prose-sm">
                    {renderFormattedAIAnalysis(record.aiAnalysis || "")}
                  </div>
                )}
              </div>

              {user.role === "patient" && (
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => onNavigate("health-tracker", record._id)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/20 border-none transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-white animate-bounce" />
                    Tự động lên Lịch thuốc & Thực đơn với AI
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Doctor Assessment panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Stethoscope className="w-5 h-5 text-blue-600" /> Đánh giá lâm sàng chuyên khoa
            </h3>

            {user.role === "doctor" || user.role === "admin" ? (
              // Editable mode for doctors
              <div className="space-y-4">
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Nhập chẩn đoán lâm sàng, dặn dò dinh dưỡng, kê đơn hoặc hướng dẫn theo dõi..."
                  className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                
                <label className="flex items-center gap-2.5 text-xs text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signReport}
                    onChange={(e) => setSignReport(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-100"
                  />
                  <span>Xác nhận Ký số Báo cáo xét nghiệm</span>
                </label>

                <button
                  onClick={handleSaveAssessment}
                  disabled={updating}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-blue-400"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Gửi đánh giá lâm sàng <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              // Read-only mode for patients
              <div className="space-y-4">
                {record.doctorNotes ? (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    "{record.doctorNotes}"
                  </p>
                ) : (
                  <div className="py-6 text-center border border-dashed border-slate-100 rounded-xl">
                    <p className="text-xs text-slate-400">Đang chờ nhận xét chuyên môn từ bác sĩ được phân công.</p>
                  </div>
                )}
                {record.doctorNotes && (
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Người nhận xét: <strong>{record.performer}</strong></span>
                    <span>Tình trạng: <strong className="text-emerald-600 font-bold uppercase">Đã xác nhận</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
