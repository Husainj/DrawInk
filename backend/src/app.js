import express from "express"
import cors from "cors"
import session from "express-session";
import passport from "passport"
import "./passport.js"
import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import boardsRouter from "./routes/board.routes.js"
const app = express()

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}))

app.use(
    session({
        secret: "husain", // Change this to a strong secret key
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false, // Set to `true` in production with HTTPS
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    })
);


app.use(passport.initialize());
app.use(passport.session());


app.use((req, res, next) => {
    console.log("Session:", req.session);
    console.log("User:", req.user);
    next();
  });

app.use(express.json({limit:"50mb"}))

app.use("/auth" , authRouter )
app.use("/api/v1/users" , userRouter)
app.use("/api/v1/boards" , boardsRouter)

export {app}