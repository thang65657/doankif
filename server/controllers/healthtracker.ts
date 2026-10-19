import { Request, Response } from "express";
import { Medication, DietRegime, MedicationLog, BloodTestRecord, PatientProfile } from "../models/index.js";
import { generateAIHealthTrackerSuggestions } from "../services/gemini.js";

export const healthTrackerController = {
  // -----------------------------------------------------------------
  // MEDICATIONS MANAGEMENT
  // -----------------------------------------------------------------
  async getMedications(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const list = await Medication.find({ userId: user._id });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async addMedication(req: Request, res: Response) {
    const user = (req as any).user;
    const { name, dosage, frequency, times, startDate, endDate, instructions, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Vui lòng cung cấp tên thuốc." });
    }

    try {
      const medication = await Medication.create({
        userId: user._id,
        name,
        dosage: dosage || "",
        frequency: frequency || "1 lần/ngày",
        times: times || ["08:00"],
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate: endDate || "",
        instructions: instructions || "",
        isActive: isActive !== false,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        message: "Thêm thuốc thành công.",
        medication,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async updateMedication(req: Request, res: Response) {
    const { id } = req.params;
    const user = (req as any).user;

    try {
      const medication = await Medication.findById(id);
      if (!medication) {
        return res.status(404).json({ message: "Không tìm thấy thuốc." });
      }

      if (medication.userId !== user._id && user.role !== "admin") {
        return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa thuốc này." });
      }

      const updated = await Medication.findByIdAndUpdate(id, req.body);
      res.json({
        message: "Cập nhật thông tin thuốc thành công.",
        medication: updated,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async deleteMedication(req: Request, res: Response) {
    const { id } = req.params;
    const user = (req as any).user;

    try {
      const medication = await Medication.findById(id);
      if (!medication) {
        return res.status(404).json({ message: "Không tìm thấy thuốc." });
      }

      if (medication.userId !== user._id && user.role !== "admin") {
        return res.status(403).json({ message: "Bạn không có quyền xóa thuốc này." });
      }

      await Medication.deleteOne({ _id: id });
      // Clean up logs for this medication
      await MedicationLog.deleteMany({ medicationId: id });

      res.json({ message: "Xóa thuốc thành công." });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // -----------------------------------------------------------------
  // MEDICATION INTAKE LOGS (LOGGING TODAY'S PILLS)
  // -----------------------------------------------------------------
  async getMedicationLogs(req: Request, res: Response) {
    const user = (req as any).user;
    const { date } = req.query; // Expects YYYY-MM-DD
    const targetDate = (date as string) || new Date().toISOString().split("T")[0];

    try {
      const logs = await MedicationLog.find({ userId: user._id, date: targetDate });
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async logMedication(req: Request, res: Response) {
    const user = (req as any).user;
    const { medicationId } = req.params;
    const { timeSlot, date, taken } = req.body; // taken is boolean, date is "YYYY-MM-DD", timeSlot is e.g. "08:00"

    if (!timeSlot || !date) {
      return res.status(400).json({ message: "Thiếu thời gian hoặc ngày ghi nhận." });
    }

    try {
      if (taken) {
        // Prevent duplicate logs
        const existing = await MedicationLog.findOne({ userId: user._id, medicationId, date, timeSlot });
        if (!existing) {
          const med = await Medication.findById(medicationId);
          await MedicationLog.create({
            userId: user._id,
            medicationId,
            medicationName: med ? med.name : "Thuốc bổ sung",
            timeSlot,
            date,
            takenAt: new Date().toISOString(),
          });
        }
      } else {
        await MedicationLog.deleteMany({ userId: user._id, medicationId, date, timeSlot });
      }

      res.json({ message: "Cập nhật trạng thái uống thuốc thành công." });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // -----------------------------------------------------------------
  // DIET REGIMES MANAGEMENT
  // -----------------------------------------------------------------
  async getDiets(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const list = await DietRegime.find({ userId: user._id });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async addDiet(req: Request, res: Response) {
    const user = (req as any).user;
    const { title, description, meals, notes, isCustom } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Vui lòng nhập tiêu đề chế độ dinh dưỡng." });
    }

    try {
      const diet = await DietRegime.create({
        userId: user._id,
        title,
        description: description || "",
        meals: meals || { breakfast: "", lunch: "", dinner: "", snacks: "" },
        notes: notes || "",
        isCustom: isCustom !== false,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        message: "Thêm chế độ dinh dưỡng thành công.",
        diet,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async updateDiet(req: Request, res: Response) {
    const { id } = req.params;
    const user = (req as any).user;

    try {
      const diet = await DietRegime.findById(id);
      if (!diet) {
        return res.status(404).json({ message: "Không tìm thấy chế độ ăn." });
      }

      if (diet.userId !== user._id && user.role !== "admin") {
        return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa chế độ ăn này." });
      }

      const updated = await DietRegime.findByIdAndUpdate(id, req.body);
      res.json({
        message: "Cập nhật chế độ dinh dưỡng thành công.",
        diet: updated,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async deleteDiet(req: Request, res: Response) {
    const { id } = req.params;
    const user = (req as any).user;

    try {
      const diet = await DietRegime.findById(id);
      if (!diet) {
        return res.status(404).json({ message: "Không tìm thấy chế độ dinh dưỡng." });
      }

      if (diet.userId !== user._id && user.role !== "admin") {
        return res.status(403).json({ message: "Bạn không có quyền xóa chế độ dinh dưỡng này." });
      }

      await DietRegime.deleteOne({ _id: id });
      res.json({ message: "Xóa chế độ dinh dưỡng thành công." });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // -----------------------------------------------------------------
  // GEMINI AI SUGGESTIONS
  // -----------------------------------------------------------------
  async getAISuggestions(req: Request, res: Response) {
    const user = (req as any).user;

    try {
      // Find the user's latest blood test record
      const records = await BloodTestRecord.find({ patientId: user._id });
      records.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
      const latestRecord = records[0] || null;

      // Find user profile
      const profile = await PatientProfile.findOne({ userId: user._id });

      // Run AI Generator
      const suggestions = await generateAIHealthTrackerSuggestions(latestRecord, profile);
      res.json(suggestions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
};
