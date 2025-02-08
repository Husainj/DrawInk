import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { addElement, deleteElement, updateElement } from "../controllers/element.controller.js";

const router = Router();


router.route("/add").post(isAuthenticated , addElement);
router.route("/:elementId/update").patch(isAuthenticated , updateElement)
router.route("/:elementId").delete(isAuthenticated , deleteElement);

export default router 