import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://pcos1.onrender.com",
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// General limiter — all authenticated routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Stricter limiter for AI / heavy routes
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit reached, please wait before trying again." },
});

// Routes
import uploadRoutes from "./routes/upload.js";
import analyzeRoutes from "./routes/analyze.js";
import assessmentRoutes from "./routes/assessments.js";
import profileRoutes from "./routes/profile.js";
import chatRoutes from "./routes/chat.js";
import wellnessRoutes from "./routes/wellness.js";
import cycleRoutes from "./routes/cycle.js";
import symptomRoutes from "./routes/symptoms.js";
import waterRoutes from "./routes/water.js";
import moodRoutes from "./routes/mood.js";
import communityRoutes from "./routes/community.js";
import reviewRoutes from "./routes/reviews.js";
import notificationRoutes from "./routes/notifications.js";
import aiTipsRoutes from "./routes/ai-tips.js";
import searchRoutes from "./routes/search.js";
import settingsRoutes from "./routes/settings.js";
import exerciseVideoRoutes from "./routes/exercise-video.js";
import supplementsRoutes from "./routes/supplements.js";
import foodScoreRoutes from "./routes/food-score.js";

// Health check (public)
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// All API routes require auth + general rate limit
app.use("/api", requireAuth, generalLimiter);

// AI-heavy routes get stricter limit on top
app.use("/api/upload",        aiLimiter, uploadRoutes);
app.use("/api/analyze",       aiLimiter, analyzeRoutes);
app.use("/api/wellness",      aiLimiter, wellnessRoutes);
app.use("/api/chat",          aiLimiter, chatRoutes);
app.use("/api/ai",            aiLimiter, aiTipsRoutes);
app.use("/api/food-score",    aiLimiter, foodScoreRoutes);

// Standard routes
app.use("/api/assessments",   assessmentRoutes);
app.use("/api/profile",       profileRoutes);
app.use("/api/cycle",         cycleRoutes);
app.use("/api/symptoms",      symptomRoutes);
app.use("/api/water",         waterRoutes);
app.use("/api/mood",          moodRoutes);
app.use("/api/community",     communityRoutes);
app.use("/api/reviews",       reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search",        searchRoutes);
app.use("/api/settings",      settingsRoutes);
app.use("/api/exercise-video",exerciseVideoRoutes);
app.use("/api/supplements",   supplementsRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
