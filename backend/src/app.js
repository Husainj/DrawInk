import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import "./passport.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import boardsRouter from "./routes/board.routes.js";
import elementRouter from "./routes/element.routes.js";
import http from "http"; // Import http module
import { Server } from "socket.io"; // Import Socket.IO
import { setupSocket } from "./sockets/socket.js";

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  },
  transports: ["websocket", "polling"],
});

setupSocket(io);
// Middleware to attach io to req
app.use((req, res, next) => {
  req.io = io; // Attach io to req
  next();
});

// Existing middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(
  session({
    secret: "husain", // Change this to a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to `true` in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log("Session:", req.session);
  console.log("User:", req.user);
  next();
});

app.use(express.json({ limit: "50mb" }));

// Routes
app.use("/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/boards", boardsRouter);
app.use("/api/v1/elements", elementRouter);


// Export both app and server
export { app, server };