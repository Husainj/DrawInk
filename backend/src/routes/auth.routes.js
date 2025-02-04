import { Router } from "express";
import passport from "passport";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login/success").get(isAuthenticated, (req, res) => {
    console.log("User in /login/success:", req.user);
    if (req.user) {
      res.status(200).json({
        error: false,
        message: "Login successful",
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar
          },
      });
    } else {
      res.status(403).json({
        error: true,
        message: "Not authorized",
      });
    }
  });

router.route("/login/failed").get((req , res)=>{
    res.status(401).json({
        error:true,
        message: "Login failed"
        
    })
})

router.route("/google").get(
    passport.authenticate("google",["profile" , "email"])
)


router.route("/google/callback").get(
    passport.authenticate("google", {
      successRedirect: `${process.env.CLIENT_URL}/`,
      failureRedirect: "/login/failed",
    }))


router.route("/logout").get((req, res, next) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ error: true, message: "Logout failed" });
        }
        res.clearCookie("connect.sid"); // Clear the session cookie
        res.redirect(process.env.CLIENT_URL);
      });
    });
  });


export default router;

