import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Bot, Send, Loader2, User, Stethoscope, AlertCircle, Paperclip, CheckCheck, HelpCircle, Search } from "lucide-react";
import { api } from "../lib/api.js";
import { IConsultation, IMessage } from "../types.js";

interface ConsultationRoomProps {
  user: any;
}

export default function ConsultationRoom({ user }: ConsultationRoomProps) {
  const [activeTab, setActiveTab] = useState<"doctor" | "ai">("ai");
  
  // Doctor chat states
  const [rooms, setRooms] = useState<IConsultation[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<IConsultation | null>(null);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [doctorMsg, setDoctorMsg] = useState("");
  const [loadingDoctor, setLoadingDoctor] = useState(true);

  // File upload states for Consultation Room
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile modal states
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null);
  const [loadedProfile, setLoadedProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleOpenProfile = async (userId: string) => {
    setProfileModalUserId(userId);
    setLoadingProfile(true);
    setLoadedProfile(null);
    try {
      const data = await api.getUserProfile(userId);
      setLoadedProfile(data);
    } catch (err) {
      console.error("Lỗi lấy thông tin:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Helper to render inline formatting like **bold text**
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-extrabold text-slate-950">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part.replace(/\*/g, "");
    });
  };

  // Helper to parse and render basic Markdown structure (Headers, Lists, Paragraphs)
  const renderMessageText = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    
    const pushCurrentList = (key: string | number) => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${key}`} className="space-y-2.5 my-2 pl-0.5 w-full">
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
        elements.push(<div key={`space-${i}`} className="h-1.5" />);
        continue;
      }

      // Check for headers
      if (trimmed.startsWith("###")) {
        pushCurrentList(i);
        elements.push(
          <h5 key={`h5-${i}`} className="font-extrabold text-indigo-950 text-xs sm:text-[13.5px] mt-4 mb-1.5 leading-snug">
            {renderInlineFormatting(trimmed.replace("###", "").trim())}
          </h5>
        );
      } else if (trimmed.startsWith("##")) {
        pushCurrentList(i);
        elements.push(
          <h4 key={`h4-${i}`} className="font-black text-indigo-950 text-sm sm:text-base mt-4.5 mb-2 pb-0.5 border-b border-indigo-50/50">
            {renderInlineFormatting(trimmed.replace("##", "").trim())}
          </h4>
        );
      } else if (trimmed.startsWith("#")) {
        pushCurrentList(i);
        elements.push(
          <h3 key={`h3-${i}`} className="font-black text-blue-900 text-base mt-5 mb-2">
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
          <li key={`li-${i}-${currentList.length}`} className="flex items-start gap-2.5 text-slate-700 text-xs sm:text-[13.5px] leading-relaxed">
            <span className="text-blue-600 font-extrabold mt-0.5 shrink-0 text-[10px] bg-blue-50/80 w-5 h-5 rounded-full flex items-center justify-center border border-blue-100/50 shadow-sm">
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
          <li key={`li-${i}-${currentList.length}`} className="flex items-start gap-2 text-slate-700 text-xs sm:text-[13.5px] leading-relaxed">
            <span className="text-indigo-500 mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500/80 shadow-sm" />
            <span className="flex-1">{renderInlineFormatting(itemText)}</span>
          </li>
        );
      }
      // Regular paragraph
      else {
        pushCurrentList(i);
        elements.push(
          <p key={`p-${i}`} className="text-slate-700 text-xs sm:text-[13.5px] leading-relaxed my-1.5">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      }
    }
    
    // Push remaining list
    pushCurrentList("final");

    return elements;
  };

  // AI chat states
  const [aiHistory, setAiHistory] = useState<any[]>([
    { senderId: "ai", senderName: "Trợ lý Y khoa AI", text: "Xin chào! Tôi là Trợ lý Sức khỏe AI của bạn. Bạn cần tôi giải đáp ý nghĩa chỉ số máu nào, hay cần tư vấn thực đơn dinh dưỡng hôm nay?", timestamp: new Date().toISOString() },
  ]);
  const [aiMsg, setAiMsg] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedRoom?.messages, aiHistory]);

  // Load lists and active consultations
  useEffect(() => {
    async function loadChatData() {
      try {
        const list = await api.getConsultations();
        setRooms(list);
        if (list.length > 0) {
          setSelectedRoom(list[0]);
        }

        if (user.role === "patient") {
          const docs = await api.getUsers("doctor");
          setDoctorsList(docs);
        } else if (user.role === "doctor") {
          const pats = await api.getUsers("patient");
          setPatientsList(pats);
        }
      } catch (err) {
        console.error("Failed to load chat components:", err);
      } finally {
        setLoadingDoctor(false);
      }
    }
    loadChatData();
  }, [user]);

  // Start new room
  const handleInitiateRoom = async (targetId: string, role: "doctor" | "patient") => {
    try {
      const payload = role === "doctor" ? { doctorId: targetId } : { patientId: targetId };
      const newRoom = await api.startConsultation(payload);
      const exists = rooms.find((r) => r._id === newRoom._id);
      if (!exists) {
        setRooms([newRoom, ...rooms]);
      } else {
        setRooms(rooms.map((r) => (r._id === newRoom._id ? newRoom : r)));
      }
      setSelectedRoom(newRoom);
    } catch (err) {
      alert("Khởi tạo phòng tư vấn thất bại.");
    }
  };

  // Send message to doctor
  const handleSendDoctorMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || (!doctorMsg.trim() && !attachedImage)) return;

    try {
      const updated = await api.sendMessage(selectedRoom._id, { 
        text: doctorMsg, 
        fileUrl: attachedImage || undefined 
      });
      setSelectedRoom(updated);
      setRooms(rooms.map((r) => (r._id === updated._id ? updated : r)));
      setDoctorMsg("");
      setAttachedImage(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Chat with AI assistant
  const handleSendAIMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMsg.trim() || loadingAI) return;

    const userMessage = {
      senderId: "patient",
      senderName: user.fullName,
      text: aiMsg,
      timestamp: new Date().toISOString(),
    };

    setAiHistory((prev) => [...prev, userMessage]);
    setAiMsg("");
    setLoadingAI(true);

    try {
      // Map history to the required format for gemini service: { role: 'user' | 'model', parts: [ { text: string } ] }
      const mappedHistory = aiHistory.map((item) => ({
        role: item.senderId === "ai" ? "model" : "user",
        parts: [{ text: item.text }],
      }));

      const reply = await api.chatWithAI(userMessage.text, mappedHistory);

      setAiHistory((prev) => [
        ...prev,
        {
          senderId: "ai",
          senderName: "Trợ lý Y khoa AI",
          text: reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error(err);
      setAiHistory((prev) => [
        ...prev,
        {
          senderId: "ai",
          senderName: "Trợ lý Y khoa AI",
          text: "Xin lỗi, kết nối máy chủ AI đang bận. Vui lòng thử lại sau.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 py-4 text-center font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === "ai"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Bot className="w-5 h-5" /> Trợ Lý Sức Khỏe AI (24/7)
        </button>
        <button
          onClick={() => setActiveTab("doctor")}
          className={`flex-1 py-4 text-center font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === "doctor"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <MessageSquare className="w-5 h-5" /> Tư Vấn Bác Sĩ Trực Tuyến
        </button>
      </div>

      {/* AI Assistant Chat Panel */}
      {activeTab === "ai" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[70vh]">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Trợ lý Sức khỏe AI</h3>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sẵn sàng hoạt động
              </p>
            </div>
          </div>

          {/* Messages stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
            {aiHistory.map((msg, idx) => {
              const isAI = msg.senderId === "ai";
              return (
                <div key={idx} className={`flex gap-3 max-w-[80%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAI ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"}`}>
                    {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className={`p-3.5 rounded-2xl text-xs sm:text-[13.5px] leading-relaxed ${isAI ? "bg-white text-slate-800 shadow-sm border border-slate-100 w-full" : "bg-blue-600 text-white shadow-sm"}`}>
                      {isAI ? renderMessageText(msg.text) : msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block px-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}
            {loadingAI && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-100 p-3.5 rounded-2xl flex items-center gap-2 shadow-sm text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Trợ lý AI đang suy nghĩ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form input */}
          <form onSubmit={handleSendAIMsg} className="p-4 bg-white border-t border-slate-100 flex gap-3 items-center">
            <input
              type="text"
              value={aiMsg}
              onChange={(e) => setAiMsg(e.target.value)}
              placeholder="Hỏi AI: 'Làm thế nào để hạ mỡ máu?', 'Chỉ số Glucose 6.2 mmol/L có cao không?'..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={loadingAI || !aiMsg.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:bg-blue-400"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Doctor Consultation Chat Panel */}
      {activeTab === "doctor" && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Side List / Active Doctors & Patients */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4 max-h-[70vh] overflow-y-auto">
            <h4 className="font-bold text-slate-800 text-sm">Cuộc tư vấn y khoa</h4>
            
            {/* Search and contact users */}
            <div className="space-y-3 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {user.role === "patient" ? "Tìm bác sĩ" : "Tìm bệnh nhân"}
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={user.role === "patient" ? "Nhập tên hoặc SĐT bác sĩ..." : "Nhập tên hoặc SĐT bệnh nhân..."}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {user.role === "patient" ? (
                  doctorsList.filter(doc => 
                    doc.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                    (doc.phone || "").includes(userSearchQuery)
                  ).map((doc) => {
                    const hasRoom = rooms.some((r) => r.doctorId === doc._id);
                    return (
                      <div key={doc._id} className="flex items-center justify-between p-2 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl transition-all">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer overflow-hidden" onClick={() => handleOpenProfile(doc._id)}>
                            {doc.avatar ? (
                              <img src={doc.avatar} alt={doc.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <Stethoscope className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleOpenProfile(doc._id)}>
                            <span className="text-xs font-bold text-slate-700 block truncate hover:text-blue-600 hover:underline">{doc.fullName}</span>
                            <span className="text-[9px] text-slate-400 block">{doc.phone || "Liên hệ qua app"}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleInitiateRoom(doc._id, "doctor")}
                          className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px] hover:bg-blue-700 cursor-pointer shrink-0"
                        >
                          {hasRoom ? "Nhắn tin" : "Tư vấn"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  patientsList.filter(pat => 
                    pat.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                    (pat.phone || "").includes(userSearchQuery)
                  ).map((pat) => {
                    const hasRoom = rooms.some((r) => r.patientId === pat._id);
                    return (
                      <div key={pat._id} className="flex items-center justify-between p-2 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl transition-all">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer overflow-hidden" onClick={() => handleOpenProfile(pat._id)}>
                            {pat.avatar ? (
                              <img src={pat.avatar} alt={pat.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleOpenProfile(pat._id)}>
                            <span className="text-xs font-bold text-slate-700 block truncate hover:text-blue-600 hover:underline">{pat.fullName}</span>
                            <span className="text-[9px] text-slate-400 block">{pat.phone || "Liên hệ qua app"}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleInitiateRoom(pat._id, "patient")}
                          className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px] hover:bg-blue-700 cursor-pointer shrink-0"
                        >
                          {hasRoom ? "Nhắn tin" : "Liên hệ"}
                        </button>
                      </div>
                    );
                  })
                )}
                
                {userSearchQuery && (user.role === "patient" ? doctorsList : patientsList).filter(u => 
                  u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                  (u.phone || "").includes(userSearchQuery)
                ).length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center py-2">Không tìm thấy kết quả.</p>
                )}
              </div>
            </div>

            {/* List of active rooms */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phòng chat đang có</span>
              <div className="space-y-1.5">
                {rooms.length > 0 ? (
                  rooms.map((r) => {
                    const partnerName = user.role === "patient" ? r.doctorName : r.patientName;
                    const partnerId = user.role === "patient" ? r.doctorId : r.patientId;
                    const partnerUser = user.role === "patient"
                      ? doctorsList.find(d => d._id === partnerId)
                      : patientsList.find(p => p._id === partnerId);
                    const partnerAvatar = partnerUser?.avatar;
                    const isSelected = selectedRoom?._id === r._id;
                    return (
                      <div
                        key={r._id}
                        onClick={() => setSelectedRoom(r)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected ? "bg-blue-50/50 border-blue-200" : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center font-black overflow-hidden shrink-0">
                            {partnerAvatar ? (
                              <img src={partnerAvatar} alt={partnerName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              partnerName.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{partnerName}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {r.messages[r.messages.length - 1]?.text || "Chưa có tin nhắn"}
                            </p>
                          </div>
                        </div>
                        {r.status === "closed" && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase font-bold">Đóng</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-slate-400">Không có phòng tư vấn nào.</p>
                )}
              </div>
            </div>
          </div>

          {/* Chat Room view */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[70vh]">
            {selectedRoom ? (
              <>
                {/* Header */}
                <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                  {(() => {
                    const partnerId = user.role === "patient" ? selectedRoom.doctorId : selectedRoom.patientId;
                    const partnerUser = user.role === "patient" 
                      ? doctorsList.find(d => d._id === partnerId) 
                      : patientsList.find(p => p._id === partnerId);
                    const partnerAvatar = partnerUser?.avatar;
                    const partnerName = user.role === "patient" ? selectedRoom.doctorName : selectedRoom.patientName;
                    return (
                      <div 
                        className="flex items-center gap-2.5 cursor-pointer group"
                        onClick={() => handleOpenProfile(partnerId)}
                      >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold uppercase overflow-hidden shrink-0">
                          {partnerAvatar ? (
                            <img src={partnerAvatar} alt={partnerName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            partnerName.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm group-hover:underline">
                            {partnerName}
                          </h4>
                          <p className="text-[9px] text-slate-400">
                            {user.role === "patient" ? "Bác sĩ tư vấn y khoa" : "Bệnh nhân - Xem chi tiết bệnh án"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <button
                    onClick={() => handleOpenProfile(user.role === "patient" ? selectedRoom.doctorId : selectedRoom.patientId)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Xem hồ sơ
                  </button>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
                  {selectedRoom.messages.map((msg, i) => {
                    const isMine = msg.senderId === user._id;
                    return (
                      <div key={i} className={`flex gap-3 max-w-[80%] ${isMine ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                        <div className={`p-3.5 rounded-2xl text-xs sm:text-sm space-y-2 ${isMine ? "bg-blue-600 text-white shadow-sm animate-fade-in" : "bg-white text-slate-800 shadow-sm border border-slate-100 animate-fade-in"}`}>
                          {msg.fileUrl && (
                            <div className="rounded-lg overflow-hidden border border-slate-200/20 max-w-[240px]">
                              <img 
                                src={msg.fileUrl} 
                                alt="Attachment" 
                                className="w-full h-auto object-cover max-h-[180px] rounded-md" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Form input */}
                {selectedRoom.status === "active" ? (
                  <div className="border-t border-slate-100 bg-white p-4 space-y-3 shrink-0">
                    {attachedImage && (
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl relative max-w-[200px] border border-slate-200">
                        <img 
                          src={attachedImage} 
                          alt="Attach preview" 
                          className="w-14 h-14 object-cover rounded-lg border border-slate-200" 
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setAttachedImage(null)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer"
                        >
                          ✕
                        </button>
                        <span className="text-[10px] text-slate-400 truncate">Ảnh đính kèm</span>
                      </div>
                    )}
                    
                    <form onSubmit={handleSendDoctorMsg} className="flex gap-3 items-center">
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all cursor-pointer shrink-0 ${attachedImage ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                        title="Đính kèm hình ảnh"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      <input
                        type="text"
                        value={doctorMsg}
                        onChange={(e) => setDoctorMsg(e.target.value)}
                        placeholder="Nhập nội dung tư vấn..."
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                      />
                      
                      <button
                        type="submit"
                        disabled={!doctorMsg.trim() && !attachedImage}
                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all disabled:bg-blue-400 cursor-pointer shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-100 text-slate-400 text-center text-xs font-semibold">
                    Phiên tư vấn này đã kết thúc.
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-4">
                <Stethoscope className="w-12 h-12 text-slate-300" />
                <div>
                  <h4 className="font-bold text-slate-800">Không có phòng tư vấn nào đang được chọn</h4>
                  <p className="text-xs mt-1">Hãy khởi tạo cuộc tư vấn mới hoặc chọn một phòng chat từ danh mục bên trái.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileModalUserId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[85vh]">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm uppercase">
                  {loadedProfile?.user?.fullName?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{loadedProfile?.user?.fullName || "Đang tải..."}</h3>
                  <p className="text-[10px] text-slate-300">
                    {loadedProfile?.user?.role === "doctor" ? "Hồ sơ Bác sĩ chuyên môn" : "Hồ sơ sức khỏe Bệnh nhân"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalUserId(null)}
                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs">
              {loadingProfile ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-slate-400 text-xs">Đang truy vấn hồ sơ bảo mật...</span>
                </div>
              ) : loadedProfile ? (
                <div className="space-y-5">
                  {/* Basic information */}
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                    <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 text-xs">Thông tin liên hệ</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">Email:</span>
                        <p className="font-semibold text-slate-700">{loadedProfile.user.email}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Số điện thoại:</span>
                        <p className="font-semibold text-slate-700">{loadedProfile.user.phone || "Chưa cập nhật"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Profile Details */}
                  {loadedProfile.user.role === "doctor" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50/50 p-3 rounded-xl">
                          <span className="text-slate-500 font-medium block mb-0.5">Chuyên khoa:</span>
                          <span className="font-bold text-blue-900">{loadedProfile.user.specialty || "Nội khoa & Xét nghiệm"}</span>
                        </div>
                        <div className="bg-indigo-50/50 p-3 rounded-xl">
                          <span className="text-slate-500 font-medium block mb-0.5">Kinh nghiệm:</span>
                          <span className="font-bold text-indigo-900">{loadedProfile.user.experience || "Chưa cập nhật"}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl">
                        <span className="text-slate-400 block mb-1 font-bold">Nơi công tác:</span>
                        <p className="font-semibold text-slate-700">{loadedProfile.user.workplace || "Chưa cập nhật"}</p>
                      </div>

                      {loadedProfile.user.bio && (
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <span className="text-slate-400 block mb-1 font-bold">Tiểu sử & Chuyên môn:</span>
                          <p className="text-slate-600 leading-relaxed font-normal whitespace-pre-line">{loadedProfile.user.bio}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Patient Profile Details */}
                  {loadedProfile.user.role === "patient" && loadedProfile.profile && (
                    <div className="space-y-4">
                      {/* Biometrics */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-slate-400 block text-[10px]">Nhóm máu</span>
                          <span className="font-black text-slate-700 text-sm">{loadedProfile.profile.bloodType || "Chưa rõ"}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-slate-400 block text-[10px]">Chiều cao</span>
                          <span className="font-black text-slate-700 text-sm">{loadedProfile.profile.height ? `${loadedProfile.profile.height} cm` : "Chưa rõ"}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-slate-400 block text-[10px]">Cân nặng</span>
                          <span className="font-black text-slate-700 text-sm">{loadedProfile.profile.weight ? `${loadedProfile.profile.weight} kg` : "Chưa rõ"}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400">Ngày sinh (DOB):</span>
                            <p className="font-semibold text-slate-700">{loadedProfile.profile.dob || "Chưa cập nhật"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Giới tính:</span>
                            <p className="font-semibold text-slate-700">{loadedProfile.profile.gender || "Chưa cập nhật"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Clinical history */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-xs">Hồ sơ y khoa lâm sàng</h4>
                        
                        <div className="space-y-2.5 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Tiền sử bệnh án:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {loadedProfile.profile.medicalHistory && loadedProfile.profile.medicalHistory.length > 0 ? (
                                loadedProfile.profile.medicalHistory.map((h: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded-lg border border-red-100 font-semibold">{h}</span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic">Không có tiền sử bệnh lý</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-1.5">
                            <span className="text-slate-400 block">Dị ứng thuốc & thức ăn:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {loadedProfile.profile.allergies && loadedProfile.profile.allergies.length > 0 ? (
                                loadedProfile.profile.allergies.map((a: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg border border-orange-100 font-semibold">{a}</span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic">Không có tiền sử dị ứng</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-1.5">
                            <span className="text-slate-400 block">Thuốc đang sử dụng điều trị:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {loadedProfile.profile.currentMedications && loadedProfile.profile.currentMedications.length > 0 ? (
                                loadedProfile.profile.currentMedications.map((m: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-semibold">{m}</span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic">Không dùng thuốc điều trị nào</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">Không thể tải thông tin hồ sơ.</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setProfileModalUserId(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
