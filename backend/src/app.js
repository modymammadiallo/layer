import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import csrf from "csurf";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN?.split(",") || "http://localhost:3000",
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", csrfProtection, authRoutes);
app.use("/api/tasks", csrfProtection, taskRoutes);
app.use("/api/user", csrfProtection, userRoutes);
app.use("/api/admin", csrfProtection, adminRoutes);

app.get("/api/csrf", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  return next(err);
});

export default app;
