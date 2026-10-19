import React, { useState, useEffect } from "react";
import { Calendar, MapPin, DollarSign, CreditCard, ShieldCheck, Check, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { api } from "../lib/api.js";
import { IAppointment } from "../types.js";

interface AppointmentBookingProps {
  onNavigate: (view: string) => void;
}

export default function AppointmentBooking({ onNavigate }: AppointmentBookingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<IAppointment[]>([]);

  // Selection states
  const [testType, setTestType] = useState("Xét nghiệm máu Tổng quát 12 chỉ số");
  const [price, setPrice] = useState(500000);
  const [atHome, setAtHome] = useState(false);
  const [address, setAddress] = useState("");
  const [facility, setFacility] = useState("Phòng Khám Đa Khoa MedTech Q1");
  const [dateTime, setDateTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");

  // Mock Credit Card states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handlePackageSelect = (pkgName: string, pkgPrice: number) => {
    setTestType(pkgName);
    setPrice(pkgPrice);
    setStep(2);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalPrice = price + (atHome ? 50000 : 0);
      const booked = await api.bookAppointment({
        testType,
        facility,
        dateTime,
        atHome,
        address: atHome ? address : undefined,
        paymentStatus: paymentMethod === "card" ? "paid" : "pending",
      });

      // reload history
      loadHistory();
      setStep(4); // Success screen
      if ((window as any).showToast) {
        (window as any).showToast("success", "Đặt lịch thành công", "Lịch hẹn xét nghiệm đã được tạo và đồng bộ hóa hệ thống.");
      }
    } catch (err) {
      if ((window as any).showToast) {
        (window as any).showToast("error", "Lỗi đặt lịch", "Đặt lịch hẹn thất bại. Vui lòng kiểm tra lại thời gian.");
      } else {
        alert("Đặt lịch hẹn thất bại. Vui lòng kiểm tra lại thời gian.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (id: string) => {
    setCancelTargetId(id);
  };

  const handleCancelConfirm = async () => {
    if (!cancelTargetId) return;
    try {
      await api.cancelAppointment(cancelTargetId);
      loadHistory();
      if ((window as any).showToast) {
        (window as any).showToast("success", "Đã hủy lịch khám", "Yêu cầu hủy lịch khám đã được xử lý thành công.");
      }
    } catch (err) {
      if ((window as any).showToast) {
        (window as any).showToast("error", "Lỗi hủy lịch", "Hủy lịch thất bại.");
      } else {
        alert("Hủy lịch thất bại.");
      }
    } finally {
      setCancelTargetId(null);
    }
  };

  const handlePay = async (id: string) => {
    try {
      await api.payAppointment(id);
      loadHistory();
      if ((window as any).showToast) {
        (window as any).showToast("success", "Thanh toán thành công", "Đã mô phỏng thanh toán trực tuyến thành công!");
      } else {
        alert("Đã mô phỏng thanh toán trực tuyến thành công!");
      }
    } catch (err) {
      if ((window as any).showToast) {
        (window as any).showToast("error", "Lỗi thanh toán", "Thanh toán thất bại.");
      } else {
        alert("Thanh toán thất bại.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
      {/* Page Title */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          Booking Platform
        </span>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Đặt Lịch Xét Nghiệm</h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed">Đăng ký lịch lấy mẫu máu nhanh chóng, an toàn tại phòng khám hoặc lấy mẫu tại nhà với công nghệ tự động đồng bộ hóa hồ sơ.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Booking flow form */}
        <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/40 space-y-6">
          {/* Progress indicators */}
          {step < 4 && (
            <div className="flex justify-between items-center pb-6 border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span className={step === 1 ? "text-blue-600 font-black border-b-2 border-blue-600 pb-1" : ""}>1. Gói xét nghiệm</span>
              <span className="text-slate-300 font-normal">&rarr;</span>
              <span className={step === 2 ? "text-blue-600 font-black border-b-2 border-blue-600 pb-1" : ""}>2. Nhận mẫu & Giờ</span>
              <span className="text-slate-300 font-normal">&rarr;</span>
              <span className={step === 3 ? "text-blue-600 font-black border-b-2 border-blue-600 pb-1" : ""}>3. Thanh toán</span>
            </div>
          )}

          {/* STEP 1: Select package */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-base">Bước 1: Chọn gói xét nghiệm phù hợp</h3>
              <div className="space-y-4">
                {[
                  { name: "Xét nghiệm máu Tổng quát 12 chỉ số", desc: "Tầm soát chức năng gan, thận, đường huyết, mỡ máu, công thức máu tổng quát.", price: 500000, tag: "Phổ biến" },
                  { name: "Tầm soát mỡ máu & tim mạch nâng cao", desc: "Đo nồng độ Cholesterol toàn phần, Triglyceride, HDL, LDL để phát hiện sớm xơ vữa động mạch.", price: 750000, tag: "Chuyên sâu" },
                  { name: "Tầm soát đái tháo đường & chuyển hóa", desc: "Đo nồng độ Glucose lúc đói, định lượng HbA1c đánh giá đường máu 3 tháng gần nhất.", price: 450000, tag: "Cơ bản" },
                ].map((pkg, idx) => (
                  <div
                    key={idx}
                    onClick={() => handlePackageSelect(pkg.name, pkg.price)}
                    className="p-5 sm:p-6 bg-slate-50/50 hover:bg-white border border-slate-150/80 hover:border-blue-500 rounded-[1.5rem] cursor-pointer hover:shadow-lg hover:shadow-blue-500/5 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          pkg.tag === "Phổ biến" ? "bg-blue-100 text-blue-700" : pkg.tag === "Chuyên sâu" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-700"
                        }`}>
                          {pkg.tag}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{pkg.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{pkg.desc}</p>
                    </div>
                    <div className="text-left sm:text-right shrink-0 flex sm:flex-col items-baseline sm:items-end gap-1 sm:gap-0 self-end sm:self-auto bg-blue-50/30 px-3 py-1.5 sm:px-0 sm:py-0 rounded-xl">
                      <span className="text-base font-black text-blue-600">{(pkg.price).toLocaleString("vi-VN")}</span>
                      <span className="text-[10px] font-bold text-slate-400">VND</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Delivery Method / Date selection */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-black text-slate-900 text-base">Bước 2: Hình thức lấy mẫu & Thời gian</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAtHome(false)}
                  className={`p-4.5 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                    !atHome ? "border-blue-500 bg-blue-50/10 text-blue-700 ring-4 ring-blue-500/5" : "border-slate-200 text-slate-600 hover:bg-slate-50/80"
                  }`}
                >
                  Lấy mẫu tại Phòng khám
                </button>
                <button
                  type="button"
                  onClick={() => setAtHome(true)}
                  className={`p-4.5 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                    atHome ? "border-blue-500 bg-blue-50/10 text-blue-700 ring-4 ring-blue-500/5" : "border-slate-200 text-slate-600 hover:bg-slate-50/80"
                  }`}
                >
                  Lấy mẫu tại Nhà (+50k)
                </button>
              </div>

              {atHome ? (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Địa chỉ lấy mẫu chi tiết</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, Tên đường, Quận/Huyện..."
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-medium"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Chọn Cơ sở Y tế gần bạn</label>
                  <select
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-semibold text-slate-700 cursor-pointer"
                  >
                    <option>Phòng Khám Đa Khoa MedTech Q1 (Hồ Chí Minh)</option>
                    <option>Cơ sở Xét nghiệm MedTech Cầu Giấy (Hà Nội)</option>
                    <option>Trung tâm huyết học MedTech Hải Châu (Đà Nẵng)</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Ngày giờ hẹn</label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-semibold text-slate-700 cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-xs font-black text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                >
                  &larr; Chọn lại gói
                </button>
                <button
                  type="button"
                  disabled={!dateTime || (atHome && !address.trim())}
                  onClick={() => setStep(3)}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer disabled:bg-blue-400 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  Tiếp tục thanh toán &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 3 && (
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <h3 className="font-black text-slate-900 text-base">Bước 3: Chọn phương thức thanh toán</h3>

              <div className="grid grid-cols-2 gap-4">
                <label className={`p-4.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === "cash" ? "border-blue-500 bg-blue-50/10 text-blue-700 ring-4 ring-blue-500/5" : "border-slate-200 text-slate-600 hover:bg-slate-50/80"
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="hidden"
                  />
                  <div>
                    <p className="text-xs font-extrabold">Thanh toán sau</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tiền mặt hoặc Chuyển khoản tại chỗ khi lấy mẫu</p>
                  </div>
                </label>

                <label className={`p-4.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === "card" ? "border-blue-500 bg-blue-50/10 text-blue-700 ring-4 ring-blue-500/5" : "border-slate-200 text-slate-600 hover:bg-slate-50/80"
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="hidden"
                  />
                  <div>
                    <p className="text-xs font-extrabold">Thẻ Quốc Tế Giả Lập</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Visa / Mastercard / JCB trực tuyến an toàn</p>
                  </div>
                </label>
              </div>

              {paymentMethod === "card" && (
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase">
                    <CreditCard className="w-4 h-4 text-slate-400" /> Nhập thông tin thẻ giả lập
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Số thẻ</label>
                      <input
                        type="text"
                        required
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-mono tracking-widest text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Hết hạn (MM/YY)</label>
                        <input
                          type="text"
                          required
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Mã CVC</label>
                        <input
                          type="password"
                          required
                          placeholder="•••"
                          value={cardCVC}
                          onChange={(e) => setCardCVC(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Total checkout calculation */}
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between font-medium">
                  <span>Giá gói xét nghiệm:</span>
                  <span className="font-extrabold text-slate-900">{(price).toLocaleString("vi-VN")} đ</span>
                </div>
                {atHome && (
                  <div className="flex justify-between font-medium">
                    <span>Phụ phí lấy mẫu tại nhà:</span>
                    <span className="font-extrabold text-slate-900">50.000 đ</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-blue-200/40 mt-1">
                  <span>Tổng hóa đơn thanh toán:</span>
                  <span className="text-blue-600 text-base font-black">{(price + (atHome ? 50000 : 0)).toLocaleString("vi-VN")} đ</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  &larr; Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2 cursor-pointer disabled:bg-blue-450 hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý giao dịch...
                    </>
                  ) : (
                    <>
                      Xác nhận Đăng Ký Đặt Lịch <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success state */}
          {step === 4 && (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900">Đặt Lịch Hẹn Thành Công!</h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
                  Mã cuộc hẹn đã được đồng bộ vào hệ thống. Đội ngũ y tế MedTech sẽ liên hệ trực tiếp qua điện thoại để xác minh thời gian trong vòng 15 phút.
                </p>
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Đặt thêm lịch mới
                </button>
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  Về trang tổng quan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Appointment Records history */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/40 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-sm">Hồ sơ lịch hẹn ({appointments.length})</h3>
              <button
                onClick={loadHistory}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                title="Làm mới lịch sử"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {appointments.length > 0 ? (
                appointments.map((app) => (
                  <div key={app._id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{app.testType}</h4>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                        app.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "cancelled"
                          ? "bg-red-50 text-red-700"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {app.status === "pending" ? "Chờ duyệt" : app.status === "confirmed" ? "Đã duyệt" : app.status === "completed" ? "Đã khám" : "Đã hủy"}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 space-y-1">
                      <p>🕒 Thời gian: {new Date(app.dateTime).toLocaleString("vi-VN")}</p>
                      <p>📍 {app.atHome ? `Địa chỉ nhà: ${app.address}` : `Cơ sở: ${app.facility}`}</p>
                      <p className="flex items-center gap-1">
                        💵 Thanh toán:{" "}
                        <span className={`font-semibold ${app.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                          {app.paymentStatus === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}
                        </span>
                      </p>
                    </div>

                    {/* Quick payment / cancel triggers */}
                    {app.status === "pending" && (
                      <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                        {app.paymentStatus === "pending" && (
                          <button
                            onClick={() => handlePay(app._id)}
                            className="px-3 py-1.5 bg-emerald-550 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-xl cursor-pointer"
                          >
                            Thanh toán
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelClick(app._id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-[10px] font-bold rounded-xl cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-10">Bạn chưa có lịch hẹn xét nghiệm nào.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern, elegant glassmorphic confirmation dialog */}
      {cancelTargetId && (
        <div className="fixed inset-0 bg-slate-950/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 border border-slate-200/80 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <span className="text-xl font-bold">!</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-base">Hủy lịch khám?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn hủy bỏ lịch hẹn khám này không? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCancelTargetId(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-2xl text-xs transition-all cursor-pointer"
              >
                Không, giữ lại
              </button>
              <button
                onClick={handleCancelConfirm}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer shadow-lg shadow-red-200"
              >
                Có, hủy lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
