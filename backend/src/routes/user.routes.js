import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { deleteUser, getMyDetails, getUserById } from "../controllers/user.controller.js";

const router = Router();


router.route("/me").get( isAuthenticated , getMyDetails)
router.route("/:id").get(getUserById);
router.route("/delete").delete(isAuthenticated , deleteUser);

export default router