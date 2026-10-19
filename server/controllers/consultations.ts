import { Request, Response } from "express";
import { Consultation, Notification, BloodTestRecord, User, PatientProfile } from "../models/index.js";
import { getHealthAssistantResponse } from "../services/gemini.js";


export const consultationsController = {
  // Get active consultations list
  async getList(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      let list = [];
      if (user.role === "patient") {
        list = await Consultation.find({ patientId: user._id });
      } else if (user.role === "doctor") {
        list = await Consultation.find({ doctorId: user._id });
      } else {
        // Fallback or admin: only see consultations they participate in to preserve complete privacy
        const all = await Consultation.find();
        list = all.filter(c => c.patientId === user._id || c.doctorId === user._id);
      }

      // Sort by creation or last updated
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Start a new consultation
  async start(req: Request, res: Response) {
    const { doctorId, patientId } = req.body;
    const currentUser = (req as any).user;

    try {
      let patient, doctor;

      if (currentUser.role === "patient") {
        patient = currentUser;
        if (!doctorId) {
          return res.status(400).json({ message: "Vui lòng chọn bác sĩ tư vấn." });
        }
        doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== "doctor") {
          return res.status(404).json({ message: "Không tìm thấy thông tin bác sĩ." });
        }
      } else if (currentUser.role === "doctor") {
        doctor = currentUser;
        if (!patientId) {
          return res.status(400).json({ message: "Vui lòng chọn bệnh nhân để liên hệ." });
        }
        patient = await User.findById(patientId);
        if (!patient || patient.role !== "patient") {
          return res.status(404).json({ message: "Không tìm thấy thông tin bệnh nhân." });
        }
      } else {
        return res.status(403).json({ message: "Vai trò không hợp lệ để tạo cuộc tư vấn." });
      }

      // Check if active consultation already exists
      const existing = await Consultation.findOne({
        patientId: patient._id!,
        doctorId: doctor._id!,
        status: "active",
      });

      if (existing) {
        return res.json(existing);
      }

      const session = await Consultation.create({
        patientId: patient._id!,
        patientName: patient.fullName,
        doctorId: doctor._id!,
        doctorName: doctor.fullName,
        messages: [
          {
            senderId: currentUser._id!,
            senderName: currentUser.fullName,
            text: currentUser.role === "patient" 
              ? `Xin chào Bác sĩ ${doctor.fullName}. Tôi là ${patient.fullName}. Tôi cần tư vấn về kết quả xét nghiệm và các vấn đề sức khỏe của mình.`
              : `Xin chào ${patient.fullName}. Tôi là Bác sĩ ${doctor.fullName}. Tôi có thể xem kết quả xét nghiệm của bạn và giúp gì cho bạn hôm nay?`,
            timestamp: new Date().toISOString(),
          }
        ],
        status: "active",
        createdAt: new Date().toISOString(),
      });

      // Notify recipient
      const recipientId = currentUser.role === "patient" ? doctor._id! : patient._id!;
      const notifyMessage = currentUser.role === "patient"
        ? `Bệnh nhân ${patient.fullName} đã bắt đầu cuộc tư vấn trực tuyến với bạn.`
        : `Bác sĩ ${doctor.fullName} đã liên hệ tư vấn trực tuyến với bạn.`;

      await Notification.create({
        userId: recipientId,
        title: "Cuộc tư vấn mới 💬",
        message: notifyMessage,
        type: "message",
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json(session);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Send message inside consultation
  async sendMessage(req: Request, res: Response) {
    const { id } = req.params;
    const { text, fileUrl } = req.body;
    const currentUser = (req as any).user;

    if (!text && !fileUrl) {
      return res.status(400).json({ message: "Nội dung tin nhắn không được để trống." });
    }

    try {
      const session = await Consultation.findById(id);
      if (!session) {
        return res.status(404).json({ message: "Không tìm thấy phòng tư vấn." });
      }

      // Check privacy authorization
      if (session.patientId !== currentUser._id && session.doctorId !== currentUser._id) {
        return res.status(403).json({ message: "Bạn không có quyền truy cập cuộc tư vấn này." });
      }

      const newMessage = {
        senderId: currentUser._id!,
        senderName: currentUser.fullName,
        text: text || "",
        fileUrl,
        timestamp: new Date().toISOString(),
      };

      const messages = [...session.messages, newMessage];
      const updated = await Consultation.findByIdAndUpdate(id, { messages }, { new: true });

      // Notify recipient
      const recipientId = currentUser._id === session.patientId ? session.doctorId : session.patientId;
      await Notification.create({
        userId: recipientId,
        title: `Tin nhắn mới từ ${currentUser.fullName} ✉️`,
        message: text ? (text.length > 60 ? text.substring(0, 57) + "..." : text) : "Đã gửi một tệp đính kèm.",
        type: "message",
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Close consultation
  async close(req: Request, res: Response) {
    const { id } = req.params;
    const currentUser = (req as any).user;
    try {
      const session = await Consultation.findById(id);
      if (!session) {
        return res.status(404).json({ message: "Không tìm thấy phòng tư vấn." });
      }

      // Check privacy authorization
      if (session.patientId !== currentUser._id && session.doctorId !== currentUser._id) {
        return res.status(403).json({ message: "Bạn không có quyền đóng cuộc tư vấn này." });
      }

      const updated = await Consultation.findByIdAndUpdate(id, { status: "closed" });
      res.json({ message: "Đã đóng phòng tư vấn.", session: updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Independent Health Chatbot Assistant
  async chatWithAI(req: Request, res: Response) {
    const { message, history } = req.body;
    const currentUser = (req as any).user;

    if (!message) {
      return res.status(400).json({ message: "Vui lòng nhập câu hỏi." });
    }

    try {
      // Fetch blood records of the patient to give personalized context if applicable
      const records = await BloodTestRecord.find({ patientId: currentUser._id });

      // Fetch patient profile if applicable
      const profile = await PatientProfile.findOne({ userId: currentUser._id });

      // Call Gemini Virtual Chatbot service
      const reply = await getHealthAssistantResponse(message, history || [], records, profile);
      res.json({ reply });
    } catch (err: any) {
      res.status(500).json({ message: `Lỗi Chatbot AI: ${err.message}` });
    }
  }
};
