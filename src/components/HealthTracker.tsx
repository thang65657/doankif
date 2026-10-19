import React, { useState, useEffect } from "react";
import { 
  Pill, 
  Utensils, 
  Sparkles, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Calendar, 
  Loader2, 
  AlertCircle, 
  Coffee, 
  Heart, 
  HelpCircle,
  Brain,
  ClipboardList,
  Edit2
} from "lucide-react";
import { api } from "../lib/api.js";

interface IMedication {
  _id?: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate?: string;
  endDate?: string;
  instructions?: string;
  isActive: boolean;
}

interface IDietRegime {
  _id?: string;
  userId: string;
  title: string;
  description: string;
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snacks?: string;
  };
  notes?: string;
  isCustom?: boolean;
}

interface IMedicationLog {
  medicationId: string;
  timeSlot: string;
  date: string;
}

interface HealthTrackerProps {
  targetRecordId?: string | null;
  clearTargetRecordId?: () => void;
}

export default function HealthTracker({ targetRecordId, clearTargetRecordId }: HealthTrackerProps) {
  const [activeTab, setActiveTab] = useState<"medications" | "nutrition">("medications");
  
  // Medications states
  const [medications, setMedications] = useState<IMedication[]>([]);
  const [medLogs, setMedLogs] = useState<IMedicationLog[]>([]);
  const [medLoading, setMedLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Nutrition states
  const [diets, setDiets] = useState<IDietRegime[]>([]);
  const [dietLoading, setDietLoading] = useState(false);

  // Form states - Medications
  const [showMedForm, setShowMedForm] = useState(false);
  const [medIdToEdit, setMedIdToEdit] = useState<string | null>(null);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medFrequency, setMedFrequency] = useState("1 lần/ngày");
  const [medTimes, setMedTimes] = useState<string[]>(["08:00"]);
  const [medStartDate, setMedStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [medEndDate, setMedEndDate] = useState("");
  const [medInstructions, setMedInstructions] = useState("");

  // Form states - Diet
  const [showDietForm, setShowDietForm] = useState(false);
  const [dietIdToEdit, setDietIdToEdit] = useState<string | null>(null);
  const [dietTitle, setDietTitle] = useState("");
  const [dietDesc, setDietDesc] = useState("");
  const [dietBreakfast, setDietBreakfast] = useState("");
  const [dietLunch, setDietLunch] = useState("");
  const [dietDinner, setDietDinner] = useState("");
  const [dietSnacks, setDietSnacks] = useState("");
  const [dietNotes, setDietNotes] = useState("");

  // AI Suggestion states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    diet: {
      title: string;
      description: string;
      breakfast: string;
      lunch: string;
      dinner: string;
      snacks: string;
      notes: string;
    };
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      times: string[];
      instructions: string;
    }>;
    rationale: string;
  } | null>(null);
  const [aiError, setAiError] = useState("");

  // Load basic data
  useEffect(() => {
    loadAllData();
  }, [selectedDate]);

  const loadAllData = async () => {
    setMedLoading(true);
    setDietLoading(true);
    try {
      const medList = await api.getMedications();
      setMedications(medList);

      const logs = await api.getMedicationLogs(selectedDate);
      setMedLogs(logs);

      const dietList = await api.getDiets();
      setDiets(dietList);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu sức khỏe:", err);
    } finally {
      setMedLoading(false);
      setDietLoading(false);
    }
  };

  // Medication handlers
  const handleAddMedTime = () => {
    setMedTimes([...medTimes, "12:00"]);
  };

  const handleRemoveMedTime = (index: number) => {
    setMedTimes(medTimes.filter((_, i) => i !== index));
  };

  const handleMedTimeChange = (index: number, val: string) => {
    const updated = [...medTimes];
    updated[index] = val;
    setMedTimes(updated);
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    try {
      const data = {
        name: medName,
        dosage: medDosage,
        frequency: medFrequency,
        times: medTimes,
        startDate: medStartDate,
        endDate: medEndDate,
        instructions: medInstructions,
        isActive: true
      };

      if (medIdToEdit) {
        await api.updateMedication(medIdToEdit, data);
      } else {
        await api.addMedication(data);
      }

      resetMedForm();
      loadAllData();
    } catch (err) {
      console.error(err);
      alert("Không thể lưu thông tin thuốc.");
    }
  };

  const resetMedForm = () => {
    setMedName("");
    setMedDosage("");
    setMedFrequency("1 lần/ngày");
    setMedTimes(["08:00"]);
    setMedStartDate(new Date().toISOString().split("T")[0]);
    setMedEndDate("");
    setMedInstructions("");
    setMedIdToEdit(null);
    setShowMedForm(false);
  };

  const handleEditMed = (med: IMedication) => {
    setMedIdToEdit(med._id || null);
    setMedName(med.name);
    setMedDosage(med.dosage);
    setMedFrequency(med.frequency);
    setMedTimes(med.times);
    setMedStartDate(med.startDate || new Date().toISOString().split("T")[0]);
    setMedEndDate(med.endDate || "");
    setMedInstructions(med.instructions || "");
    setShowMedForm(true);
  };

  const handleDeleteMed = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thuốc này?")) return;
    try {
      await api.deleteMedication(id);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMedActive = async (med: IMedication) => {
    try {
      await api.updateMedication(med._id!, { isActive: !med.isActive });
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Checkbox logging intake
  const handleToggleLog = async (medicationId: string, timeSlot: string) => {
    const isLogged = medLogs.some(
      (l) => l.medicationId === medicationId && l.timeSlot === timeSlot
    );

    try {
      await api.logMedication(medicationId, {
        timeSlot,
        date: selectedDate,
        taken: !isLogged
      });
      // reload logs
      const updatedLogs = await api.getMedicationLogs(selectedDate);
      setMedLogs(updatedLogs);
    } catch (err) {
      console.error(err);
    }
  };

  // Diet handlers
  const handleSaveDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dietTitle.trim()) return;

    try {
      const data = {
        title: dietTitle,
        description: dietDesc,
        meals: {
          breakfast: dietBreakfast,
          lunch: dietLunch,
          dinner: dietDinner,
          snacks: dietSnacks
        },
        notes: dietNotes,
        isCustom: true
      };

      if (dietIdToEdit) {
        await api.updateDiet(dietIdToEdit, data);
      } else {
        await api.addDiet(data);
      }

      resetDietForm();
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetDietForm = () => {
    setDietTitle("");
    setDietDesc("");
    setDietBreakfast("");
    setDietLunch("");
    setDietDinner("");
    setDietSnacks("");
    setDietNotes("");
    setDietIdToEdit(null);
    setShowDietForm(false);
  };

  const handleEditDiet = (diet: IDietRegime) => {
    setDietIdToEdit(diet._id || null);
    setDietTitle(diet.title);
    setDietDesc(diet.description || "");
    setDietBreakfast(diet.meals?.breakfast || "");
    setDietLunch(diet.meals?.lunch || "");
    setDietDinner(diet.meals?.dinner || "");
    setDietSnacks(diet.meals?.snacks || "");
    setDietNotes(diet.notes || "");
    setShowDietForm(true);
  };

  const handleDeleteDiet = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chế độ dinh dưỡng này?")) return;
    try {
      await api.deleteDiet(id);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // AI Suggestion fetcher
  const handleGenerateAISuggestions = async () => {
    setAiGenerating(true);
    setAiError("");
    setAiResult(null);

    try {
      const suggest = await api.getAISuggestedTracker();
      setAiResult(suggest);
    } catch (err: any) {
      setAiError(err.message || "Không thể khởi chạy phân tích AI.");
    } finally {
      setAiGenerating(false);
    }
  };

  // Handle incoming targetRecordId from OCR scanning navigation
  useEffect(() => {
    if (targetRecordId) {
      handleGenerateAISuggestions();
      if (clearTargetRecordId) {
        clearTargetRecordId();
      }
    }
  }, [targetRecordId]);

  // Apply AI result to user profile
  const handleApplyAISuggestions = async () => {
    if (!aiResult) return;
    setAiGenerating(true);

    try {
      // 1. Save diet
      await api.addDiet({
        title: aiResult.diet.title,
        description: aiResult.diet.description,
        meals: {
          breakfast: aiResult.diet.breakfast,
          lunch: aiResult.diet.lunch,
          dinner: aiResult.diet.dinner,
          snacks: aiResult.diet.snacks
        },
        notes: aiResult.diet.notes,
        isCustom: false
      });

      // 2. Save all medications
      for (const med of aiResult.medications) {
        await api.addMedication({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          times: med.times,
          instructions: med.instructions,
          isActive: true
        });
      }

      alert("Đã áp dụng chế độ ăn và danh mục thuốc gợi ý của AI thành công!");
      setAiResult(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi áp dụng gợi ý AI.");
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Intro Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 rounded-[2rem] p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-12 w-32 h-32 bg-blue-500/20 rounded-full blur-xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
              Health Tracker
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Quản lý Thuốc & Dinh dưỡng
            </h1>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Theo dõi lịch uống thuốc chính xác mỗi ngày, quản lý thực đơn ăn uống khoa học, và nhận tư vấn cá nhân hóa tự động từ Trí tuệ nhân tạo (Gemini AI) dựa trên chỉ số xét nghiệm máu.
            </p>
          </div>
          
          <button
            onClick={handleGenerateAISuggestions}
            disabled={aiGenerating}
            className="self-start md:self-center px-6 py-3.5 bg-white text-blue-700 font-black text-xs rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer border-none shrink-0"
          >
            {aiGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
            AI gợi ý từ Chỉ số Máu
          </button>
        </div>
      </div>

      {/* AI Suggestion Display Panel */}
      {(aiGenerating || aiResult || aiError) && (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 border border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {aiGenerating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
              <p className="text-xs font-bold text-slate-400 animate-pulse">
                Gemini AI đang đọc hồ sơ bệnh án và tính toán thực đơn lý tưởng...
              </p>
            </div>
          )}

          {aiError && (
            <div className="space-y-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-red-400">{aiError}</p>
              <button
                onClick={handleGenerateAISuggestions}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl"
              >
                Thử lại
              </button>
            </div>
          )}

          {aiResult && !aiGenerating && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-6 h-6 text-amber-400" />
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white">Chế độ & Thuốc khuyên dùng bởi AI</h2>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Cá nhân hóa theo máu của bạn</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAiResult(null)}
                    className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Bỏ qua
                  </button>
                  <button
                    onClick={handleApplyAISuggestions}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer transition-all hover:-translate-y-0.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Áp dụng vào lịch
                  </button>
                </div>
              </div>

              {/* Rationale explaining why */}
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5">
                <p className="font-extrabold text-white uppercase tracking-wider text-[10px] text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Giải thích y khoa:
                </p>
                <p>{aiResult.rationale}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Proposed Diet */}
                <div className="bg-slate-950 rounded-2xl p-5 border border-slate-850 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Utensils className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-sm text-emerald-400">Thực đơn dinh dưỡng</h3>
                  </div>
                  <div className="space-y-3 text-xs">
                    <p className="font-black text-white text-xs">{aiResult.diet.title}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed italic">{aiResult.diet.description}</p>
                    <div className="space-y-2 pt-2 border-t border-slate-900">
                      <div><strong className="text-slate-300">Bữa sáng:</strong> <span className="text-slate-400">{aiResult.diet.breakfast}</span></div>
                      <div><strong className="text-slate-300">Bữa trưa:</strong> <span className="text-slate-400">{aiResult.diet.lunch}</span></div>
                      <div><strong className="text-slate-300">Bữa tối:</strong> <span className="text-slate-400">{aiResult.diet.dinner}</span></div>
                      <div><strong className="text-slate-300">Bữa phụ:</strong> <span className="text-slate-400">{aiResult.diet.snacks}</span></div>
                    </div>
                    {aiResult.diet.notes && (
                      <div className="pt-2 border-t border-slate-900">
                        <strong className="text-amber-400">Lưu ý kiêng khem:</strong> <span className="text-slate-400 text-[11px]">{aiResult.diet.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proposed Supportive medications */}
                <div className="bg-slate-950 rounded-2xl p-5 border border-slate-850 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Pill className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-sm text-blue-400">Sản phẩm bổ sung đề xuất</h3>
                  </div>
                  <div className="space-y-4 text-xs">
                    {aiResult.medications.length === 0 ? (
                      <p className="text-slate-400 text-[11px]">Không có đề xuất bổ sung hoạt chất/thuốc đặc biệt nào khác ngoài chế độ sinh hoạt.</p>
                    ) : (
                      aiResult.medications.map((m, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5">
                          <p className="font-bold text-white text-xs flex items-center gap-1">
                            💊 {m.name}
                          </p>
                          <div className="text-[11px] text-slate-400 grid grid-cols-2 gap-y-1">
                            <div><strong>Liều:</strong> {m.dosage}</div>
                            <div><strong>Tần suất:</strong> {m.frequency}</div>
                            <div className="col-span-2"><strong>Mốc giờ:</strong> {m.times.join(", ")}</div>
                          </div>
                          <p className="text-[10px] text-slate-500 italic bg-slate-950 p-1.5 rounded-lg border border-slate-850">
                            HD: {m.instructions}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-slate-150 text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab("medications")}
          className={`pb-3 border-b-2 px-2.5 cursor-pointer flex items-center gap-2 transition-all relative ${
            activeTab === "medications" 
              ? "border-blue-600 text-blue-600 font-black" 
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          <Pill className="w-4 h-4" /> Lịch uống thuốc & Đơn thuốc
        </button>
        <button
          onClick={() => setActiveTab("nutrition")}
          className={`pb-3 border-b-2 px-2.5 cursor-pointer flex items-center gap-2 transition-all relative ${
            activeTab === "nutrition" 
              ? "border-blue-600 text-blue-600 font-black" 
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          <Utensils className="w-4 h-4" /> Chế độ Dinh dưỡng
        </button>
      </div>

      {/* TABS RENDERING CONTROLLER */}
      {activeTab === "medications" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main timeline & Interactive Daily logging */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Interactive logging header card */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-5 h-5 text-blue-500" /> Điểm danh uống thuốc trong ngày
                  </h2>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Chọn một ngày bất kỳ và đánh dấu vào các mốc thời gian để ghi chép lại lịch sử uống thuốc.
                  </p>
                </div>
                
                {/* Datepicker input */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3.5 py-2 rounded-2xl self-start shrink-0">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border-none focus:outline-none font-bold text-xs text-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Checklist items */}
              {medLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : medications.filter(m => m.isActive).length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 space-y-2">
                  <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Bạn không có thuốc nào đang hoạt động trong danh mục.</p>
                  <p className="text-[10px]">Hãy thêm thuốc mới bằng mẫu bên cạnh để bắt đầu theo dõi.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medications.filter(m => m.isActive).map((med) => (
                    <div 
                      key={med._id} 
                      className="bg-slate-50/60 border border-slate-100 p-4.5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-slate-50"
                    >
                      <div className="space-y-1.5">
                        <p className="font-extrabold text-sm text-slate-800">{med.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                          <div><strong>Liều:</strong> {med.dosage}</div>
                          <div><strong>Tần suất:</strong> {med.frequency}</div>
                          {med.instructions && (
                            <div className="bg-blue-50 border border-blue-100/50 text-blue-600 px-2 py-0.5 rounded font-medium text-[10px]">
                              HD: {med.instructions}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Time slot pills checkboxes */}
                      <div className="flex flex-wrap gap-2">
                        {med.times.map((time) => {
                          const isTaken = medLogs.some(
                            (log) => log.medicationId === med._id && log.timeSlot === time
                          );
                          return (
                            <button
                              key={time}
                              onClick={() => handleToggleLog(med._id!, time)}
                              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border ${
                                isTaken
                                  ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                  : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              <Clock className={`w-3.5 h-3.5 ${isTaken ? "text-white" : "text-slate-400"}`} />
                              <span>{time}</span>
                              <div className={`w-2.5 h-2.5 rounded-full border ${isTaken ? "bg-white border-white" : "border-slate-300"}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List of medications (Master Catalog) */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-indigo-500" /> Sổ tay dược phẩm cá nhân ({medications.length})
              </h3>
              
              {medications.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">Không có danh mục lưu trữ nào.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medications.map((med) => (
                    <div 
                      key={med._id} 
                      className={`p-5 rounded-3xl border transition-all relative flex flex-col justify-between h-full hover:shadow-md ${
                        med.isActive 
                          ? "bg-white border-slate-100 shadow-sm" 
                          : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              med.isActive ? "bg-emerald-50 text-emerald-600 font-bold" : "bg-slate-200 text-slate-600"
                            }`}>
                              {med.isActive ? "Đang uống" : "Đã ngưng"}
                            </span>
                            <h4 className="font-black text-sm text-slate-800 leading-tight pt-1">{med.name}</h4>
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditMed(med)}
                              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMed(med._id!)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-1">
                          <p><strong>Liều dùng:</strong> {med.dosage || "N/A"}</p>
                          <p><strong>Tần suất:</strong> {med.frequency}</p>
                          <p><strong>Mốc giờ:</strong> {med.times.join(", ")}</p>
                          {med.instructions && (
                            <p className="text-blue-600 font-semibold italic">💡 {med.instructions}</p>
                          )}
                          {(med.startDate || med.endDate) && (
                            <p className="text-[10px] text-slate-400">
                              Lịch trình: {med.startDate || "N/A"} → {med.endDate || "vô hạn"}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 mt-4 pt-3 flex justify-end">
                        <button
                          onClick={() => handleToggleMedActive(med)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                            med.isActive
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                          }`}
                        >
                          {med.isActive ? "Tạm ngưng dùng" : "Kích hoạt uống"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form to Add/Edit medications */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm h-fit space-y-6">
            <div className="space-y-1">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-blue-500" />
                {medIdToEdit ? "Sửa thông tin thuốc" : "Thêm thuốc vào danh sách"}
              </h3>
              <p className="text-[10px] text-slate-400">
                Nhập chính xác để thuận tiện ghi nhớ và điểm danh thuốc hàng ngày.
              </p>
            </div>

            <form onSubmit={handleSaveMedication} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Tên thuốc *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Panadol, Atorvastatin, Vitamin D3..."
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1.5">Liều lượng</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 1 viên, 2 bạt, 5ml..."
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1.5">Tần suất</label>
                  <select
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    <option value="1 lần/ngày">1 lần/ngày</option>
                    <option value="2 lần/ngày">2 lần/ngày</option>
                    <option value="3 lần/ngày">3 lần/ngày</option>
                    <option value="4 lần/ngày">4 lần/ngày</option>
                    <option value="Cần thiết mới dùng">Cần thiết mới dùng</option>
                  </select>
                </div>
              </div>

              {/* Multiple pickers for medicine hours */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-600">Giờ uống trong ngày</label>
                <div className="space-y-2">
                  {medTimes.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleMedTimeChange(idx, e.target.value)}
                        className="px-3.5 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-300 focus:bg-white transition-all"
                      />
                      {medTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedTime(idx)}
                          className="text-red-500 font-bold hover:underline text-[10px]"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddMedTime}
                  className="mt-1 text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer text-[11px]"
                >
                  <Plus className="w-3 h-3" /> Thêm mốc giờ
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1.5">Bắt đầu dùng</label>
                  <input
                    type="date"
                    value={medStartDate}
                    onChange={(e) => setMedStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-slate-700 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1.5">Kết thúc dùng</label>
                  <input
                    type="date"
                    value={medEndDate}
                    onChange={(e) => setMedEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-slate-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Ghi chú hướng dẫn sử dụng</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Uống sau khi ăn no 30 phút, tránh ăn kèm hải sản..."
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 font-medium transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-500/15 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  {medIdToEdit ? "Cập nhật" : "Thêm thuốc"}
                </button>
                {medIdToEdit && (
                  <button
                    type="button"
                    onClick={resetMedForm}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-2xl cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* NUTRITION & DIETARY TABS */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Diets lists */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-6">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                <Utensils className="w-5 h-5 text-emerald-500" /> Thực đơn & Chế độ dinh dưỡng của bạn
              </h3>

              {dietLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : diets.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 space-y-2">
                  <Utensils className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold">Bạn chưa thiết lập chế độ ăn uống nào.</p>
                  <p className="text-[10px]">Hãy tự tạo mới thực đơn hoặc bấm nút AI Gợi ý ở đầu trang!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {diets.map((diet) => (
                    <div 
                      key={diet._id} 
                      className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden"
                    >
                      {/* Brand Label for AI generation vs custom */}
                      <div className="absolute right-0 top-0">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-3 py-1.5 rounded-bl-2xl ${
                          diet.isCustom === false
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {diet.isCustom === false ? "Gợi ý bởi AI" : "Cá nhân tự tạo"}
                        </span>
                      </div>

                      <div className="space-y-1.5 pr-20">
                        <h4 className="font-black text-sm sm:text-base text-slate-800 leading-tight">
                          {diet.title}
                        </h4>
                        {diet.description && (
                          <p className="text-xs text-slate-400 leading-relaxed italic">{diet.description}</p>
                        )}
                      </div>

                      {/* Meals breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-50 text-xs text-slate-600">
                        {diet.meals?.breakfast && (
                          <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/40 space-y-1">
                            <span className="font-extrabold text-[10px] uppercase text-amber-500 flex items-center gap-1">
                              🌅 Bữa Sáng
                            </span>
                            <p className="leading-relaxed text-slate-700 font-medium">{diet.meals.breakfast}</p>
                          </div>
                        )}
                        {diet.meals?.lunch && (
                          <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/40 space-y-1">
                            <span className="font-extrabold text-[10px] uppercase text-blue-500 flex items-center gap-1">
                              ☀️ Bữa Trưa
                            </span>
                            <p className="leading-relaxed text-slate-700 font-medium">{diet.meals.lunch}</p>
                          </div>
                        )}
                        {diet.meals?.dinner && (
                          <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/40 space-y-1">
                            <span className="font-extrabold text-[10px] uppercase text-indigo-500 flex items-center gap-1">
                              🌙 Bữa Tối
                            </span>
                            <p className="leading-relaxed text-slate-700 font-medium">{diet.meals.dinner}</p>
                          </div>
                        )}
                        {diet.meals?.snacks && (
                          <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/40 space-y-1">
                            <span className="font-extrabold text-[10px] uppercase text-emerald-500 flex items-center gap-1">
                              🍪 Bữa Phụ
                            </span>
                            <p className="leading-relaxed text-slate-700 font-medium">{diet.meals.snacks}</p>
                          </div>
                        )}
                      </div>

                      {diet.notes && (
                        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-xs text-amber-800 space-y-1">
                          <p className="font-extrabold text-[10px] uppercase tracking-wide flex items-center gap-1">
                            ⚠️ Lưu ý kiêng khem đặc biệt:
                          </p>
                          <p className="leading-relaxed">{diet.notes}</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 text-[11px] font-bold">
                        <button
                          onClick={() => handleEditDiet(diet)}
                          className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer"
                        >
                          Sửa chế độ
                        </button>
                        <button
                          onClick={() => handleDeleteDiet(diet._id!)}
                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl cursor-pointer"
                        >
                          Xóa chế độ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form to Add/Edit Diet */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm h-fit space-y-6">
            <div className="space-y-1">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-500" />
                {dietIdToEdit ? "Chỉnh sửa chế độ ăn" : "Thiết lập chế độ ăn tự tạo"}
              </h3>
              <p className="text-[10px] text-slate-400">
                Hãy tùy biến các bữa ăn lành mạnh để kiểm soát chỉ số mỡ máu, đường huyết của bản thân.
              </p>
            </div>

            <form onSubmit={handleSaveDiet} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Tên chế độ ăn *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ăn kiêng tinh bột, Thực đơn healthy..."
                  value={dietTitle}
                  onChange={(e) => setDietTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Mô tả ngắn gọn</label>
                <input
                  type="text"
                  placeholder="Mục tiêu của chế độ dinh dưỡng này là gì..."
                  value={dietDesc}
                  onChange={(e) => setDietDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 font-medium transition-all"
                />
              </div>

              <div className="space-y-3">
                <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5">Các món trong bữa chính:</p>
                
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Bữa sáng</label>
                  <input
                    type="text"
                    placeholder="Cháo yến mạch, trứng luộc, sữa hạt..."
                    value={dietBreakfast}
                    onChange={(e) => setDietBreakfast(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Bữa trưa</label>
                  <input
                    type="text"
                    placeholder="Ức gà áp chảo, súp lơ xanh, cơm lứt..."
                    value={dietLunch}
                    onChange={(e) => setDietLunch(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Bữa tối</label>
                  <input
                    type="text"
                    placeholder="Salad cá hồi quả bơ, súp bí đỏ..."
                    value={dietDinner}
                    onChange={(e) => setDietDinner(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Bữa phụ (nếu có)</label>
                  <input
                    type="text"
                    placeholder="Hạt điều, hạnh nhân, sữa chua không đường..."
                    value={dietSnacks}
                    onChange={(e) => setDietSnacks(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1.5">Hướng dẫn kiêng khem bổ sung</label>
                <textarea
                  rows={2}
                  placeholder="Kiêng ăn đồ ngọt, mỡ động vật, phủ tạng heo bò..."
                  value={dietNotes}
                  onChange={(e) => setDietNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 font-medium transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-500/15 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  {dietIdToEdit ? "Cập nhật chế độ" : "Thêm chế độ ăn"}
                </button>
                {dietIdToEdit && (
                  <button
                    type="button"
                    onClick={resetDietForm}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-2xl cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
