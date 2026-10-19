export type UserRole = "patient" | "doctor" | "admin";

export interface IUser {
  _id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  password?: string;
}

export interface IPatientProfile {
  _id: string;
  userId: string;
  fullName: string;
  dob: string;
  gender: string;
  bloodType: string;
  height: number;
  weight: number;
  medicalHistory: string[];
  allergies: string[];
  currentMedications: string[];
  updatedAt: string;
}

export interface IIndicator {
  value: number;
  refMin: number;
  refMax: number;
  unit: string;
  status: "normal" | "low" | "high";
  name: string;
}

export interface IBloodTestRecord {
  _id: string;
  patientId: string;
  patientName: string;
  patientDob?: string;
  patientPhone?: string;
  testDate: string;
  facility: string;
  performer: string;
  imageUrl?: string;
  indicators: Record<string, IIndicator>;
  aiAnalysis?: string;
  doctorNotes?: string;
  doctorSignature?: string;
  savedAt?: string;
  createdAt: string;
}

export interface IAppointment {
  _id: string;
  patientId: string;
  patientName: string;
  testType: string;
  facility: string;
  dateTime: string;
  atHome: boolean;
  address?: string;
  paymentStatus: "pending" | "paid";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface IMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  fileUrl?: string;
}

export interface IConsultation {
  _id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  messages: IMessage[];
  status: "active" | "closed";
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "health_alert" | "test_result" | "appointment" | "message" | "system";
  read: boolean;
  createdAt: string;
}

export interface IArticle {
  _id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  author: string;
  imageUrl?: string;
  tags?: string[];
  readingMinutes?: number;
  featured?: boolean;
  sourceLabel?: string;
  sourceUrl?: string;
  createdAt: string;
}
