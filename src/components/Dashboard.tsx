import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";
import { Activity, Calendar, AlertTriangle, ArrowRight, ShieldCheck, Heart, User, Sparkles, Pill, Utensils } from "lucide-react";
import { api } from "../lib/api.js";
import { IBloodTestRecord, IAppointment } from "../types.js";

interface DashboardProps {
  user: any;
  profile: any;
  onNavigate: (view: string, targetId?: string) => void;
}

const TREND_OPTIONS = [
  { key: "rbc", label: "Hồng cầu", shortLabel: "RBC", unit: "T/L", color: "#e11d48" },
  { key: "wbc", label: "Bạch cầu", shortLabel: "WBC", unit: "G/L", color: "#2563eb" },
  { key: "hgb", label: "Huyết sắc tố", shortLabel: "HGB", unit: "g/L", color: "#7c3aed" },
  { key: "plt", label: "Tiểu cầu", shortLabel: "PLT", unit: "G/L", color: "#059669" },
] as const;

type TrendKey = typeof TREND_OPTIONS[number]["key"];

export default function Dashboard({ user, profile, onNavigate }: DashboardProps) {
  const [latestRecord, setLatestRecord] = useState<IBloodTestRecord | null>(null);
  const [history, setHistory] = useState<IBloodTestRecord[]>([]);
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendKey, setTrendKey] = useState<TrendKey>("rbc");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const recordsList = await api.getRecords();
        setHistory(recordsList);
        if (recordsList.length > 0) {
          setLatestRecord(recordsList[0]); // sorted by testDate descending on backend
        }

        const appList = await api.getAppointments();
        // filter only pending/confirmed upcoming appointments
        const upcoming = appList.filter((a: IAppointment) => a.status === "pending" || a.status === "confirmed");
        setAppointments(upcoming);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Chỉ hiển thị dữ liệu thật do OCR huyết học đã lưu, không thay ô thiếu bằng số 0.
  const availableTrendOptions = TREND_OPTIONS.filter(option =>
    history.some(record => Number.isFinite(record.indicators[option.key]?.value))
  );
  const activeTrendKey = availableTrendOptions.some(option => option.key === trendKey)
    ? trendKey
    : (availableTrendOptions[0]?.key || trendKey);
  const selectedTrend = TREND_OPTIONS.find(option => option.key === activeTrendKey) || TREND_OPTIONS[0];
  const chartData = history
    .flatMap(record => {
      const indicator = record.indicators[activeTrendKey];
      if (!indicator || !Number.isFinite(indicator.value)) return [];
      const savedAt = record.savedAt || record.createdAt || `${record.testDate}T00:00:00`;
      const savedDate = new Date(savedAt);
      return [{
        timestamp: Number.isNaN(savedDate.getTime()) ? new Date(record.testDate).getTime() : savedDate.getTime(),
        timeLabel: savedDate.toLocaleString("vi-VN", {
          day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
        }),
        fullTime: savedDate.toLocaleString("vi-VN", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }),
        testDate: new Date(record.testDate).toLocaleDateString("vi-VN"),
        value: indicator.value,
        refMin: indicator.refMin,
        refMax: indicator.refMax,
      }];
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  const referenceIndicator = [...history].reverse().find(record => record.indicators[activeTrendKey])?.indicators[activeTrendKey];
  const domainValues = [
    ...chartData.map(point => point.value),
    ...(referenceIndicator ? [referenceIndicator.refMin, referenceIndicator.refMax] : []),
  ];
  const rawMin = domainValues.length ? Math.min(...domainValues) : 0;
  const rawMax = domainValues.length ? Math.max(...domainValues) : 1;
  const padding = Math.max((rawMax - rawMin) * 0.18, Math.abs(rawMax) * 0.08, 0.5);
  const yDomain: [number, number] = [Math.max(0, rawMin - padding), rawMax + padding];

  // Identify abnormal indicators
  const abnormals = latestRecord
    ? Object.values(latestRecord.indicators).filter((ind: any) => ind.status !== "normal")
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border border-white/20 animate-gradient-bg">
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-white/15 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-500/20 rounded-full blur-2xl -ml-20 -mb-20" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-extrabold tracking-wide uppercase border border-white/20 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> Hồ Sơ Y Tế Đang Hoạt Động
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-sm">Xin chào, {user.fullName}!</h1>
          <p className="text-blue-50/90 text-sm sm:text-base max-w-xl leading-relaxed">
            {latestRecord
              ? `Hệ thống đã phân tích kết quả xét nghiệm gần nhất vào ngày ${new Date(latestRecord.testDate).toLocaleDateString("vi-VN")}. Hãy kiểm tra các chỉ số bên dưới.`
              : "Bạn chưa có hồ sơ xét nghiệm máu nào. Hãy quét phiếu kết quả của bạn hoặc đặt lịch hẹn xét nghiệm."}
          </p>
        </div>
        <div className="flex gap-3 shrink-0 relative z-10 w-full sm:w-auto">
          <button
            onClick={() => onNavigate("ocr-center")}
            className="flex-1 sm:flex-initial px-6 py-4 bg-white hover:bg-slate-50 text-blue-700 font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center"
          >
            Quét phiếu OCR 🩸
          </button>
          <button
            onClick={() => onNavigate("booking")}
            className="flex-1 sm:flex-initial px-6 py-4 bg-white/20 hover:bg-white/30 text-white border border-white/30 font-bold rounded-2xl text-xs sm:text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center backdrop-blur-md"
          >
            Đặt lịch khám
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Alerts & Dynamic Metrics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Latest Test Summary */}
          {latestRecord ? (
            <div className="glass-panel-light p-6 rounded-[2rem] border border-slate-200/50 shadow-xl shadow-slate-100/30 hover-card-trigger space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200/45">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                    <Activity className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm sm:text-base">Chỉ số xét nghiệm gần nhất</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Nơi thực hiện: {latestRecord.facility}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate("test-detail", latestRecord._id)}
                  className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  Xem chi tiết <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Indicator Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(latestRecord.indicators).map(([key, ind]: [string, any]) => {
                  const isNormal = ind.status === "normal";
                  const isHigh = ind.status === "high";

                  return (
                    <div
                      key={key}
                      onClick={() => onNavigate("test-detail", latestRecord._id)}
                      className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden ${
                        isNormal
                          ? "bg-gradient-to-b from-emerald-50/30 to-emerald-100/20 border-emerald-100 hover:border-emerald-300 shadow-sm"
                          : isHigh
                          ? "bg-gradient-to-b from-rose-50/30 to-rose-100/20 border-rose-100 hover:border-rose-300 shadow-sm"
                          : "bg-gradient-to-b from-amber-50/30 to-amber-100/20 border-amber-100 hover:border-amber-300 shadow-sm"
                      }`}
                    >
                      {/* Left border indicator line */}
                      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        isNormal ? "bg-emerald-500" : isHigh ? "bg-rose-500" : "bg-amber-500"
                      }`} />

                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-bold text-slate-700 line-clamp-1 leading-snug">{ind.name}</span>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase shrink-0 tracking-wide border ${
                            isNormal
                              ? "bg-emerald-100/80 text-emerald-800 border-emerald-200"
                              : isHigh
                              ? "bg-rose-100/80 text-rose-800 border-rose-200"
                              : "bg-amber-100/80 text-amber-800 border-amber-200"
                          }`}
                        >
                          {ind.status === "normal" ? "chuẩn" : ind.status === "high" ? "cao" : "thấp"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-extrabold text-slate-950 tracking-tight">{ind.value}</span>
                        <span className="text-[10px] text-slate-400 ml-1 font-bold">{ind.unit}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        Ref: {ind.refMin}-{ind.refMax}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Empty State for Blood Records */
            <div className="glass-panel-light p-12 rounded-[2rem] border border-slate-200/50 shadow-xl text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-indigo-150 animate-bounce">
                <Activity className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Bắt đầu theo dõi sức khỏe của bạn</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                  Hãy tải ảnh hoặc tệp PDF kết quả xét nghiệm của bạn lên hệ thống OCR. Hệ thống AI sẽ tự động đọc chỉ số và số hóa bệnh án của bạn.
                </p>
              </div>
              <button
                onClick={() => onNavigate("ocr-center")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-extrabold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-indigo-100 hover:-translate-y-0.5 active:translate-y-0"
              >
                Tải lên kết quả ngay 🩸
              </button>
            </div>
          )}

          {/* Health Trends Graph */}
          {availableTrendOptions.length > 0 && (
            <div className="glass-panel-light p-6 rounded-3xl border border-slate-200/50 shadow-xl space-y-6 hover-card-trigger">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-slate-200/40">
                <div>
                  <h3 className="font-extrabold text-slate-950">Biến thiên chỉ số huyết học</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Theo dõi {selectedTrend.label} ({selectedTrend.shortLabel}) theo đúng thời điểm lưu kết quả
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("history")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer hover:underline"
                >
                  Xem lịch sử
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTrendOptions.map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTrendKey(option.key)}
                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                      activeTrendKey === option.key
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {option.shortLabel}
                  </button>
                ))}
              </div>

              {chartData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 12, right: 26, left: 4, bottom: 14 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      {referenceIndicator && (
                        <ReferenceArea {...({
                          y1: referenceIndicator.refMin,
                          y2: referenceIndicator.refMax,
                          fill: "#10b981",
                          fillOpacity: 0.1,
                          strokeOpacity: 0,
                          label: { value: "Khoảng chuẩn", position: "insideTopRight", fill: "#059669", fontSize: 10 },
                        } as any)} />
                      )}
                      <XAxis
                        dataKey="timeLabel"
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        minTickGap={42}
                        interval="preserveStartEnd"
                        height={44}
                      />
                      <YAxis
                        domain={yDomain}
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        width={48}
                        tickFormatter={value => Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value} ${selectedTrend.unit}`, selectedTrend.label]}
                        labelFormatter={(_label, payload) => {
                          const point = payload?.[0]?.payload;
                          return point ? `Lưu lúc ${point.fullTime} · Ngày xét nghiệm ${point.testDate}` : "";
                        }}
                        contentStyle={{ background: "rgba(255, 255, 255, 0.96)", backdropFilter: "blur(8px)", borderRadius: "16px", border: "1px solid rgba(226, 232, 240, 0.9)", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name={selectedTrend.label}
                        stroke={selectedTrend.color}
                        strokeWidth={3}
                        dot={{ r: chartData.length === 1 ? 6 : 4, fill: "white", strokeWidth: 3 }}
                        activeDot={{ r: 7 }}
                        isAnimationActive={chartData.length > 1}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center px-6">
                  <div><p className="font-bold text-slate-700">Chưa có dữ liệu {selectedTrend.shortLabel}</p><p className="mt-1 text-xs text-slate-400">Hãy lưu thêm kết quả OCR có chỉ số này.</p></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Alerts, Profiles & Schedules */}
        <div className="space-y-8">
          {/* Health Alerts Card */}
          {latestRecord && (
            <div className="glass-panel-light p-6 rounded-3xl border border-slate-200/50 shadow-xl space-y-4 relative overflow-hidden hover-card-trigger">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl -mr-4 -mt-4" />
              <h3 className="font-extrabold text-slate-950 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Cảnh báo sức khỏe AI ({abnormals.length})
              </h3>
              {abnormals.length > 0 ? (
                <div className="space-y-3 relative z-10">
                  {abnormals.map((ind: any, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 transition-all hover:bg-white ${
                        ind.status === "high" ? "bg-rose-50/40 border-rose-100 text-rose-800" : "bg-amber-50/40 border-amber-100 text-amber-800"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <strong>{ind.name}: {ind.value} {ind.unit}</strong> (Ngưỡng: {ind.refMin}-{ind.refMax}). Chỉ số hiện tại đang ở mức <strong className="font-black text-rose-700">{ind.status === "high" ? "CAO" : "THẤP"}</strong>. Hãy tham vấn ý kiến bác sĩ.
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/60 text-emerald-800 border border-emerald-100 rounded-2xl text-xs flex items-center gap-2.5 relative z-10">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
                  <div>Toàn bộ chỉ số xét nghiệm gần nhất đều nằm trong giới hạn an toàn tuyệt vời!</div>
                </div>
              )}
            </div>
          )}

          {/* Quick tracker shortcut widget */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-indigo-50/40 border border-indigo-100 p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden hover-card-trigger">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl -mr-5 -mt-5" />
            <h3 className="font-extrabold text-slate-950 flex items-center gap-2">
              <Pill className="w-5 h-5 text-indigo-600 animate-pulse" /> Sổ tay Thuốc & Dinh dưỡng
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhận gợi ý thực đơn, kiểm soát mỡ máu/đường huyết lý tưởng và thiết lập mốc giờ báo uống thuốc thông minh cùng AI.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate("health-tracker")}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-blue-500/15 flex items-center justify-center gap-1.5 cursor-pointer border-none transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Pill className="w-3.5 h-3.5" /> Điểm danh thuốc
              </button>
              <button
                onClick={() => onNavigate("health-tracker")}
                className="flex-1 py-3 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Utensils className="w-3.5 h-3.5" /> Chế độ ăn uống
              </button>
            </div>
          </div>

          {/* Upcoming appointments */}
          <div className="glass-panel-light p-6 rounded-3xl border border-slate-200/50 shadow-xl space-y-4 hover-card-trigger">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500 animate-pulse" /> Lịch khám sắp tới
              </h3>
              <button
                onClick={() => onNavigate("booking")}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Đặt thêm
              </button>
            </div>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((app) => (
                  <div key={app._id} className="p-4 border border-slate-200/50 rounded-2xl bg-white/40 flex flex-col gap-2.5 hover:border-indigo-300 transition-all">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-sm">{app.testType}</h4>
                      <span className="px-2 py-0.5 bg-blue-150 text-blue-800 text-[10px] font-bold rounded-full">
                        {app.atHome ? "Tại nhà" : "Phòng khám"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Thời gian: {new Date(app.dateTime).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-1">Địa điểm: {app.facility}</p>
                    {app.paymentStatus === "pending" && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/40">
                        <span className="text-[10px] text-amber-700 font-bold uppercase bg-amber-50 px-2 py-0.5 rounded-full">Chờ thanh toán</span>
                        <button
                          onClick={() => onNavigate("booking")}
                          className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Thanh toán ngay &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl space-y-3">
                <p className="text-xs text-slate-400 font-medium">Bạn chưa có lịch hẹn xét nghiệm sắp tới nào.</p>
                <button
                  onClick={() => onNavigate("booking")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-100"
                >
                  Đặt lịch lấy mẫu ngay &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Quick Body info card */}
          {profile && (
            <div className="glass-panel-light p-6 rounded-3xl border border-slate-200/50 shadow-xl space-y-4 hover-card-trigger">
              <h3 className="font-extrabold text-slate-950 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" /> Chỉ số cơ thể & Tiền sử
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-white/40 rounded-2xl border border-slate-200/40">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Nhóm máu</p>
                  <p className="text-lg font-black text-rose-600 mt-1">{profile.bloodType || "Chưa rõ"}</p>
                </div>
                <div className="p-3 bg-white/40 rounded-2xl border border-slate-200/40">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Chiều cao</p>
                  <p className="text-lg font-black text-slate-800 mt-1">{profile.height || "0"} cm</p>
                </div>
                <div className="p-3 bg-white/40 rounded-2xl border border-slate-200/40">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cân nặng</p>
                  <p className="text-lg font-black text-slate-800 mt-1">{profile.weight || "0"} kg</p>
                </div>
              </div>

              {profile.medicalHistory?.length > 0 && (
                <div className="text-xs space-y-1.5 pt-1">
                  <span className="text-slate-400 font-extrabold">Tiền sử bệnh:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.medicalHistory.map((item: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-white/60 border border-slate-200 text-slate-800 rounded-full font-medium shadow-sm">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.allergies?.length > 0 && (
                <div className="text-xs space-y-1.5 pt-1">
                  <span className="text-slate-400 font-extrabold">Dị ứng thuốc/thức ăn:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.allergies.map((item: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-red-700 rounded-full font-bold shadow-sm">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
