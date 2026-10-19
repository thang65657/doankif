import React, { useState, useEffect } from "react";
import { Users, FileText, CheckCircle, ShieldAlert, Sparkles, Trash2, UserPlus, Server, Key, Filter, Check, X, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api.js";

export default function AdminPanel() {
  const [stats, setStats] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<string[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const togglePasswordReveal = (userId: string) => {
    if (revealedPasswords.includes(userId)) {
      setRevealedPasswords(revealedPasswords.filter(id => id !== userId));
    } else {
      setRevealedPasswords([...revealedPasswords, userId]);
    }
  };

  // New User Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"patient" | "doctor" | "admin">("patient");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    try {
      const statsData = await api.getAdminStats();
      setStats(statsData);

      const usersData = await api.getUsers();
      setUsersList(usersData);
    } catch (err) {
      console.error("Failed to load admin panel details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await api.adminDeleteUser(deleteTargetId);
      loadData();
      if ((window as any).showToast) {
        (window as any).showToast("success", "Đã xóa tài khoản", "Tài khoản thành viên đã được xóa hoàn toàn khỏi hệ thống.");
      }
    } catch (err: any) {
      if ((window as any).showToast) {
        (window as any).showToast("error", "Lỗi xóa tài khoản", err.message || "Không thể xóa người dùng.");
      } else {
        alert(err.message || "Không thể xóa người dùng.");
      }
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await api.adminCreateUser({ email, password, role, fullName, phone });
      setShowAddModal(false);
      // reset form
      setEmail("");
      setPassword("");
      setRole("patient");
      setFullName("");
      setPhone("");
      loadData();
      if ((window as any).showToast) {
        (window as any).showToast("success", "Tạo tài khoản thành công", "Thành viên mới đã được thêm vào cơ sở dữ liệu.");
      }
    } catch (err: any) {
      setFormError(err.message || "Tạo tài khoản thất bại.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredUsers = usersList;

  // Mock system health audit logs
  const systemLogs = [
    { time: "09:30:15", type: "info", msg: "Cổng thanh toán điện tử hoạt động ổn định" },
    { time: "09:12:44", type: "success", msg: "API OCR của Gemini hoàn thành phân tích tệp #291" },
    { time: "08:45:00", type: "info", msg: "Hệ thống tự động sao lưu dữ liệu hoàn tất" },
    { time: "08:00:10", type: "success", msg: "Kiểm tra chứng chỉ bảo mật SSL thành công (HTTPS)" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Admin Panel Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Bảng Điều Khiển Hệ Thống</h1>
        <p className="text-slate-500 text-sm">Giám sát tài nguyên, số liệu đăng ký và quản lý bảo mật thành viên.</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div className="text-slate-400"><Users className="w-6 h-6 text-blue-500" /></div>
            <p className="text-2xl font-black text-slate-900">{stats.usersCount}</p>
            <p className="text-xs text-slate-400">Tổng Thành Viên</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div className="text-slate-400"><FileText className="w-6 h-6 text-red-500" /></div>
            <p className="text-2xl font-black text-slate-900">{stats.recordsCount}</p>
            <p className="text-xs text-slate-400">Bản Ghi Xét Nghiệm</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div className="text-slate-400"><CheckCircle className="w-6 h-6 text-emerald-500" /></div>
            <p className="text-2xl font-black text-slate-900">{stats.appointmentsPending}</p>
            <p className="text-xs text-slate-400">Lịch Hẹn Khám Treo</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div className="text-slate-400"><Server className="w-6 h-6 text-indigo-500" /></div>
            <p className="text-2xl font-black text-slate-900">99.98%</p>
            <p className="text-xs text-slate-400">Thời Gian Hoạt Động (Uptime)</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* User Account Manager Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/45 pb-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-950 text-lg flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-500 animate-pulse" /> Quản lý danh sách tài khoản
                </h3>
                <p className="text-xs text-slate-400">Tra cứu, thêm mới hoặc vô hiệu hóa tài khoản người dùng.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-100 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <UserPlus className="w-4 h-4" /> Thêm tài khoản
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/40 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-4">Thông tin liên lạc</th>
                    <th className="py-3 px-4">Mật khẩu</th>
                    <th className="py-3 px-4">Vai trò</th>
                    <th className="py-3 px-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/60 transition-all">
                        <td className="py-4 px-4 font-extrabold text-slate-900">{item.fullName}</td>
                        <td className="py-4 px-4 text-slate-600">
                          <div className="font-semibold">{item.email}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.phone}</div>
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/40">
                              {revealedPasswords.includes(item._id) ? item.password || "N/A" : "••••••••"}
                            </span>
                            {item.password && (
                              <button
                                onClick={() => togglePasswordReveal(item._id)}
                                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer inline-flex items-center"
                                title={revealedPasswords.includes(item._id) ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                              >
                                {revealedPasswords.includes(item._id) ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 font-extrabold rounded-xl text-[10px] uppercase border ${
                              item.role === "admin"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : item.role === "doctor"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}
                          >
                            {item.role === "admin" ? "Admin" : item.role === "doctor" ? "Bác sĩ" : "Bệnh nhân"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleDeleteClick(item._id)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                        Không có tài khoản nào tương ứng.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Security Logs Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <Server className="w-5 h-5 text-indigo-500" /> Giám sát máy chủ & Logs
            </h3>
            <p className="text-xs text-slate-400">
              Cập nhật trực tiếp trạng thái và các tiến trình đồng bộ hệ thống.
            </p>

            <div className="space-y-3 font-mono text-[10px] bg-slate-950 text-slate-300 p-4 rounded-2xl">
              {systemLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className={log.type === "success" ? "text-emerald-400" : "text-sky-400"}>
                    {log.msg}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-500 flex items-center justify-between">
                <span>Database Engine: File-JSON</span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <ShieldCheck className="w-3.5 h-3.5" /> SECURE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddUserSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Thêm thành viên mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl text-xs flex gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Email đăng nhập</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@medtech.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="BS. Nguyễn Văn A"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Phân quyền vai trò</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="patient">Bệnh nhân</option>
                    <option value="doctor">Bác sĩ</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Tạo tài khoản
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modern state-based delete confirmation dialog */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-slate-950/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 border border-slate-200/80 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <span className="text-xl font-bold">!</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-base">Xóa tài khoản?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống không? Dữ liệu và hồ sơ liên quan sẽ bị ảnh hưởng.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-2xl text-xs transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer shadow-lg shadow-red-200"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
