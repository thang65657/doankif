import { Request, Response } from "express";
import { Appointment, Notification, User } from "../models/index.js";

export const appointmentsController = {
  // Book an appointment (Patient)
  async book(req: Request, res: Response) {
    const { testType, facility, dateTime, atHome, address } = req.body;
    const currentUser = (req as any).user;

    if (!testType || !facility || !dateTime) {
      return res.status(400).json({ message: "Vui lòng chọn loại xét nghiệm, cơ sở và thời gian." });
    }

    try {
      const appointment = await Appointment.create({
        patientId: currentUser._id!,
        patientName: currentUser.fullName,
        testType,
        facility,
        dateTime,
        atHome: !!atHome,
        address: atHome ? address : "",
        paymentStatus: "pending",
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      // Notify system / admins
      await Notification.create({
        userId: currentUser._id!,
        title: "Đặt lịch thành công 📅",
        message: `Lịch hẹn khám "${testType}" tại ${facility} đang chờ xác nhận từ cơ sở y tế.`,
        type: "appointment",
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        message: "Đặt lịch xét nghiệm thành công.",
        appointment,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get appointments list (Patient sees their own, doctor/admin sees all or filtered)
  async getList(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      let appointments = [];
      if (user.role === "patient") {
        appointments = await Appointment.find({ patientId: user._id });
      } else {
        appointments = await Appointment.find();
      }

      // Sort by dateTime ascending (nearest first)
      appointments.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      res.json(appointments);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Cancel appointment
  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const user = (req as any).user;

    try {
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ message: "Không tìm thấy lịch hẹn." });
      }

      // Security check: patients can only cancel their own
      if (user.role === "patient" && appointment.patientId !== user._id) {
        return res.status(403).json({ message: "Bạn không có quyền hủy lịch hẹn này." });
      }

      const updated = await Appointment.findByIdAndUpdate(id, { status: "cancelled" });

      // Notify patient of cancellation
      await Notification.create({
        userId: appointment.patientId,
        title: "Đã hủy lịch hẹn ❌",
        message: `Lịch hẹn khám ngày ${new Date(appointment.dateTime).toLocaleDateString("vi-VN")} của bạn đã bị hủy thành công.`,
        type: "appointment",
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.json({
        message: "Hủy lịch hẹn thành công.",
        appointment: updated,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Pay for appointment (Online payment simulation)
  async pay(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ message: "Không tìm thấy lịch hẹn." });
      }

      const updated = await Appointment.findByIdAndUpdate(id, { paymentStatus: "paid" });

      await Notification.create({
        userId: appointment.patientId,
        title: "Thanh toán thành công 💳",
        message: `Hóa đơn cho lịch hẹn xét nghiệm ngày ${new Date(appointment.dateTime).toLocaleDateString("vi-VN")} đã được thanh toán trực tuyến thành công.`,
        type: "system",
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.json({
        message: "Thanh toán thành công.",
        appointment: updated,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update status (Doctor/Admin only)
  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body; // 'confirmed', 'completed', 'cancelled'

    try {
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ message: "Không tìm thấy lịch hẹn." });
      }

      const updated = await Appointment.findByIdAndUpdate(id, { status });

      let emoji = "📅";
      if (status === "confirmed") emoji = "✅";
      if (status === "completed") emoji = "🎉";
      if (status === "cancelled") emoji = "❌";

      // Create notification
      await Notification.create({
        userId: appointment.patientId,
        title: `Cập nhật trạng thái lịch hẹn ${emoji}`,
        message: `Lịch hẹn khám tại ${appointment.facility} của bạn đã chuyển sang trạng thái: ${status === 'confirmed' ? 'Đã xác nhận' : status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}.`,
        type: "appointment",
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.json({
        message: "Cập nhật trạng thái thành công.",
        appointment: updated,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
};
