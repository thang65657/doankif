const API_BASE = "/api";

export function getHeaders() {
  const token = localStorage.getItem("medtech_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async login(credentials: any) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi đăng nhập.");
    localStorage.setItem("medtech_token", data.token);
    return data;
  },

  async register(userInfo: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userInfo),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi đăng ký.");
    localStorage.setItem("medtech_token", data.token);
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể lấy thông tin người dùng.");
    return data;
  },

  async updateProfile(profileData: any) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi cập nhật hồ sơ.");
    return data;
  },

  async getUserProfile(userId: string) {
    const res = await fetch(`${API_BASE}/auth/profile/${userId}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi tải thông tin người dùng.");
    return data;
  },

  async changePassword(passwordData: any) {
    const res = await fetch(`${API_BASE}/auth/password`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(passwordData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi thay đổi mật khẩu.");
    return data;
  },

  // Records
  async extractOCR(fileData: string, mimeType: string) {
    const res = await fetch(`${API_BASE}/records/ocr`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ fileData, mimeType }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi phân tích OCR.");
    return data.data;
  },

  async saveRecord(recordData: any) {
    const res = await fetch(`${API_BASE}/records`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(recordData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi lưu kết quả xét nghiệm.");
    return data.record;
  },

  async getRecords(patientId?: string) {
    const url = patientId ? `${API_BASE}/records?patientId=${patientId}` : `${API_BASE}/records`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi lấy danh sách xét nghiệm.");
    return await res.json();
  },

  async getRecordDetail(id: string) {
    const res = await fetch(`${API_BASE}/records/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi tải chi tiết xét nghiệm.");
    return await res.json();
  },

  async updateAssessment(id: string, assessment: any) {
    const res = await fetch(`${API_BASE}/records/${id}/assessment`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(assessment),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi cập nhật đánh giá.");
    return data.record;
  },

  async analyzeAI(id: string) {
    const res = await fetch(`${API_BASE}/records/${id}/analyze`, {
      method: "POST",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi phân tích AI.");
    return data;
  },

  async deleteRecord(id: string) {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi xóa bản ghi.");
    return data;
  },

  // Appointments
  async bookAppointment(appointmentData: any) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(appointmentData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi đặt lịch hẹn.");
    return data.appointment;
  },

  async getAppointments() {
    const res = await fetch(`${API_BASE}/appointments`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi lấy lịch sử cuộc hẹn.");
    return await res.json();
  },

  async cancelAppointment(id: string) {
    const res = await fetch(`${API_BASE}/appointments/${id}/cancel`, {
      method: "PUT",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi hủy cuộc hẹn.");
    return data.appointment;
  },

  async payAppointment(id: string) {
    const res = await fetch(`${API_BASE}/appointments/${id}/pay`, {
      method: "PUT",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi thanh toán lịch hẹn.");
    return data.appointment;
  },

  async updateAppointmentStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi cập nhật trạng thái lịch hẹn.");
    return data.appointment;
  },

  // Consultations
  async getConsultations() {
    const res = await fetch(`${API_BASE}/consultations`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi lấy danh sách tư vấn.");
    return await res.json();
  },

  async startConsultation(payload: { doctorId?: string; patientId?: string }) {
    const res = await fetch(`${API_BASE}/consultations/start`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Lỗi khởi tạo phòng tư vấn.");
    return await res.json();
  },

  async sendMessage(id: string, messageData: any) {
    const res = await fetch(`${API_BASE}/consultations/${id}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(messageData),
    });
    if (!res.ok) throw new Error("Lỗi gửi tin nhắn.");
    return await res.json();
  },

  async chatWithAI(message: string, history: any[]) {
    const res = await fetch(`${API_BASE}/consultations/chatbot`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message, history }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi phản hồi chatbot.");
    return data.reply;
  },

  // Admin
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi tải số liệu thống kê.");
    return await res.json();
  },

  async getUsers(role?: string) {
    const url = role ? `${API_BASE}/admin/users?role=${role}` : `${API_BASE}/admin/users`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi tải danh sách người dùng.");
    return await res.json();
  },

  async adminCreateUser(userData: any) {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi tạo tài khoản quản trị.");
    return data;
  },

  async adminDeleteUser(id: string) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi xóa tài khoản quản trị.");
    return data;
  },

  async adminUpdateUserRole(id: string, role: string) {
    const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi cập nhật vai trò.");
    return data;
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi lấy danh sách thông báo.");
    return await res.json();
  },

  async markRead(id: string) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PUT",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Lỗi đánh dấu đã đọc.");
    return await res.json();
  },

  async markAllRead() {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: "PUT",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Lỗi đánh dấu toàn bộ.");
    return await res.json();
  },

  // Articles
  async getArticles() {
    const res = await fetch(`${API_BASE}/articles`);
    if (!res.ok) throw new Error("Lỗi tải danh sách bài viết.");
    return await res.json();
  },

  async createArticle(articleData: any) {
    const res = await fetch(`${API_BASE}/articles`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(articleData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi đăng bài viết.");
    return data.article;
  },

  // Health Tracker (Medications, Pill Logging, Diets, AI Recommendations)
  async getMedications() {
    const res = await fetch(`${API_BASE}/medications`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi tải danh sách thuốc.");
    return await res.json();
  },

  async addMedication(medData: any) {
    const res = await fetch(`${API_BASE}/medications`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(medData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi thêm thuốc.");
    return data.medication;
  },

  async updateMedication(id: string, medData: any) {
    const res = await fetch(`${API_BASE}/medications/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(medData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi cập nhật thuốc.");
    return data.medication;
  },

  async deleteMedication(id: string) {
    const res = await fetch(`${API_BASE}/medications/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi xóa thuốc.");
    return data;
  },

  async getMedicationLogs(date: string) {
    const res = await fetch(`${API_BASE}/medications/logs?date=${date}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi lấy lịch sử uống thuốc.");
    return await res.json();
  },

  async logMedication(medicationId: string, logData: { timeSlot: string; date: string; taken: boolean }) {
    const res = await fetch(`${API_BASE}/medications/${medicationId}/log`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(logData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi ghi nhận lịch sử uống thuốc.");
    return data;
  },

  async getDiets() {
    const res = await fetch(`${API_BASE}/diets`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Lỗi lấy chế độ dinh dưỡng.");
    return await res.json();
  },

  async addDiet(dietData: any) {
    const res = await fetch(`${API_BASE}/diets`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(dietData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi thêm chế độ dinh dưỡng.");
    return data.diet;
  },

  async updateDiet(id: string, dietData: any) {
    const res = await fetch(`${API_BASE}/diets/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(dietData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi cập nhật chế độ dinh dưỡng.");
    return data.diet;
  },

  async deleteDiet(id: string) {
    const res = await fetch(`${API_BASE}/diets/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi xóa chế độ dinh dưỡng.");
    return data;
  },

  async getAISuggestedTracker() {
    const res = await fetch(`${API_BASE}/health-tracker/ai-suggest`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Lỗi phân tích gợi ý AI.");
    return await res.json();
  },

  logout() {
    localStorage.removeItem("medtech_token");
  },
};
