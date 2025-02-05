import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { getUserById } from "../controllers/user.controller.js";

const router = Router();

router.route("/:id").get(getUserById);


export default router