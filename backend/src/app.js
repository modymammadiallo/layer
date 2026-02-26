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
const isProd = process.env.NODE_ENV === "production";
const frontendOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["http://localhost:3000"];
const cookieSameSite = process.env.COOKIE_SAMESITE || (isProd ? "none" : "lax");

app.use(helmet());
app.use(
  cors({
    origin: frontendOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: cookieSameSite,
    secure: isProd
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
