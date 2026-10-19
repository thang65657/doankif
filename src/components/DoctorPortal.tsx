import { useState, useEffect } from "react";
import { Search, User, ClipboardList, Clock, Sparkles, CheckCircle2, ChevronRight, MessageSquareCode, Activity, Phone, Calendar, MapPin, CreditCard, Check, X, AlertCircle } from "lucide-react";
import { api } from "../lib/api.js";
import { IBloodTestRecord } from "../types.js";

interface DoctorPortalProps {
  user: any;
  onNavigate: (view: string, targetId?: string) => void;
}

export default function DoctorPortal({ user, onNavigate }: DoctorPortalProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [records, setRecords] = useState<IBloodTestRecord[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientSearch, setPatientSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"patients" | "appointments">("patients");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentFilter, setAppointmentFilter] = useState<string>("all");

  useEffect(() => {
    async function loadDoctorData() {
      try {
        const patientList = await api.getUsers("patient");
        setPatients(patientList);

        const recordsList = await api.getRecords();
        setRecords(recordsList);

        const appointmentsList = await api.getAppointments();
        setAppointments(appointmentsList);
      } catch (err) {
        console.error("Failed to load doctor portal data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctorData();
  }, []);

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      await api.updateAppointmentStatus(appointmentId, status);
      const appointmentsList = await api.getAppointments();
      setAppointments(appointmentsList);
    } catch (err: any) {
      console.error(err);
      alert("Cập nhật trạng thái lịch hẹn thất bại: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter patients
  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch) ||
      p.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Identify records needing attention (unsigned reports)
  const pendingReview = records.filter((r) => !r.doctorNotes || !r.doctorSignature);

  // Filter appointments
  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch = (app.patientName || "").toLowerCase().includes(appointmentSearch.toLowerCase()) || 
                          (app.testType || "").toLowerCase().includes(appointmentSearch.toLowerCase());
    const matchesFilter = appointmentFilter === "all" || app.status === appointmentFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Doctor Banner */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-400/20 rounded-full text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Bác Sĩ Chuyên Khoa Phân Phối
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Khu vực bác sĩ: {user.fullName}</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Quản lý bệnh nhân được chỉ định, thực hiện chẩn đoán lâm sàng huyết học, cập nhật ghi chú bệnh án và thực thi chữ ký điện tử.
          </p>
        </div>
        <div className="flex gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => onNavigate("consultations")}
            className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageSquareCode className="w-4 h-4" /> Tư vấn trực tuyến
          </button>
        </div>
      </div>

      {/* Tab Menu */}
      <div className="flex border-b border-slate-200/60 pb-px gap-6">
        <button
          onClick={() => setActiveTab("patients")}
          className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "patients"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Hồ sơ bệnh án & Duyệt kết quả
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "appointments"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Quản lý lịch hẹn đặt khám
          {appointments.filter((a) => a.status === "pending").length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-white font-extrabold text-[9px] rounded-full animate-pulse">
              {appointments.filter((a) => a.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "patients" ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Patient List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Hồ sơ bệnh nhân ({filteredPatients.length})
                </h3>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc số điện thoại..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto pr-1">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => {
                    const patientRecords = records.filter((r) => r.patientId === p._id);
                    return (
                      <div key={p._id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 font-bold rounded-xl flex items-center justify-center">
                            {p.fullName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{p.fullName}</h4>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5" /> {p.phone} | {p.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-400">
                            {patientRecords.length} phiếu xét nghiệm
                          </span>
                          {patientRecords.length > 0 && (
                            <button
                              onClick={() => onNavigate("test-detail", patientRecords[0]._id)}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
                              title="Xem phiếu xét nghiệm gần nhất"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Không tìm thấy bệnh nhân nào khớp với từ khóa tìm kiếm.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pending Reviews */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <ClipboardList className="w-5 h-5 text-amber-500" /> Xét nghiệm chờ duyệt ({pendingReview.length})
              </h3>
              <p className="text-xs text-slate-400">
                Các báo cáo dưới đây vừa được khách hàng hoặc phòng lab đồng bộ OCR lên hệ thống, đang chờ bác sĩ ghi chú lâm sàng và ký số.
              </p>

              <div className="space-y-3">
                {pendingReview.length > 0 ? (
                  pendingReview.map((r) => (
                    <div
                      key={r._id}
                      onClick={() => onNavigate("test-detail", r._id)}
                      className="p-4 border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/10 rounded-xl transition-all flex flex-col gap-2 cursor-pointer group"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-xs group-hover:text-blue-600 transition-colors">
                          {r.patientName}
                        </h4>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-extrabold rounded-full flex items-center gap-1 uppercase">
                          <Clock className="w-2.5 h-2.5" /> Chờ ký
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Ngày: {new Date(r.testDate).toLocaleDateString("vi-VN")}</span>
                        <span>🏥 Lab: {r.facility}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-100 rounded-xl">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Tuyệt vời! Toàn bộ hồ sơ bệnh án đã được ký duyệt hoàn tất.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Appointment management tab */
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Danh sách lịch đặt khám ({filteredAppointments.length})
              </h3>
              <p className="text-xs text-slate-400 mt-1">Duyệt, hủy hoặc xác nhận hoàn thành lịch khám lấy mẫu xét nghiệm của bệnh nhân.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search bar */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm bệnh nhân hoặc gói..."
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Status filter selection */}
              <select
                value={appointmentFilter}
                onChange={(e) => setAppointmentFilter(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((app) => (
                <div
                  key={app._id}
                  className="p-5 border border-slate-150 hover:border-blue-200 bg-slate-50/20 hover:bg-white rounded-2xl transition-all flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:shadow-slate-100/50"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm flex items-center justify-center">
                          {app.patientName ? app.patientName.charAt(0) : "P"}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">{app.patientName}</h4>
                          <p className="text-[10px] text-slate-400">Đặt vào: {new Date(app.createdAt || app.dateTime).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>
                      
                      <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full uppercase ${
                        app.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "cancelled"
                          ? "bg-red-50 text-red-700"
                          : app.status === "confirmed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {app.status === "pending" ? "Chờ duyệt" : app.status === "confirmed" ? "Đã duyệt" : app.status === "completed" ? "Đã khám" : "Đã hủy"}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 my-2 pt-2 space-y-2 text-xs text-slate-600">
                      <p className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                        {app.testType}
                      </p>
                      
                      <p className="flex items-center gap-2 text-[11px]">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Thời gian khám: <strong className="text-slate-800">{new Date(app.dateTime).toLocaleString("vi-VN")}</strong></span>
                      </p>

                      <p className="flex items-center gap-2 text-[11px]">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="line-clamp-2 leading-relaxed">
                          {app.atHome ? (
                            <>
                              <span className="text-amber-800 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded text-[9px] mr-1 uppercase">Tại nhà</span>
                              {app.address}
                            </>
                          ) : (
                            <>
                              <span className="text-blue-800 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded text-[9px] mr-1 uppercase">Phòng khám</span>
                              {app.facility}
                            </>
                          )}
                        </span>
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-dashed border-slate-100 mt-2">
                        <span className="text-slate-400 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Thanh toán:</span>
                        <span className={`font-extrabold px-1.5 py-0.5 rounded ${app.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {app.paymentStatus === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons with confirm/cancel trigger */}
                  {app.status === "pending" && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleUpdateStatus(app._id, "confirmed")}
                        className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10 cursor-pointer transition-all border-none"
                      >
                        <Check className="w-3.5 h-3.5" /> Xác nhận & Thông báo
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app._id, "cancelled")}
                        className="py-2 px-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all border-none"
                      >
                        <X className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  )}

                  {app.status === "confirmed" && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleUpdateStatus(app._id, "completed")}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-500/10 cursor-pointer transition-all border-none"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành xét nghiệm
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app._id, "cancelled")}
                        className="py-2 px-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all border-none"
                      >
                        <X className="w-3.5 h-3.5" /> Hủy lịch
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl space-y-3 bg-slate-50/20">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-sm">Không tìm thấy lịch hẹn nào</p>
                  <p className="text-xs text-slate-400">Không có yêu cầu đặt lịch nào trùng khớp với bộ lọc hiện tại.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
