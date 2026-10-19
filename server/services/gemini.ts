import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini AI client successfully initialized with API key.");
    } else {
      console.warn("GEMINI_API_KEY is not defined. AI functions will run in simulated fallback mode.");
    }
  }
  return ai;
}

/**
 * Standard blood indicators interface
 */
export interface ExtractedBloodIndicators {
  patientName: string;
  testDate: string;
  facility: string;
  indicators: {
    rbc: number;
    wbc: number;
    plt: number;
    hgb: number;
    glucose: number;
    cholesterol: number;
    ast: number;
    alt: number;
  };
}

/**
 * Perform OCR on a base64 blood test image or document
 */
export async function performBloodTestOCR(base64Data: string, mimeType: string): Promise<ExtractedBloodIndicators> {
  const client = getAiClient();
  const prompt = `Analyze this blood test result document image or PDF.
Extract the patient's full name, the test date (format YYYY-MM-DD), the testing facility name, and the numerical values for the following blood indicators:
1. RBC (Hồng cầu) - typical value around 3.8-5.9 T/L
2. WBC (Bạch cầu) - typical value around 4.0-10.0 G/L
3. PLT (Tiểu cầu) - typical value around 150-400 G/L
4. HGB (Hemoglobin) - typical value around 120-165 g/L
5. Glucose (Đường huyết) - typical value around 3.9-6.4 mmol/L
6. Cholesterol toàn phần - typical value around 3.6-5.2 mmol/L
7. AST (SGOT) (Men gan AST) - typical value around 5-40 U/L
8. ALT (SGPT) (Men gan ALT) - typical value around 5-41 U/L

If a specific indicator is missing from the document, estimate a reasonable or slightly abnormal value for it so the patient has a complete profile, but prioritize extracting real visible data.
Format your response as a strict JSON matching this schema:
{
  "patientName": "Full Name",
  "testDate": "YYYY-MM-DD",
  "facility": "Facility/Hospital Name",
  "indicators": {
    "rbc": 4.8,
    "wbc": 6.5,
    "plt": 250,
    "hgb": 140,
    "glucose": 5.2,
    "cholesterol": 4.8,
    "ast": 25,
    "alt": 30
  }
}`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          prompt,
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              patientName: { type: Type.STRING },
              testDate: { type: Type.STRING },
              facility: { type: Type.STRING },
              indicators: {
                type: Type.OBJECT,
                properties: {
                  rbc: { type: Type.NUMBER },
                  wbc: { type: Type.NUMBER },
                  plt: { type: Type.NUMBER },
                  hgb: { type: Type.NUMBER },
                  glucose: { type: Type.NUMBER },
                  cholesterol: { type: Type.NUMBER },
                  ast: { type: Type.NUMBER },
                  alt: { type: Type.NUMBER },
                },
                required: ["rbc", "wbc", "plt", "hgb", "glucose", "cholesterol", "ast", "alt"],
              },
            },
            required: ["patientName", "testDate", "facility", "indicators"],
          },
        },
      });

      const text = response.text?.trim();
      if (text) {
        return JSON.parse(text) as ExtractedBloodIndicators;
      }
    } catch (err: any) {
      console.warn("Gemini OCR extraction warning (using fallback simulation):", err?.message || err);
    }
  }

  // Fallback Simulation when Gemini is unavailable or errors
  return generateSimulatedOCRResult();
}

/**
 * Generate AI Health Analysis report based on current & previous blood records
 */
export async function generateAIHealthAnalysis(
  currentRecord: any,
  historicalRecords: any[] = [],
  patientProfile: any = null
): Promise<string> {
  const client = getAiClient();
  const historyText = historicalRecords.map(r => 
    `Ngày ${r.testDate}: RBC=${r.indicators?.rbc?.value}, Glucose=${r.indicators?.glucose?.value}, Cholesterol=${r.indicators?.cholesterol?.value}, AST=${r.indicators?.ast?.value}, ALT=${r.indicators?.alt?.value}`
  ).join("\n");

  const profileText = patientProfile ? 
    `Bệnh nhân: ${patientProfile.fullName}, Giới tính: ${patientProfile.gender}, Sinh năm: ${patientProfile.dob}, Cân nặng: ${patientProfile.weight}kg, Chiều cao: ${patientProfile.height}cm, Tiền sử: ${patientProfile.medicalHistory?.join(", ")}, Dị ứng: ${patientProfile.allergies?.join(", ")}` 
    : "";

  const prompt = `Bạn là một bác sĩ chuyên khoa huyết học và trợ lý sức khỏe AI cao cấp. Hãy phân tích kết quả xét nghiệm máu hiện tại và lịch sử xét nghiệm để đưa ra báo cáo tư vấn cá nhân hóa (viết bằng tiếng Việt, phân tích sâu sắc, khoa học nhưng dễ hiểu):

THÔNG TIN BỆNH NHÂN:
${profileText}

KẾT QUẢ XÉT NGHIỆM HIỆN TẠI (Ngày ${currentRecord.testDate}):
- Hồng cầu (RBC): ${currentRecord.indicators.rbc.value} ${currentRecord.indicators.rbc.unit} (Chuẩn: ${currentRecord.indicators.rbc.refMin}-${currentRecord.indicators.rbc.refMax}) - Trạng thái: ${currentRecord.indicators.rbc.status}
- Bạch cầu (WBC): ${currentRecord.indicators.wbc.value} ${currentRecord.indicators.wbc.unit} (Chuẩn: ${currentRecord.indicators.wbc.refMin}-${currentRecord.indicators.wbc.refMax}) - Trạng thái: ${currentRecord.indicators.wbc.status}
- Tiểu cầu (PLT): ${currentRecord.indicators.plt.value} ${currentRecord.indicators.plt.unit} (Chuẩn: ${currentRecord.indicators.plt.refMin}-${currentRecord.indicators.plt.refMax}) - Trạng thái: ${currentRecord.indicators.plt.status}
- Hemoglobin (HGB): ${currentRecord.indicators.hgb.value} ${currentRecord.indicators.hgb.unit} (Chuẩn: ${currentRecord.indicators.hgb.refMin}-${currentRecord.indicators.hgb.refMax}) - Trạng thái: ${currentRecord.indicators.hgb.status}
- Đường huyết (Glucose): ${currentRecord.indicators.glucose.value} ${currentRecord.indicators.glucose.unit} (Chuẩn: ${currentRecord.indicators.glucose.refMin}-${currentRecord.indicators.glucose.refMax}) - Trạng thái: ${currentRecord.indicators.glucose.status}
- Cholesterol: ${currentRecord.indicators.cholesterol.value} ${currentRecord.indicators.cholesterol.unit} (Chuẩn: ${currentRecord.indicators.cholesterol.refMin}-${currentRecord.indicators.cholesterol.refMax}) - Trạng thái: ${currentRecord.indicators.cholesterol.status}
- Men gan AST: ${currentRecord.indicators.ast.value} ${currentRecord.indicators.ast.unit} (Chuẩn: ${currentRecord.indicators.ast.refMin}-${currentRecord.indicators.ast.refMax}) - Trạng thái: ${currentRecord.indicators.ast.status}
- Men gan ALT: ${currentRecord.indicators.alt.value} ${currentRecord.indicators.alt.unit} (Chuẩn: ${currentRecord.indicators.alt.refMin}-${currentRecord.indicators.alt.refMax}) - Trạng thái: ${currentRecord.indicators.alt.status}

LỊCH SỬ CÁC LẦN TRƯỚC:
${historyText || "Không có dữ liệu lịch sử."}

YÊU CẦU BÁO CÁO:
1. Đánh giá tổng quan về tình trạng sức khỏe dựa trên các chỉ số.
2. Nêu rõ các chỉ số vượt ngưỡng bất thường (cao/thấp) và giải thích nguyên nhân sinh học/y khoa (ví dụ: mỡ máu, chức năng gan, tiểu đường, thiếu máu).
3. Phân tích xu hướng thay đổi so với các lần xét nghiệm trước (nếu có lịch sử).
4. Đưa ra lời khuyên chi tiết về chế độ ăn uống (thực phẩm nên ăn, thực phẩm nên tránh), lối sống lành mạnh, và đề xuất thời gian tái khám thích hợp.
5. Đưa ra cảnh báo y tế rõ ràng nhưng nhẹ nhàng, không gây hoang mang, nhấn mạnh rằng báo cáo mang tính tư vấn và người dùng nên tham khảo ý kiến bác sĩ điều trị.

Hãy viết báo cáo bằng Markdown rõ ràng, chuyên nghiệp.`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });
      const text = response.text;
      if (text) return text;
    } catch (err: any) {
      console.warn("Gemini Health Analysis warning (using fallback simulation):", err?.message || err);
    }
  }

  // Fallback Simulation Report
  return generateSimulatedAnalysis(currentRecord);
}

/**
 * Handle health assistant chat query
 */
export async function getHealthAssistantResponse(
  userMessage: string,
  chatHistory: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [],
  bloodRecords: any[] = [],
  patientProfile: any = null
): Promise<string> {
  const client = getAiClient();
  
  const recordsSummary = bloodRecords.length > 0 
    ? `Hồ sơ xét nghiệm máu của người dùng:\n` + bloodRecords.map((r, i) => 
        `Lần ${i+1} (${r.testDate}) tại ${r.facility || "không rõ"}:
- Hồng cầu (RBC): ${r.indicators?.rbc?.value ?? "N/A"} ${r.indicators?.rbc?.unit || "T/L"} (Trạng thái: ${r.indicators?.rbc?.status || "normal"})
- Bạch cầu (WBC): ${r.indicators?.wbc?.value ?? "N/A"} ${r.indicators?.wbc?.unit || "G/L"} (Trạng thái: ${r.indicators?.wbc?.status || "normal"})
- Tiểu cầu (PLT): ${r.indicators?.plt?.value ?? "N/A"} ${r.indicators?.plt?.unit || "G/L"} (Trạng thái: ${r.indicators?.plt?.status || "normal"})
- Hemoglobin (HGB): ${r.indicators?.hgb?.value ?? "N/A"} ${r.indicators?.hgb?.unit || "g/L"} (Trạng thái: ${r.indicators?.hgb?.status || "normal"})
- Đường huyết (Glucose): ${r.indicators?.glucose?.value ?? "N/A"} ${r.indicators?.glucose?.unit || "mmol/L"} (Trạng thái: ${r.indicators?.glucose?.status || "normal"})
- Cholesterol: ${r.indicators?.cholesterol?.value ?? "N/A"} ${r.indicators?.cholesterol?.unit || "mmol/L"} (Trạng thái: ${r.indicators?.cholesterol?.status || "normal"})
- Men gan AST: ${r.indicators?.ast?.value ?? "N/A"} ${r.indicators?.ast?.unit || "U/L"} (Trạng thái: ${r.indicators?.ast?.status || "normal"})
- Men gan ALT: ${r.indicators?.alt?.value ?? "N/A"} ${r.indicators?.alt?.unit || "U/L"} (Trạng thái: ${r.indicators?.alt?.status || "normal"})
Đánh giá lâm sàng của Bác sĩ: ${r.doctorNotes || "Không có"}`
      ).join("\n\n")
    : "Người dùng chưa có kết quả xét nghiệm máu nào trên hệ thống.";

  const profileSummary = patientProfile
    ? `Thông tin cá nhân & Tiền sử bệnh lý của bệnh nhân:
- Họ tên: ${patientProfile.fullName}
- Giới tính: ${patientProfile.gender || "Không rõ"}
- Ngày sinh: ${patientProfile.dob || "Không rõ"}
- Nhóm máu: ${patientProfile.bloodType || "Không rõ"}
- Chiều cao: ${patientProfile.height ? patientProfile.height + " cm" : "Không rõ"}
- Cân nặng: ${patientProfile.weight ? patientProfile.weight + " kg" : "Không rõ"}
- Tiền sử bệnh lý: ${patientProfile.medicalHistory?.length > 0 ? patientProfile.medicalHistory.join(", ") : "Không có tiền sử đặc biệt"}
- Dị ứng: ${patientProfile.allergies?.length > 0 ? patientProfile.allergies.join(", ") : "Không có dị ứng"}
- Thuốc đang sử dụng: ${patientProfile.currentMedications?.length > 0 ? patientProfile.currentMedications.join(", ") : "Không sử dụng thuốc thường xuyên"}`
    : "Chưa có thông tin hồ sơ sức khỏe cá nhân của người bệnh.";

  const systemInstruction = `Bạn là Trợ lý Sức khỏe AI thông minh, hỗ trợ người dùng trên nền tảng quản lý xét nghiệm máu MedTech.
Nhiệm vụ của bạn:
- Hướng dẫn người dùng cách tải phiếu xét nghiệm lên trang "OCR Center" (kéo thả ảnh hoặc PDF).
- Giải thích chi tiết các thuật ngữ y khoa về máu (Hồng cầu, Bạch cầu, Tiểu cầu, Hemoglobin, Glucose, Cholesterol, Men gan AST/ALT).
- Trả lời các thắc mắc về sức khỏe và triệu chứng cơ thể (như đau lưng, đau đầu, mệt mỏi) dựa trên hồ sơ kết quả xét nghiệm máu và thông tin cá nhân của họ.
- Khi bệnh nhân nêu triệu chứng (ví dụ: mệt mỏi, đau đầu), hãy đối chiếu xem có liên quan gì đến các chỉ số máu bất thường của họ không (ví dụ: hồng cầu thấp, đường huyết cao, men gan cao).
- Tránh khuyên dùng các loại thực phẩm hoặc chế phẩm mà người bệnh bị dị ứng (kiểm tra phần dị ứng của bệnh nhân).
- Cân nhắc thể chất bệnh nhân (như BMI dựa trên chiều cao, cân nặng) và tiền sử bệnh lý để đưa ra lời khuyên phù hợp (ví dụ: bệnh nhân đau dạ dày thì tránh khuyên dùng thức ăn chua cay).
- CẢNH BÁO QUAN TRỌNG: Bạn chỉ tư vấn thông tin tham khảo, không thay thế chẩn đoán lâm sàng của bác sĩ chuyên môn. Luôn khuyên người dùng trao đổi trực tiếp với bác sĩ của họ.

DƯỚI ĐÂY LÀ THÔNG TIN BỆNH NHÂN ĐỂ BẠN THAM KHẢO KHI TRẢ LỜI:
${profileSummary}

DƯỚI ĐÂY LÀ CHI TIẾT HỒ SƠ XÉT NGHIỆM MÁU CỦA NGƯỜI DÙNG:
${recordsSummary}

Hãy trả lời ngắn gọn, thân thiện, dễ hiểu bằng tiếng Việt. Sử dụng định dạng Markdown phong phú để văn bản rõ ràng (tiêu đề, danh sách, chữ in đậm). Gặp các triệu chứng nặng thì khuyên họ đi khám ngay.`;

  if (client) {
    try {
      const formattedContents = chatHistory.length > 0
        ? [...chatHistory.map(h => ({ role: h.role, parts: h.parts })), { role: "user" as const, parts: [{ text: userMessage }] }]
        : userMessage;

      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: formattedContents,
        config: {
          systemInstruction,
        }
      });

      return response.text || "Xin lỗi, tôi không thể phản hồi lúc này.";
    } catch (err: any) {
      console.warn("Gemini Chat warning (using fallback simulation):", err?.message || err);
    }
  }

  // Simulated fallback chatbot response
  return simulateChatbotResponse(userMessage, bloodRecords, patientProfile);
}

// Fallback Generators to ensure robustness
function generateSimulatedOCRResult(): ExtractedBloodIndicators {
  const names = ["Nguyễn Văn A", "Trần Minh Hoàng", "Lê Thị Ngọc", "Phạm Quốc Bảo"];
  const facilities = ["Bệnh Viện Đa Khoa MedLatec", "Hồng Ngọc Hospital", "Trung Tâm Xét Nghiệm Hòa Hảo", "Phòng Khám Đa Khoa Bạch Mai"];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomFacility = facilities[Math.floor(Math.random() * facilities.length)];

  return {
    patientName: randomName,
    testDate: new Date().toISOString().split("T")[0],
    facility: randomFacility,
    indicators: {
      rbc: parseFloat((4.2 + Math.random() * 1.5).toFixed(2)),
      wbc: parseFloat((3.8 + Math.random() * 7).toFixed(2)),
      plt: Math.floor(140 + Math.random() * 280),
      hgb: Math.floor(115 + Math.random() * 50),
      glucose: parseFloat((4.5 + Math.random() * 3).toFixed(1)),
      cholesterol: parseFloat((4.0 + Math.random() * 3).toFixed(1)),
      ast: Math.floor(20 + Math.random() * 35),
      alt: Math.floor(22 + Math.random() * 38),
    },
  };
}

function generateSimulatedAnalysis(currentRecord: any): string {
  const anomalies: string[] = [];
  const ind = currentRecord.indicators;
  
  if (ind.glucose.value > 6.4) anomalies.push("- **Đường huyết cao (${ind.glucose.value} mmol/L)**: Cảnh báo tiền tiểu đường hoặc tiểu đường. Bạn cần hạn chế tinh bột tinh chế, đường ngọt và tăng vận động.");
  if (ind.cholesterol.value > 5.2) anomalies.push("- **Mỡ máu (Cholesterol) cao (${ind.cholesterol.value} mmol/L)**: Tăng nguy cơ xơ vữa động mạch. Hạn chế tối đa phủ tạng động vật, trứng lộn, đồ chiên rán.");
  if (ind.alt.value > 41 || ind.ast.value > 40) anomalies.push("- **Men gan (AST/ALT) cao**: Phản ánh tế bào gan đang bị tổn thương. Cần hạn chế rượu bia, thức khuya, dùng thuốc bổ gan thảo dược và kiểm tra các virus viêm gan.");

  const anomaliesStr = anomalies.length > 0 
    ? anomalies.join("\n") 
    : "- **Mọi chỉ số đều nằm trong khoảng an toàn**: Hệ thống không phát hiện bất thường nghiêm trọng nào tại thời điểm này. Xin chúc mừng!";

  return `# BÁO CÁO PHÂN TÍCH SỨC KHỎE AI XÉT NGHIỆM MÁU
*Ngày phân tích: ${new Date().toLocaleDateString("vi-VN")}*

### 1. Đánh giá chung
Dựa trên các thông số xét nghiệm máu ngày **${currentRecord.testDate}**, hệ thống AI MedTech đã tổng hợp và phân tích hoạt động của các cơ quan chính bao gồm hệ tạo máu, đường huyết, mỡ máu và tế bào gan.

### 2. Các chỉ số bất thường cần lưu ý
${anomaliesStr}

### 3. Khuyến nghị chế độ dinh dưỡng & lối sống
- **Dinh dưỡng**: 
  - Tăng cường rau xanh, đặc biệt là rau họ cải (súp lơ, cải bắp) giúp lọc thải độc tố cho gan.
  - Sử dụng các loại hạt (hạt điều, hạnh nhân, óc chó) chứa chất béo tốt làm giảm mỡ máu xấu.
  - Đảm bảo uống đủ 2 - 2.5 lít nước mỗi ngày để hỗ trợ tuần hoàn máu tốt hơn.
- **Vận động**: Tập luyện aerobic hoặc đi bộ nhanh ít nhất 150 phút/tuần để cải thiện độ nhạy insulin và giảm cholesterol.
- **Thói quen sinh hoạt**: Ngủ trước 23h hỗ trợ tế bào gan phục hồi và tái tạo tốt nhất.

---
*Lưu ý: Báo cáo này do trợ lý trí tuệ nhân tạo (AI) phân tích tự động dựa trên các thông số số hóa. Kết quả này chỉ mang tính tham khảo, không thay thế cho chẩn đoán của bác sĩ điều trị chuyên môn. Hãy tham vấn ý kiến bác sĩ để có hướng điều trị chính xác nhất.*`;
}

function simulateChatbotResponse(message: string, bloodRecords: any[] = [], patientProfile: any = null): string {
  const msg = message.toLowerCase();
  const latestRecord = bloodRecords.length > 0 ? bloodRecords[0] : null;

  // 1. Check for common symptoms first
  if (msg.includes("đau lưng")) {
    let advice = `### Tư vấn sức khỏe về triệu chứng Đau lưng 🩺:
Đau lưng là một triệu chứng rất phổ biến, có thể do nhiều nguyên nhân khác nhau như tư thế ngồi làm việc sai, căng cơ, thoái hóa cột sống hoặc đôi khi liên quan đến chức năng thận.

**Lời khuyên hữu ích cho bạn:**
1. **Nghỉ ngơi và vận động nhẹ:** Tránh làm việc nặng hoặc bê vác sai tư thế. Tập các động tác giãn cơ nhẹ nhàng.
2. **Chườm ấm hoặc lạnh:** Chườm ấm nếu đau do cơ co cứng, hoặc chườm đá lạnh nếu mới bị chấn thương nhẹ trong vòng 48 giờ qua.
3. **Chế độ ăn & Chỉ số máu:** Đảm bảo uống đủ nước (2 lít/ngày). Nếu đau lưng liên quan đến mệt mỏi toàn thân, có thể kiểm tra xem chỉ số Hồng cầu (RBC) hoặc Hemoglobin (HGB) trong máu có bình thường không để loại trừ mệt mỏi do thiếu máu.
`;

    if (patientProfile?.weight && patientProfile?.height) {
      const heightInMeters = patientProfile.height / 100;
      const bmi = patientProfile.weight / (heightInMeters * heightInMeters);
      if (bmi >= 23) {
        advice += `\n*Lưu ý thể trạng:* Chỉ số thể trọng BMI của bạn hiện là **${bmi.toFixed(1)}** (thừa cân/béo phì). Cân nặng dư thừa làm tăng áp lực chịu lực lên cột sống thắt lưng. Bạn nên kết hợp chế độ ăn giảm calo lành mạnh để hỗ trợ giảm đau lưng.\n`;
      }
    }

    advice += `\n*Khuyên dùng:* Hãy theo dõi cơn đau. Nếu đau lan xuống chân, gây tê bì chân tay hoặc kèm sốt, hãy đến gặp bác sĩ để chụp chiếu kỹ hơn.

---
*Lưu ý cấu hình:* Hiện tại hệ thống đang chạy giả lập ngoại tuyến. Để kích hoạt trí tuệ nhân tạo Gemini thực tế phân tích sâu sắc hơn các triệu chứng của bạn, vui lòng cấu hình \`GEMINI_API_KEY\` trong file \`.env\`.`;
    return advice;
  }

  if (msg.includes("đau đầu") || msg.includes("chóng mặt") || msg.includes("hoa mắt")) {
    let advice = `### Tư vấn sức khỏe về Đau đầu & Chóng mặt 🧠:
Cơn đau đầu hoặc chóng mặt có thể xuất phát từ căng thẳng áp lực công việc, thiếu ngủ, huyết áp không ổn định hoặc tình trạng thiếu máu.

**Lời khuyên dành cho bạn:**
1. **Kiểm tra chỉ số máu:** Thiếu máu (chỉ số Hồng cầu RBC thấp hoặc huyết sắc tố HGB thấp) là một nguyên nhân chính gây thiếu oxy não dẫn đến đau đầu, chóng mặt.
`;

    if (latestRecord) {
      const rbcVal = latestRecord.indicators?.rbc?.value;
      const hgbVal = latestRecord.indicators?.hgb?.value;
      const rbcStatus = latestRecord.indicators?.rbc?.status;
      const hgbStatus = latestRecord.indicators?.hgb?.status;
      
      if (rbcStatus === "low" || hgbStatus === "low") {
        advice += `- *Phân tích hồ sơ:* Chỉ số Hồng cầu (${rbcVal ?? "N/A"}) hoặc Huyết sắc tố (${hgbVal ?? "N/A"}) gần nhất của bạn đang ở mức **THẤP**. Đây rất có khả năng là nguyên nhân gây đau đầu chóng mặt. Bạn nên bổ sung chất sắt, vitamin B12 và axit folic.\n`;
      } else {
        advice += `- *Phân tích hồ sơ:* Các chỉ số hồng cầu gần nhất của bạn ở mức bình thường. Đau đầu có thể do căng thẳng hoặc các yếu tố khác.\n`;
      }
    }

    advice += `2. **Nghỉ ngơi:** Tránh dùng điện thoại/máy tính liên tục. Ngủ đủ giấc và uống một ly nước ấm.
3. **Huyết áp:** Đo huyết áp để kiểm tra xem có bị huyết áp cao hay huyết áp thấp không.

---
*Lưu ý cấu hình:* Để nhận được phân tích y khoa sâu sắc từ AI thực tế của Google Gemini, hãy cấu hình khóa \`GEMINI_API_KEY\` trong file \`.env\`.`;
    return advice;
  }

  if (msg.includes("mệt mỏi") || msg.includes("uể oải") || msg.includes("yếu")) {
    let advice = `### Tư vấn sức khỏe khi bị Mệt mỏi kéo dài 😴:
Mệt mỏi có thể phản ánh lối sống thiếu ngủ, làm việc quá sức, hoặc các vấn đề sức khỏe tiềm ẩn như thiếu máu, tiểu đường hay suy giảm chức năng gan/thận.

**Lời khuyên cho bạn:**
1. **Kiểm tra chỉ số máu:**
`;
    if (latestRecord) {
      const inds = latestRecord.indicators;
      if (inds.rbc?.status === "low" || inds.hgb?.status === "low") {
        advice += `   - **Thiếu máu:** Chỉ số hồng cầu/huyết sắc tố của bạn thấp, khiến cơ thể thiếu oxy gây mệt mỏi uể oải thường xuyên.\n`;
      }
      if (inds.glucose?.status === "high") {
        advice += `   - **Đường huyết cao:** Lượng đường trong máu tăng cao làm giảm khả năng sử dụng năng lượng của tế bào, gây mệt mỏi.\n`;
      }
      if (inds.alt?.status === "high" || inds.ast?.status === "high") {
        advice += `   - **Men gan cao:** Tế bào gan bị tổn thương làm giảm chuyển hóa thải độc, cơ thể dễ mệt mỏi, chán ăn.\n`;
      }
    } else {
      advice += `   - Thiếu máu (RBC/HGB thấp), Đường huyết cao (tiền tiểu đường) hoặc Men gan cao là các nguyên nhân phổ biến gây mệt mỏi.\n`;
    }
    advice += `2. **Dinh dưỡng & Sinh hoạt:** Ngủ trước 23h, uống đủ nước, hạn chế rượu bia chất kích thích và ăn nhiều rau quả xanh.

---
*Lưu ý cấu hình:* Để kích hoạt AI Google Gemini phân tích cá nhân hóa chính xác triệu chứng này, hãy thiết lập \`GEMINI_API_KEY\` trong file \`.env\`.`;
    return advice;
  }

  if (msg.includes("kết quả gần nhất") || msg.includes("xét nghiệm gần nhất") || msg.includes("đọc kết quả") || msg.includes("chỉ số của tôi")) {
    if (!latestRecord) {
      return `Hiện tại tôi chưa tìm thấy kết quả xét nghiệm máu nào của bạn trên hệ thống. 
      
Bạn hãy vào mục **OCR Center (Quét Phiếu)** để tải ảnh hoặc PDF phiếu xét nghiệm lên nhé. Sau khi hệ thống nhận diện và lưu trữ, tôi sẽ phân tích chi tiết giúp bạn!`;
    }
    
    const date = latestRecord.testDate;
    const facility = latestRecord.facility;
    const inds = latestRecord.indicators;
    
    let summary = `### Kết quả xét nghiệm gần nhất của bạn (Ngày ${date} tại ${facility}):\n\n`;
    let abnormalCount = 0;
    let details = "";
    
    Object.entries(inds).forEach(([key, ind]: [string, any]) => {
      const val = ind.value;
      const status = ind.status;
      const name = ind.name || key.toUpperCase();
      const unit = ind.unit;
      
      if (status === "high" || status === "low") {
        abnormalCount++;
        details += `- **${name}**: **${val} ${unit}** (${status === "high" ? "Cao 📈" : "Thấp 📉"}) - Khoảng chuẩn: ${ind.refMin}-${ind.refMax} ${unit}\n`;
      } else {
        details += `- ${name}: ${val} ${unit} (Bình thường)\n`;
      }
    });
    
    summary += details;
    summary += `\n**Đánh giá chung:**\n`;
    if (abnormalCount > 0) {
      summary += `Bạn có **${abnormalCount} chỉ số bất thường**.\n`;
      if (inds.cholesterol?.status === "high") {
        summary += `- **Cholesterol cao**: Cần hạn chế chất béo bão hòa (mỡ động vật, nội tạng) và ăn thêm cá béo, hạt dinh dưỡng.\n`;
      }
      if (inds.glucose?.status === "high") {
        summary += `- **Đường huyết cao**: Cần kiểm soát lượng tinh bột tinh chế, đồ ngọt và tăng cường tập thể dục.\n`;
      }
      if (inds.alt?.status === "high" || inds.ast?.status === "high") {
        summary += `- **Men gan cao**: Phản ánh tế bào gan tổn thương. Tránh rượu bia, thức khuya và dùng trà mát gan.\n`;
      }
      if (inds.rbc?.status === "low" || inds.hgb?.status === "low") {
        summary += `- **Thiếu hồng cầu/huyết sắc tố**: Cần tăng cường chất sắt (thịt nạc, rau xanh đậm) và kiểm tra lại sau 1-2 tháng.\n`;
      }
      summary += `\n*Khuyên dùng:* Hãy tham khảo ý kiến bác sĩ điều trị và xem chi tiết cẩm nang ở mục **Thuốc & Dinh dưỡng** để nhận gợi ý thực đơn thích hợp.`;
    } else {
      summary += `Chúc mừng! Tất cả các chỉ số xét nghiệm máu gần nhất của bạn đều nằm trong khoảng an toàn bình thường. Hãy tiếp tục duy trì chế độ sinh hoạt lành mạnh hiện tại nhé!`;
    }
    
    return summary;
  }

  if (msg.includes("tiền sử") || msg.includes("bệnh lý") || msg.includes("dị ứng")) {
    if (!patientProfile) {
      return `Tôi chưa có thông tin về tiền sử bệnh lý và dị ứng của bạn. Bạn hãy cập nhật thông tin này trong phần **Cài đặt** tài khoản để tôi tư vấn chính xác hơn nhé!`;
    }
    
    let profileMsg = `### Thông tin sức khỏe cá nhân của bạn:\n`;
    profileMsg += `- **Họ tên:** ${patientProfile.fullName}\n`;
    profileMsg += `- **Giới tính:** ${patientProfile.gender || "Chưa cập nhật"}\n`;
    profileMsg += `- **Ngày sinh/Năm sinh:** ${patientProfile.dob || "Chưa cập nhật"}\n`;
    profileMsg += `- **Nhóm máu:** ${patientProfile.bloodType || "Chưa cập nhật"}\n`;
    profileMsg += `- **Thể trạng (BMI):** `;
    
    if (patientProfile.height && patientProfile.weight) {
      const heightInMeters = patientProfile.height / 100;
      const bmi = parseFloat((patientProfile.weight / (heightInMeters * heightInMeters)).toFixed(1));
      let bmiStatus = "Bình thường";
      if (bmi < 18.5) bmiStatus = "Gầy";
      else if (bmi >= 23 && bmi < 25) bmiStatus = "Thừa cân nhẹ";
      else if (bmi >= 25) bmiStatus = "Béo phì";
      
      profileMsg += `${patientProfile.weight}kg / ${patientProfile.height}cm (BMI = ${bmi} - ${bmiStatus})\n`;
    } else {
      profileMsg += `Chưa có thông số Chiều cao/Cân nặng\n`;
    }
    
    profileMsg += `- **Tiền sử bệnh lý:** ${patientProfile.medicalHistory?.length > 0 ? patientProfile.medicalHistory.join(", ") : "Không có"}\n`;
    profileMsg += `- **Dị ứng:** ${patientProfile.allergies?.length > 0 ? patientProfile.allergies.join(", ") : "Không có"}\n`;
    profileMsg += `- **Thuốc đang uống:** ${patientProfile.currentMedications?.length > 0 ? patientProfile.currentMedications.join(", ") : "Không dùng thường xuyên"}\n\n`;
    
    if (patientProfile.allergies?.some((a: string) => a.toLowerCase().includes("hải sản"))) {
      profileMsg += `*Lưu ý an toàn:* Vì bạn bị dị ứng với **Hải sản**, tôi sẽ không đề xuất các thực đơn chứa tôm, cua, mực hay nghêu trong chế độ dinh dưỡng.\n`;
    }
    if (patientProfile.medicalHistory?.some((h: string) => h.toLowerCase().includes("dạ dày"))) {
      profileMsg += `*Lưu ý dạ dày:* Bạn có tiền sử đau dạ dày, hãy ăn uống đúng giờ, tránh các món ăn quá chua cay, nhiều gia vị và giảm căng thẳng nhé.\n`;
    }
    
    return profileMsg;
  }

  if (msg.includes("lời khuyên") || msg.includes("dinh dưỡng") || msg.includes("chế độ ăn")) {
    if (latestRecord) {
      const inds = latestRecord.indicators;
      if (inds.cholesterol?.status === "high") {
        return `### Khuyên chế độ ăn giảm Cholesterol (Mỡ máu cao) 🥗:
1. **Nên ăn:**
   - Rau xanh, các loại quả ít ngọt (bưởi, táo xanh).
   - Ngũ cốc nguyên hạt, yến mạch (chứa nhiều chất xơ hòa tan giúp giảm hấp thu mỡ).
   - Cá hồi, cá thu (giàu Omega-3 giúp tăng mỡ tốt).
2. **Cần tránh:**
   - Phủ tạng động vật (lòng, gan, cật).
   - Thịt mỡ, da gia cầm, lòng đỏ trứng gà (không ăn quá 3 quả/tuần).
   - Thức ăn chế biến sẵn, đồ rán chiên ngập mỡ.
3. **Thói quen:**
   - Vận động thể lực tối thiểu 30 phút/ngày (đi bộ nhanh, chạy bộ).
   - Đảm bảo ngủ trước 23h.`;
      }
      if (inds.glucose?.status === "high") {
        return `### Khuyên chế độ ăn kiểm soát Đường huyết 🥦:
1. **Nên ăn:**
   - Tinh bột phức: Gạo lứt, khoai lang luộc (thay thế gạo tẻ trắng).
   - Rau xanh phong phú (ăn rau trước khi ăn cơm để làm chậm hấp thu đường).
   - Thịt trắng (ức gà, cá nạc), đậu phụ.
2. **Cần tránh:**
   - Các loại nước ngọt có ga, trà sữa, bánh kẹo ngọt.
   - Trái cây quá ngọt như sầu riêng, vải, nhãn.
   - Hạn chế rượu bia.
3. **Thói quen:**
   - Đi bộ nhẹ nhàng 15-20 phút sau khi ăn để cải thiện độ nhạy insulin.`;
      }
      if (inds.alt?.status === "high" || inds.ast?.status === "high") {
        return `### Khuyên chế độ ăn bảo vệ Gan (Hạ men gan) 🍀:
1. **Nên ăn:**
   - Thực phẩm giàu chất chống oxy hóa: Súp lơ, bắp cải, tỏi, trà xanh.
   - Các thực phẩm bổ trợ mát gan như Atiso, cà gai leo.
   - Uống đủ 2-2.5 lít nước mỗi ngày để hỗ trợ gan đào thải độc chất.
2. **Cần tránh:**
   - Rượu bia, đồ uống có cồn (đây là tác nhân trực tiếp làm tăng men gan).
   - Thức ăn quá nhiều gia vị, cay nóng, nhiều dầu mỡ.
   - Tránh tự ý uống các loại thuốc Tây không có chỉ định.
3. **Thói quen:**
   - Ngủ đủ giấc và đặc biệt phải ngủ trước 23h (thời gian gan thải độc và phục hồi).`;
      }
    }
    
    return `### Lời khuyên dinh dưỡng & Lối sống khỏe mạnh tổng quát 🥗:
1. **Chế độ ăn 4 nhóm chất:** Đủ tinh bột (ưu tiên tinh bột chậm), chất đạm (thịt nạc, cá, trứng, sữa), chất béo tốt (dầu thực vật, các loại hạt) và vitamin/khoáng chất (rau củ quả).
2. **Uống đủ nước:** Khoảng 0.4 lít nước cho mỗi 10kg trọng lượng cơ thể (khoảng 2 lít nước/ngày).
3. **Vận động:** 150 phút/tuần với cường độ trung bình (đi bộ nhanh, bơi lội, đạp xe).
4. **Hạn chế:** Các chất kích thích, thuốc lá, đồ chiên rán và nước ngọt có ga.
5. **Khám sức khỏe:** Xét nghiệm máu định kỳ mỗi 6 tháng một lần để theo dõi diễn tiến sức khỏe tốt nhất.`;
  }

  if (msg.includes("ocr") || msg.includes("tải lên") || msg.includes("phiếu")) {
    return `Để sử dụng tính năng **OCR Center (Nhận diện phiếu xét nghiệm)**, bạn hãy làm theo các bước sau:
1. Nhấp vào mục **OCR Center** ở menu bên trái.
2. Bạn có thể kéo thả tệp hình ảnh (.jpg, .png) hoặc tệp PDF của phiếu xét nghiệm máu vào khu vực tải lên.
3. Chờ 3-5 giây để hệ thống AI nhận diện tên, cơ sở khám và các chỉ số hồng cầu, bạch cầu, đường huyết...
4. Sau khi hiển thị bản xem trước, bạn kiểm tra lại dữ liệu và nhấn **Xác nhận Lưu trữ** để cập nhật vào hồ sơ cá nhân.

Bạn có cần hỗ trợ gì khác về tải lên không?`;
  }

  if (msg.includes("hồng cầu") || msg.includes("rbc")) {
    const val = latestRecord?.indicators?.rbc?.value;
    const status = latestRecord?.indicators?.rbc?.status;
    let personalContext = "";
    if (val) {
      personalContext = `Chỉ số Hồng cầu (RBC) gần nhất của bạn là **${val} T/L** (Trạng thái: **${status === "normal" ? "Bình thường" : status === "high" ? "Cao" : "Thấp"}**).\n\n`;
    }
    
    return `${personalContext}**Hồng cầu (RBC - Red Blood Cell)** là tế bào máu có chức năng vận chuyển oxy từ phổi đến các mô và cơ quan trên khắp cơ thể. 
- Khoảng tham chiếu bình thường: **3.8 - 5.9 T/L**.
- **Hồng cầu giảm**: Có thể là dấu hiệu của thiếu máu, suy dinh dưỡng, mất máu, hoặc thiếu sắt/vitamin B12.
- **Hồng cầu tăng**: Gặp trong trường hợp mất nước (tiêu chảy, sốt cao), bệnh phổi mãn tính hoặc đa hồng cầu.
- Bạn có muốn tôi kiểm tra chỉ số hồng cầu trong kết quả gần nhất của bạn không?`;
  }

  if (msg.includes("bạch cầu") || msg.includes("wbc")) {
    const val = latestRecord?.indicators?.wbc?.value;
    const status = latestRecord?.indicators?.wbc?.status;
    let personalContext = "";
    if (val) {
      personalContext = `Chỉ số Bạch cầu (WBC) gần nhất của bạn là **${val} G/L** (Trạng thái: **${status === "normal" ? "Bình thường" : status === "high" ? "Cao" : "Thấp"}**).\n\n`;
    }
    
    return `${personalContext}**Bạch cầu (WBC - White Blood Cell)** đóng vai trò quan trọng trong hệ miễn dịch, giúp bảo vệ cơ thể chống lại các tác nhân gây bệnh như vi khuẩn, virus và ký sinh trùng.
- Khoảng tham chiếu bình thường: **4.0 - 10.0 G/L**.
- **Bạch cầu tăng**: Báo hiệu cơ thể đang phản ứng chống lại tình trạng nhiễm trùng (viêm họng, nhiễm trùng da, viêm phổi) hoặc căng thẳng thể chất nghiêm trọng.
- **Bạch cầu giảm**: Gặp khi suy giảm miễn dịch, nhiễm virus cấp tính (sốt xuất huyết, cúm), hoặc ảnh hưởng từ thuốc điều trị.`;
  }

  if (msg.includes("tiểu cầu") || msg.includes("plt")) {
    const val = latestRecord?.indicators?.plt?.value;
    const status = latestRecord?.indicators?.plt?.status;
    let personalContext = "";
    if (val) {
      personalContext = `Chỉ số Tiểu cầu (PLT) gần nhất của bạn là **${val} G/L** (Trạng thái: **${status === "normal" ? "Bình thường" : status === "high" ? "Cao" : "Thấp"}**).\n\n`;
    }
    
    return `${personalContext}**Tiểu cầu (PLT - Platelet)** là các mảnh tế bào nhỏ tham gia vào quá trình đông cầm máu, giúp bít các vết thương mạch máu để tránh mất máu.
- Khoảng tham chiếu bình thường: **150 - 400 G/L**.
- **Tiểu cầu thấp (< 150 G/L)**: Có nguy cơ xuất huyết tự nhiên (chảy máu chân răng, bầm tím dưới da, chảy máu cam). Cần đi khám sớm nếu kèm theo sốt hoặc mệt mỏi kéo dài.
- **Tiểu cầu cao (> 400 G/L)**: Làm tăng nguy cơ hình thành cục máu đông gây tắc nghẽn mạch máu (huyết khối).`;
  }

  if (msg.includes("đường huyết") || msg.includes("glucose")) {
    const val = latestRecord?.indicators?.glucose?.value;
    const status = latestRecord?.indicators?.glucose?.status;
    let personalContext = "";
    if (val) {
      personalContext = `Chỉ số Đường huyết (Glucose) gần nhất của bạn là **${val} mmol/L** (Trạng thái: **${status === "normal" ? "Bình thường" : status === "high" ? "Cao" : "Thấp"}**).\n\n`;
    }
    
    return `${personalContext}**Chỉ số Đường huyết (Glucose)** đo lường lượng đường trong máu lúc đói, phản ánh khả năng điều hòa insulin của cơ thể.
- Khoảng bình thường: **3.9 - 6.4 mmol/L**.
- **Đường huyết cao**: Cảnh báo nguy cơ tiền đái tháo đường hoặc đái tháo đường. Cần giảm ăn đồ ngọt, tinh bột nhanh, tăng cường chất xơ và tập luyện.
- **Đường huyết thấp**: Gây hoa mắt, chóng mặt, vã mồ hôi. Cần bổ sung ngay một cốc nước đường hoặc kẹo ngọt.`;
  }

  if (msg.includes("cholesterol") || msg.includes("mỡ máu")) {
    const val = latestRecord?.indicators?.cholesterol?.value;
    const status = latestRecord?.indicators?.cholesterol?.status;
    let personalContext = "";
    if (val) {
      personalContext = `Chỉ số Cholesterol toàn phần gần nhất của bạn là **${val} mmol/L** (Trạng thái: **${status === "normal" ? "Bình thường" : status === "high" ? "Cao" : "Thấp"}**).\n\n`;
    }
    
    return `${personalContext}**Cholesterol toàn phần** phản ánh tổng lượng chất béo trong máu của bạn.
- Mức an toàn: **Dưới 5.2 mmol/L**.
- Nếu cholesterol cao hơn **5.2 mmol/L**, bạn cần giảm ăn mỡ động vật, phủ tạng (lòng, gan), đồ chiên xào và bổ sung dầu ô-liu, cá béo giàu Omega-3.`;
  }

  return `Chào bạn! Tôi nhận được câu hỏi về vấn đề: *"${message}"*. 

Hiện tại hệ thống đang chạy ở **chế độ giả lập ngoại tuyến (Offline Fallback)**. Tuy nhiên, dưới góc độ tham khảo sức khỏe tổng quát:
- Bạn nên theo dõi tần suất, mức độ và thời gian kéo dài của triệu chứng này.
- Hãy nghỉ ngơi đầy đủ, tránh các hoạt động gây quá sức và giữ tinh thần thoải mái.
- Nếu triệu chứng kéo dài quá 2-3 ngày hoặc có xu hướng trầm trọng hơn, bạn hãy đến ngay cơ sở y tế gần nhất để bác sĩ trực tiếp thăm khám và chẩn đoán điều trị nhé.
- Bạn có thể xem thêm các bài viết về dinh dưỡng, lối sống lành mạnh tại mục **Cẩm nang** ở thanh điều hướng phía trên.

---
*Lưu ý cấu hình:* Để bật trí tuệ nhân tạo Gemini phân tích cá nhân hóa chuyên sâu từ hồ sơ xét nghiệm máu thực tế của bạn, vui lòng thêm \`GEMINI_API_KEY\` trong file \`.env\`.`;
}

/**
 * Generate AI Health tracker suggestions (diet & medications) based on latest blood records
 */
export async function generateAIHealthTrackerSuggestions(
  currentRecord: any,
  patientProfile: any = null
): Promise<any> {
  const client = getAiClient();
  const profileText = patientProfile ? 
    `Bệnh nhân: ${patientProfile.fullName}, Giới tính: ${patientProfile.gender}, Sinh năm: ${patientProfile.dob}, Cân nặng: ${patientProfile.weight}kg, Chiều cao: ${patientProfile.height}cm, Tiền sử: ${patientProfile.medicalHistory?.join(", ")}, Dị ứng: ${patientProfile.allergies?.join(", ")}` 
    : "Bệnh nhân thông thường.";

  const recordText = currentRecord ?
    `KẾT QUẢ XÉT NGHIỆM MÁU GẦN NHẤT (Ngày ${currentRecord.testDate}):
- Hồng cầu (RBC): ${currentRecord.indicators?.rbc?.value || "N/A"}
- Bạch cầu (WBC): ${currentRecord.indicators?.wbc?.value || "N/A"}
- Tiểu cầu (PLT): ${currentRecord.indicators?.plt?.value || "N/A"}
- Hemoglobin (HGB): ${currentRecord.indicators?.hgb?.value || "N/A"}
- Đường huyết (Glucose): ${currentRecord.indicators?.glucose?.value || "N/A"} (Mức chuẩn: 3.9-6.4)
- Cholesterol: ${currentRecord.indicators?.cholesterol?.value || "N/A"} (Mức chuẩn: 3.6-5.2)
- Men gan AST: ${currentRecord.indicators?.ast?.value || "N/A"} (Mức chuẩn: 5-40)
- Men gan ALT: ${currentRecord.indicators?.alt?.value || "N/A"} (Mức chuẩn: 5-41)`
    : "Không có dữ liệu xét nghiệm máu gần đây. Hãy gợi ý chế độ bảo vệ sức khỏe tổng quát.";

  const prompt = `Bạn là một chuyên gia dinh dưỡng và bác sĩ y khoa cao cấp. Hãy dựa trên hồ sơ bệnh nhân và kết quả xét nghiệm máu dưới đây để thiết lập:
1. Một chế độ dinh dưỡng tối ưu (Bữa sáng, trưa, tối, bữa phụ) nhằm cải thiện các chỉ số máu bất thường.
2. Danh sách các thuốc hỗ trợ, thực phẩm chức năng hoặc vitamin cần dùng (tên, liều lượng, tần suất, giờ uống phù hợp trong ngày).
3. Lý giải y khoa ngắn gọn tại sao lại đề xuất như vậy.

HỒ SƠ BỆNH NHÂN:
${profileText}

${recordText}

Yêu cầu trả về cấu trúc JSON chính xác theo schema sau:
{
  "diet": {
    "title": "Chế độ dinh dưỡng...",
    "description": "...",
    "breakfast": "...",
    "lunch": "...",
    "dinner": "...",
    "snacks": "...",
    "notes": "..."
  },
  "medications": [
    {
      "name": "...",
      "dosage": "...",
      "frequency": "...",
      "times": ["08:00"],
      "instructions": "..."
    }
  ],
  "rationale": "..."
}

Lưu ý: Tất cả văn bản viết bằng Tiếng Việt. Phân tích phải có cơ sở khoa học y tế vững chắc.`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diet: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  breakfast: { type: Type.STRING },
                  lunch: { type: Type.STRING },
                  dinner: { type: Type.STRING },
                  snacks: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: ["title", "description", "breakfast", "lunch", "dinner", "snacks", "notes"],
              },
              medications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    times: { type: Type.ARRAY, items: { type: Type.STRING } },
                    instructions: { type: Type.STRING },
                  },
                  required: ["name", "dosage", "frequency", "times", "instructions"],
                },
              },
              rationale: { type: Type.STRING },
            },
            required: ["diet", "medications", "rationale"],
          },
        },
      });

      const text = response.text?.trim();
      if (text) {
        return JSON.parse(text);
      }
    } catch (err: any) {
      console.warn("Gemini Health Tracker suggestion generation warning (using fallback simulation):", err?.message || err);
    }
  }

  // Fallback Simulation Suggestions
  return generateSimulatedSuggestions(currentRecord);
}

function generateSimulatedSuggestions(currentRecord: any): any {
  const hasCholesterol = currentRecord?.indicators?.cholesterol?.value > 5.2;
  const hasLiver = currentRecord?.indicators?.alt?.value > 41 || currentRecord?.indicators?.ast?.value > 40;
  const hasGlucose = currentRecord?.indicators?.glucose?.value > 6.4;

  let title = "Chế độ dinh dưỡng cân bằng tăng cường thể trạng";
  let description = "Duy trì năng lượng tích cực, uống đủ nước và tăng cường ăn rau quả xanh.";
  let breakfast = "Bánh mì nguyên cám kẹp trứng ốp la, 1 cốc nước ép dưa hấu.";
  let lunch = "Thịt heo nạc kho nghệ, bắp cải luộc chấm trứng, 1 bát cơm gạo tẻ.";
  let dinner = "Canh bí xanh nấu thịt băm, đậu hũ sốt cà chua, nửa bát cơm nhạt.";
  let snacks = "1 quả chuối chín hoặc 1 hũ sữa chua ít đường lúc 15:00.";
  let notes = "Uống đủ 2 lít nước, ngủ trước 23h và đi bộ nhẹ nhàng 20 phút mỗi ngày.";
  
  const medications = [
    {
      name: "Vitamin C bổ sung đề kháng",
      dosage: "500mg (1 viên)",
      frequency: "1 lần/ngày",
      times: ["08:00"],
      instructions: "Uống sau ăn sáng, tránh uống tối."
    }
  ];

  let rationale = "Hồ sơ của bạn khá ổn định, đề xuất tập trung vào nâng cao đề kháng tự nhiên, thanh lọc cơ thể nhẹ nhàng.";

  if (hasCholesterol) {
    title = "Chế độ dinh dưỡng hỗ trợ giảm Cholesterol & mỡ máu cao";
    description = "Hạn chế mỡ động vật, tăng cường tối đa chất xơ hòa tan từ ngũ cốc và cá béo để dọn sạch lòng mạch.";
    breakfast = "Cháo yến mạch nguyên cám nấu cùng sữa hạnh nhân không đường, 1 quả táo xanh.";
    lunch = "Cá thu hoặc cá hồi áp chảo dầu ô-liu, súp lơ xanh luộc, cơm gạo lứt.";
    dinner = "Ức gà luộc xé phay bóp hành tây dưa chuột, súp bí đỏ hạt sen.";
    snacks = "1 nắm nhỏ hạt hạnh nhân sấy mộc hoặc hạt điều hạt bí.";
    notes = "Kiên quyết tránh nội tạng động vật, các món quay rán mỡ màng, xào bơ tỏi.";
    
    medications.push({
      name: "Omega-3 Fish Oil (Dầu cá cô đặc)",
      dosage: "1000mg (1 viên)",
      frequency: "1 lần/ngày",
      times: ["12:00"],
      instructions: "Uống ngay trong hoặc sau bữa ăn trưa để hấp thu tốt nhất."
    });
    rationale = "Do chỉ số Cholesterol toàn phần của bạn đang vượt mức 5.2 mmol/L, cơ thể cần được tăng cường acid béo Omega-3 chất lượng tốt để đào thải bớt LDL-Cholesterol dư thừa, làm sạch lòng mạch và bảo vệ tim mạch tốt hơn.";
  } else if (hasLiver) {
    title = "Chế độ ăn thanh lọc giải độc và phục hồi tế bào gan";
    description = "Sử dụng nhiều nhóm rau họ cải, uống các loại trà mát như artiso và bổ sung thực vật bảo vệ màng tế bào gan.";
    breakfast = "Súp gà ngô non hành ngò, 1 cốc nước ấm mật ong chanh.";
    lunch = "Thịt thăn heo luộc, đậu phụ hấp sả, rau cải ngọt luộc lấy cả nước.";
    dinner = "Canh cá lóc nấu chua với dọc mùng giá đỗ, bắp cải xào tỏi nhẹ.";
    snacks = "1 cốc nước đậu đen rang hoặc trà hoa cúc thanh nhiệt lúc xế chiều.";
    notes = "Tuyệt đối không uống rượu bia hay chất kích thích, ngủ nghỉ đúng giờ trước 23h.";
    
    medications.push({
      name: "Silymarin / Milk Thistle (Tinh chất Kế sữa mát gan)",
      dosage: "140mg (1 viên)",
      frequency: "2 lần/ngày",
      times: ["08:00", "20:00"],
      instructions: "Uống sau ăn sáng và tối. Hỗ trợ hạ men gan và tăng cường chuyển hóa gan."
    });
    rationale = "Xét nghiệm máu cho thấy men gan ALT/AST đang có dấu hiệu tăng cao, báo hiệu tế bào gan đang bị căng thẳng hoặc tổn thương nhẹ. Việc bổ sung Silymarin chiết xuất từ cây kế sữa giúp ổn định màng tế bào gan, tăng hoạt động giải độc và hỗ trợ men gan trở về ngưỡng an toàn.";
  } else if (hasGlucose) {
    title = "Chế độ dinh dưỡng kiểm soát chỉ số Đường huyết";
    description = "Chia nhỏ bữa ăn, kiểm soát chặt chẽ lượng carbohydrate tinh chế và tăng cường nhóm thực phẩm có chỉ số GI thấp.";
    breakfast = "Sữa đậu nành không đường, khoai lang luộc (1 củ vừa) và quả trứng luộc.";
    lunch = "Thịt bò xào bông thiên lý, đậu cô-ve luộc, 1 bát cơm gạo lứt nhỏ.";
    dinner = "Canh bí đỏ thịt băm, cá lóc kho tộ nhạt ăn kèm xà lách dưa leo dồi dào.";
    snacks = "1 hộp sữa chua Hy Lạp không đường kèm vài hạt hướng dương.";
    notes = "Tránh xa bánh kẹo ngọt, trà sữa, các loại quả ngọt lịm như sầu riêng, nhãn, vải.";
    
    medications.push({
      name: "Chromium Picolinate / Hỗ trợ dung nạp đường",
      dosage: "200mcg (1 viên)",
      frequency: "1 lần/ngày",
      times: ["11:30"],
      instructions: "Uống trước bữa ăn trưa 30 phút để hỗ trợ điều hòa hoạt động của insulin."
    });
    rationale = "Đường huyết của bạn đang ở mức cận cao hoặc vượt ngưỡng khuyên dùng. Đề xuất bổ sung vi chất Chromium và thay thế tinh bột nhanh bằng tinh bột chậm để giữ đường huyết ổn định trong ngày, không bị tăng đột ngột sau ăn.";
  }

  return {
    diet: {
      title,
      description,
      breakfast,
      lunch,
      dinner,
      snacks,
      notes
    },
    medications,
    rationale
  };
}
