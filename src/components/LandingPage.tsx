import { motion } from "motion/react";
import { Activity, Brain, FileText, Heart, ShieldAlert, Sparkles, UserCheck, Calendar, ArrowRight, BookOpen, Stethoscope, Clock, ShieldCheck } from "lucide-react";

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onOpenLogin: () => void;
}

export default function LandingPage({ onNavigate, onOpenLogin }: LandingPageProps) {
  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen grid-bg relative">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-10 w-[400px] h-[400px] bg-indigo-300/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          
          {/* Hero text content */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 backdrop-blur border border-blue-100 rounded-full text-blue-700 text-xs sm:text-sm font-bold shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              Nền tảng Y Tế Số Hóa & Trí Tuệ Nhân Tạo AI
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12]"
            >
              Số hóa kết quả <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Xét Nghiệm Máu
              </span> <br />
              bằng Công nghệ AI
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              Trải nghiệm đột phá: Tự động quét chỉ số y khoa bằng OCR siêu tốc, theo dõi diễn biến sức khỏe trực quan bằng biểu đồ và nhận phân tích, cảnh báo lâm sàng tự động từ AI.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2"
            >
              <button
                onClick={onOpenLogin}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:opacity-95 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5 cursor-pointer text-sm tracking-wide"
              >
                Bắt đầu Trải nghiệm <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("features");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 bg-white/95 backdrop-blur border border-slate-200/80 hover:bg-slate-50 text-slate-800 hover:text-slate-950 font-bold rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-sm"
              >
                Tìm hiểu quy trình
              </button>
            </motion.div>
          </div>

          {/* Hero interactive visual cards (Multi-layered Dashboard preview) */}
          <div className="flex-1 relative w-full max-w-md lg:max-w-none min-h-[460px] flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-[440px] mx-auto">
              
              {/* Outer decorative glowing ring */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse" />
              
              {/* Layer 1: Main Diagnostic Card (Base) */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center shadow-inner">
                      <Activity className="w-5.5 h-5.5 text-rose-600 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-950 text-sm">Kết quả Sinh hóa Máu</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Mã số: #MT-8840</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-full border border-emerald-150">
                    Chỉ số an toàn
                  </span>
                </div>

                <div className="py-6 space-y-5 flex-1 justify-center flex flex-col">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-slate-600">Đường huyết lúc đói (Glucose)</span>
                      <span className="text-xs font-bold text-slate-900">5.4 mmol/L</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[65%] rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-slate-600">Cholesterol toàn phần</span>
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        5.8 mmol/L <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[85%] rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100/50 flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    <strong className="text-blue-800">Khuyến nghị AI:</strong> Chỉ số Cholesterol hơi vượt ngưỡng nhẹ. Bạn nên giảm bớt tinh bột trắng và bổ sung thêm Omega-3.
                  </p>
                </div>
              </motion.div>

              {/* Layer 2: Floating Stat Overlay (Top Right) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 40, y: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute -top-6 -right-6 bg-slate-900 text-white p-4.5 rounded-2xl shadow-xl flex items-center gap-3.5 border border-slate-800 animate-float"
              >
                <div className="w-10 h-10 bg-indigo-500/15 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Độ chính xác AI</p>
                  <p className="text-lg font-black tracking-tight text-white">99.8%</p>
                </div>
              </motion.div>

              {/* Layer 3: Doctor Consultation Badge (Bottom Left) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -40, y: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3.5"
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                  <ShieldCheck className="w-5.5 h-5.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ký danh bác sĩ</p>
                  <p className="text-xs font-black text-slate-900">BS. Trần Quốc Bảo</p>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </header>

      {/* Trust Badges and Stats Strip */}
      <section className="bg-slate-900 border-y border-slate-800 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          {[
            { value: "99.8%", label: "Chính Xác Nhận Diện OCR" },
            { value: "10,000+", label: "Hồ Sơ Được Số Hóa" },
            { value: "150+", label: "Bác Sĩ Chuyên Khoa Đồng Hành" },
            { value: "24/7", label: "Hỗ Trợ Giải Đáp Chỉ Số AI" }
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent tracking-tight">
                {stat.value}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Smart Flow / Step Process Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 relative">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase text-blue-600 tracking-widest bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100/60 inline-block">
            Giải pháp thông minh
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Quy Trình Số Hóa Đột Phá
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed text-sm sm:text-base">
            Chuyển đổi hoàn toàn các phiếu xét nghiệm giấy truyền thống thành biểu đồ theo dõi sức khỏe số chỉ trong vài tích tắc.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 mt-16 relative">
          {[
            {
              icon: <FileText className="w-6 h-6 text-blue-600" />,
              title: "1. Tải Phiếu Lên",
              desc: "Chụp ảnh rõ nét hoặc tải lên tệp PDF phiếu xét nghiệm máu từ bất kỳ cơ sở y tế nào.",
              color: "from-blue-500 to-cyan-500"
            },
            {
              icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
              title: "2. Quét OCR Tự Động",
              desc: "Công nghệ AI bóc tách chính xác từng ký tự, chỉ số, đơn vị đo và ngày tháng ghi chép.",
              color: "from-indigo-500 to-purple-500"
            },
            {
              icon: <Brain className="w-6 h-6 text-emerald-600" />,
              title: "3. AI Phân Tích Sâu",
              desc: "Cảnh báo vượt ngưỡng, phân tích xu hướng biến thiên và đưa ra lời khuyên dinh dưỡng tối ưu.",
              color: "from-emerald-500 to-teal-500"
            },
            {
              icon: <Stethoscope className="w-6 h-6 text-rose-600" />,
              title: "4. Ký Số Bác Sĩ",
              desc: "Hồ sơ được liên kết và phê chuẩn bởi đội ngũ bác sĩ chuyên khoa đầu ngành.",
              color: "from-rose-500 to-pink-500"
            },
          ].map((step, idx) => (
            <motion.div 
              whileHover={{ y: -6 }}
              key={idx} 
              className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 hover:border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-100/40 transition-all duration-300 relative group flex flex-col justify-between"
            >
              <div className="space-y-5">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100/50 group-hover:bg-slate-100 transition-colors">
                  {step.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors text-base">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full mt-6 overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${step.color} w-0 group-hover:w-full transition-all duration-500 rounded-full`} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive CTA Card Section */}
      <section className="bg-slate-950 text-white py-16 sm:py-20 relative overflow-hidden rounded-[2.5rem] max-w-7xl mx-auto my-8 px-6 sm:px-12 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] -ml-24 -mb-24 pointer-events-none" />
        
        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-semibold text-blue-300 border border-white/5">
              <Calendar className="w-3.5 h-3.5" /> Dịch vụ lấy mẫu tận nơi
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              Tích Hợp Dịch Vụ Lấy Máu Tại Nhà
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Bạn không cần mất hàng giờ xếp hàng chờ đợi tại bệnh viện. Đội ngũ kỹ thuật viên y tế của MedTech sẽ tới tận nhà lấy mẫu và trả kết quả tự động ngay trên ứng dụng của bạn.
            </p>

            <div className="space-y-4 pt-2">
              {[
                { title: "Lưu trữ lịch sử xét nghiệm trọn đời", desc: "Tất cả các chỉ số huyết học, sinh hóa được sắp xếp trực quan." },
                { title: "Tự động phân tích xu hướng sức khỏe", desc: "Hệ thống AI nhận định chính xác biểu đồ dao động của bạn." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-5.5 h-5.5 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 mt-0.5 shrink-0">
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clean Premium Quick Reservation Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 sm:p-10 rounded-[2rem] space-y-6 shadow-2xl">
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Đăng ký dịch vụ nhanh
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Điền thông tin đặt lịch hẹn. Hệ thống sẽ tự động đồng bộ khi bạn thực hiện đăng nhập / đăng ký tài khoản.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); onOpenLogin(); }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Loại xét nghiệm mong muốn</label>
                <select className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all text-xs font-semibold">
                  <option className="text-slate-900" value="tong-quat">Xét nghiệm Tổng quát 12 chỉ số</option>
                  <option className="text-slate-900" value="mo-mau">Tầm soát mỡ máu & tim mạch chuyên sâu</option>
                  <option className="text-slate-900" value="tieu-duong">Kiểm tra đường huyết HbA1c định kỳ</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Họ và tên</label>
                  <input type="text" placeholder="Nguyễn Văn A" required className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Số điện thoại</label>
                  <input type="tel" placeholder="0901..." required className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all text-xs font-semibold" />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold rounded-2xl shadow-xl shadow-blue-950/40 transition-all hover:-translate-y-0.5 active:translate-y-0 text-center cursor-pointer text-xs tracking-wider"
              >
                Đặt Lịch Khám & Đăng Nhập
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Medical Knowledge Teaser */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-slate-200">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">Kiến Thức Y Khoa Thường Thức</h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Cẩm nang tra cứu và chế độ dinh dưỡng được phê duyệt bởi các bác sĩ hàng đầu</p>
          </div>
          <button
            onClick={() => onNavigate("articles")}
            className="px-5 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
          >
            <BookOpen className="w-4 h-4 text-blue-600" /> Xem tất cả bài viết
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-5 hover:border-slate-200 transition-all duration-300">
            <img
              src="https://images.unsplash.com/photo-1579152181111-2da552f137e7?auto=format&fit=crop&q=80&w=300"
              alt="blood indicators"
              className="w-full sm:w-36 h-36 object-cover rounded-2xl shrink-0 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col justify-between py-1">
              <div className="space-y-2">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-full border border-blue-100">Cẩm nang</span>
                <h3 className="text-base font-extrabold text-slate-950 leading-snug">Ý nghĩa các chỉ số hồng cầu, bạch cầu, tiểu cầu</h3>
                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">Tìm hiểu chi tiết các ký hiệu RBC, WBC, PLT ảnh hưởng trực tiếp thế nào tới sức đề kháng cơ thể...</p>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-2">Đăng bởi: ThS. BS. Nguyễn Thị Lan</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-5 hover:border-slate-200 transition-all duration-300">
            <img
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=300"
              alt="nutrition cholesterol"
              className="w-full sm:w-36 h-36 object-cover rounded-2xl shrink-0 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col justify-between py-1">
              <div className="space-y-2">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full border border-emerald-100">Dinh dưỡng</span>
                <h3 className="text-base font-extrabold text-slate-950 leading-snug">Chế độ ăn kiểm soát mỡ máu & bảo vệ tim mạch</h3>
                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">Lập kế hoạch dinh dưỡng hạ Cholesterol tự nhiên hiệu quả bằng thực phẩm lành tính nhiều xơ...</p>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-2">Đăng bởi: PGS. TS. Nguyễn Minh Đức</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-900 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">🩸</div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block">MedTech Blood Test AI</span>
              <span className="text-[9px] uppercase text-slate-400 tracking-widest font-bold">Chăm sóc chủ động</span>
            </div>
          </div>
          <p className="text-xs max-w-md text-center md:text-right leading-relaxed">
            © 2026 MedTech Blood Test AI. Toàn bộ thông tin sức khỏe và hồ sơ bệnh án được bảo mật nghiêm ngặt theo tiêu chuẩn HIPAA y tế quốc tế.
          </p>
        </div>
      </footer>
    </div>
  );
}
