import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, User, Sparkles, LogIn } from "lucide-react";
import { api } from "../lib/api.js";

interface ChatbotProps {
  user: any;
  onOpenLogin: () => void;
}

export default function Chatbot({ user, onOpenLogin }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { senderId: "ai", text: "Xin chào! Tôi là Trợ lý Sức khỏe AI của MedTech. Tôi có thể giúp bạn đọc hiểu chỉ số xét nghiệm máu, tư vấn chế độ dinh dưỡng và lối sống dựa trên thể chất và tiền sử bệnh lý của bạn. Bạn muốn hỏi điều gì ạ?", timestamp: new Date().toISOString() },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const suggestions = [
    "Nhờ AI đọc giúp kết quả xét nghiệm gần nhất 📊",
    "Tôi bị đau lưng thì phải làm sao? 🩺",
    "Cách giảm mỡ máu (Cholesterol)? 🥗",
    "Giải độc gan và hạ men gan? 🍀",
    "Giải thích chỉ số Hồng cầu (RBC) 🩸"
  ];

  const submitMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage = {
      senderId: "user",
      text: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      // Build history format required by backend
      const history = [...messages, userMessage].map((m) => ({
        role: m.senderId === "ai" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

      const reply = await api.chatWithAI(text, history);

      setMessages((prev) => [
        ...prev,
        {
          senderId: "ai",
          text: reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          senderId: "ai",
          text: "Xin lỗi, hiện kết nối của tôi đang bận hoặc có lỗi xảy ra. Vui lòng thử lại sau giây lát.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(inputValue);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    submitMessage(suggestionText);
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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-80 sm:w-[29rem] h-[560px] flex flex-col mb-4 overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                  Trợ lý Sức khỏe AI <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                </h4>
                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Trực tuyến 24/7
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conditional Rendering depending on auth state */}
          {!user ? (
            /* Guest Welcome Screen */
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 flex flex-col justify-center items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50/80 backdrop-blur rounded-2xl flex items-center justify-center text-blue-600 shadow-inner border border-blue-100/50">
                <Bot className="w-8 h-8 text-blue-600 animate-bounce" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h4 className="font-extrabold text-slate-900 text-sm">Chào mừng đến với Trợ lý MedTech AI</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Vui lòng đăng nhập tài khoản của bạn để đồng bộ các chỉ số xét nghiệm máu, tiền sử bệnh lý và trò chuyện cá nhân hóa cùng Trợ lý AI.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenLogin();
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Đăng nhập trải nghiệm ngay
              </button>
            </div>
          ) : (
            /* Logged in chat block */
            <>
              {/* Messages block */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 scrollbar-thin">
                {messages.map((msg, idx) => {
                  const isAI = msg.senderId === "ai";
                  return (
                    <div key={idx} className={`flex gap-2.5 max-w-[90%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm ${isAI ? "bg-indigo-100 text-indigo-700 font-bold" : "bg-blue-100 text-blue-700 font-bold"}`}>
                        {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex flex-col gap-0.5 bg-transparent max-w-full">
                        <div className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-[13.5px] leading-relaxed ${isAI ? "bg-white text-slate-800 border border-slate-150/60 shadow-sm w-full" : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10"}`}>
                          {isAI ? renderMessageText(msg.text) : msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-2.5 max-w-[88%] mr-auto">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-slate-100 p-3.5 rounded-2xl flex items-center gap-2 shadow-sm text-xs text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> Đang phân tích sức khỏe...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions quick-action container (only visible on initial state) */}
              {messages.length === 1 && (
                <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100/50 space-y-1.5 shrink-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gợi ý câu hỏi:</p>
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSuggestionClick(s)}
                        className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-150 text-slate-600 hover:text-indigo-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-left shadow-sm active:scale-95"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center shrink-0">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nhập câu hỏi sức khỏe..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-300 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md cursor-pointer disabled:bg-blue-400 transition-all flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-850 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-white/10 pulse-glow-blue"
        title="Trò chuyện với Trợ lý AI y tế"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6 animate-pulse" />}
      </button>
    </div>
  );
}
