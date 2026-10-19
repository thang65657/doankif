import express from "express";
import { authController, requireAuth } from "../controllers/auth.js";
import { recordsController } from "../controllers/records.js";
import { appointmentsController } from "../controllers/appointments.js";
import { consultationsController } from "../controllers/consultations.js";
import { adminController } from "../controllers/admin.js";
import { healthTrackerController } from "../controllers/healthtracker.js";

const router = express.Router();

// -----------------------------------------------------------------
// AUTHENTICATION & PROFILE ROUTES
// -----------------------------------------------------------------
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", requireAuth(), authController.getMe);
router.get("/auth/profile/:userId", requireAuth(), authController.getUserProfile);
router.put("/auth/profile", requireAuth(), authController.updateProfile);
router.put("/auth/password", requireAuth(), authController.changePassword);

// -----------------------------------------------------------------
// BLOOD TEST RECORDS (OCR & HISTORY)
// -----------------------------------------------------------------
router.post("/records/ocr", requireAuth(), recordsController.extractOCR);
router.post("/records", requireAuth(), recordsController.saveRecord);
router.get("/records", requireAuth(), recordsController.getHistory);
router.get("/records/:id", requireAuth(), recordsController.getRecordDetail);
router.put("/records/:id/assessment", requireAuth(["doctor", "admin"]), recordsController.updateDoctorAssessment);
router.post("/records/:id/analyze", requireAuth(), recordsController.analyzeWithAI);
router.delete("/records/:id", requireAuth(["admin"]), recordsController.deleteRecord);

// -----------------------------------------------------------------
// APPOINTMENTS
// -----------------------------------------------------------------
router.post("/appointments", requireAuth(["patient"]), appointmentsController.book);
router.get("/appointments", requireAuth(), appointmentsController.getList);
router.put("/appointments/:id/cancel", requireAuth(), appointmentsController.cancel);
router.put("/appointments/:id/pay", requireAuth(["patient"]), appointmentsController.pay);
router.put("/appointments/:id/status", requireAuth(["doctor", "admin"]), appointmentsController.updateStatus);

// -----------------------------------------------------------------
// ONLINE TELE-CONSULTATION & HEALTH CHATBOT
// -----------------------------------------------------------------
router.get("/consultations", requireAuth(), consultationsController.getList);
router.post("/consultations/start", requireAuth(["patient", "doctor"]), consultationsController.start);
router.post("/consultations/:id/messages", requireAuth(), consultationsController.sendMessage);
router.put("/consultations/:id/close", requireAuth(), consultationsController.close);
router.post("/consultations/chatbot", requireAuth(), consultationsController.chatWithAI);

// -----------------------------------------------------------------
// DRUGS & DIETARY REGIMES TRACKER
// -----------------------------------------------------------------
router.get("/medications", requireAuth(), healthTrackerController.getMedications);
router.post("/medications", requireAuth(["patient"]), healthTrackerController.addMedication);
router.put("/medications/:id", requireAuth(), healthTrackerController.updateMedication);
router.delete("/medications/:id", requireAuth(), healthTrackerController.deleteMedication);

router.get("/medications/logs", requireAuth(), healthTrackerController.getMedicationLogs);
router.post("/medications/:medicationId/log", requireAuth(), healthTrackerController.logMedication);

router.get("/diets", requireAuth(), healthTrackerController.getDiets);
router.post("/diets", requireAuth(["patient"]), healthTrackerController.addDiet);
router.put("/diets/:id", requireAuth(), healthTrackerController.updateDiet);
router.delete("/diets/:id", requireAuth(), healthTrackerController.deleteDiet);

router.post("/health-tracker/ai-suggest", requireAuth(["patient"]), healthTrackerController.getAISuggestions);

// -----------------------------------------------------------------
// ADMIN & SYSTEM SETTINGS
// -----------------------------------------------------------------
router.get("/admin/stats", requireAuth(["doctor", "admin"]), adminController.getDashboardStats);
router.get("/admin/users", requireAuth(["patient", "doctor", "admin"]), adminController.getUsers);
router.post("/admin/users", requireAuth(["admin"]), adminController.createUser);
router.put("/admin/users/:id/role", requireAuth(["admin"]), adminController.updateUserRole);
router.delete("/admin/users/:id", requireAuth(["admin"]), adminController.deleteUser);

// -----------------------------------------------------------------
// NOTIFICATIONS
// -----------------------------------------------------------------
router.get("/notifications", requireAuth(), adminController.getNotifications);
router.put("/notifications/:id/read", requireAuth(), adminController.markNotificationRead);
router.put("/notifications/read-all", requireAuth(), adminController.markAllRead);

// -----------------------------------------------------------------
// KNOWLEDGE HUB (ARTICLES)
// -----------------------------------------------------------------
router.get("/articles", adminController.getArticles);
router.post("/articles", requireAuth(["doctor", "admin"]), adminController.createArticle);

export default router;
