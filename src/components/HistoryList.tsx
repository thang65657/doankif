import { useState, useEffect } from "react";
import { Search, Calendar, ChevronRight, BarChart2, CheckSquare, Square, Download, FileSpreadsheet, Activity, HelpCircle, X } from "lucide-react";
import { api } from "../lib/api.js";
import { IBloodTestRecord } from "../types.js";

interface HistoryListProps {
  onNavigate: (view: string, targetId?: string) => void;
}

export default function HistoryList({ onNavigate }: HistoryListProps) {
  const [records, setRecords] = useState<IBloodTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    async function fetchRecords() {
      try {
        const data = await api.getRecords();
        setRecords(data);
      } catch (err) {
        console.error("Failed to fetch records:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter records based on search
  const filtered = records.filter(
    (r) =>
      r.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.performer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.testDate.includes(searchTerm)
  );

  // Toggle selection for comparison
  const toggleSelect = (id: string) => {
    if (selectedRecords.includes(id)) {
      setSelectedRecords(selectedRecords.filter((rid) => rid !== id));
    } else {
      setSelectedRecords([...selectedRecords, id]);
    }
  };

  // Extract selected records details for side-by-side comparison
  const comparisonRecords = records
    .filter((r) => selectedRecords.includes(r._id))
    .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()); // oldest to newest in table

  // Mock export action
  const handleExport = (record: IBloodTestRecord) => {
    const reportText = `BÁO CÁO XÉT NGHIỆM MÁU - MEDTECH
Bệnh nhân: ${record.patientName}
Ngày thực hiện: ${record.testDate}
Thời gian lưu: ${new Date(record.savedAt || record.createdAt).toLocaleString("vi-VN", { hour12: false })}
Cơ sở y tế: ${record.facility}
Người thực hiện/Bác sĩ: ${record.performer}
--------------------------------------------------
Hồng cầu (RBC): ${record.indicators.rbc.value} T/L (Trạng thái: ${record.indicators.rbc.status})
Bạch cầu (WBC): ${record.indicators.wbc.value} G/L (Trạng thái: ${record.indicators.wbc.status})
Tiểu cầu (PLT): ${record.indicators.plt.value} G/L (Trạng thái: ${record.indicators.plt.status})
Hemoglobin (HGB): ${record.indicators.hgb.value} g/L (Trạng thái: ${record.indicators.hgb.status})
Đường huyết (Glucose): ${record.indicators.glucose.value} mmol/L (Trạng thái: ${record.indicators.glucose.status})
Cholesterol: ${record.indicators.cholesterol.value} mmol/L (Trạng thái: ${record.indicators.cholesterol.status})
Men gan AST: ${record.indicators.ast.value} U/L (Trạng thái: ${record.indicators.ast.status})
Men gan ALT: ${record.indicators.alt.value} U/L (Trạng thái: ${record.indicators.alt.status})
--------------------------------------------------
ĐÁNH GIÁ CHUYÊN MÔN CỦA BÁO SĨ:
${record.doctorNotes || "Chưa có nhận xét."}
--------------------------------------------------
Hệ thống y tế số MedTech Blood Test`;
    
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Xet_Nghiem_Mau_${record.testDate}_${record.patientName.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Lịch Sử Xét Nghiệm</h1>
          <p className="text-slate-500 text-sm">Quản lý toàn bộ hồ sơ xét nghiệm máu của bạn theo dòng thời gian.</p>
        </div>
        
        {selectedRecords.length >= 2 && (
          <button
            onClick={() => setIsComparing(true)}
            className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" /> So sánh ({selectedRecords.length} phiếu)
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo cơ sở y tế, bác sĩ thực hiện hoặc năm (Ví dụ: MedLatec, 2026)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Archive List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((record) => {
            const isSelected = selectedRecords.includes(record._id);
            const badIndicators = Object.values(record.indicators).filter((ind: any) => ind.status !== "normal").length;

            return (
              <div
                key={record._id}
                className={`bg-white p-6 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md ${
                  isSelected ? "border-blue-500 bg-blue-50/10" : "border-slate-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Multiselect Checkbox */}
                  <button
                    onClick={() => toggleSelect(record._id)}
                    className="text-slate-400 hover:text-blue-600 shrink-0 transition-colors cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">
                        {new Date(record.testDate).toLocaleDateString("vi-VN", { dateStyle: "long" })}
                      </span>
                      {badIndicators > 0 ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full">
                          {badIndicators} chỉ số vượt ngưỡng
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                          Ổn định
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      🏥 Cơ sở: <strong className="text-slate-700">{record.facility}</strong>
                    </p>
                    <p className="text-xs text-slate-400">Người thực hiện: {record.performer}</p>
                    <p className="text-xs text-indigo-500 font-semibold">
                      Lưu lúc: {new Date(record.savedAt || record.createdAt).toLocaleString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                  <button
                    onClick={() => handleExport(record)}
                    className="p-2.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 font-semibold"
                    title="Tải tệp text báo cáo"
                  >
                    <Download className="w-4 h-4" /> Tải về (.TXT)
                  </button>
                  <button
                    onClick={() => onNavigate("test-detail", record._id)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Chi tiết phiếu <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white py-16 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
          <Activity className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-800">Không tìm thấy kết quả</h3>
            <p className="text-slate-400 text-xs mt-1">Vui lòng thay đổi từ khóa tìm kiếm hoặc thử tải lên phiếu mới.</p>
          </div>
        </div>
      )}

      {/* Comparison Drawer / Modal Overlay */}
      {isComparing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" /> Bảng So Sánh Chỉ Số Huyết Học Theo Thời Gian
                </h3>
                <p className="text-xs text-slate-400">Đối sánh sự gia động của các thành phần chỉ số máu</p>
              </div>
              <button
                onClick={() => setIsComparing(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Tên Chỉ số</th>
                    <th className="py-3 px-4">Khoảng chuẩn</th>
                    {comparisonRecords.map((r) => (
                      <th key={r._id} className="py-3 px-4 text-center">
                        Ngày {new Date(r.testDate).toLocaleDateString("vi-VN", { month: "2-digit", year: "2-digit" })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {[
                    { key: "rbc", name: "Hồng cầu (RBC)", ref: "3.8 - 5.9 T/L" },
                    { key: "wbc", name: "Bạch cầu (WBC)", ref: "4.0 - 10.0 G/L" },
                    { key: "plt", name: "Tiểu cầu (PLT)", ref: "150 - 400 G/L" },
                    { key: "hgb", name: "Hemoglobin (HGB)", ref: "120 - 165 g/L" },
                    { key: "glucose", name: "Đường huyết lúc đói", ref: "3.9 - 6.4 mmol/L" },
                    { key: "cholesterol", name: "Cholesterol toàn phần", ref: "3.6 - 5.2 mmol/L" },
                    { key: "ast", name: "Men gan AST (SGOT)", ref: "5 - 40 U/L" },
                    { key: "alt", name: "Men gan ALT (SGPT)", ref: "5 - 41 U/L" },
                  ].map((indRow) => (
                    <tr key={indRow.key} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-bold text-slate-800">{indRow.name}</td>
                      <td className="py-4 px-4 text-xs font-mono text-slate-400">{indRow.ref}</td>
                      {comparisonRecords.map((r) => {
                        const indVal = r.indicators[indRow.key as keyof typeof r.indicators];
                        const isNormal = indVal?.status === "normal";
                        return (
                          <td key={r._id} className="py-4 px-4 text-center">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-black ${
                                isNormal
                                  ? "bg-slate-100 text-slate-800"
                                  : "bg-red-50 text-red-700 ring-1 ring-red-100"
                              }`}
                            >
                              {indVal?.value || "-"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsComparing(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Đóng so sánh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
