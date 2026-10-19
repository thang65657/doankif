import React, { useState, useEffect } from "react";
import { Activity, Bell, FileText, Heart, Calendar, MessageSquare, BookOpen, Settings, ShieldCheck, LogOut, LogIn, Menu, X, HelpCircle, Bot, Sparkles, User, UserCheck, Stethoscope, Loader2, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { api } from "./lib/api.js";
import { IUser, IPatientProfile, INotification } from "./types.js";
import { motion, AnimatePresence } from "motion/react";

// Import custom sub-views
import LandingPage from "./components/LandingPage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import OCRCenter from "./components/OCRCenter.jsx";
import HistoryList from "./components/HistoryList.jsx";
import TestDetail from "./components/TestDetail.jsx";
import DoctorPortal from "./components/DoctorPortal.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import ConsultationRoom from "./components/ConsultationRoom.jsx";
import AppointmentBooking from "./components/AppointmentBooking.jsx";
import KnowledgeHub from "./components/KnowledgeHub.jsx";
import SettingsPage from "./components/Settings.jsx";
import Chatbot from "./components/Chatbot.jsx";
import HealthTracker from "./components/HealthTracker.jsx";

export default function App() {
  const [user, setUser] = useState<IUser | null>(null);
  const [profile, setProfile] = useState<IPatientProfile | null>(null);
  const [notifications, setNotifications] = useState<INotification[]>([]);

  // Toast notifications state
  const [toasts, setToasts] = useState<Array<{ id: string; type: "success" | "error" | "info" | "warning" | "loading"; title: string; message: string }>>([]);

  const addToast = (type: "success" | "error" | "info" | "warning" | "loading", title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    (window as any).showToast = (type: "success" | "error" | "info" | "warning" | "loading", title: string, message: string) => {
      addToast(type, title, message);
    };
  }, []);
  
  // Persist view state to handle browser/HMR reloads gracefully
  const [currentView, setCurrentView] = useState<string>(() => {
    return localStorage.getItem("medtech_view") || "landing";
  });
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(() => {
    return localStorage.getItem("medtech_target_id") || null;
  });

  // Keep localStorage synchronized with active view state
  useEffect(() => {
    if (currentView) {
      localStorage.setItem("medtech_view", currentView);
    }
  }, [currentView]);

  useEffect(() => {
    if (selectedTargetId) {
      localStorage.setItem("medtech_target_id", selectedTargetId);
    } else {
      localStorage.removeItem("medtech_target_id");
    }
  }, [selectedTargetId]);

  // Authentication Dialog states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"patient" | "doctor" | "admin">("patient");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Notifications popup states
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-authenticate on mount
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("medtech_token");
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          setProfile(res.profile || null);
          
          // Route immediately if no previous view is stored
          const savedView = localStorage.getItem("medtech_view");
          if (!savedView || savedView === "landing") {
            if (res.user.role === "doctor") {
              setCurrentView("doctor-portal");
            } else if (res.user.role === "admin") {
              setCurrentView("admin-panel");
            } else {
              setCurrentView("dashboard");
            }
          }
        } catch (err) {
          console.warn("Stale login token, cleared.");
          localStorage.removeItem("medtech_token");
          localStorage.removeItem("medtech_view");
          localStorage.removeItem("medtech_target_id");
          setCurrentView("landing");
        }
      }
    }
    checkAuth();
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    async function loadNotifs() {
      try {
        const list = await api.getNotifications();
        setNotifications(list);
      } catch (err) {
        console.error(err);
      }
    }
    loadNotifs();
    const timer = setInterval(loadNotifs, 10000); // pull every 10s
    return () => clearInterval(timer);
  }, [user]);

  // Handle Logout
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setProfile(null);
    setNotifications([]);
    localStorage.removeItem("medtech_view");
    localStorage.removeItem("medtech_target_id");
    setCurrentView("landing");
    if ((window as any).showToast) {
      (window as any).showToast("info", "Đã đăng xuất", "Hẹn gặp lại bạn lần sau!");
    }
  };

  // Handle Login / Reg Submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (isRegisterMode) {
        const res = await api.register({ email, password, role, fullName, phone });
        setUser(res.user);
        setProfile(res.profile || null);
        
        if (res.user.role === "doctor") {
          setCurrentView("doctor-portal");
        } else if (res.user.role === "admin") {
          setCurrentView("admin-panel");
        } else {
          setCurrentView("dashboard");
        }
        if ((window as any).showToast) {
          (window as any).showToast("success", "Đăng ký thành công", `Chào mừng bạn đến với MedTech, ${res.fullName}!`);
        }
      } else {
        const res = await api.login({ email, password });
        setUser(res.user);
        setProfile(res.profile || null);
        
        if (res.user.role === "doctor") {
          setCurrentView("doctor-portal");
        } else if (res.user.role === "admin") {
          setCurrentView("admin-panel");
        } else {
          setCurrentView("dashboard");
        }
        if ((window as any).showToast) {
          (window as any).showToast("success", "Đăng nhập thành công", `Chào mừng ${res.user.fullName} quay trở lại!`);
        }
      }
      setShowAuthModal(false);
      // Reset forms
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
    } catch (err: any) {
      setAuthError(err.message || "Xác thực không chính xác.");
      if ((window as any).showToast) {
        (window as any).showToast("error", "Xác thực thất bại", err.message || "Kiểm tra lại tài khoản và mật khẩu.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Notification Read Click
  const handleNotifClick = async (id: string) => {
    try {
      await api.markRead(id);
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (view: string, targetId?: string) => {
    setCurrentView(view);
    if (targetId) setSelectedTargetId(targetId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans relative overflow-x-hidden grid-bg">
      {/* Dynamic colorful decorative glowing blur circles */}
      <div className="absolute top-0 left-[-10%] w-[50vw] h-[50vw] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] bg-indigo-300/8 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-[10%] w-[50vw] h-[50vw] bg-emerald-300/8 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-violet-300/8 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* HEADER NAVIGATION */}
      <nav className="backdrop-blur-md bg-white/80 border-b border-slate-200/40 sticky top-0 z-40 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center relative">
          
          {/* Logo Brand */}
          <div
            onClick={() => handleNavigate(user ? (user.role === "doctor" ? "doctor-portal" : user.role === "admin" ? "admin-panel" : "dashboard") : "landing")}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-200/50 group-hover:scale-105 transition-transform">
              🩸
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base block">MedTech</span>
              <span className="text-[9px] bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-widest font-black -mt-1 block">Blood Test</span>
            </div>
          </div>

          {/* Desktop Nav Actions */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500">
            {user ? (
              user.role === "patient" ? (
                <>
                  <button onClick={() => handleNavigate("dashboard")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "dashboard" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Tổng quan</button>
                  <button onClick={() => handleNavigate("ocr-center")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "ocr-center" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Quét Phiếu</button>
                  <button onClick={() => handleNavigate("history")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "history" || currentView === "test-detail" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Lịch sử xét nghiệm</button>
                  <button onClick={() => handleNavigate("health-tracker")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "health-tracker" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Thuốc & Dinh dưỡng</button>
                  <button onClick={() => handleNavigate("booking")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "booking" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Đặt lịch khám</button>
                  <button onClick={() => handleNavigate("consultations")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "consultations" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Tư vấn y tế</button>
                  <button onClick={() => handleNavigate("articles")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "articles" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Cẩm nang</button>
                  <button onClick={() => handleNavigate("settings")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "settings" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Cài đặt</button>
                </>
              ) : user.role === "doctor" ? (
                <>
                  <button onClick={() => handleNavigate("doctor-portal")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "doctor-portal" || currentView === "test-detail" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Bệnh nhân của tôi</button>
                  <button onClick={() => handleNavigate("consultations")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "consultations" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Kênh tư vấn</button>
                  <button onClick={() => handleNavigate("articles")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "articles" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Kiến thức</button>
                  <button onClick={() => handleNavigate("settings")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "settings" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Cài đặt</button>
                </>
              ) : (
                // Admin role
                <>
                  <button onClick={() => handleNavigate("admin-panel")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "admin-panel" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Thống kê</button>
                  <button onClick={() => handleNavigate("history")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "history" || currentView === "test-detail" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Kho bệnh án</button>
                  <button onClick={() => handleNavigate("articles")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "articles" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Kiến thức</button>
                  <button onClick={() => handleNavigate("settings")} className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${currentView === "settings" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/50" : "hover:bg-slate-100/70 hover:text-slate-900"}`}>Cài đặt</button>
                </>
              )
            ) : (
              <button onClick={() => handleNavigate("articles")} className="px-3.5 py-2 rounded-xl hover:bg-slate-100/75 hover:text-slate-900 transition-all cursor-pointer">Cẩm nang sức khỏe</button>
            )}
          </div>

          {/* User Credentials state triggers */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="p-2.5 hover:bg-slate-100/80 rounded-xl transition-all cursor-pointer relative"
                  >
                    <Bell className="w-5 h-5 text-slate-600" />
                    {notifications.filter((n) => !n.read).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-rose-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center animate-bounce shadow-md">
                        {notifications.filter((n) => !n.read).length}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown stream */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl border border-indigo-100/60 shadow-2xl w-80 max-h-[30rem] overflow-y-auto z-50 py-3 space-y-2">
                      <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-800">Thông báo y tế</span>
                        <button onClick={handleMarkAllRead} className="text-blue-600 hover:underline font-bold">Đọc hết</button>
                      </div>
                      <div className="divide-y divide-slate-50 px-2">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => handleNotifClick(notif._id)}
                              className={`p-3 text-xs flex flex-col gap-1 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors ${
                                !notif.read ? "bg-indigo-50/30 font-semibold border-l-2 border-indigo-500 pl-2" : ""
                              }`}
                            >
                              <span className="text-slate-800">{notif.title}</span>
                              <span className="text-[10px] text-slate-400 font-medium leading-relaxed">{notif.message}</span>
                              <span className="text-[9px] text-slate-400 text-right mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 text-xs py-10 text-center">Không có thông báo mới.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar Trigger and Log out */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-extrabold text-xs text-slate-800">{user.fullName}</p>
                    <span className="text-[9px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase">{user.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setShowAuthModal(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:opacity-95 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-100"
              >
                <LogIn className="w-4 h-4" /> Đăng nhập
              </button>
            )}

            {/* Mobile Menu Hamburguer */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl p-4 space-y-3 flex flex-col font-bold text-xs text-slate-600 shadow-lg">
            {user ? (
              user.role === "patient" ? (
                <>
                  <button onClick={() => handleNavigate("dashboard")} className="py-2 text-left hover:text-blue-600">Tổng quan</button>
                  <button onClick={() => handleNavigate("ocr-center")} className="py-2 text-left hover:text-blue-600">Quét Phiếu</button>
                  <button onClick={() => handleNavigate("history")} className="py-2 text-left hover:text-blue-600">Lịch sử xét nghiệm</button>
                  <button onClick={() => handleNavigate("health-tracker")} className="py-2 text-left hover:text-blue-600">Thuốc & Dinh dưỡng</button>
                  <button onClick={() => handleNavigate("booking")} className="py-2 text-left hover:text-blue-600">Đặt lịch khám</button>
                  <button onClick={() => handleNavigate("consultations")} className="py-2 text-left hover:text-blue-600">Tư vấn y tế</button>
                  <button onClick={() => handleNavigate("articles")} className="py-2 text-left hover:text-blue-600">Cẩm nang</button>
                  <button onClick={() => handleNavigate("settings")} className="py-2 text-left hover:text-blue-600">Cài đặt</button>
                </>
              ) : user.role === "doctor" ? (
                <>
                  <button onClick={() => handleNavigate("doctor-portal")} className="py-2 text-left hover:text-blue-600">Bệnh nhân của tôi</button>
                  <button onClick={() => handleNavigate("consultations")} className="py-2 text-left hover:text-blue-600">Kênh tư vấn</button>
                  <button onClick={() => handleNavigate("articles")} className="py-2 text-left hover:text-blue-600">Kiến thức</button>
                  <button onClick={() => handleNavigate("settings")} className="py-2 text-left hover:text-blue-600">Cài đặt</button>
                </>
              ) : (
                // Admin role
                <>
                  <button onClick={() => handleNavigate("admin-panel")} className={`hover:text-blue-600 cursor-pointer ${currentView === "admin-panel" ? "text-blue-600" : ""}`}>Thống kê</button>
                  <button onClick={() => handleNavigate("history")} className={`hover:text-blue-600 cursor-pointer ${currentView === "history" || currentView === "test-detail" ? "text-blue-600" : ""}`}>Kho bệnh án</button>
                  <button onClick={() => handleNavigate("articles")} className={`hover:text-blue-600 cursor-pointer ${currentView === "articles" ? "text-blue-600" : ""}`}>Kiến thức</button>
                  <button onClick={() => handleNavigate("settings")} className={`hover:text-blue-600 cursor-pointer ${currentView === "settings" ? "text-blue-600" : ""}`}>Cài đặt</button>
                </>
              )
            ) : (
              <button onClick={() => handleNavigate("articles")} className="hover:text-blue-600 cursor-pointer">Cẩm nang sức khỏe</button>
            )}
          </div>
        )}
      </nav>

      {/* MAIN VIEW CONTROLLER PORTAL */}
      <main className="flex-1 px-6 py-10 max-w-7xl mx-auto w-full relative z-10">
        {currentView === "landing" && (
          <LandingPage onNavigate={handleNavigate} onOpenLogin={() => { setIsRegisterMode(false); setShowAuthModal(true); }} />
        )}
        {currentView === "dashboard" && user && (
          <Dashboard user={user} profile={profile} onNavigate={handleNavigate} />
        )}
        {currentView === "ocr-center" && user && (
          <OCRCenter onNavigate={handleNavigate} user={user} profile={profile} />
        )}
         {currentView === "health-tracker" && user && (
          <HealthTracker 
            targetRecordId={selectedTargetId} 
            clearTargetRecordId={() => setSelectedTargetId(null)} 
          />
        )}
        {currentView === "history" && user && (
          <HistoryList onNavigate={handleNavigate} />
        )}
        {currentView === "test-detail" && user && selectedTargetId && (
          <TestDetail recordId={selectedTargetId} user={user} onNavigate={handleNavigate} />
        )}
        {currentView === "doctor-portal" && user && (
          <DoctorPortal user={user} onNavigate={handleNavigate} />
        )}
        {currentView === "admin-panel" && user && (
          <AdminPanel />
        )}
        {currentView === "consultations" && user && (
          <ConsultationRoom user={user} />
        )}
        {currentView === "booking" && user && (
          <AppointmentBooking onNavigate={handleNavigate} />
        )}
        {currentView === "articles" && (
          <KnowledgeHub user={user} />
        )}
        {currentView === "settings" && user && (
          <SettingsPage user={user} profile={profile} onUpdateUserAndProfile={(u, p) => { setUser(u); setProfile(p); }} />
        )}
      </main>

      {/* GLOBAL HEALTH COMPANION CHATBOT */}
      <Chatbot 
        user={user} 
        onOpenLogin={() => { setIsRegisterMode(false); setShowAuthModal(true); }} 
      />

      {/* MAIN LOGIN / REGISTRATION MODAL PANEL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-white/20 relative flex flex-col max-h-[90vh] overflow-y-auto space-y-6">
            
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-150 rounded-full cursor-pointer transition-all"
            >
              <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1.5 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20 mx-auto mb-3">
                🩸
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                {isRegisterMode ? "Đăng ký MedTech" : "Chào mừng trở lại"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isRegisterMode ? "Điền đầy đủ thông tin để số hóa hồ sơ y tế trọn đời." : "Đăng nhập hệ thống phân tích chỉ số máu y khoa."}
              </p>
            </div>

            {authError && (
              <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl text-xs flex items-center gap-2.5 shadow-sm">
                <X className="w-4 h-4 text-rose-600 shrink-0" /> {authError}
              </div>
            )}

            {/* Actual Auth form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
              {isRegisterMode && (
                <>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">Số điện thoại</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">Bạn là</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                      >
                        <option value="patient">Bệnh nhân</option>
                        <option value="doctor">Bác sĩ</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Email đăng nhập</label>
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
                <label className="block font-bold text-slate-600 mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  isRegisterMode ? "Đăng ký tài khoản" : "Đăng nhập"
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setAuthError("");
                }}
                className="text-blue-600 hover:underline font-bold text-xs cursor-pointer"
              >
                {isRegisterMode ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký ngay"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast notifications container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-white/95 backdrop-blur-xl p-4.5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100/85 flex items-start gap-3.5 relative overflow-hidden group select-none hover:shadow-2xl transition-all"
            >
              {/* Colored side-bar marker */}
              <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                t.type === "success" ? "bg-emerald-500" :
                t.type === "error" ? "bg-rose-500" :
                t.type === "warning" ? "bg-amber-500" :
                t.type === "loading" ? "bg-violet-500" : "bg-blue-500"
              }`} />

              <div className="shrink-0 mt-0.5">
                {t.type === "success" && <CheckCircle className="w-5.5 h-5.5 text-emerald-500" />}
                {t.type === "error" && <AlertCircle className="w-5.5 h-5.5 text-rose-500" />}
                {t.type === "warning" && <AlertTriangle className="w-5.5 h-5.5 text-amber-500" />}
                {t.type === "info" && <Info className="w-5.5 h-5.5 text-blue-500" />}
                {t.type === "loading" && <Loader2 className="w-5.5 h-5.5 text-violet-500 animate-spin" />}
              </div>

              <div className="flex-1 space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-xs tracking-tight">{t.title}</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{t.message}</p>
              </div>

              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
