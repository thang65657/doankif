import { Request, Response } from "express";
import { User, PatientProfile } from "../models/index.js";

// Helper to encode a simple session token
export function generateToken(userId: string, role: string): string {
  const payload = { userId, role, timestamp: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

// Helper to decode a token and verify
export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const json = Buffer.from(token, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    // Token valid for 24 hours
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    return { userId: parsed.userId, role: parsed.role };
  } catch (err) {
    return null;
  }
}

// Middleware to authorize roles
export function requireAuth(roles?: string[]) {
  return async (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có quyền truy cập. Vui lòng đăng nhập." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Phiên đăng nhập hết hạn hoặc không hợp lệ." });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại." });
    }

    if (roles && !roles.includes(user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này." });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  };
}

export const authController = {
  // Sign up user (patient, doctor, etc.)
  async register(req: Request, res: Response) {
    const { email, password, fullName, phone, role } = req.body;

    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin." });
    }

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email đã tồn tại trên hệ thống." });
      }

      const userRole = (role === "doctor" || role === "admin" || role === "patient") ? role : "patient";

      const newUser = await User.create({
        email,
        password, // For simulation we store directly
        role: userRole,
        fullName,
        phone,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
        createdAt: new Date().toISOString(),
      });

      // Create empty patient profile only for patients
      if (userRole === "patient") {
        await PatientProfile.create({
          userId: newUser._id!,
          fullName: newUser.fullName,
          dob: "",
          gender: "Nam",
          bloodType: "O",
          height: 170,
          weight: 60,
          medicalHistory: [],
          allergies: [],
          currentMedications: [],
          updatedAt: new Date().toISOString(),
        });
      }

      const token = generateToken(newUser._id!, newUser.role);
      res.status(201).json({
        token,
        user: {
          _id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          fullName: newUser.fullName,
          phone: newUser.phone,
          avatar: newUser.avatar,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Login for multi-roles
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu." });
    }

    try {
      const user = await User.findOne({ email });
      if (!user || user.password !== password) {
        return res.status(400).json({ message: "Email hoặc mật khẩu không chính xác." });
      }

      const token = generateToken(user._id!, user.role);
      res.json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone,
          avatar: user.avatar,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get current user and profile
  async getMe(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      let profile = null;
      if (user.role === "patient") {
        profile = await PatientProfile.findOne({ userId: user._id });
      }
      res.json({ user, profile });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update profile
  async updateProfile(req: Request, res: Response) {
    const user = (req as any).user;
    const { 
      fullName, 
      phone, 
      avatar,
      dob, 
      gender, 
      bloodType, 
      height, 
      weight, 
      medicalHistory, 
      allergies, 
      currentMedications,
      specialty,
      experience,
      workplace,
      bio
    } = req.body;

    try {
      // Update User collection
      const updatedUser = await User.findByIdAndUpdate(user._id, {
        fullName: fullName || user.fullName,
        phone: phone || user.phone,
        avatar: avatar !== undefined ? avatar : user.avatar,
        specialty: specialty !== undefined ? specialty : user.specialty,
        experience: experience !== undefined ? experience : user.experience,
        workplace: workplace !== undefined ? workplace : user.workplace,
        bio: bio !== undefined ? bio : user.bio,
      }, { new: true });

      let updatedProfile = null;
      if (user.role === "patient") {
        const existingProfile = await PatientProfile.findOne({ userId: user._id });
        if (existingProfile) {
          updatedProfile = await PatientProfile.findByIdAndUpdate(existingProfile._id!, {
            fullName: fullName || existingProfile.fullName,
            dob: dob !== undefined ? dob : existingProfile.dob,
            gender: gender !== undefined ? gender : existingProfile.gender,
            bloodType: bloodType !== undefined ? bloodType : existingProfile.bloodType,
            height: height !== undefined ? Number(height) : existingProfile.height,
            weight: weight !== undefined ? Number(weight) : existingProfile.weight,
            medicalHistory: medicalHistory !== undefined ? medicalHistory : existingProfile.medicalHistory,
            allergies: allergies !== undefined ? allergies : existingProfile.allergies,
            currentMedications: currentMedications !== undefined ? currentMedications : existingProfile.currentMedications,
            updatedAt: new Date().toISOString(),
          }, { new: true });
        }
      }

      res.json({
        message: "Cập nhật hồ sơ thành công.",
        user: {
          _id: updatedUser?._id,
          email: updatedUser?.email,
          role: updatedUser?.role,
          fullName: updatedUser?.fullName,
          phone: updatedUser?.phone,
          avatar: updatedUser?.avatar,
          specialty: updatedUser?.specialty,
          experience: updatedUser?.experience,
          workplace: updatedUser?.workplace,
          bio: updatedUser?.bio,
        },
        profile: updatedProfile,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get profile of another user
  async getUserProfile(req: Request, res: Response) {
    const { userId } = req.params;
    try {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng." });
      }

      let profile = null;
      if (targetUser.role === "patient") {
        profile = await PatientProfile.findOne({ userId: targetUser._id });
      }

      res.json({
        user: {
          _id: targetUser._id,
          email: targetUser.email,
          role: targetUser.role,
          fullName: targetUser.fullName,
          phone: targetUser.phone,
          avatar: targetUser.avatar,
          specialty: targetUser.specialty,
          experience: targetUser.experience,
          workplace: targetUser.workplace,
          bio: targetUser.bio,
        },
        profile,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // Change password / security
  async changePassword(req: Request, res: Response) {
    const user = (req as any).user;
    const currentPassword = req.body.currentPassword || req.body.oldPassword;
    const { newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập mật khẩu cũ và mật khẩu mới." });
    }

    try {
      const dbUser = await User.findById(user._id);
      if (!dbUser || dbUser.password !== currentPassword) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
      }

      await User.findByIdAndUpdate(user._id, { password: newPassword });
      res.json({ message: "Thay đổi mật khẩu thành công." });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
};
