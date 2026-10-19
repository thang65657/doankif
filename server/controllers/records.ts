import { Request, Response } from "express";
import { BloodTestRecord, PatientProfile, Notification, User } from "../models/index.js";
import { generateAIHealthAnalysis } from "../services/gemini.js";

// Helper to determine status based on standard ranges
export function getStatus(value: number, min: number, max: number): "normal" | "low" | "high" {
  if (value < min) return "low";
  if (value > max) return "high";
  return "normal";
}

export const recordsController = {
  // OCR Gemini cũ đã tắt. OCR mới chạy cục bộ bằng Tesseract.js trong trình duyệt.
  async extractOCR(_req: Request, res: Response) {
    return res.status(410).json({ message: "OCR máy chủ đã được thay bằng Tesseract OCR trên trình duyệt." });
  },

  // Save blood test record (can be entered manually or after OCR verification)
  async saveRecord(req: Request, res: Response) {
    const { patientId, testDate, facility, performer, indicators, imageUrl, doctorNotes, doctorSignature } = req.body;
    const currentUser = (req as any).user;

    // Determine target patient id (patient can only save for themselves, doctor/admin can save for anyone)
    const targetPatientId = currentUser.role === "patient" ? currentUser._id : (patientId || currentUser._id);

    if (!testDate || !facility || !indicators) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin xét nghiệm." });
    }

    try {
      // Find patient profile/user to get accurate name
      const patientUser = await User.findById(targetPatientId);
      if (!patientUser) {
        return res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh nhân." });
      }
      const accountProfile = await PatientProfile.findOne({ userId: targetPatientId });

      // Chỉ lưu các ô thật sự có giá trị. Phiếu huyết học không có glucose,
      // cholesterol hoặc men gan nên hệ thống không tự bịa thêm số liệu.
      const definitions: Record<string, { min: number; max: number; unit: string; name: string }> = {
        rbc: { min: 3.8, max: 5.9, unit: "T/L", name: "Hồng cầu (RBC)" },
        wbc: { min: 4.0, max: 10.0, unit: "G/L", name: "Bạch cầu (WBC)" },
        hgb: { min: 120, max: 165, unit: "g/L", name: "Hemoglobin (HGB)" },
        hct: { min: 0.35, max: 0.50, unit: "L/L", name: "Hematocrit (HCT)" },
        mcv: { min: 83, max: 92, unit: "fL", name: "MCV" },
        mch: { min: 27, max: 32, unit: "pg", name: "MCH" },
        mchc: { min: 320, max: 356, unit: "g/L", name: "MCHC" },
        wbcComposition: { min: 0, max: 100, unit: "%", name: "Thành phần bạch cầu" },
        nrbc: { min: 0, max: 0, unit: "G/L", name: "Hồng cầu có nhân" },
        reticulocyte: { min: 0.1, max: 0.5, unit: "%", name: "Hồng cầu lưới" },
        abnormalCells: { min: 0, max: 0, unit: "%", name: "Tế bào bất thường" },
        plt: { min: 150, max: 400, unit: "G/L", name: "Tiểu cầu (PLT)" },
        neutrophil: { min: 40, max: 75, unit: "%", name: "Đoạn trung tính" },
        eosinophil: { min: 0, max: 6, unit: "%", name: "Đoạn ưa axit" },
        basophil: { min: 0, max: 2, unit: "%", name: "Đoạn ưa bazơ" },
        mono: { min: 2, max: 10, unit: "%", name: "Mono" },
        lympho: { min: 20, max: 45, unit: "%", name: "Lympho" },
        esr1: { min: 0, max: 15, unit: "mm", name: "Máu lắng giờ 1" },
        esr2: { min: 0, max: 20, unit: "mm", name: "Máu lắng giờ 2" },
        glucose: { min: 3.9, max: 6.4, unit: "mmol/L", name: "Đường huyết lúc đói" },
        cholesterol: { min: 3.6, max: 5.2, unit: "mmol/L", name: "Cholesterol toàn phần" },
        ast: { min: 5, max: 40, unit: "U/L", name: "Men gan AST (SGOT)" },
        alt: { min: 5, max: 41, unit: "U/L", name: "Men gan ALT (SGPT)" },
      };
      const formattedIndicators: Record<string, any> = {};
      Object.entries(definitions).forEach(([key, definition]) => {
        const raw = indicators[key];
        if (raw === "" || raw === null || raw === undefined) return;
        const value = Number(raw);
        if (!Number.isFinite(value)) return;
        formattedIndicators[key] = {
          value, refMin: definition.min, refMax: definition.max, unit: definition.unit,
          status: getStatus(value, definition.min, definition.max), name: definition.name
        };
      });

      if (!formattedIndicators.rbc && !formattedIndicators.wbc && !formattedIndicators.hgb && !formattedIndicators.plt) {
        return res.status(400).json({ message: "Không có chỉ số huyết học hợp lệ để lưu. Vui lòng kiểm tra lại kết quả OCR." });
      }

      // Lưu một mốc thời gian do máy chủ tạo, có đầy đủ ngày, giờ, phút, giây.
      const savedAt = new Date().toISOString();

      // Create record
      const recordDraft: any = {
        patientId: targetPatientId,
        patientName: patientUser.fullName,
        patientDob: accountProfile?.dob || "",
        patientPhone: patientUser.phone || "",
        testDate,
        facility,
        performer: performer || (currentUser.role === "doctor" ? currentUser.fullName : "Kỹ thuật viên phòng khám"),
        imageUrl,
        indicators: formattedIndicators,
        doctorNotes: doctorNotes || "",
        doctorSignature: doctorSignature || "",
        savedAt,
        createdAt: savedAt,
      };

      // OCR chỉ nhập dữ liệu. Phân tích AI là chức năng riêng và chỉ chạy khi
      // người dùng chủ động yêu cầu ở đường dẫn /records/:id/analyze.
      recordDraft.aiAnalysis = "";

      const savedRecord = await BloodTestRecord.create(recordDraft);

      // Create Notification for the patient
      await Notification.create({
        userId: targetPatientId,
        title: "Có kết quả xét nghiệm mới 🩸",
        message: `Kết quả xét nghiệm ngày ${testDate} tại ${facility} đã được lưu sau khi kiểm tra OCR.`,
        type: "test_result",
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        message: "Lưu kết quả xét nghiệm thành công.",
        record: savedRecord,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get records of user
  async getHistory(req: Request, res: Response) {
    const user = (req as any).user;
    const { patientId } = req.query;

    try {
      let records = [];
      if (user.role === "patient") {
        // Patients can only see their own records
        records = await BloodTestRecord.find({ patientId: user._id });
      } else {
        // Doctors and admins can filter by patientId or see all
        if (patientId) {
          records = await BloodTestRecord.find({ patientId: String(patientId) });
        } else {
          records = await BloodTestRecord.find();
        }
      }

      // Kết quả vừa lưu luôn đứng trước; phiếu cũ vẫn tương thích qua createdAt/testDate.
      records.sort((a, b) => {
        const timeA = new Date(a.savedAt || a.createdAt || a.testDate).getTime();
        const timeB = new Date(b.savedAt || b.createdAt || b.testDate).getTime();
        return timeB - timeA;
      });

      res.json(records);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get specific record detail
  async getRecordDetail(req: Request, res: Response) {
    const { id } = req.params;
    const user = (req as any).user;

    try {
      const record = await BloodTestRecord.findById(id);
      if (!record) {
        return res.status(404).json({ message: "Không tìm thấy kết quả xét nghiệm." });
      }

      // Patients can only view their own
      if (user.role === "patient" && record.patientId !== user._id) {
        return res.status(403).json({ message: "Bạn không có quyền xem hồ sơ này." });
      }

      res.json(record);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update Doctor Notes & digital signature (Doctor/Admin only)
  async updateDoctorAssessment(req: Request, res: Response) {
    const { id } = req.params;
    const { doctorNotes, signReport } = req.body;
    const currentUser = (req as any).user;

    try {
      const record = await BloodTestRecord.findById(id);
      if (!record) {
        return res.status(404).json({ message: "Không tìm thấy kết quả xét nghiệm." });
      }

      const updateData: any = { doctorNotes };
      if (signReport) {
        // Create digital signature string
        updateData.doctorSignature = `SIGNED_BY_${encodeURIComponent(currentUser.fullName)}_${new Date().toISOString().split("T")[0]}`;
        updateData.performer = currentUser.fullName;
      }

      const updated = await BloodTestRecord.findByIdAndUpdate(id, updateData);

      // Notify patient of doctor assessment
      await Notification.create({
        userId: record.patientId,
        title: "Cập nhật đánh giá từ bác sĩ 🩺",
        message: `${currentUser.fullName} đã gửi nhận xét và ký số báo cáo xét nghiệm ngày ${record.testDate} của bạn.`,
        type: "health_alert",
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.json({
        message: "Cập nhật đánh giá y tế thành công.",
        record: updated,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Delete record (Admin only)
  async deleteRecord(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const result = await BloodTestRecord.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Không tìm thấy bản ghi để xóa." });
      }
      res.json({ message: "Xóa bản ghi xét nghiệm thành công." });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Request AI Health analysis regeneration
  async analyzeWithAI(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const record = await BloodTestRecord.findById(id);
      if (!record) {
        return res.status(404).json({ message: "Không tìm thấy kết quả xét nghiệm." });
      }

      const history = await BloodTestRecord.find({ patientId: record.patientId });
      const filteredHistory = history.filter(r => r._id !== id);
      const profile = await PatientProfile.findOne({ userId: record.patientId });

      const analysis = await generateAIHealthAnalysis(record, filteredHistory, profile);
      const updated = await BloodTestRecord.findByIdAndUpdate(id, { aiAnalysis: analysis });

      res.json({
        message: "Phân tích sức khỏe AI hoàn tất.",
        aiAnalysis: analysis,
        record: updated,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
};
