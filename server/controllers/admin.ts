import { Request, Response } from "express";
import { User, BloodTestRecord, Appointment, Consultation, Notification, Article } from "../models/index.js";

export const adminController = {
  // Stats Dashboard
  async getDashboardStats(req: Request, res: Response) {
    try {
      const allUsers = await User.find();
      const patientCount = allUsers.filter(u => u.role === "patient").length;
      const doctorCount = allUsers.filter(u => u.role === "doctor").length;
      
      const records = await BloodTestRecord.find();
      const appointments = await Appointment.find();
      const consultations = await Consultation.find();

      // Calculate ratios / totals
      const totalTests = records.length;
      const totalAppointments = appointments.length;
      const activeChats = consultations.filter(c => c.status === "active").length;

      // Group records by month for dashboard chart
      const monthlyData: { [key: string]: number } = {};
      records.forEach(r => {
        if (r.testDate) {
          const month = r.testDate.substring(0, 7); // YYYY-MM
          monthlyData[month] = (monthlyData[month] || 0) + 1;
        }
      });

      const charts = Object.keys(monthlyData).map(m => ({
        month: m,
        count: monthlyData[m]
      })).sort((a, b) => a.month.localeCompare(b.month));

      res.json({
        users: {
          total: allUsers.length,
          patients: patientCount,
          doctors: doctorCount,
        },
        stats: {
          totalTests,
          totalAppointments,
          activeChats,
        },
        charts,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get users lists (Admin can manage doctors or patients)
  async getUsers(req: Request, res: Response) {
    const { role } = req.query;
    const currentUser = (req as any).user;
    try {
      if (currentUser.role === "patient" && role !== "doctor") {
        return res.status(403).json({ message: "Bạn chỉ có quyền tìm kiếm thông tin bác sĩ." });
      }

      let users = [];
      if (role) {
        users = await User.find({ role: role as any });
      } else {
        users = await User.find();
      }

      // Hide passwords before sending (except for admin who can see password)
      const sanitized = users.map(u => ({
        _id: u._id,
        email: u.email,
        role: u.role,
        fullName: u.fullName,
        phone: u.phone,
        avatar: u.avatar,
        createdAt: u.createdAt,
        password: currentUser.role === "admin" ? u.password : undefined,
      }));

      res.json(sanitized);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Create new user (e.g. Admin adding a Doctor)
  async createUser(req: Request, res: Response) {
    const { email, password, role, fullName, phone } = req.body;

    if (!email || !password || !role || !fullName || !phone) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin." });
    }

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email này đã tồn tại trên hệ thống." });
      }

      const created = await User.create({
        email,
        password,
        role,
        fullName,
        phone,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        message: "Tạo tài khoản thành công.",
        user: {
          _id: created._id,
          email: created.email,
          role: created.role,
          fullName: created.fullName,
          phone: created.phone,
          avatar: created.avatar,
        }
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Delete user (Admin only)
  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản." });
      }

      if (user.role === "admin") {
        return res.status(400).json({ message: "Không thể xóa tài khoản Quản Trị Viên hệ thống." });
      }

      await User.deleteOne({ _id: id });
      res.json({ message: "Xóa tài khoản thành công." });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update user role (Admin only)
  async updateUserRole(req: Request, res: Response) {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["patient", "doctor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ." });
    }

    try {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản." });
      }

      const updated = await User.findByIdAndUpdate(id, { role });

      res.json({
        message: "Cập nhật vai trò tài khoản thành công.",
        user: {
          _id: updated?._id,
          email: updated?.email,
          role,
          fullName: updated?.fullName,
        }
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Fetch articles (Health knowledge)
  async getArticles(req: Request, res: Response) {
    try {
      const list = await Article.find();
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Create article (Admin/Doctor)
  async createArticle(req: Request, res: Response) {
    const { title, category, summary, content, imageUrl } = req.body;
    const author = (req as any).user.fullName;

    if (!title || !category || !summary || !content) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin bài viết." });
    }

    try {
      const article = await Article.create({
        title,
        category,
        summary,
        content,
        author,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600",
        tags: [category],
        readingMinutes: Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 220)),
        featured: false,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        message: "Tạo bài viết thành công.",
        article,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Fetch notifications for a user
  async getNotifications(req: Request, res: Response) {
    const currentUser = (req as any).user;
    try {
      const notifications = await Notification.find({ userId: currentUser._id });
      // Sort by newest first
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(notifications);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Mark notification as read
  async markNotificationRead(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const updated = await Notification.findByIdAndUpdate(id, { read: true });
      res.json({ message: "Đã đánh dấu đã đọc.", notification: updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Mark all read
  async markAllRead(req: Request, res: Response) {
    const currentUser = (req as any).user;
    try {
      const list = await Notification.find({ userId: currentUser._id });
      for (const notif of list) {
        if (!notif.read) {
          await Notification.findByIdAndUpdate(notif._id!, { read: true });
        }
      }
      res.json({ message: "Đã đánh dấu đã đọc toàn bộ thông báo." });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
};
