import { MongooseModel } from "./db.js";

// User Roles
export type UserRole = "patient" | "doctor" | "admin";

// User Interface
export interface IUser {
  _id?: string;
  email: string;
  password?: string;
  role: UserRole;
  fullName: string;
  phone: string;
  avatar?: string;
  specialty?: string;
  experience?: string;
  workplace?: string;
  bio?: string;
  createdAt: string;
}

// PatientProfile Interface
export interface IPatientProfile {
  _id?: string;
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

// Blood Test Indicator
export interface IIndicator {
  value: number;
  refMin: number;
  refMax: number;
  unit: string;
  status: "normal" | "low" | "high";
  name: string;
}

// BloodTestRecord Interface
export interface IBloodTestRecord {
  _id?: string;
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

// Appointment Interface
export interface IAppointment {
  _id?: string;
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

// Consultation Interface
export interface IMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  fileUrl?: string;
}

export interface IConsultation {
  _id?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  messages: IMessage[];
  status: "active" | "closed";
  createdAt: string;
}

// Notification Interface
export interface INotification {
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: "health_alert" | "test_result" | "appointment" | "message" | "system";
  read: boolean;
  createdAt: string;
}

// Article Interface
export interface IArticle {
  _id?: string;
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

// Medication Interface
export interface IMedication {
  _id?: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[]; // e.g., ["08:00", "20:00"]
  startDate?: string;
  endDate?: string;
  instructions?: string;
  isActive: boolean;
  createdAt: string;
}

// Diet Regime Interface
export interface IDietRegime {
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
  createdAt: string;
}

// Medication Log Interface (for tracking intake)
export interface IMedicationLog {
  _id?: string;
  userId: string;
  medicationId: string;
  medicationName: string;
  timeSlot: string; // e.g. "08:00"
  date: string; // "YYYY-MM-DD"
  takenAt: string; // ISO String
}

// Export Mongoose-like models
export const User = new MongooseModel<IUser>("users");
export const PatientProfile = new MongooseModel<IPatientProfile>("patient_profiles");
export const BloodTestRecord = new MongooseModel<IBloodTestRecord>("blood_test_records");
export const Appointment = new MongooseModel<IAppointment>("appointments");
export const Consultation = new MongooseModel<IConsultation>("consultations");
export const Notification = new MongooseModel<INotification>("notifications");
export const Article = new MongooseModel<IArticle>("articles");
export const Medication = new MongooseModel<IMedication>("medications");
export const DietRegime = new MongooseModel<IDietRegime>("diet_regimes");
export const MedicationLog = new MongooseModel<IMedicationLog>("medication_logs");

// Database Seed function
export async function seedDatabase() {
  // 1. Seed Users
  const existingUsers = await User.find();
  if (existingUsers.length === 0) {
    console.log("Seeding initial users...");
    // Patient
    const patient = await User.create({
      email: "patient@healthtech.vn",
      password: "password123", // easy-to-use default password
      role: "patient",
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      createdAt: new Date().toISOString(),
    });

    // Patient profile
    await PatientProfile.create({
      userId: patient._id!,
      fullName: "Nguyễn Văn A",
      dob: "1990-05-15",
      gender: "Nam",
      bloodType: "O+",
      height: 172,
      weight: 68,
      medicalHistory: ["Huyết áp thấp nhẹ", "Đau dạ dày"],
      allergies: ["Penicillin", "Hải sản"],
      currentMedications: ["Nghệ mật ong"],
      updatedAt: new Date().toISOString(),
    });

    // Doctor
    const doctor = await User.create({
      email: "doctor@healthtech.vn",
      password: "password123",
      role: "doctor",
      fullName: "BS. Trần Thị B",
      phone: "0912345678",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150",
      specialty: "Nội khoa & Xét nghiệm sinh hóa",
      experience: "10 năm kinh nghiệm",
      workplace: "Bệnh Viện Đa Khoa MedLatec",
      bio: "Chuyên môn sâu về đọc và phân tích kết quả xét nghiệm máu, chẩn đoán mỡ máu, tiểu đường và các bệnh lý về gan mật.",
      createdAt: new Date().toISOString(),
    });

    // Admin
    await User.create({
      email: "admin@healthtech.vn",
      password: "password123",
      role: "admin",
      fullName: "Quản Trị Viên Hệ Thống",
      phone: "0988888888",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150",
      createdAt: new Date().toISOString(),
    });

    // Seed a standard Blood Test Record for the Patient
    await BloodTestRecord.create({
      patientId: patient._id!,
      patientName: patient.fullName,
      testDate: "2026-06-10",
      facility: "Phòng Khám Đa Khoa MedLatec",
      performer: "BS. Trần Thị B",
      indicators: {
        rbc: { value: 4.8, refMin: 4.2, refMax: 5.9, unit: "T/L", status: "normal", name: "Hồng cầu (RBC)" },
        wbc: { value: 6.5, refMin: 4.0, refMax: 10.0, unit: "G/L", status: "normal", name: "Bạch cầu (WBC)" },
        plt: { value: 245, refMin: 150, refMax: 400, unit: "G/L", status: "normal", name: "Tiểu cầu (PLT)" },
        hgb: { value: 142, refMin: 120, refMax: 165, unit: "g/L", status: "normal", name: "Hemoglobin (HGB)" },
        glucose: { value: 5.4, refMin: 3.9, refMax: 6.4, unit: "mmol/L", status: "normal", name: "Đường huyết" },
        cholesterol: { value: 5.8, refMin: 3.6, refMax: 5.2, unit: "mmol/L", status: "high", name: "Cholesterol toàn phần" },
        ast: { value: 28, refMin: 5, refMax: 40, unit: "U/L", status: "normal", name: "Men gan AST (SGOT)" },
        alt: { value: 42, refMin: 5, refMax: 41, unit: "U/L", status: "high", name: "Men gan ALT (SGPT)" },
      },
      aiAnalysis: "Chỉ số Cholesterol toàn phần (5.8 mmol/L) và Men gan ALT (42 U/L) hiện tại đang ở mức cao hơn so với bình thường. Điều này cảnh báo nguy cơ mỡ máu tăng và gan đang phải làm việc quá tải. Bạn nên hạn chế thức ăn nhiều dầu mỡ, đồ chiên rán, rượu bia và bổ sung nhiều chất xơ, uống đủ nước. Tiếp tục theo dõi và tập thể dục đều đặn.",
      doctorNotes: "Bệnh nhân có men gan và mỡ máu tăng nhẹ. Cần điều chỉnh chế độ ăn giảm bớt mỡ động vật và hạn chế rượu bia. Tái khám sau 3 tháng để kiểm tra lại các chỉ số này.",
      doctorSignature: "BS_Tran_Thi_B_Digitally_Signed_2026-06-10",
      createdAt: new Date().toISOString(),
    });

    // Seed default Appointment
    await Appointment.create({
      patientId: patient._id!,
      patientName: patient.fullName,
      testType: "Xét nghiệm Tổng quát 12 chỉ số",
      facility: "Bệnh Viện Đa Khoa MedLatec",
      dateTime: "2026-07-20T08:00:00.000Z",
      atHome: true,
      address: "123 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội",
      paymentStatus: "paid",
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });

    // Seed a live Consultation
    await Consultation.create({
      patientId: patient._id!,
      patientName: patient.fullName,
      doctorId: doctor._id!,
      doctorName: doctor.fullName,
      status: "active",
      messages: [
        {
          senderId: patient._id!,
          senderName: patient.fullName,
          text: "Xin chào bác sĩ, tôi vừa tải lên kết quả xét nghiệm máu gần đây. Bác sĩ xem giúp tôi chỉ số cholesterol cao như vậy có nguy hiểm không ạ?",
          timestamp: "2026-06-11T09:00:00.000Z"
        },
        {
          senderId: doctor._id!,
          senderName: doctor.fullName,
          text: "Chào anh A. Tôi đã xem qua kết quả của anh. Chỉ số cholesterol ở mức 5.8 mmol/L là hơi cao nhẹ so với tiêu chuẩn (dưới 5.2). Hiện tại chưa ở mức quá nguy hiểm nhưng anh cần chú ý ăn uống lành mạnh hơn, bớt ăn lòng lợn, mỡ động vật nhé.",
          timestamp: "2026-06-11T09:15:00.000Z"
        },
        {
          senderId: patient._id!,
          senderName: patient.fullName,
          text: "Dạ vâng thưa bác sĩ, tôi sẽ điều chỉnh chế độ ăn uống. Cảm ơn bác sĩ nhiều!",
          timestamp: "2026-06-11T09:30:00.000Z"
        }
      ],
      createdAt: new Date().toISOString(),
    });

    // Seed default notifications
    await Notification.create({
      userId: patient._id!,
      title: "Kết quả xét nghiệm mới",
      message: "Kết quả xét nghiệm ngày 10/06/2026 của bạn đã có trên hệ thống. AI đã hoàn tất phân tích sức khỏe.",
      type: "test_result",
      read: false,
      createdAt: new Date().toISOString(),
    });

    await Notification.create({
      userId: patient._id!,
      title: "Nhắc lịch hẹn xét nghiệm",
      message: "Lịch hẹn lấy mẫu xét nghiệm tại nhà của bạn được lên lịch vào 08:00 sáng ngày 20/07/2026.",
      type: "appointment",
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Seed default medication for patient
    await Medication.create({
      userId: patient._id!,
      name: "Atorvastatin (Thuốc điều trị mỡ máu)",
      dosage: "10mg (1 viên)",
      frequency: "1 lần/ngày",
      times: ["21:00"],
      startDate: "2026-06-10",
      endDate: "2026-09-10",
      instructions: "Uống sau khi ăn tối, hạn chế rượu bia.",
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    // Seed default diet regime for patient
    await DietRegime.create({
      userId: patient._id!,
      title: "Chế độ dinh dưỡng giảm cholesterol & mỡ gan nhẹ",
      description: "Thực đơn dinh dưỡng giàu chất xơ hòa tan, chất béo không bão hòa và omega-3 giúp phục hồi tế bào gan và làm giảm cholesterol có hại.",
      meals: {
        breakfast: "Cháo yến mạch nấu chín với sữa đậu nành không đường và 1 quả táo cắt lát.",
        lunch: "Cá thu áp chảo (150g) xốt cà chua, bông cải xanh luộc, và 1 bát cơm gạo lứt.",
        dinner: "Ức gà luộc xé phay trộn hành tây rau thơm, súp lơ trắng hấp, và súp bí đỏ.",
        snacks: "Hạt hạnh nhân sấy (khoảng 10 hạt) và 1 cốc nước ép bưởi vào bữa phụ chiều 15:00."
      },
      notes: "Cần đảm bảo uống đủ 2 - 2.5 lít nước mỗi ngày. Kiêng hoàn toàn nội tạng động vật, thịt mỡ heo/bò, đồ chiên rán xào nhiều dầu mỡ, bia rượu và nước ngọt có ga.",
      isCustom: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Seed Articles (Health Knowledge Hub)
  const existingArticles = await Article.find();
  if (existingArticles.length === 0) {
    console.log("Seeding health articles...");
    await Article.create({
      title: "Cách Đọc Hiểu Chỉ Số Xét Nghiệm Máu Phổ Biến",
      category: "Hướng dẫn",
      summary: "Tìm hiểu ý nghĩa của các chỉ số hồng cầu (RBC), bạch cầu (WBC), tiểu cầu (PLT) và glucose trong máu để chủ động bảo vệ sức khỏe.",
      content: `Xét nghiệm máu là một trong những chỉ định cận lâm sàng quan trọng nhất giúp bác sĩ chẩn đoán và theo dõi nhiều tình trạng bệnh lý. Tuy nhiên, khi nhận được phiếu kết quả, không ít người cảm thấy bối rối trước hàng loạt ký hiệu viết tắt và con số phức tạp. Dưới đây là cách đọc hiểu các chỉ số máu cơ bản nhất:

### 1. Dòng hồng cầu (RBC - Red Blood Cell)
- **RBC (Số lượng hồng cầu):** Giá trị bình thường khoảng 3.8 - 5.8 T/L. Hồng cầu chứa huyết sắc tố giúp vận chuyển oxy từ phổi đến khắp các cơ quan. Chỉ số này giảm trong bệnh thiếu máu hoặc mất máu, tăng trong tình trạng mất nước hoặc đa hồng cầu.
- **HGB (Hemoglobin):** Huyết sắc tố, giá trị chuẩn 120 - 165 g/L. Đây là chỉ số chính xác nhất để chẩn đoán tình trạng thiếu máu.
- **HCT (Hematocrit):** Tỷ thể tích hồng cầu, cho biết tỷ lệ thể tích hồng cầu trên toàn bộ thể tích máu.

### 2. Dòng bạch cầu (WBC - White Blood Cell)
- **WBC (Số lượng bạch cầu):** Bình thường dao động từ 4.0 - 10.0 G/L. Bạch cầu đóng vai trò như hệ thống phòng thủ của cơ thể trước virus, vi khuẩn xâm nhập. Bạch cầu tăng cao là dấu hiệu cơ thể đang bị nhiễm trùng cấp, viêm hoặc các bệnh lý tủy xương. Bạch cầu giảm khi suy giảm miễn dịch, nhiễm virus nặng hoặc nhiễm độc hóa chất.

### 3. Dòng tiểu cầu (PLT - Platelet)
- **PLT (Số lượng tiểu cầu):** Bình thường từ 150 - 400 G/L. Tiểu cầu tham gia tích cực vào quá trình đông cầm máu. PLT quá thấp dẫn đến nguy cơ xuất huyết, bầm tím dưới da hoặc chảy máu chân răng khó cầm. PLT quá cao dễ hình thành các cục máu đông gây tắc nghẽn mạch máu.

### 4. Các chỉ số Sinh hóa quan trọng
- **Glucose (Đường huyết):** Phản ánh nồng độ đường trong máu lúc đói, bình thường từ 3.9 - 6.4 mmol/L. Nếu vượt quá giới hạn này, bạn cần kiểm tra nguy cơ đái tháo đường.
- **Cholesterol toàn phần:** Lượng mỡ máu tổng thể, bình thường dưới 5.2 mmol/L. Cholesterol cao liên quan trực tiếp đến xơ vữa động mạch và đột quỵ.
- **AST và ALT (Men gan):** Phản ánh hoạt động của gan. Chỉ số bình thường dưới 40 U/L. Khi gan bị tổn thương (do viêm gan, rượu bia, ngộ độc thuốc), men gan sẽ phóng thích vào máu làm chỉ số này tăng vọt.

Hãy lưu giữ các kết quả xét nghiệm qua nhiều năm để xây dựng biểu đồ theo dõi sức khỏe dài hạn của bạn!`,
      author: "BS. Trần Thị B",
      imageUrl: "https://images.unsplash.com/photo-1579152181111-2da552f137e7?auto=format&fit=crop&q=80&w=600",
      createdAt: new Date().toISOString(),
    });

    await Article.create({
      title: "Chế Độ Ăn Uống Cho Người Có Cholesterol Cao",
      category: "Dinh dưỡng",
      summary: "Mỡ máu cao là nguyên nhân dẫn đến nhiều bệnh tim mạch nguy hiểm. Làm thế nào để hạ chỉ số cholesterol một cách tự nhiên thông qua chế độ ăn?",
      content: `Nếu kết quả xét nghiệm máu cho thấy chỉ số Cholesterol toàn phần của bạn vượt mức 5.2 mmol/L hoặc LDL-Cholesterol (mỡ xấu) tăng cao, việc thay đổi lối sống và dinh dưỡng là bước đi đầu tiên vô cùng thiết yếu.

### Những thực phẩm NÊN TRÁNH hoặc HẠN CHẾ:
1. **Mỡ động vật và nội tạng:** Óc, lòng lợn, gan, dạ dày bò chứa lượng mỡ bão hòa cực lớn, làm gan tăng sản sinh cholesterol có hại.
2. **Đồ chiên rán, đồ ăn nhanh:** Các món khoai tây chiên, gà rán sử dụng dầu mỡ chiên đi chiên lại chứa nhiều chất béo chuyển hóa (trans fat) gây xơ cứng động mạch.
3. **Thịt đỏ nhiều mỡ:** Thịt bò mỡ, thịt heo ba chỉ nên được giới hạn thay vào đó là thịt gia cầm bỏ da hoặc cá hồi, cá trích giàu Omega-3.
4. **Sữa nguyên kem và bơ động vật.**

### Những thực phẩm NÊN TĂNG CƯỜNG:
1. **Chất xơ hòa tan:** Có nhiều trong yến mạch, các loại đậu (đậu nành, đậu xanh, đậu đen), táo, lê. Chất xơ hòa tan hoạt động như một thỏi nam châm hút cholesterol dư thừa trong đường tiêu hóa và đẩy ra ngoài cơ thể.
2. **Chất béo không bão hòa đơn:** Dầu oliu, quả bơ, hạt điều, hạt hạnh nhân. Chúng giúp tăng HDL-Cholesterol (mỡ tốt) bảo vệ thành mạch.
3. **Cá béo:** Ăn cá 2-3 lần một tuần để bổ sung Omega-3 giảm mỡ máu triglyceride và ngăn chặn xơ vữa.
4. **Trà xanh và tỏi:** Giúp giảm oxy hóa cholesterol có hại, bảo vệ mạch tim dẻo dai.

Hãy rèn luyện thói quen đi bộ 30 phút mỗi ngày và tái khám xét nghiệm định kỳ mỗi 6 tháng để kiểm soát mỡ máu hiệu quả!`,
      author: "BS. Nguyễn Minh Đức",
      imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=600",
      createdAt: new Date().toISOString(),
    });
  }

  // Bổ sung các bài còn thiếu cho cả dữ liệu mới và dữ liệu đã được tạo từ phiên bản cũ.
  const additionalArticles: Array<Omit<IArticle, "_id" | "createdAt">> = [
    {
      title: "RBC, HGB và HCT: Ba chỉ số liên quan đến hồng cầu",
      category: "Chỉ số máu",
      summary: "Hiểu mối liên hệ giữa số lượng hồng cầu, huyết sắc tố và hematocrit để đọc phiếu xét nghiệm đúng cách hơn.",
      content: `### Ba chỉ số nói về điều gì?
**RBC** là số lượng hồng cầu. **HGB** là lượng hemoglobin, protein giàu sắt giúp hồng cầu vận chuyển oxy. **HCT** cho biết tỷ lệ thể tích máu được tạo bởi hồng cầu.

### Vì sao phải xem cùng nhau?
Một con số đứng riêng lẻ chưa đủ để kết luận. Bác sĩ thường đối chiếu RBC, HGB, HCT cùng MCV, MCH, triệu chứng, tuổi, giới và bệnh sử. Khoảng tham chiếu cũng có thể khác giữa các phòng xét nghiệm.

### Khi nào nên trao đổi với bác sĩ?
- Mệt nhiều, khó thở, chóng mặt hoặc da nhợt.
- Kết quả thay đổi rõ qua nhiều lần xét nghiệm.
- Có chảy máu bất thường, bệnh mạn tính hoặc đang dùng thuốc ảnh hưởng đến máu.

### Cách theo dõi trên MedTech
Lưu từng phiếu OCR và chọn RBC hoặc HGB trong biểu đồ. Hãy quan sát xu hướng qua nhiều thời điểm thay vì tự chẩn đoán từ một kết quả duy nhất.

Thông tin này chỉ nhằm mục đích tham khảo và không thay thế chẩn đoán của bác sĩ.`,
      author: "Ban biên tập MedTech",
      imageUrl: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=900",
      tags: ["RBC", "HGB", "HCT", "hồng cầu", "thiếu máu"],
      readingMinutes: 4,
      featured: true,
      sourceLabel: "MedlinePlus – Red Blood Cell Count",
      sourceUrl: "https://medlineplus.gov/lab-tests/red-blood-cell-rbc-count/",
    },
    {
      title: "WBC và công thức bạch cầu: Không chỉ có một con số",
      category: "Chỉ số máu",
      summary: "Bạch cầu gồm nhiều nhóm khác nhau; tổng WBC và công thức bạch cầu cần được đọc trong đúng bối cảnh.",
      content: `### WBC là gì?
Bạch cầu là một phần của hệ miễn dịch. Xét nghiệm WBC đo tổng số bạch cầu, còn công thức bạch cầu cho biết tỷ lệ hoặc số lượng của các nhóm như neutrophil, lymphocyte, monocyte, eosinophil và basophil.

### Vì sao kết quả có thể thay đổi?
Kết quả có thể chịu ảnh hưởng bởi nhiễm trùng, tình trạng viêm, thuốc đang sử dụng, vận động, căng thẳng và nhiều yếu tố khác. Vì vậy, không nên tự gắn một bệnh cụ thể chỉ dựa trên WBC cao hoặc thấp.

### Cách xem phiếu hợp lý
- So sánh với khoảng tham chiếu in trên chính phiếu.
- Xem cả tổng WBC và từng thành phần bạch cầu.
- Đối chiếu với triệu chứng và các lần xét nghiệm trước.
- Trao đổi với bác sĩ nếu kết quả bất thường kéo dài hoặc kèm sốt, mệt nhiều, sụt cân không rõ nguyên nhân.

MedTech giúp lưu các chỉ số, nhưng quyết định y khoa vẫn cần người có chuyên môn.`,
      author: "Ban biên tập MedTech",
      imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=900",
      tags: ["WBC", "bạch cầu", "neutrophil", "lymphocyte", "miễn dịch"],
      readingMinutes: 4,
      featured: false,
      sourceLabel: "MedlinePlus – Blood Differential",
      sourceUrl: "https://medlineplus.gov/lab-tests/blood-differential/",
    },
    {
      title: "Tiểu cầu PLT và vai trò trong quá trình đông máu",
      category: "Chỉ số máu",
      summary: "Tiểu cầu giúp cầm máu; kết quả PLT cần được đánh giá cùng triệu chứng và các chỉ số liên quan.",
      content: `### Tiểu cầu làm gì?
Tiểu cầu là các thành phần nhỏ trong máu tham gia tạo cục máu đông để hạn chế chảy máu khi mạch máu bị tổn thương.

### Đọc PLT thế nào?
Hãy dùng khoảng tham chiếu của phòng xét nghiệm trên phiếu. Một kết quả cao hoặc thấp có nhiều nguyên nhân khác nhau và đôi khi cần xét nghiệm lặp lại để xác nhận.

### Dấu hiệu không nên bỏ qua
- Chảy máu kéo dài hoặc khó cầm.
- Xuất hiện nhiều vết bầm không rõ nguyên nhân.
- Chấm đỏ dưới da, chảy máu mũi hoặc chân răng thường xuyên.
- Đau đầu dữ dội, khó thở hoặc đau ngực cần được đánh giá khẩn cấp.

Không tự ý ngừng thuốc chống đông, aspirin hoặc thuốc đang được kê chỉ vì một kết quả PLT. Hãy hỏi bác sĩ điều trị.`,
      author: "Ban biên tập MedTech",
      imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=900",
      tags: ["PLT", "tiểu cầu", "đông máu", "chảy máu"],
      readingMinutes: 3,
      featured: false,
      sourceLabel: "MedlinePlus – Complete Blood Count",
      sourceUrl: "https://medlineplus.gov/lab-tests/complete-blood-count-cbc/",
    },
    {
      title: "Chuẩn bị trước khi lấy máu xét nghiệm",
      category: "Hướng dẫn",
      summary: "Một danh sách kiểm tra ngắn giúp bạn đến buổi lấy máu đúng giờ và cung cấp thông tin cần thiết.",
      content: `### Trước ngày xét nghiệm
- Đọc kỹ giấy chỉ định và hướng dẫn của cơ sở y tế.
- Hỏi rõ có cần nhịn ăn hay không; không phải xét nghiệm nào cũng cần nhịn ăn.
- Chuẩn bị danh sách thuốc, thực phẩm bổ sung và bệnh đang điều trị.

### Trong ngày lấy máu
- Mang theo giấy tờ và kết quả cũ nếu có.
- Đến sớm một chút để nghỉ trước khi lấy mẫu.
- Báo với nhân viên nếu bạn từng ngất, khó lấy máu hoặc đang dùng thuốc chống đông.

### Sau khi lấy máu
Giữ bông ép theo hướng dẫn. Nếu vị trí lấy máu sưng đau nhiều, chảy máu kéo dài hoặc có biểu hiện bất thường, hãy liên hệ cơ sở y tế.

Hướng dẫn cụ thể của nơi xét nghiệm luôn được ưu tiên vì mỗi loại xét nghiệm có yêu cầu khác nhau.`,
      author: "Ban biên tập MedTech",
      imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=900",
      tags: ["lấy máu", "nhịn ăn", "chuẩn bị", "xét nghiệm"],
      readingMinutes: 3,
      featured: false,
      sourceLabel: "MedlinePlus – Complete Blood Count",
      sourceUrl: "https://medlineplus.gov/lab-tests/complete-blood-count-cbc/",
    },
    {
      title: "Xây dựng bữa ăn cân đối theo nguyên tắc dễ nhớ",
      category: "Dinh dưỡng",
      summary: "Ưu tiên thực phẩm ít chế biến, đa dạng rau quả, ngũ cốc nguyên hạt và hạn chế muối, đường tự do, chất béo không lành mạnh.",
      content: `### Nền tảng của bữa ăn lành mạnh
Tổ chức Y tế Thế giới khuyến khích chế độ ăn đa dạng, ưu tiên thực phẩm ít hoặc chưa qua chế biến. Bữa ăn nên có rau, trái cây, các loại đậu, hạt và ngũ cốc nguyên hạt.

### Những thứ nên giảm dần
- Đồ uống nhiều đường và bánh kẹo dùng thường xuyên.
- Thực phẩm quá mặn, thịt chế biến sẵn và đồ ăn nhanh.
- Chất béo bão hòa và chất béo chuyển hóa công nghiệp.

### Cách bắt đầu thực tế
1. Thêm một phần rau vào bữa trưa và tối.
2. Chọn nước lọc thay cho nước ngọt trong phần lớn các ngày.
3. Ưu tiên hấp, luộc, áp chảo ít dầu thay cho chiên ngập dầu.
4. Thay đổi từ từ để duy trì được lâu dài.

Người có bệnh thận, tim mạch, đái tháo đường hoặc cần chế độ ăn đặc biệt nên hỏi bác sĩ hoặc chuyên gia dinh dưỡng.`,
      author: "Ban biên tập MedTech",
      imageUrl: "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=80&w=900",
      tags: ["dinh dưỡng", "rau quả", "ngũ cốc", "muối", "đường"],
      readingMinutes: 4,
      featured: false,
      sourceLabel: "WHO – Healthy Diet",
      sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
    },
    {
      title: "Lịch vận động một tuần cho người mới bắt đầu",
      category: "Lối sống",
      summary: "Chia nhỏ thời gian vận động trong tuần để dễ duy trì, thay vì cố tập quá nhiều trong một buổi.",
      content: `### Mục tiêu tham khảo cho người trưởng thành
CDC khuyến nghị ít nhất 150 phút hoạt động thể lực mức vừa mỗi tuần và hoạt động tăng cường cơ bắp ít nhất 2 ngày. Có thể chia nhỏ thời gian thành nhiều buổi.

### Gợi ý lịch đơn giản
- Thứ hai: đi bộ nhanh 20–30 phút.
- Thứ ba: tập sức mạnh nhẹ với trọng lượng cơ thể.
- Thứ tư: đi bộ hoặc đạp xe nhẹ.
- Thứ năm: nghỉ hoặc vận động giãn cơ.
- Thứ sáu: đi bộ nhanh 20–30 phút.
- Cuối tuần: một buổi vận động yêu thích và một buổi sức mạnh nhẹ.

### Nguyên tắc an toàn
Bắt đầu chậm, tăng dần và chọn mức phù hợp. Nếu có bệnh tim, khó thở, đau ngực, chóng mặt hoặc bệnh nền chưa ổn định, hãy hỏi bác sĩ trước khi tăng cường độ.`,
      author: "Ban biên tập MedTech",
      imageUrl: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&q=80&w=900",
      tags: ["vận động", "đi bộ", "150 phút", "lối sống"],
      readingMinutes: 3,
      featured: false,
      sourceLabel: "CDC – Physical Activity for Adults",
      sourceUrl: "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html",
    },
    {
      title: "Hiểu bảng mỡ máu: LDL, HDL và triglyceride",
      category: "Tim mạch",
      summary: "Bảng mỡ máu không chỉ có cholesterol toàn phần; LDL, HDL và triglyceride cung cấp những thông tin khác nhau.",
      content: `### Bảng mỡ máu gồm những gì?
Xét nghiệm lipid thường đo cholesterol toàn phần, LDL, HDL và triglyceride. Mỗi thành phần có ý nghĩa riêng; bác sĩ đánh giá chúng cùng tuổi, huyết áp, hút thuốc, đái tháo đường và các yếu tố nguy cơ khác.

### LDL và HDL
LDL thường được gọi là cholesterol xấu vì mức cao có thể liên quan đến tích tụ mảng bám trong động mạch. HDL thường được gọi là cholesterol tốt vì tham gia vận chuyển cholesterol về gan.

### Không tự điều trị theo một con số
Mục tiêu điều trị khác nhau giữa từng người. Không tự mua thuốc hoặc ngừng thuốc hạ mỡ máu. Hãy mang cả bảng kết quả đến bác sĩ để được đánh giá nguy cơ tim mạch tổng thể.

Chế độ ăn lành mạnh, vận động, không hút thuốc và dùng thuốc đúng chỉ định đều có thể là một phần của kế hoạch kiểm soát mỡ máu.`,
      author: "Ban biên tập MedTech",
      imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=900",
      tags: ["cholesterol", "LDL", "HDL", "triglyceride", "tim mạch"],
      readingMinutes: 4,
      featured: false,
      sourceLabel: "NHLBI – Blood Cholesterol Diagnosis",
      sourceUrl: "https://www.nhlbi.nih.gov/health/blood-cholesterol/diagnosis",
    },
    {
      title: "Theo dõi kết quả xét nghiệm qua nhiều lần như thế nào?",
      category: "Hướng dẫn",
      summary: "Dùng biểu đồ đúng cách, lưu thời điểm chính xác và tránh so sánh các kết quả không cùng điều kiện.",
      content: `### Ưu tiên xu hướng thay vì một điểm đơn lẻ
Một kết quả có thể bị ảnh hưởng bởi tình trạng sức khỏe tại thời điểm lấy mẫu. Khi có nhiều phiếu, biểu đồ giúp nhìn ra xu hướng tăng, giảm hoặc ổn định.

### So sánh có điều kiện
- Kiểm tra đơn vị đo và khoảng tham chiếu của từng phòng xét nghiệm.
- Ghi nhận ngày xét nghiệm và thời điểm lưu phiếu.
- Không coi số 0 là dữ liệu nếu phiếu không có chỉ số đó.
- Chọn cùng một chỉ số RBC, WBC, HGB hoặc PLT khi xem biểu đồ.

### Khi dùng OCR
Ô màu vàng là ô cần kiểm tra lại. Hãy đối chiếu ảnh gốc trước khi lưu. OCR hỗ trợ nhập liệu nhanh, không thay thế việc xác nhận kết quả và tư vấn của nhân viên y tế.`,
      author: "Ban biên tập MedTech",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=900",
      tags: ["OCR", "biểu đồ", "lịch sử", "theo dõi"],
      readingMinutes: 3,
      featured: false,
    },
  ];

  const articleTitles = new Set((await Article.find()).map(article => article.title));
  for (let index = 0; index < additionalArticles.length; index++) {
    const article = additionalArticles[index];
    if (articleTitles.has(article.title)) continue;
    await Article.create({
      ...article,
      createdAt: new Date(Date.now() - index * 60_000).toISOString(),
    });
  }
}
