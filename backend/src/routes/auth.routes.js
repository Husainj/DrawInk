import { Router } from "express";
import passport from "passport";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login/success").get( isAuthenticated , (req,res)=>{
    if (req.user) {
        res.status(200).json({
            error:false,
            message: "Login successfull",
            user : req.user
        })
    } else {
        res.status(403).json({
            error: true,
            message : "Not authorized"
        })
    }
})

router.route("/login/failed").get((req , res)=>{
    res.status(401).json({
        error:true,
        message: "Login failed"
        
    })
})

router.route("/google/callback").get(
    passport.authenticate('google' , {
        successRedirect:process.env.CLIENT_URL,
        failureRedirect:"/login/failed"
    })
)

router.route("/google").get(
    passport.authenticate('google',["profile" , "email"])
)

router.route("/logout").get((req,res)=>{
    req.logout(function (err) {
        if (err) {
            return next(err);  // Pass the error to the Express error handler
        }
        req.session = null;  // ✅ Clear session if using session-based auth
        return res.redirect(process.env.CLIENT_URL);
    });
    
})


export default router;

