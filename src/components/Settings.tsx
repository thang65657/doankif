import React, { useState, useEffect } from "react";
import { Key, User, ShieldCheck, Lock, Smartphone, RefreshCw, AlertCircle, Check } from "lucide-react";
import { api } from "../lib/api.js";

interface SettingsProps {
  user: any;
  profile: any;
  onUpdateUserAndProfile: (newUser: any, newProfile: any) => void;
}

export default function Settings({ user, profile, onUpdateUserAndProfile }: SettingsProps) {
  // Profile update states (only applicable for patients)
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [dob, setDob] = useState(profile?.dob || "");
  const [gender, setGender] = useState(profile?.gender || "Nam");
  const [bloodType, setBloodType] = useState(profile?.bloodType || "O");
  const [height, setHeight] = useState<number | string>(profile?.height || 170);
  const [weight, setWeight] = useState<number | string>(profile?.weight || 60);
  const [medicalHistory, setMedicalHistory] = useState(profile?.medicalHistory?.join(", ") || "");
  const [allergies, setAllergies] = useState(profile?.allergies?.join(", ") || "");
  const [currentMedications, setCurrentMedications] = useState(profile?.currentMedications?.join(", ") || "");
  
  // Doctor update states
  const [specialty, setSpecialty] = useState(user?.specialty || "");
  const [experience, setExperience] = useState(user?.experience || "");
  const [workplace, setWorkplace] = useState(user?.workplace || "");
  const [bio, setBio] = useState(user?.bio || "");
  
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [hasInitialized, setHasInitialized] = useState(false);

  // Sync state values when new user/profile loads asynchronously
  useEffect(() => {
    if (user && !hasInitialized) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setAvatar(user.avatar || "");
      
      if (user.role === "doctor") {
        setSpecialty(user.specialty || "");
        setExperience(user.experience || "");
        setWorkplace(user.workplace || "");
        setBio(user.bio || "");
        setHasInitialized(true);
      } else if (user.role === "admin") {
        setHasInitialized(true);
      } else if (user.role === "patient" && profile) {
        setDob(profile.dob || "");
        setGender(profile.gender || "Nam");
        setBloodType(profile.bloodType || "O");
        setHeight(profile.height || 170);
        setWeight(profile.weight || 60);
        setMedicalHistory(profile.medicalHistory?.join(", ") || "");
        setAllergies(profile.allergies?.join(", ") || "");
        setCurrentMedications(profile.currentMedications?.join(", ") || "");
        setHasInitialized(true);
      }
    }
  }, [user, profile, hasInitialized]);

  // Reset initialization flag when logged-in user changes
  useEffect(() => {
    setHasInitialized(false);
  }, [user?._id, profile?._id]);

  // Password change states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA simulation states
  const [enable2FA, setEnable2FA] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);

  // Submit profile edits
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    setProfileLoading(true);

    try {
      const payload = user.role === "patient" ? {
        fullName,
        phone,
        avatar,
        dob,
        gender,
        bloodType,
        height: Number(height),
        weight: Number(weight),
        medicalHistory: medicalHistory.split(",").map((s) => s.trim()).filter(Boolean),
        allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean),
        currentMedications: currentMedications.split(",").map((s) => s.trim()).filter(Boolean),
      } : {
        fullName,
        phone,
        avatar,
        specialty,
        experience,
        workplace,
        bio,
      };

      const response = await api.updateProfile(payload);

      setProfileSuccess("Cập nhật thông tin hồ sơ thành công!");
      onUpdateUserAndProfile(response.user, response.profile);
    } catch (err: any) {
      setProfileError(err.message || "Lỗi cập nhật hồ sơ.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Submit password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới không trùng khớp.");
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword({ currentPassword: oldPassword, newPassword });
      setPasswordSuccess("Thay đổi mật khẩu đăng nhập thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Lỗi thay đổi mật khẩu.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Validate simulated 2FA code
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode === "123456" || otpCode.length === 6) {
      setTwoFactorVerified(true);
      if ((window as any).showToast) {
        (window as any).showToast("success", "Kích hoạt 2FA thành công", "Tài khoản của bạn đã được bảo vệ tối đa bằng mã bảo mật OTP.");
      } else {
        alert("Đã kích hoạt xác thực 2 bước 2FA thành công!");
      }
    } else {
      if ((window as any).showToast) {
        (window as any).showToast("error", "Lỗi xác thực", "Mã OTP không chính xác. Vui lòng thử lại với 123456 hoặc mã 6 chữ số bất kỳ.");
      } else {
        alert("Mã OTP không chính xác. Vui lòng nhập lại!");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
      {/* Title */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
          Settings & Profile
        </span>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Thiết Lập Bảo Mật & Hồ Sơ</h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed">Cập nhật chỉ số sinh trắc học cá nhân, quản lý chuyên môn và cấu hình các biện pháp xác thực đa lớp.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Section 1: Patient Biometrics / Doctor Specialty profile */}
          {(user.role === "patient" || user.role === "doctor" || user.role === "admin") && (
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/40 space-y-6">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-4">
                <User className="w-5 h-5 text-blue-600" /> 
                {user.role === "patient" ? "Chỉ số cơ thể & Hồ sơ bệnh lịch" : user.role === "doctor" ? "Thông tin chuyên môn Bác sĩ" : "Thông tin Cá nhân Quản trị viên"}
              </h3>

              {profileSuccess && (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="p-4 bg-red-50 text-red-800 border border-red-100 rounded-2xl text-xs flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Số điện thoại</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Ảnh đại diện (Link URL)</label>
                  <div className="flex gap-4 items-center">
                    {avatar && (
                      <img 
                        src={avatar} 
                        alt="Avatar Preview" 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white ring-4 ring-slate-100 shadow-md shrink-0" 
                        onError={(e) => {
                          (e.target as any).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150";
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <input
                        type="url"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="Nhập link ảnh đại diện https://..."
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">Chọn nhanh:</span>
                    {[
                      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150",
                      "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150",
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
                    ].map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAvatar(url)}
                        className={`w-8 h-8 rounded-full border-2 overflow-hidden cursor-pointer transition-all hover:scale-105 ${avatar === url ? 'border-blue-600 scale-110 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-400'}`}
                      >
                        <img src={url} alt="Preset option" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {user.role === "patient" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Ngày sinh (DOB)</label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-700 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Giới tính</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-700 cursor-pointer"
                        >
                          <option>Nam</option>
                          <option>Nữ</option>
                          <option>Khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Nhóm máu</label>
                        <select
                          value={bloodType}
                          onChange={(e) => setBloodType(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-700 cursor-pointer"
                        >
                          <option>A</option>
                          <option>B</option>
                          <option>AB</option>
                          <option>O</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Chiều cao (cm)</label>
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-755"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Cân nặng (kg)</label>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-755"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Tiền sử bệnh (Cách nhau bằng dấu phẩy)</label>
                      <input
                        type="text"
                        value={medicalHistory}
                        onChange={(e) => setMedicalHistory(e.target.value)}
                        placeholder="Cao huyết áp, Đái tháo đường..."
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Dị ứng thuốc & thức ăn (Cách nhau bằng dấu phẩy)</label>
                      <input
                        type="text"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="Dị ứng Penicillin, Dị ứng Hải sản..."
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Thuốc đang sử dụng (Cách nhau bằng dấu phẩy)</label>
                      <input
                        type="text"
                        value={currentMedications}
                        onChange={(e) => setCurrentMedications(e.target.value)}
                        placeholder="Insulin, Metformin..."
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                      />
                    </div>
                  </>
                ) : user.role === "doctor" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Chuyên khoa</label>
                        <input
                          type="text"
                          required
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          placeholder="Ví dụ: Nội khoa, Tim mạch, Xét nghiệm..."
                          className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Kinh nghiệm làm việc</label>
                        <input
                          type="text"
                          required
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          placeholder="Ví dụ: 10 năm kinh nghiệm"
                          className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Nơi công tác (Bệnh viện / Phòng khám)</label>
                      <input
                        type="text"
                        required
                        value={workplace}
                        onChange={(e) => setWorkplace(e.target.value)}
                        placeholder="Ví dụ: Bệnh Viện Đa Khoa MedLatec"
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Giới thiệu bản thân / Tiểu sử</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Mô tả tóm tắt kinh nghiệm làm việc, học văn bằng cấp hoặc thông tin khám chữa bệnh..."
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-700 resize-none font-sans"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-5 bg-slate-50 border border-slate-150 rounded-2xl text-slate-550 font-semibold leading-relaxed">
                    Tài khoản Quản trị viên MedTech. Bạn có toàn quyền quản lý, duyệt hồ sơ và theo dõi số liệu hệ thống.
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5"
                  >
                    {profileLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Cập nhật hồ sơ <Check className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section 2: Change password */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/40 space-y-6">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-4">
              <Key className="w-5 h-5 text-blue-600" /> Đổi mật khẩu tài khoản
            </h3>

            {passwordSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="p-4 bg-red-50 text-red-800 border border-red-100 rounded-2xl text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-450 transition-all font-semibold text-slate-750"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5"
                >
                  {passwordLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Đổi mật khẩu <Check className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Simulated 2FA setup */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/40 space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Smartphone className="w-5 h-5 text-indigo-500" /> Xác thực 2 bước 2FA
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Mã hóa dữ liệu lâm sàng HIPAA bằng cơ chế xác minh Google Authenticator.
            </p>

            {!enable2FA ? (
              <button
                type="button"
                onClick={() => setEnable2FA(true)}
                className="w-full py-3.5 border border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/50 text-indigo-700 font-extrabold rounded-2xl text-xs transition-all cursor-pointer shadow-sm hover:shadow-indigo-100"
              >
                Cài đặt Google Authenticator &rarr;
              </button>
            ) : !twoFactorVerified ? (
              <form onSubmit={handleVerify2FA} className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col items-center text-center space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">1. Quét mã QR bảo mật</span>
                  {/* Styled Mock QR Code */}
                  <div className="w-32 h-32 bg-slate-900 p-2.5 rounded-2xl flex items-center justify-center">
                    <div className="w-full h-full bg-[radial-gradient(#ffffff_20%,transparent_20%)] [background-size:10px_10px]" />
                  </div>
                  <span className="font-mono font-bold text-slate-500 select-all">SECRET: MEDTECH2026</span>
                </div>

                <div className="space-y-1">
                  <label className="block font-black text-slate-500 uppercase tracking-wider text-[10px]">2. Nhập mã OTP 6 số để kích hoạt</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Ví dụ: 123456"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-center font-bold font-mono text-sm tracking-widest text-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-indigo-500/10 cursor-pointer transition-all hover:-translate-y-0.5"
                >
                  Xác minh & Kích hoạt 2FA
                </button>
              </form>
            ) : (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <strong className="font-extrabold text-emerald-850">Trạng thái: ĐÃ BẢO VỆ</strong>
                  <p className="text-[10px] text-emerald-600 mt-0.5 leading-normal">Tài khoản được bảo vệ vững chắc bằng mã khóa Google Authenticator OTP.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
