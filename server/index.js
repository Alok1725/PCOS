import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// DB & Storage imports moved to utils/db.js

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

app.use("/api/upload", uploadRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/wellness", wellnessRoutes);
app.use("/api/cycle", cycleRoutes);
app.use("/api/symptoms", symptomRoutes);
app.use("/api/water", waterRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiTipsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/exercise-video", exerciseVideoRoutes);
app.use("/api/supplements", supplementsRoutes);
app.use("/api/food-score", foodScoreRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
